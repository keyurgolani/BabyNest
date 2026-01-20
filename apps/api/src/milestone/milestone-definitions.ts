/**
 * Developmental Milestone Definitions
 * 
 * Static reference data based on CDC and WHO guidelines.
 * Categories: motor, cognitive, social, language
 * 
 * This data is baked into the application and does not require database seeding.
 * 
 * Validates: Requirements 7.1, 7.3
 */

import * as crypto from 'crypto';

export interface MilestoneDefinitionData {
  id: string;
  category: 'motor' | 'cognitive' | 'social' | 'language';
  name: string;
  description: string;
  expectedAgeMonthsMin: number;
  expectedAgeMonthsMax: number;
}

/**
 * Generate a deterministic UUID-like ID based on category and name
 * This ensures the same milestone always gets the same ID
 */
function generateDeterministicId(category: string, name: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${category}:${name}`)
    .digest('hex');
  
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    '8' + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join('-');
}

const rawMilestoneDefinitions: Omit<MilestoneDefinitionData, 'id'>[] = [
  // ============================================================================
  // MOTOR MILESTONES (Movement)
  // ============================================================================
  
  // 0-3 months
  {
    category: 'motor',
    name: 'Lifts head during tummy time',
    description: 'Baby can lift and hold head up briefly while lying on stomach',
    expectedAgeMonthsMin: 0,
    expectedAgeMonthsMax: 2,
  },
  {
    category: 'motor',
    name: 'Moves arms and legs',
    description: 'Baby moves both arms and both legs actively',
    expectedAgeMonthsMin: 0,
    expectedAgeMonthsMax: 2,
  },
  {
    category: 'motor',
    name: 'Opens and closes hands',
    description: 'Baby opens and closes hands, may grasp objects briefly',
    expectedAgeMonthsMin: 1,
    expectedAgeMonthsMax: 3,
  },
  
  // 3-6 months
  {
    category: 'motor',
    name: 'Holds head steady',
    description: 'Baby holds head steady without support when held upright',
    expectedAgeMonthsMin: 3,
    expectedAgeMonthsMax: 4,
  },
  {
    category: 'motor',
    name: 'Pushes up on arms during tummy time',
    description: 'Baby pushes up on arms while lying on stomach',
    expectedAgeMonthsMin: 3,
    expectedAgeMonthsMax: 5,
  },
  {
    category: 'motor',
    name: 'Rolls from tummy to back',
    description: 'Baby can roll over from stomach to back',
    expectedAgeMonthsMin: 4,
    expectedAgeMonthsMax: 6,
  },
  {
    category: 'motor',
    name: 'Rolls from back to tummy',
    description: 'Baby can roll over from back to stomach',
    expectedAgeMonthsMin: 5,
    expectedAgeMonthsMax: 7,
  },
  {
    category: 'motor',
    name: 'Reaches for and grasps toys',
    description: 'Baby reaches for toys and can grasp them',
    expectedAgeMonthsMin: 4,
    expectedAgeMonthsMax: 6,
  },
  
  // 6-9 months
  {
    category: 'motor',
    name: 'Sits without support',
    description: 'Baby can sit independently without support',
    expectedAgeMonthsMin: 6,
    expectedAgeMonthsMax: 8,
  },
  {
    category: 'motor',
    name: 'Transfers objects between hands',
    description: 'Baby passes objects from one hand to the other',
    expectedAgeMonthsMin: 6,
    expectedAgeMonthsMax: 8,
  },
  {
    category: 'motor',
    name: 'Starts crawling',
    description: 'Baby begins to crawl on hands and knees',
    expectedAgeMonthsMin: 7,
    expectedAgeMonthsMax: 10,
  },
  {
    category: 'motor',
    name: 'Uses pincer grasp',
    description: 'Baby picks up small objects using thumb and finger',
    expectedAgeMonthsMin: 8,
    expectedAgeMonthsMax: 10,
  },
  
  // 9-12 months
  {
    category: 'motor',
    name: 'Pulls to stand',
    description: 'Baby pulls up to standing position using furniture',
    expectedAgeMonthsMin: 9,
    expectedAgeMonthsMax: 12,
  },
  {
    category: 'motor',
    name: 'Cruises along furniture',
    description: 'Baby walks while holding onto furniture for support',
    expectedAgeMonthsMin: 9,
    expectedAgeMonthsMax: 12,
  },
  {
    category: 'motor',
    name: 'Stands alone briefly',
    description: 'Baby can stand without support for a few seconds',
    expectedAgeMonthsMin: 10,
    expectedAgeMonthsMax: 13,
  },
  {
    category: 'motor',
    name: 'Takes first steps',
    description: 'Baby takes first independent steps without support',
    expectedAgeMonthsMin: 11,
    expectedAgeMonthsMax: 14,
  },
  
  // 12-18 months
  {
    category: 'motor',
    name: 'Walks independently',
    description: 'Baby walks well without assistance',
    expectedAgeMonthsMin: 12,
    expectedAgeMonthsMax: 15,
  },
  {
    category: 'motor',
    name: 'Climbs stairs with help',
    description: 'Baby climbs stairs while holding hand or railing',
    expectedAgeMonthsMin: 14,
    expectedAgeMonthsMax: 18,
  },
  {
    category: 'motor',
    name: 'Stacks blocks',
    description: 'Baby can stack 2-3 blocks on top of each other',
    expectedAgeMonthsMin: 14,
    expectedAgeMonthsMax: 18,
  },
  {
    category: 'motor',
    name: 'Scribbles with crayon',
    description: 'Baby can hold a crayon and make marks on paper',
    expectedAgeMonthsMin: 15,
    expectedAgeMonthsMax: 18,
  },
  
  // 18-24 months
  {
    category: 'motor',
    name: 'Runs',
    description: 'Child can run, though may be unsteady',
    expectedAgeMonthsMin: 18,
    expectedAgeMonthsMax: 22,
  },
  {
    category: 'motor',
    name: 'Kicks a ball',
    description: 'Child can kick a ball forward',
    expectedAgeMonthsMin: 18,
    expectedAgeMonthsMax: 24,
  },
  {
    category: 'motor',
    name: 'Climbs stairs independently',
    description: 'Child walks up stairs with alternating feet',
    expectedAgeMonthsMin: 20,
    expectedAgeMonthsMax: 24,
  },

  // ============================================================================
  // COGNITIVE MILESTONES
  // ============================================================================
  
  // 0-3 months
  {
    category: 'cognitive',
    name: 'Focuses on faces',
    description: 'Baby focuses on and follows faces with eyes',
    expectedAgeMonthsMin: 0,
    expectedAgeMonthsMax: 2,
  },
  {
    category: 'cognitive',
    name: 'Follows moving objects',
    description: 'Baby tracks moving objects with eyes',
    expectedAgeMonthsMin: 1,
    expectedAgeMonthsMax: 3,
  },
  {
    category: 'cognitive',
    name: 'Recognizes familiar people',
    description: 'Baby shows recognition of familiar faces and voices',
    expectedAgeMonthsMin: 2,
    expectedAgeMonthsMax: 4,
  },
  
  // 3-6 months
  {
    category: 'cognitive',
    name: 'Explores objects with mouth',
    description: 'Baby brings objects to mouth to explore them',
    expectedAgeMonthsMin: 3,
    expectedAgeMonthsMax: 6,
  },
  {
    category: 'cognitive',
    name: 'Shows curiosity',
    description: 'Baby shows interest in new objects and surroundings',
    expectedAgeMonthsMin: 4,
    expectedAgeMonthsMax: 6,
  },
  {
    category: 'cognitive',
    name: 'Responds to own name',
    description: 'Baby turns head when name is called',
    expectedAgeMonthsMin: 5,
    expectedAgeMonthsMax: 7,
  },
  
  // 6-9 months
  {
    category: 'cognitive',
    name: 'Looks for dropped objects',
    description: 'Baby looks for objects that fall out of sight',
    expectedAgeMonthsMin: 6,
    expectedAgeMonthsMax: 9,
  },
  {
    category: 'cognitive',
    name: 'Understands object permanence',
    description: 'Baby understands that objects exist even when hidden',
    expectedAgeMonthsMin: 7,
    expectedAgeMonthsMax: 10,
  },
  {
    category: 'cognitive',
    name: 'Plays peek-a-boo',
    description: 'Baby enjoys and participates in peek-a-boo games',
    expectedAgeMonthsMin: 7,
    expectedAgeMonthsMax: 10,
  },
  
  // 9-12 months
  {
    category: 'cognitive',
    name: 'Imitates gestures',
    description: 'Baby copies simple gestures like waving or clapping',
    expectedAgeMonthsMin: 9,
    expectedAgeMonthsMax: 12,
  },
  {
    category: 'cognitive',
    name: 'Explores cause and effect',
    description: 'Baby experiments with actions to see results (dropping toys)',
    expectedAgeMonthsMin: 9,
    expectedAgeMonthsMax: 12,
  },
  {
    category: 'cognitive',
    name: 'Points to objects',
    description: 'Baby points to objects of interest',
    expectedAgeMonthsMin: 10,
    expectedAgeMonthsMax: 14,
  },
  
  // 12-18 months
  {
    category: 'cognitive',
    name: 'Follows simple instructions',
    description: 'Child follows simple one-step instructions',
    expectedAgeMonthsMin: 12,
    expectedAgeMonthsMax: 15,
  },
  {
    category: 'cognitive',
    name: 'Identifies body parts',
    description: 'Child can point to body parts when named',
    expectedAgeMonthsMin: 14,
    expectedAgeMonthsMax: 18,
  },
  {
    category: 'cognitive',
    name: 'Engages in pretend play',
    description: 'Child begins simple pretend play (feeding doll)',
    expectedAgeMonthsMin: 15,
    expectedAgeMonthsMax: 18,
  },
  
  // 18-24 months
  {
    category: 'cognitive',
    name: 'Sorts shapes and colors',
    description: 'Child can sort objects by shape or color',
    expectedAgeMonthsMin: 18,
    expectedAgeMonthsMax: 24,
  },
  {
    category: 'cognitive',
    name: 'Completes simple puzzles',
    description: 'Child can complete simple 2-3 piece puzzles',
    expectedAgeMonthsMin: 20,
    expectedAgeMonthsMax: 24,
  },
  {
    category: 'cognitive',
    name: 'Follows two-step instructions',
    description: 'Child follows instructions with two steps',
    expectedAgeMonthsMin: 20,
    expectedAgeMonthsMax: 24,
  },

  // ============================================================================
  // SOCIAL MILESTONES
  // ============================================================================
  
  // 0-3 months
  {
    category: 'social',
    name: 'First social smile',
    description: 'Baby smiles in response to people (not just reflexively)',
    expectedAgeMonthsMin: 1,
    expectedAgeMonthsMax: 3,
  },
  {
    category: 'social',
    name: 'Enjoys being held',
    description: 'Baby calms when picked up and held',
    expectedAgeMonthsMin: 0,
    expectedAgeMonthsMax: 2,
  },
  {
    category: 'social',
    name: 'Makes eye contact',
    description: 'Baby makes and maintains eye contact during interactions',
    expectedAgeMonthsMin: 1,
    expectedAgeMonthsMax: 3,
  },
  
  // 3-6 months
  {
    category: 'social',
    name: 'Laughs out loud',
    description: 'Baby laughs in response to play and interaction',
    expectedAgeMonthsMin: 3,
    expectedAgeMonthsMax: 5,
  },
  {
    category: 'social',
    name: 'Enjoys social play',
    description: 'Baby enjoys interactive games and play with caregivers',
    expectedAgeMonthsMin: 4,
    expectedAgeMonthsMax: 6,
  },
  {
    category: 'social',
    name: 'Shows preference for familiar people',
    description: 'Baby shows clear preference for parents and familiar caregivers',
    expectedAgeMonthsMin: 5,
    expectedAgeMonthsMax: 7,
  },
  
  // 6-9 months
  {
    category: 'social',
    name: 'Shows stranger anxiety',
    description: 'Baby shows wariness or fear around unfamiliar people',
    expectedAgeMonthsMin: 6,
    expectedAgeMonthsMax: 9,
  },
  {
    category: 'social',
    name: 'Shows separation anxiety',
    description: 'Baby becomes upset when primary caregiver leaves',
    expectedAgeMonthsMin: 7,
    expectedAgeMonthsMax: 10,
  },
  {
    category: 'social',
    name: 'Responds to emotions',
    description: "Baby responds to others' emotions (smiles when others smile)",
    expectedAgeMonthsMin: 7,
    expectedAgeMonthsMax: 10,
  },
  
  // 9-12 months
  {
    category: 'social',
    name: 'Waves bye-bye',
    description: 'Baby waves goodbye when prompted or spontaneously',
    expectedAgeMonthsMin: 9,
    expectedAgeMonthsMax: 12,
  },
  {
    category: 'social',
    name: 'Plays simple games',
    description: 'Baby engages in simple interactive games like pat-a-cake',
    expectedAgeMonthsMin: 9,
    expectedAgeMonthsMax: 12,
  },
  {
    category: 'social',
    name: 'Shows affection',
    description: 'Baby shows affection by hugging or kissing familiar people',
    expectedAgeMonthsMin: 10,
    expectedAgeMonthsMax: 14,
  },
  
  // 12-18 months
  {
    category: 'social',
    name: 'Plays alongside other children',
    description: 'Child engages in parallel play near other children',
    expectedAgeMonthsMin: 12,
    expectedAgeMonthsMax: 18,
  },
  {
    category: 'social',
    name: 'Shows empathy',
    description: 'Child shows concern when others are upset',
    expectedAgeMonthsMin: 14,
    expectedAgeMonthsMax: 18,
  },
  {
    category: 'social',
    name: 'Helps with simple tasks',
    description: 'Child tries to help with simple household tasks',
    expectedAgeMonthsMin: 15,
    expectedAgeMonthsMax: 18,
  },
  
  // 18-24 months
  {
    category: 'social',
    name: 'Shows independence',
    description: 'Child shows desire to do things independently',
    expectedAgeMonthsMin: 18,
    expectedAgeMonthsMax: 24,
  },
  {
    category: 'social',
    name: 'Engages in cooperative play',
    description: 'Child begins to play cooperatively with other children',
    expectedAgeMonthsMin: 20,
    expectedAgeMonthsMax: 24,
  },
  {
    category: 'social',
    name: 'Shows defiant behavior',
    description: 'Child says "no" and tests limits (normal development)',
    expectedAgeMonthsMin: 18,
    expectedAgeMonthsMax: 24,
  },

  // ============================================================================
  // LANGUAGE MILESTONES
  // ============================================================================
  
  // 0-3 months
  {
    category: 'language',
    name: 'Coos and gurgles',
    description: 'Baby makes cooing and gurgling sounds',
    expectedAgeMonthsMin: 1,
    expectedAgeMonthsMax: 3,
  },
  {
    category: 'language',
    name: 'Responds to sounds',
    description: 'Baby turns toward sounds and voices',
    expectedAgeMonthsMin: 0,
    expectedAgeMonthsMax: 2,
  },
  {
    category: 'language',
    name: 'Different cries for different needs',
    description: 'Baby has different cries for hunger, tiredness, discomfort',
    expectedAgeMonthsMin: 1,
    expectedAgeMonthsMax: 3,
  },
  
  // 3-6 months
  {
    category: 'language',
    name: 'Babbles with consonants',
    description: 'Baby babbles using consonant sounds (ba, da, ma)',
    expectedAgeMonthsMin: 4,
    expectedAgeMonthsMax: 6,
  },
  {
    category: 'language',
    name: 'Responds to tone of voice',
    description: 'Baby responds differently to happy vs. angry tones',
    expectedAgeMonthsMin: 4,
    expectedAgeMonthsMax: 6,
  },
  {
    category: 'language',
    name: 'Makes sounds to get attention',
    description: 'Baby vocalizes to get caregiver attention',
    expectedAgeMonthsMin: 5,
    expectedAgeMonthsMax: 7,
  },
  
  // 6-9 months
  {
    category: 'language',
    name: 'Babbles in strings',
    description: 'Baby babbles in longer strings of sounds (bababa, mamama)',
    expectedAgeMonthsMin: 6,
    expectedAgeMonthsMax: 9,
  },
  {
    category: 'language',
    name: 'Understands "no"',
    description: 'Baby shows understanding of the word "no"',
    expectedAgeMonthsMin: 7,
    expectedAgeMonthsMax: 10,
  },
  {
    category: 'language',
    name: 'Imitates speech sounds',
    description: 'Baby tries to imitate sounds and words',
    expectedAgeMonthsMin: 8,
    expectedAgeMonthsMax: 10,
  },
  
  // 9-12 months
  {
    category: 'language',
    name: 'Says first word',
    description: 'Baby says first meaningful word (mama, dada, or other)',
    expectedAgeMonthsMin: 10,
    expectedAgeMonthsMax: 14,
  },
  {
    category: 'language',
    name: 'Uses gestures to communicate',
    description: 'Baby uses gestures like pointing and reaching to communicate',
    expectedAgeMonthsMin: 9,
    expectedAgeMonthsMax: 12,
  },
  {
    category: 'language',
    name: 'Understands simple words',
    description: 'Baby understands common words like "bottle", "ball"',
    expectedAgeMonthsMin: 10,
    expectedAgeMonthsMax: 12,
  },
  
  // 12-18 months
  {
    category: 'language',
    name: 'Says several words',
    description: 'Child uses 3-5 words meaningfully',
    expectedAgeMonthsMin: 12,
    expectedAgeMonthsMax: 15,
  },
  {
    category: 'language',
    name: 'Points to show interest',
    description: 'Child points to objects to show interest or request',
    expectedAgeMonthsMin: 12,
    expectedAgeMonthsMax: 15,
  },
  {
    category: 'language',
    name: 'Vocabulary of 10+ words',
    description: 'Child uses 10 or more words',
    expectedAgeMonthsMin: 15,
    expectedAgeMonthsMax: 18,
  },
  
  // 18-24 months
  {
    category: 'language',
    name: 'Vocabulary of 50+ words',
    description: 'Child uses 50 or more words',
    expectedAgeMonthsMin: 18,
    expectedAgeMonthsMax: 24,
  },
  {
    category: 'language',
    name: 'Combines two words',
    description: 'Child puts two words together (more milk, daddy go)',
    expectedAgeMonthsMin: 18,
    expectedAgeMonthsMax: 24,
  },
  {
    category: 'language',
    name: 'Names familiar objects',
    description: 'Child can name familiar objects when asked',
    expectedAgeMonthsMin: 18,
    expectedAgeMonthsMax: 22,
  },
  {
    category: 'language',
    name: 'Asks simple questions',
    description: 'Child asks simple questions like "What\'s that?"',
    expectedAgeMonthsMin: 20,
    expectedAgeMonthsMax: 24,
  },
];

/**
 * All milestone definitions with generated IDs
 */
export const MILESTONE_DEFINITIONS: MilestoneDefinitionData[] = rawMilestoneDefinitions.map(
  (milestone) => ({
    ...milestone,
    id: generateDeterministicId(milestone.category, milestone.name),
  }),
);

/**
 * Get milestone definitions filtered by category
 */
export function getMilestonesByCategory(
  category: 'motor' | 'cognitive' | 'social' | 'language',
): MilestoneDefinitionData[] {
  return MILESTONE_DEFINITIONS.filter((m) => m.category === category);
}

/**
 * Get milestone definitions filtered by age range
 */
export function getMilestonesByAgeRange(
  minAgeMonths?: number,
  maxAgeMonths?: number,
): MilestoneDefinitionData[] {
  return MILESTONE_DEFINITIONS.filter((m) => {
    if (minAgeMonths !== undefined && m.expectedAgeMonthsMin < minAgeMonths) {
      return false;
    }
    if (maxAgeMonths !== undefined && m.expectedAgeMonthsMax > maxAgeMonths) {
      return false;
    }
    return true;
  });
}

/**
 * Get a single milestone definition by ID
 */
export function getMilestoneById(id: string): MilestoneDefinitionData | undefined {
  return MILESTONE_DEFINITIONS.find((m) => m.id === id);
}

/**
 * Get milestone definitions map by ID for quick lookup
 */
export const MILESTONE_DEFINITIONS_MAP: Map<string, MilestoneDefinitionData> = new Map(
  MILESTONE_DEFINITIONS.map((m) => [m.id, m]),
);
