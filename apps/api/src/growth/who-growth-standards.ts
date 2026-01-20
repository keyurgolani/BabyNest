/**
 * WHO Growth Standards Data
 * 
 * This file contains the LMS (Lambda-Mu-Sigma) parameters from the WHO Child Growth Standards
 * for children aged 0-24 months. These parameters are used to calculate percentiles for:
 * - Weight-for-age
 * - Length/height-for-age
 * - Head circumference-for-age
 * 
 * Data source: WHO Child Growth Standards (https://www.who.int/tools/child-growth-standards)
 * 
 * LMS Method:
 * - L (Lambda): Box-Cox power for normality
 * - M (Mu): Median
 * - S (Sigma): Coefficient of variation
 * 
 * Percentile calculation:
 * - When L ≠ 0: Z = ((measurement/M)^L - 1) / (L * S)
 * - When L = 0: Z = ln(measurement/M) / S
 * - Percentile = Φ(Z) where Φ is the standard normal CDF
 * 
 * Validates: Requirements 6.2
 */

export type Gender = 'male' | 'female';
export type MeasurementType = 'weight' | 'height' | 'headCircumference';

export interface LMSParams {
  L: number;  // Lambda (Box-Cox power)
  M: number;  // Mu (Median)
  S: number;  // Sigma (Coefficient of variation)
}

export interface WHODataPoint {
  ageMonths: number;
  L: number;
  M: number;
  S: number;
}

/**
 * WHO Weight-for-age LMS parameters for boys (0-24 months)
 * Weight in kg
 */
export const WEIGHT_FOR_AGE_BOYS: WHODataPoint[] = [
  { ageMonths: 0, L: 0.3487, M: 3.3464, S: 0.14602 },
  { ageMonths: 1, L: 0.2297, M: 4.4709, S: 0.13395 },
  { ageMonths: 2, L: 0.1970, M: 5.5675, S: 0.12385 },
  { ageMonths: 3, L: 0.1738, M: 6.3762, S: 0.11727 },
  { ageMonths: 4, L: 0.1553, M: 7.0023, S: 0.11316 },
  { ageMonths: 5, L: 0.1395, M: 7.5105, S: 0.1108 },
  { ageMonths: 6, L: 0.1257, M: 7.9340, S: 0.10958 },
  { ageMonths: 7, L: 0.1134, M: 8.2970, S: 0.10902 },
  { ageMonths: 8, L: 0.1021, M: 8.6151, S: 0.10882 },
  { ageMonths: 9, L: 0.0917, M: 8.9014, S: 0.10881 },
  { ageMonths: 10, L: 0.0822, M: 9.1649, S: 0.10891 },
  { ageMonths: 11, L: 0.0733, M: 9.4122, S: 0.10906 },
  { ageMonths: 12, L: 0.0651, M: 9.6479, S: 0.10925 },
  { ageMonths: 13, L: 0.0573, M: 9.8749, S: 0.10949 },
  { ageMonths: 14, L: 0.0500, M: 10.0953, S: 0.10976 },
  { ageMonths: 15, L: 0.0432, M: 10.3108, S: 0.11007 },
  { ageMonths: 16, L: 0.0368, M: 10.5228, S: 0.11041 },
  { ageMonths: 17, L: 0.0307, M: 10.7319, S: 0.11079 },
  { ageMonths: 18, L: 0.0250, M: 10.9385, S: 0.11119 },
  { ageMonths: 19, L: 0.0196, M: 11.1430, S: 0.11164 },
  { ageMonths: 20, L: 0.0144, M: 11.3462, S: 0.11211 },
  { ageMonths: 21, L: 0.0095, M: 11.5486, S: 0.11261 },
  { ageMonths: 22, L: 0.0049, M: 11.7504, S: 0.11314 },
  { ageMonths: 23, L: 0.0004, M: 11.9514, S: 0.11369 },
  { ageMonths: 24, L: -0.0038, M: 12.1515, S: 0.11426 },
];

/**
 * WHO Weight-for-age LMS parameters for girls (0-24 months)
 * Weight in kg
 */
export const WEIGHT_FOR_AGE_GIRLS: WHODataPoint[] = [
  { ageMonths: 0, L: 0.3809, M: 3.2322, S: 0.14171 },
  { ageMonths: 1, L: 0.1714, M: 4.1873, S: 0.13724 },
  { ageMonths: 2, L: 0.0962, M: 5.1282, S: 0.13000 },
  { ageMonths: 3, L: 0.0402, M: 5.8458, S: 0.12619 },
  { ageMonths: 4, L: -0.0050, M: 6.4237, S: 0.12402 },
  { ageMonths: 5, L: -0.0430, M: 6.8985, S: 0.12274 },
  { ageMonths: 6, L: -0.0756, M: 7.2970, S: 0.12204 },
  { ageMonths: 7, L: -0.1039, M: 7.6422, S: 0.12178 },
  { ageMonths: 8, L: -0.1288, M: 7.9487, S: 0.12181 },
  { ageMonths: 9, L: -0.1507, M: 8.2254, S: 0.12199 },
  { ageMonths: 10, L: -0.1700, M: 8.4800, S: 0.12223 },
  { ageMonths: 11, L: -0.1872, M: 8.7192, S: 0.12247 },
  { ageMonths: 12, L: -0.2024, M: 8.9481, S: 0.12268 },
  { ageMonths: 13, L: -0.2158, M: 9.1699, S: 0.12283 },
  { ageMonths: 14, L: -0.2278, M: 9.3870, S: 0.12294 },
  { ageMonths: 15, L: -0.2384, M: 9.6008, S: 0.12299 },
  { ageMonths: 16, L: -0.2478, M: 9.8124, S: 0.12303 },
  { ageMonths: 17, L: -0.2562, M: 10.0226, S: 0.12306 },
  { ageMonths: 18, L: -0.2637, M: 10.2315, S: 0.12309 },
  { ageMonths: 19, L: -0.2703, M: 10.4393, S: 0.12315 },
  { ageMonths: 20, L: -0.2762, M: 10.6464, S: 0.12323 },
  { ageMonths: 21, L: -0.2815, M: 10.8534, S: 0.12335 },
  { ageMonths: 22, L: -0.2862, M: 11.0608, S: 0.12351 },
  { ageMonths: 23, L: -0.2903, M: 11.2688, S: 0.12371 },
  { ageMonths: 24, L: -0.2941, M: 11.4775, S: 0.12396 },
];

/**
 * WHO Length/Height-for-age LMS parameters for boys (0-24 months)
 * Length/Height in cm
 */
export const HEIGHT_FOR_AGE_BOYS: WHODataPoint[] = [
  { ageMonths: 0, L: 1, M: 49.8842, S: 0.03795 },
  { ageMonths: 1, L: 1, M: 54.7244, S: 0.03557 },
  { ageMonths: 2, L: 1, M: 58.4249, S: 0.03424 },
  { ageMonths: 3, L: 1, M: 61.4292, S: 0.03328 },
  { ageMonths: 4, L: 1, M: 63.8860, S: 0.03257 },
  { ageMonths: 5, L: 1, M: 65.9026, S: 0.03204 },
  { ageMonths: 6, L: 1, M: 67.6236, S: 0.03165 },
  { ageMonths: 7, L: 1, M: 69.1645, S: 0.03139 },
  { ageMonths: 8, L: 1, M: 70.5994, S: 0.03124 },
  { ageMonths: 9, L: 1, M: 71.9687, S: 0.03117 },
  { ageMonths: 10, L: 1, M: 73.2812, S: 0.03118 },
  { ageMonths: 11, L: 1, M: 74.5388, S: 0.03125 },
  { ageMonths: 12, L: 1, M: 75.7488, S: 0.03137 },
  { ageMonths: 13, L: 1, M: 76.9186, S: 0.03154 },
  { ageMonths: 14, L: 1, M: 78.0497, S: 0.03174 },
  { ageMonths: 15, L: 1, M: 79.1458, S: 0.03197 },
  { ageMonths: 16, L: 1, M: 80.2113, S: 0.03222 },
  { ageMonths: 17, L: 1, M: 81.2487, S: 0.03248 },
  { ageMonths: 18, L: 1, M: 82.2587, S: 0.03276 },
  { ageMonths: 19, L: 1, M: 83.2418, S: 0.03306 },
  { ageMonths: 20, L: 1, M: 84.1996, S: 0.03336 },
  { ageMonths: 21, L: 1, M: 85.1348, S: 0.03366 },
  { ageMonths: 22, L: 1, M: 86.0477, S: 0.03396 },
  { ageMonths: 23, L: 1, M: 86.9410, S: 0.03426 },
  { ageMonths: 24, L: 1, M: 87.8161, S: 0.03455 },
];

/**
 * WHO Length/Height-for-age LMS parameters for girls (0-24 months)
 * Length/Height in cm
 */
export const HEIGHT_FOR_AGE_GIRLS: WHODataPoint[] = [
  { ageMonths: 0, L: 1, M: 49.1477, S: 0.0379 },
  { ageMonths: 1, L: 1, M: 53.6872, S: 0.0364 },
  { ageMonths: 2, L: 1, M: 57.0673, S: 0.03568 },
  { ageMonths: 3, L: 1, M: 59.8029, S: 0.0352 },
  { ageMonths: 4, L: 1, M: 62.0899, S: 0.03486 },
  { ageMonths: 5, L: 1, M: 64.0301, S: 0.03463 },
  { ageMonths: 6, L: 1, M: 65.7311, S: 0.03448 },
  { ageMonths: 7, L: 1, M: 67.2873, S: 0.03441 },
  { ageMonths: 8, L: 1, M: 68.7498, S: 0.0344 },
  { ageMonths: 9, L: 1, M: 70.1435, S: 0.03444 },
  { ageMonths: 10, L: 1, M: 71.4818, S: 0.03452 },
  { ageMonths: 11, L: 1, M: 72.771, S: 0.03464 },
  { ageMonths: 12, L: 1, M: 74.015, S: 0.03479 },
  { ageMonths: 13, L: 1, M: 75.2176, S: 0.03496 },
  { ageMonths: 14, L: 1, M: 76.3817, S: 0.03514 },
  { ageMonths: 15, L: 1, M: 77.5099, S: 0.03534 },
  { ageMonths: 16, L: 1, M: 78.6055, S: 0.03555 },
  { ageMonths: 17, L: 1, M: 79.671, S: 0.03576 },
  { ageMonths: 18, L: 1, M: 80.7079, S: 0.03598 },
  { ageMonths: 19, L: 1, M: 81.7182, S: 0.0362 },
  { ageMonths: 20, L: 1, M: 82.7036, S: 0.03643 },
  { ageMonths: 21, L: 1, M: 83.6654, S: 0.03666 },
  { ageMonths: 22, L: 1, M: 84.6040, S: 0.03688 },
  { ageMonths: 23, L: 1, M: 85.5202, S: 0.03711 },
  { ageMonths: 24, L: 1, M: 86.4153, S: 0.03734 },
];

/**
 * WHO Head circumference-for-age LMS parameters for boys (0-24 months)
 * Head circumference in cm
 */
export const HEAD_CIRCUMFERENCE_FOR_AGE_BOYS: WHODataPoint[] = [
  { ageMonths: 0, L: 1, M: 34.4618, S: 0.03686 },
  { ageMonths: 1, L: 1, M: 37.2759, S: 0.03133 },
  { ageMonths: 2, L: 1, M: 39.1285, S: 0.02997 },
  { ageMonths: 3, L: 1, M: 40.5135, S: 0.02918 },
  { ageMonths: 4, L: 1, M: 41.6317, S: 0.02868 },
  { ageMonths: 5, L: 1, M: 42.5576, S: 0.02837 },
  { ageMonths: 6, L: 1, M: 43.3306, S: 0.02817 },
  { ageMonths: 7, L: 1, M: 43.9803, S: 0.02804 },
  { ageMonths: 8, L: 1, M: 44.53, S: 0.02796 },
  { ageMonths: 9, L: 1, M: 44.9998, S: 0.02792 },
  { ageMonths: 10, L: 1, M: 45.4051, S: 0.0279 },
  { ageMonths: 11, L: 1, M: 45.7573, S: 0.0279 },
  { ageMonths: 12, L: 1, M: 46.0661, S: 0.02791 },
  { ageMonths: 13, L: 1, M: 46.3395, S: 0.02793 },
  { ageMonths: 14, L: 1, M: 46.5844, S: 0.02795 },
  { ageMonths: 15, L: 1, M: 46.806, S: 0.02798 },
  { ageMonths: 16, L: 1, M: 47.0088, S: 0.02802 },
  { ageMonths: 17, L: 1, M: 47.1962, S: 0.02806 },
  { ageMonths: 18, L: 1, M: 47.3711, S: 0.0281 },
  { ageMonths: 19, L: 1, M: 47.5357, S: 0.02815 },
  { ageMonths: 20, L: 1, M: 47.6919, S: 0.0282 },
  { ageMonths: 21, L: 1, M: 47.8408, S: 0.02825 },
  { ageMonths: 22, L: 1, M: 47.9833, S: 0.0283 },
  { ageMonths: 23, L: 1, M: 48.1201, S: 0.02836 },
  { ageMonths: 24, L: 1, M: 48.2515, S: 0.02841 },
];

/**
 * WHO Head circumference-for-age LMS parameters for girls (0-24 months)
 * Head circumference in cm
 */
export const HEAD_CIRCUMFERENCE_FOR_AGE_GIRLS: WHODataPoint[] = [
  { ageMonths: 0, L: 1, M: 33.8787, S: 0.03496 },
  { ageMonths: 1, L: 1, M: 36.5463, S: 0.0321 },
  { ageMonths: 2, L: 1, M: 38.2521, S: 0.03168 },
  { ageMonths: 3, L: 1, M: 39.5328, S: 0.03111 },
  { ageMonths: 4, L: 1, M: 40.5817, S: 0.03067 },
  { ageMonths: 5, L: 1, M: 41.459, S: 0.03035 },
  { ageMonths: 6, L: 1, M: 42.1995, S: 0.03013 },
  { ageMonths: 7, L: 1, M: 42.829, S: 0.02998 },
  { ageMonths: 8, L: 1, M: 43.3671, S: 0.02989 },
  { ageMonths: 9, L: 1, M: 43.83, S: 0.02982 },
  { ageMonths: 10, L: 1, M: 44.2319, S: 0.02977 },
  { ageMonths: 11, L: 1, M: 44.5844, S: 0.02975 },
  { ageMonths: 12, L: 1, M: 44.8965, S: 0.02973 },
  { ageMonths: 13, L: 1, M: 45.1752, S: 0.02973 },
  { ageMonths: 14, L: 1, M: 45.4265, S: 0.02973 },
  { ageMonths: 15, L: 1, M: 45.6551, S: 0.02974 },
  { ageMonths: 16, L: 1, M: 45.865, S: 0.02975 },
  { ageMonths: 17, L: 1, M: 46.0598, S: 0.02977 },
  { ageMonths: 18, L: 1, M: 46.2424, S: 0.02979 },
  { ageMonths: 19, L: 1, M: 46.4152, S: 0.02982 },
  { ageMonths: 20, L: 1, M: 46.5801, S: 0.02985 },
  { ageMonths: 21, L: 1, M: 46.7384, S: 0.02988 },
  { ageMonths: 22, L: 1, M: 46.8913, S: 0.02991 },
  { ageMonths: 23, L: 1, M: 47.0391, S: 0.02995 },
  { ageMonths: 24, L: 1, M: 47.1822, S: 0.02998 },
];

/**
 * Get the appropriate WHO data table for a given measurement type and gender
 */
export function getWHODataTable(
  measurementType: MeasurementType,
  gender: Gender,
): WHODataPoint[] {
  switch (measurementType) {
    case 'weight':
      return gender === 'male' ? WEIGHT_FOR_AGE_BOYS : WEIGHT_FOR_AGE_GIRLS;
    case 'height':
      return gender === 'male' ? HEIGHT_FOR_AGE_BOYS : HEIGHT_FOR_AGE_GIRLS;
    case 'headCircumference':
      return gender === 'male'
        ? HEAD_CIRCUMFERENCE_FOR_AGE_BOYS
        : HEAD_CIRCUMFERENCE_FOR_AGE_GIRLS;
  }
}

/**
 * Get LMS parameters for a specific age by interpolating between data points
 * Uses linear interpolation for ages between whole months
 */
export function getLMSParams(
  measurementType: MeasurementType,
  gender: Gender,
  ageInMonths: number,
): LMSParams | null {
  const dataTable = getWHODataTable(measurementType, gender);

  // Clamp age to valid range (0-24 months)
  if (ageInMonths < 0) {
    return null;
  }
  if (ageInMonths > 24) {
    // For ages beyond 24 months, use the 24-month values
    const lastPoint = dataTable[dataTable.length - 1];
    if (!lastPoint) return null;
    return { L: lastPoint.L, M: lastPoint.M, S: lastPoint.S };
  }

  // Find the two data points to interpolate between
  const lowerIndex = Math.floor(ageInMonths);
  const upperIndex = Math.ceil(ageInMonths);

  // If exact month, return that data point
  if (lowerIndex === upperIndex || upperIndex >= dataTable.length) {
    const point = dataTable[Math.min(lowerIndex, dataTable.length - 1)];
    if (!point) return null;
    return { L: point.L, M: point.M, S: point.S };
  }

  // Linear interpolation
  const lowerPoint = dataTable[lowerIndex];
  const upperPoint = dataTable[upperIndex];
  if (!lowerPoint || !upperPoint) return null;
  const fraction = ageInMonths - lowerIndex;

  return {
    L: lowerPoint.L + (upperPoint.L - lowerPoint.L) * fraction,
    M: lowerPoint.M + (upperPoint.M - lowerPoint.M) * fraction,
    S: lowerPoint.S + (upperPoint.S - lowerPoint.S) * fraction,
  };
}
