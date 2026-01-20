
import { PrismaClient } from '@prisma/client';
import { MILESTONE_DEFINITIONS } from '../src/milestone/milestone-definitions';


const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dev data...');

  // Seed milestone definitions first
  console.log(`Seeding ${MILESTONE_DEFINITIONS.length} milestone definitions...`);
  
  for (const milestone of MILESTONE_DEFINITIONS) {
    await prisma.milestoneDefinition.upsert({
      where: { id: milestone.id },
      update: {
        category: milestone.category,
        name: milestone.name,
        description: milestone.description,
        expectedAgeMonthsMin: milestone.expectedAgeMonthsMin,
        expectedAgeMonthsMax: milestone.expectedAgeMonthsMax,
      },
      create: {
        id: milestone.id,
        category: milestone.category,
        name: milestone.name,
        description: milestone.description,
        expectedAgeMonthsMin: milestone.expectedAgeMonthsMin,
        expectedAgeMonthsMax: milestone.expectedAgeMonthsMax,
      },
    });
  }
  
  console.log('✓ Milestone definitions seeded successfully');

  const email = 'test@babymonitor.com';
  const babyName = 'Test Baby';
  const apiKeyStr = 'dev-api-key-12345';

  // 1. Create Caregiver
  // Using a dummy hash for "password123" - typically would use bcrypt
  // But since we use API Key, password login might not be primary for this dev flow.
  // However, Auth service might fail if hash is invalid.
  // For now, let's assume we use API Key.
  
  const caregiver = await prisma.caregiver.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Test Parent',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fKb.U9H.microburkhgiun32r.n24microburk', // Dummy hash
    },
  });

  console.log(`Caregiver created: ${caregiver.id}`);

  // 2. Create Baby
  const baby = await prisma.baby.create({
    data: {
      name: babyName,
      dateOfBirth: new Date(),
      gender: 'unknown',
    },
  });

  console.log(`Baby created: ${baby.id}`);

  // 3. Link them (with acceptedAt set so hasAccess check passes)
  await prisma.babyCaregiver.create({
    data: {
      babyId: baby.id,
      caregiverId: caregiver.id,
      role: 'primary',
      acceptedAt: new Date(),
    },
  });

  // 4. Create API Key
  await prisma.apiKey.create({
    data: {
      caregiverId: caregiver.id,
      key: apiKeyStr,
      name: 'Dev Key',
    },
  });

  console.log(`API Key created: ${apiKeyStr}`);
  console.log('------------------------------------------------');
  console.log(`Use these env vars in your web app:`);
  console.log(`NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`);
  console.log(`NEXT_PUBLIC_BABY_ID=${baby.id}`);
  console.log(`NEXT_PUBLIC_API_KEY=${apiKeyStr}`);
  console.log('------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
