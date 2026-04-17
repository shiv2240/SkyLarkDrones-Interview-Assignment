import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('⬡ Starting Database Seeding...');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Ridgeway Industrial Sites',
    },
  });

  // 2. Create Users (RBAC)
  const salt = await bcrypt.genSalt(10);
  
  // Maya - Operator
  await prisma.user.create({
    data: {
      email: 'maya@ridgeway.com',
      name: 'Maya Krishnan',
      passwordHash: await bcrypt.hash('operator123', salt),
      role: 'OPERATOR',
      organizationId: org.id,
    },
  });

  // Nisha - Site Head (Manager)
  await prisma.user.create({
    data: {
      email: 'nisha@ridgeway.com',
      name: 'Nisha Singh',
      passwordHash: await bcrypt.hash('manager123', salt),
      role: 'SITE_HEAD',
      organizationId: org.id,
    },
  });

  // 3. Create Sites & Incidents (Migrated from Legacy data.ts)
  
  // --- Site 1: Bangalore ---
  const siteBlr = await prisma.site.create({
    data: {
      name: 'Horizon Industrial Park – Bangalore South',
      label: 'Horizon Park · Bengaluru',
      city: 'Bengaluru',
      lat: 12.9716,
      lng: 77.595,
      droneNestLat: 12.968,
      droneNestLng: 77.598,
      zoom: 15,
      operator: 'Maya Krishnan',
      raghavNote: 'Please check Block C before leadership asks. Raghav.',
      organizationId: org.id,
    },
  });

  await prisma.incident.createMany({
    data: [
      { id: 'BLR-001', type: 'FENCE_ALERT', timestamp: new Date('2024-11-15T02:15:00Z'), lat: 12.9716, lng: 77.5946, zone: 'Block C – North Fence', description: 'Fence vibration sensor triggered. 4 pulses detected over 12 seconds.', siteId: siteBlr.id },
      { id: 'BLR-002', type: 'BADGE_FAILURE', timestamp: new Date('2024-11-15T02:17:33Z'), lat: 12.9712, lng: 77.5951, zone: 'Block C – Storage Entry', description: 'Badge BD-9942 (Raghav Nair, Facilities) failed reader. Not on night roster.', siteId: siteBlr.id },
      { id: 'BLR-003', type: 'VEHICLE_MOTION', timestamp: new Date('2024-11-15T02:45:00Z'), lat: 12.9718, lng: 77.594, zone: 'Block C – Service Road', description: 'Unscheduled vehicle movement detected on internal service road via motion sensor.', siteId: siteBlr.id },
      { id: 'BLR-006', type: 'ROUTINE_PATROL', timestamp: new Date('2024-11-15T01:00:00Z'), lat: 12.969, lng: 77.5965, zone: 'Warehouse A – West Wing', description: 'Scheduled night round completed. No anomalies found.', siteId: siteBlr.id },
    ],
  });

  // --- Site 2: Chennai ---
  const siteChe = await prisma.site.create({
    data: {
      name: 'Nexus Logistics Hub – Chennai East',
      label: 'Nexus Hub · Chennai',
      city: 'Chennai',
      lat: 13.0827,
      lng: 80.29,
      droneNestLat: 13.08,
      droneNestLng: 80.2935,
      zoom: 15,
      operator: 'Priya Venkat',
      raghavNote: 'Karthik is authorized for extra maintenance in Bay 4 tonight. Door sensor might be glitchy. — Priya.',
      organizationId: org.id,
    },
  });

  await prisma.incident.createMany({
    data: [
      { id: 'CHE-001', type: 'VEHICLE_MOTION', timestamp: new Date('2024-11-15T01:22:00Z'), lat: 13.0831, lng: 80.2894, zone: 'Truck Bay – Gate B', description: 'Unregistered truck entered truck bay via Gate B at 01:22 AM. CCTV timestamp synced.', siteId: siteChe.id },
      { id: 'CHE-002', type: 'BADGE_FAILURE', timestamp: new Date('2024-11-15T01:25:00Z'), lat: 13.0829, lng: 80.289, zone: 'Cold Storage – Bay 4 Entry', description: 'Badge CH-7712 (Murugan Pillai, Transport) attempted cold storage entry. Transport staff have no cold storage authorization.', siteId: siteChe.id },
      { id: 'CHE-004', type: 'ROUTINE_PATROL', timestamp: new Date('2024-11-15T00:00:00Z'), lat: 13.0822, lng: 80.2908, zone: 'Loading Dock – North', description: 'Nightly dock inspection completed. All 7 shipping containers verified sealed.', siteId: siteChe.id },
    ],
  });

  console.log('⬡ Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
