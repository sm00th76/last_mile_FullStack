/**
 * Admin Controller
 *
 * CRUD operations for zones, areas, rate cards, and agents.
 * All endpoints require admin role.
 */

import Zone from '../models/Zone.js';
import Area from '../models/Area.js';
import RateCard from '../models/RateCard.js';
import Agent from '../models/Agent.js';
import User from '../models/User.js';

// ─── Zones ─────────────────────────────────────────────────────────────

export const getZones = async (req, res, next) => {
  try {
    const zones = await Zone.find().sort({ name: 1 }).lean();
    res.json({ zones });
  } catch (error) {
    next(error);
  }
};

export const createZone = async (req, res, next) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json({ zone });
  } catch (error) {
    next(error);
  }
};

export const updateZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json({ zone });
  } catch (error) {
    next(error);
  }
};

export const deleteZone = async (req, res, next) => {
  try {
    // Check if zone is referenced by any areas
    const areaCount = await Area.countDocuments({ zoneId: req.params.id });
    if (areaCount > 0) {
      return res.status(400).json({
        error: `Cannot delete zone: ${areaCount} area(s) still reference it`,
      });
    }
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json({ message: 'Zone deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Areas ─────────────────────────────────────────────────────────────

export const getAreas = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.zoneId) filter.zoneId = req.query.zoneId;
    const areas = await Area.find(filter).populate('zoneId', 'name code').sort({ city: 1 }).lean();
    res.json({ areas });
  } catch (error) {
    next(error);
  }
};

export const createArea = async (req, res, next) => {
  try {
    const area = await Area.create(req.body);
    const populated = await Area.findById(area._id).populate('zoneId', 'name code');
    res.status(201).json({ area: populated });
  } catch (error) {
    next(error);
  }
};

export const updateArea = async (req, res, next) => {
  try {
    const area = await Area.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('zoneId', 'name code');
    if (!area) return res.status(404).json({ error: 'Area not found' });
    res.json({ area });
  } catch (error) {
    next(error);
  }
};

export const deleteArea = async (req, res, next) => {
  try {
    const area = await Area.findByIdAndDelete(req.params.id);
    if (!area) return res.status(404).json({ error: 'Area not found' });
    res.json({ message: 'Area deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Rate Cards ────────────────────────────────────────────────────────

export const getRateCards = async (req, res, next) => {
  try {
    const rateCards = await RateCard.find().sort({ orderType: 1, rateType: 1 }).lean();
    res.json({ rateCards });
  } catch (error) {
    next(error);
  }
};

export const createRateCard = async (req, res, next) => {
  try {
    // Check if an active card already exists for this combination
    const existing = await RateCard.findOne({
      orderType: req.body.orderType,
      rateType: req.body.rateType,
      isActive: true,
    });
    if (existing) {
      return res.status(409).json({
        error: `An active rate card already exists for ${req.body.orderType} / ${req.body.rateType}. Deactivate it first or update it.`,
      });
    }
    const rateCard = await RateCard.create(req.body);
    res.status(201).json({ rateCard });
  } catch (error) {
    next(error);
  }
};

export const updateRateCard = async (req, res, next) => {
  try {
    const rateCard = await RateCard.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rateCard) return res.status(404).json({ error: 'Rate card not found' });
    res.json({ rateCard });
  } catch (error) {
    next(error);
  }
};

export const deleteRateCard = async (req, res, next) => {
  try {
    const rateCard = await RateCard.findByIdAndDelete(req.params.id);
    if (!rateCard) return res.status(404).json({ error: 'Rate card not found' });
    res.json({ message: 'Rate card deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Agents ────────────────────────────────────────────────────────────

export const getAgents = async (req, res, next) => {
  try {
    const agents = await Agent.find()
      .populate('userId', 'name email phone')
      .populate('currentZoneId', 'name code')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ agents });
  } catch (error) {
    next(error);
  }
};

export const createAgent = async (req, res, next) => {
  try {
    const { userId, currentZoneId, currentLocation } = req.body;

    // Verify the user exists and has agent role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role !== 'agent') {
      // Promote user to agent role
      user.role = 'agent';
      await user.save();
    }

    const agent = await Agent.create({ userId, currentZoneId, currentLocation });
    const populated = await Agent.findById(agent._id)
      .populate('userId', 'name email phone')
      .populate('currentZoneId', 'name code');

    res.status(201).json({ agent: populated });
  } catch (error) {
    next(error);
  }
};

export const updateAgent = async (req, res, next) => {
  try {
    const agent = await Agent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('userId', 'name email phone')
      .populate('currentZoneId', 'name code');

    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ agent });
  } catch (error) {
    next(error);
  }
};

export const updateAgentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email phone')
      .populate('currentZoneId', 'name code');

    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ agent });
  } catch (error) {
    next(error);
  }
};

export const deleteAgent = async (req, res, next) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    if (agent.activeOrderCount > 0) {
      return res.status(400).json({
        error: `Cannot delete agent: ${agent.activeOrderCount} active order(s) assigned`,
      });
    }

    await Agent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Agent deleted' });
  } catch (error) {
    next(error);
  }
};
