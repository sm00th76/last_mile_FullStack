/**
 * Seed script — populates the database with demo data for local development and testing.
 *
 * Run: node seed.js
 *
 * Seeds:
 *   - 4 Zones (North, South, East, West)
 *   - 12 Areas/pincodes mapped to zones
 *   - 4 RateCards (B2B intra, B2B inter, B2C intra, B2C inter)
 *   - 1 Admin user
 *   - 1 Customer user
 *   - 3 Agent users + Agent records
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Zone from './src/models/Zone.js';
import Area from './src/models/Area.js';
import RateCard from './src/models/RateCard.js';
import Agent from './src/models/Agent.js';
import Order from './src/models/Order.js';
import TrackingEvent from './src/models/TrackingEvent.js';
import Notification from './src/models/Notification.js';

const seed = async () => {
  await connectDB();

  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Zone.deleteMany({}),
    Area.deleteMany({}),
    RateCard.deleteMany({}),
    Agent.deleteMany({}),
    Order.deleteMany({}),
    TrackingEvent.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  // ─── Zones ───────────────────────────────────────────────────────────
  console.log('🌍 Seeding zones...');
  const zones = await Zone.insertMany([
    { name: 'North Zone', code: 'NORTH' },
    { name: 'South Zone', code: 'SOUTH' },
    { name: 'East Zone', code: 'EAST' },
    { name: 'West Zone', code: 'WEST' },
  ]);

  const [north, south, east, west] = zones;

  // ─── Areas (pincodes) ────────────────────────────────────────────────
  console.log('📍 Seeding areas...');
  await Area.insertMany([
    // North Zone
    { pincode: '110001', city: 'New Delhi', zoneId: north._id },
    { pincode: '110020', city: 'New Delhi', zoneId: north._id },
    { pincode: '226001', city: 'Lucknow', zoneId: north._id },
    // South Zone
    { pincode: '600001', city: 'Chennai', zoneId: south._id },
    { pincode: '560001', city: 'Bangalore', zoneId: south._id },
    { pincode: '500001', city: 'Hyderabad', zoneId: south._id },
    // East Zone
    { pincode: '700001', city: 'Kolkata', zoneId: east._id },
    { pincode: '800001', city: 'Patna', zoneId: east._id },
    { pincode: '751001', city: 'Bhubaneswar', zoneId: east._id },
    // West Zone
    { pincode: '400001', city: 'Mumbai', zoneId: west._id },
    { pincode: '380001', city: 'Ahmedabad', zoneId: west._id },
    { pincode: '411001', city: 'Pune', zoneId: west._id },
  ]);

  // ─── Rate Cards ──────────────────────────────────────────────────────
  console.log('💰 Seeding rate cards...');
  await RateCard.insertMany([
    {
      orderType: 'B2C',
      rateType: 'intra-zone',
      baseRate: 50,
      perKgRate: 15,
      minCharge: 50,
      volumetricDivisor: 5000,
      codSurchargeFlat: 25,
      codSurchargePercent: 2,
      isActive: true,
    },
    {
      orderType: 'B2C',
      rateType: 'inter-zone',
      baseRate: 80,
      perKgRate: 25,
      minCharge: 80,
      volumetricDivisor: 5000,
      codSurchargeFlat: 35,
      codSurchargePercent: 2.5,
      isActive: true,
    },
    {
      orderType: 'B2B',
      rateType: 'intra-zone',
      baseRate: 40,
      perKgRate: 10,
      minCharge: 40,
      volumetricDivisor: 5000,
      codSurchargeFlat: 20,
      codSurchargePercent: 1.5,
      isActive: true,
    },
    {
      orderType: 'B2B',
      rateType: 'inter-zone',
      baseRate: 70,
      perKgRate: 20,
      minCharge: 70,
      volumetricDivisor: 5000,
      codSurchargeFlat: 30,
      codSurchargePercent: 2,
      isActive: true,
    },
  ]);

  // ─── Users ───────────────────────────────────────────────────────────
  console.log('👤 Seeding users...');
  const passwordHash = await bcrypt.hash('password123', 12);

  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@delivery.com',
    passwordHash,
    role: 'admin',
    phone: '9999999999',
  });

  const customerUser = await User.create({
    name: 'John Customer',
    email: 'customer@delivery.com',
    passwordHash,
    role: 'customer',
    phone: '8888888888',
    addresses: [
      { label: 'Home', line: '123 Main Street, New Delhi', pincode: '110001' },
      { label: 'Office', line: '456 Business Park, Mumbai', pincode: '400001' },
    ],
  });

  const agentUser1 = await User.create({
    name: 'Agent North',
    email: 'agent.north@delivery.com',
    passwordHash,
    role: 'agent',
    phone: '7777777771',
  });

  const agentUser2 = await User.create({
    name: 'Agent South',
    email: 'agent.south@delivery.com',
    passwordHash,
    role: 'agent',
    phone: '7777777772',
  });

  const agentUser3 = await User.create({
    name: 'Agent West',
    email: 'agent.west@delivery.com',
    passwordHash,
    role: 'agent',
    phone: '7777777773',
  });

  // ─── Agents ──────────────────────────────────────────────────────────
  console.log('🚚 Seeding agents...');
  await Agent.insertMany([
    {
      userId: agentUser1._id,
      currentZoneId: north._id,
      currentLocation: { lat: 28.6139, lng: 77.209 },
      status: 'available',
      activeOrderCount: 0,
    },
    {
      userId: agentUser2._id,
      currentZoneId: south._id,
      currentLocation: { lat: 12.9716, lng: 77.5946 },
      status: 'available',
      activeOrderCount: 0,
    },
    {
      userId: agentUser3._id,
      currentZoneId: west._id,
      currentLocation: { lat: 19.076, lng: 72.8777 },
      status: 'available',
      activeOrderCount: 0,
    },
  ]);

  // ─── Summary ─────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('═══════════════════════════════════════════');
  console.log('  Demo Login Credentials');
  console.log('═══════════════════════════════════════════');
  console.log('  Admin:    admin@delivery.com / password123');
  console.log('  Customer: customer@delivery.com / password123');
  console.log('  Agent N:  agent.north@delivery.com / password123');
  console.log('  Agent S:  agent.south@delivery.com / password123');
  console.log('  Agent W:  agent.west@delivery.com / password123');
  console.log('═══════════════════════════════════════════');
  console.log('\n  Zones: 4 | Areas: 12 | Rate Cards: 4');
  console.log('  Users: 5 | Agents: 3\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
