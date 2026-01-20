import { PrismaClient } from '@prisma/client';
import { MILESTONE_DEFINITIONS } from '../src/milestone/milestone-definitions';

const prisma = new PrismaClient();

/**
 * Production seed script
 * 
 * Seeds milestone definitions from static data into the database.
 * This is required because MilestoneEntry has a foreign key constraint to MilestoneDefinition.
 */
async function main() {
  console.log('Running production seed...');
  
  // Seed milestone definitions
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
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
