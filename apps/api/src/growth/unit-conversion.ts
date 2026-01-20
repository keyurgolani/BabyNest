/**
 * Unit Conversion Utilities for Growth Tracking
 * Provides metric/imperial conversion functions for weight, length/height, and head circumference
 * Validates: Requirements 6.4
 */

/**
 * Unit system types
 */
export type UnitSystem = 'metric' | 'imperial';

/**
 * Conversion constants
 */
export const CONVERSION_CONSTANTS = {
  // Weight conversions
  GRAMS_PER_POUND: 453.59237,
  GRAMS_PER_OUNCE: 28.349523125,
  OUNCES_PER_POUND: 16,
  
  // Length conversions
  MM_PER_INCH: 25.4,
  CM_PER_INCH: 2.54,
} as const;

/**
 * Weight conversion result in imperial units
 */
export interface ImperialWeight {
  /** Total weight in pounds (decimal) */
  pounds: number;
  /** Weight broken down into whole pounds */
  wholePounds: number;
  /** Remaining ounces after whole pounds */
  ounces: number;
  /** Total weight in ounces */
  totalOunces: number;
}

/**
 * Length conversion result in imperial units
 */
export interface ImperialLength {
  /** Total length in inches (decimal) */
  inches: number;
  /** Length broken down into whole feet */
  feet: number;
  /** Remaining inches after whole feet */
  remainingInches: number;
}

/**
 * Growth measurements with both metric and imperial units
 */
export interface ConvertedGrowthMeasurements {
  metric: {
    /** Weight in grams */
    weight: number | null;
    /** Weight in kilograms */
    weightKg: number | null;
    /** Height in millimeters */
    height: number | null;
    /** Height in centimeters */
    heightCm: number | null;
    /** Head circumference in millimeters */
    headCircumference: number | null;
    /** Head circumference in centimeters */
    headCircumferenceCm: number | null;
  };
  imperial: {
    /** Weight in pounds (decimal) */
    weightLbs: number | null;
    /** Weight broken down: whole pounds */
    weightWholeLbs: number | null;
    /** Weight broken down: remaining ounces */
    weightOz: number | null;
    /** Total weight in ounces */
    weightTotalOz: number | null;
    /** Height in inches */
    heightIn: number | null;
    /** Head circumference in inches */
    headCircumferenceIn: number | null;
  };
}

// ============================================================================
// Weight Conversions
// ============================================================================

/**
 * Convert grams to pounds (decimal)
 * @param grams Weight in grams
 * @returns Weight in pounds (decimal)
 */
export function gramsToPounds(grams: number): number {
  return grams / CONVERSION_CONSTANTS.GRAMS_PER_POUND;
}

/**
 * Convert pounds to grams
 * @param pounds Weight in pounds (decimal)
 * @returns Weight in grams
 */
export function poundsToGrams(pounds: number): number {
  return pounds * CONVERSION_CONSTANTS.GRAMS_PER_POUND;
}

/**
 * Convert grams to ounces
 * @param grams Weight in grams
 * @returns Weight in ounces
 */
export function gramsToOunces(grams: number): number {
  return grams / CONVERSION_CONSTANTS.GRAMS_PER_OUNCE;
}

/**
 * Convert ounces to grams
 * @param ounces Weight in ounces
 * @returns Weight in grams
 */
export function ouncesToGrams(ounces: number): number {
  return ounces * CONVERSION_CONSTANTS.GRAMS_PER_OUNCE;
}

/**
 * Convert grams to kilograms
 * @param grams Weight in grams
 * @returns Weight in kilograms
 */
export function gramsToKilograms(grams: number): number {
  return grams / 1000;
}

/**
 * Convert kilograms to grams
 * @param kilograms Weight in kilograms
 * @returns Weight in grams
 */
export function kilogramsToGrams(kilograms: number): number {
  return kilograms * 1000;
}

/**
 * Convert grams to imperial weight breakdown (pounds and ounces)
 * @param grams Weight in grams
 * @returns Imperial weight breakdown
 */
export function gramsToImperialWeight(grams: number): ImperialWeight {
  const totalOunces = gramsToOunces(grams);
  const pounds = gramsToPounds(grams);
  const wholePounds = Math.floor(pounds);
  const ounces = totalOunces - (wholePounds * CONVERSION_CONSTANTS.OUNCES_PER_POUND);
  
  return {
    pounds: roundToDecimalPlaces(pounds, 2),
    wholePounds,
    ounces: roundToDecimalPlaces(ounces, 1),
    totalOunces: roundToDecimalPlaces(totalOunces, 1),
  };
}

/**
 * Convert pounds and ounces to grams
 * @param pounds Whole pounds
 * @param ounces Additional ounces
 * @returns Weight in grams
 */
export function imperialWeightToGrams(pounds: number, ounces: number = 0): number {
  const totalOunces = (pounds * CONVERSION_CONSTANTS.OUNCES_PER_POUND) + ounces;
  return ouncesToGrams(totalOunces);
}

// ============================================================================
// Length/Height Conversions
// ============================================================================

/**
 * Convert millimeters to inches
 * @param mm Length in millimeters
 * @returns Length in inches
 */
export function mmToInches(mm: number): number {
  return mm / CONVERSION_CONSTANTS.MM_PER_INCH;
}

/**
 * Convert inches to millimeters
 * @param inches Length in inches
 * @returns Length in millimeters
 */
export function inchesToMm(inches: number): number {
  return inches * CONVERSION_CONSTANTS.MM_PER_INCH;
}

/**
 * Convert centimeters to inches
 * @param cm Length in centimeters
 * @returns Length in inches
 */
export function cmToInches(cm: number): number {
  return cm / CONVERSION_CONSTANTS.CM_PER_INCH;
}

/**
 * Convert inches to centimeters
 * @param inches Length in inches
 * @returns Length in centimeters
 */
export function inchesToCm(inches: number): number {
  return inches * CONVERSION_CONSTANTS.CM_PER_INCH;
}

/**
 * Convert millimeters to centimeters
 * @param mm Length in millimeters
 * @returns Length in centimeters
 */
export function mmToCm(mm: number): number {
  return mm / 10;
}

/**
 * Convert centimeters to millimeters
 * @param cm Length in centimeters
 * @returns Length in millimeters
 */
export function cmToMm(cm: number): number {
  return cm * 10;
}

/**
 * Convert millimeters to imperial length breakdown (feet and inches)
 * @param mm Length in millimeters
 * @returns Imperial length breakdown
 */
export function mmToImperialLength(mm: number): ImperialLength {
  const totalInches = mmToInches(mm);
  const feet = Math.floor(totalInches / 12);
  const remainingInches = totalInches - (feet * 12);
  
  return {
    inches: roundToDecimalPlaces(totalInches, 2),
    feet,
    remainingInches: roundToDecimalPlaces(remainingInches, 1),
  };
}

/**
 * Convert feet and inches to millimeters
 * @param feet Whole feet
 * @param inches Additional inches
 * @returns Length in millimeters
 */
export function imperialLengthToMm(feet: number, inches: number = 0): number {
  const totalInches = (feet * 12) + inches;
  return inchesToMm(totalInches);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Round a number to a specified number of decimal places
 * @param value The number to round
 * @param decimalPlaces Number of decimal places
 * @returns Rounded number
 */
export function roundToDecimalPlaces(value: number, decimalPlaces: number): number {
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Convert all growth measurements to include both metric and imperial units
 * @param weightGrams Weight in grams (or null)
 * @param heightMm Height in millimeters (or null)
 * @param headCircumferenceMm Head circumference in millimeters (or null)
 * @returns Converted measurements in both unit systems
 */
export function convertGrowthMeasurements(
  weightGrams: number | null,
  heightMm: number | null,
  headCircumferenceMm: number | null,
): ConvertedGrowthMeasurements {
  // Calculate metric values
  const weightKg = weightGrams !== null ? roundToDecimalPlaces(gramsToKilograms(weightGrams), 2) : null;
  const heightCm = heightMm !== null ? roundToDecimalPlaces(mmToCm(heightMm), 1) : null;
  const headCircumferenceCm = headCircumferenceMm !== null ? roundToDecimalPlaces(mmToCm(headCircumferenceMm), 1) : null;

  // Calculate imperial values
  let imperialWeight: ImperialWeight | null = null;
  if (weightGrams !== null) {
    imperialWeight = gramsToImperialWeight(weightGrams);
  }

  const heightIn = heightMm !== null ? roundToDecimalPlaces(mmToInches(heightMm), 2) : null;
  const headCircumferenceIn = headCircumferenceMm !== null ? roundToDecimalPlaces(mmToInches(headCircumferenceMm), 2) : null;

  return {
    metric: {
      weight: weightGrams,
      weightKg,
      height: heightMm,
      heightCm,
      headCircumference: headCircumferenceMm,
      headCircumferenceCm,
    },
    imperial: {
      weightLbs: imperialWeight?.pounds ?? null,
      weightWholeLbs: imperialWeight?.wholePounds ?? null,
      weightOz: imperialWeight?.ounces ?? null,
      weightTotalOz: imperialWeight?.totalOunces ?? null,
      heightIn,
      headCircumferenceIn,
    },
  };
}

/**
 * Format weight for display
 * @param grams Weight in grams
 * @param unitSystem Unit system to use
 * @returns Formatted weight string
 */
export function formatWeight(grams: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    const kg = gramsToKilograms(grams);
    return `${roundToDecimalPlaces(kg, 2)} kg`;
  } else {
    const imperial = gramsToImperialWeight(grams);
    if (imperial.wholePounds > 0) {
      return `${imperial.wholePounds} lb ${roundToDecimalPlaces(imperial.ounces, 0)} oz`;
    }
    return `${roundToDecimalPlaces(imperial.totalOunces, 1)} oz`;
  }
}

/**
 * Format length for display
 * @param mm Length in millimeters
 * @param unitSystem Unit system to use
 * @returns Formatted length string
 */
export function formatLength(mm: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    const cm = mmToCm(mm);
    return `${roundToDecimalPlaces(cm, 1)} cm`;
  } else {
    const inches = mmToInches(mm);
    return `${roundToDecimalPlaces(inches, 1)} in`;
  }
}
