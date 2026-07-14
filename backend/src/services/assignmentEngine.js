/**
 * Auto-Assignment Engine
 *
 * Assigns the best available delivery agent to an order based on:
 *   1. Zone match: prefer agents in the pickup zone
 *   2. Haversine distance: if agents have location data, rank by proximity
 *   3. Workload: if no location data, rank by lowest activeOrderCount
 *
 * Fallback: if no agents in the pickup zone, fall back to ALL available agents system-wide.
 * This fallback is intentional — it prevents orders from being stuck unassigned when a zone
 * has no available agents, at the cost of potentially longer delivery times.
 */

import Agent from '../models/Agent.js';
import TrackingEvent from '../models/TrackingEvent.js';
import { notifyStatusChange } from './notificationService.js';

/**
 * Haversine distance between two lat/lng points in kilometers.
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Auto-assign the best available agent to an order.
 *
 * @param {Object} order - Mongoose order document (must have pickupAddress.zoneId)
 * @param {Object} actor - { id, role } of who triggered the assignment (system or admin)
 * @returns {Object} { agent, order } or throws if no agents available
 */
export const autoAssign = async (order, actor = { id: null, role: 'system' }) => {
  const pickupZoneId = order.pickupAddress.zoneId;

  // Step 1: Try agents in the pickup zone first
  let candidates = await Agent.find({
    currentZoneId: pickupZoneId,
    status: 'available',
  }).populate('userId', 'name email');

  // Step 2: Fallback — if no agents in the zone, try ALL available agents system-wide
  // This prevents orders from being stuck unassigned when a zone has no available agents.
  if (candidates.length === 0) {
    console.log(
      `⚠️ No available agents in pickup zone. Falling back to system-wide search.`
    );
    candidates = await Agent.find({
      status: 'available',
    }).populate('userId', 'name email');
  }

  if (candidates.length === 0) {
    const err = new Error('No available agents found for assignment');
    err.statusCode = 422;
    throw err;
  }

  // Step 3: Rank candidates
  let bestAgent;

  // Check if we have location data for distance-based ranking
  const pickupHasLocation =
    order.pickupAddress.location &&
    order.pickupAddress.location.lat &&
    order.pickupAddress.location.lng;

  const agentsWithLocation = candidates.filter(
    (a) => a.currentLocation && a.currentLocation.lat && a.currentLocation.lng
  );

  if (pickupHasLocation && agentsWithLocation.length > 0) {
    // Rank by Haversine distance to pickup address
    const ranked = agentsWithLocation
      .map((agent) => ({
        agent,
        distance: haversineDistance(
          order.pickupAddress.location.lat,
          order.pickupAddress.location.lng,
          agent.currentLocation.lat,
          agent.currentLocation.lng
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    bestAgent = ranked[0].agent;
  } else {
    // Rank by lowest activeOrderCount (fairness-based fallback)
    const ranked = [...candidates].sort(
      (a, b) => a.activeOrderCount - b.activeOrderCount
    );
    bestAgent = ranked[0];
  }

  // Step 4: Assign the agent
  order.assignedAgentId = bestAgent._id;
  order.status = 'Assigned';
  await order.save();

  // Increment agent's active order count
  bestAgent.activeOrderCount += 1;
  if (bestAgent.activeOrderCount >= 5) {
    bestAgent.status = 'busy';
  }
  await bestAgent.save();

  // Write tracking event
  await TrackingEvent.create({
    orderId: order._id,
    status: 'Assigned',
    actor: { id: actor.id, role: actor.role },
    note: `Auto-assigned to agent: ${bestAgent.userId?.name || bestAgent._id}`,
    isOverride: false,
  });

  // Fire notification
  notifyStatusChange(order, 'Assigned').catch(() => {});

  return { agent: bestAgent, order };
};

/**
 * Manually assign a specific agent to an order (admin override).
 * Skips ranking but still logs TrackingEvent + notification.
 *
 * @param {Object} order - Mongoose order document
 * @param {string} agentId - Agent ID to assign
 * @param {Object} actor - { id, role } — should be admin
 * @returns {Object} { agent, order }
 */
export const manualAssign = async (order, agentId, actor) => {
  const agent = await Agent.findById(agentId).populate('userId', 'name email');
  if (!agent) {
    const err = new Error(`Agent ${agentId} not found`);
    err.statusCode = 404;
    throw err;
  }

  // Unassign previous agent if exists
  if (order.assignedAgentId) {
    const prevAgent = await Agent.findById(order.assignedAgentId);
    if (prevAgent && prevAgent.activeOrderCount > 0) {
      prevAgent.activeOrderCount -= 1;
      if (prevAgent.status === 'busy') {
        prevAgent.status = 'available';
      }
      await prevAgent.save();
    }
  }

  // Assign new agent
  order.assignedAgentId = agent._id;
  order.status = 'Assigned';
  await order.save();

  // Increment agent's active order count
  agent.activeOrderCount += 1;
  if (agent.activeOrderCount >= 5) {
    agent.status = 'busy';
  }
  await agent.save();

  // Write tracking event
  await TrackingEvent.create({
    orderId: order._id,
    status: 'Assigned',
    actor: { id: actor.id, role: actor.role },
    note: `Manually assigned to agent: ${agent.userId?.name || agent._id} by admin`,
    isOverride: false,
  });

  // Fire notification
  notifyStatusChange(order, 'Assigned').catch(() => {});

  return { agent, order };
};
