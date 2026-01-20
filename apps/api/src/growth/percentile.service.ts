/**
 * WHO Percentile Calculation Service
 * 
 * Implements the LMS method for calculating growth percentiles based on WHO standards.
 * 
 * The LMS method uses three parameters:
 * - L (Lambda): Box-Cox power for normality transformation
 * - M (Mu): Median value at that age
 * - S (Sigma): Coefficient of variation
 * 
 * Z-score calculation:
 * - When L ≠ 0: Z = ((measurement/M)^L - 1) / (L * S)
 * - When L = 0: Z = ln(measurement/M) / S
 * 
 * Percentile = Φ(Z) where Φ is the standard normal CDF
 * 
 * Validates: Requirements 6.2
 */

import { Injectable } from '@nestjs/common';

import {
  Gender,
  MeasurementType,
  getLMSParams,
  LMSParams,
} from './who-growth-standards';

export interface PercentileResult {
  percentile: number;
  zScore: number;
}

export interface GrowthPercentiles {
  weightPercentile: number | null;
  heightPercentile: number | null;
  headPercentile: number | null;
  weightZScore?: number | null;
  heightZScore?: number | null;
  headZScore?: number | null;
}

export interface PercentileChartData {
  ageMonths: number;
  p1: number;
  p3: number;
  p5: number;
  p10: number;
  p15: number;
  p25: number;
  p50: number;
  p75: number;
  p85: number;
  p90: number;
  p95: number;
  p97: number;
  p99: number;
}

/**
 * Standard normal cumulative distribution function (CDF)
 * Uses the Abramowitz and Stegun approximation (error < 7.5e-8)
 */
function normalCDF(z: number): number {
  // Constants for the approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Handle negative z values
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z);

  // Approximation formula
  const t = 1.0 / (1.0 + p * z);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z / 2);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Inverse standard normal CDF (quantile function)
 * Uses the Beasley-Springer-Moro algorithm
 */
function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Coefficients for the rational approximation
  const a0 = -3.969683028665376e1;
  const a1 = 2.209460984245205e2;
  const a2 = -2.759285104469687e2;
  const a3 = 1.383577518672690e2;
  const a4 = -3.066479806614716e1;
  const a5 = 2.506628277459239e0;

  const b0 = -5.447609879822406e1;
  const b1 = 1.615858368580409e2;
  const b2 = -1.556989798598866e2;
  const b3 = 6.680131188771972e1;
  const b4 = -1.328068155288572e1;

  const c0 = -7.784894002430293e-3;
  const c1 = -3.223964580411365e-1;
  const c2 = -2.400758277161838e0;
  const c3 = -2.549732539343734e0;
  const c4 = 4.374664141464968e0;
  const c5 = 2.938163982698783e0;

  const d0 = 7.784695709041462e-3;
  const d1 = 3.224671290700398e-1;
  const d2 = 2.445134137142996e0;
  const d3 = 3.754408661907416e0;

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number;
  let r: number;

  if (p < pLow) {
    // Rational approximation for lower region
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c0 * q + c1) * q + c2) * q + c3) * q + c4) * q + c5) /
      ((((d0 * q + d1) * q + d2) * q + d3) * q + 1)
    );
  } else if (p <= pHigh) {
    // Rational approximation for central region
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a0 * r + a1) * r + a2) * r + a3) * r + a4) * r + a5) *
        q) /
      (((((b0 * r + b1) * r + b2) * r + b3) * r + b4) * r + 1)
    );
  } else {
    // Rational approximation for upper region
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c0 * q + c1) * q + c2) * q + c3) * q + c4) * q + c5) /
      ((((d0 * q + d1) * q + d2) * q + d3) * q + 1)
    );
  }
}

/**
 * Calculate measurement value from Z-score using LMS parameters
 */
function measurementFromZScore(z: number, lms: LMSParams): number {
  const { L, M, S } = lms;

  if (Math.abs(L) < 0.001) {
    // When L ≈ 0, use the exponential formula
    return M * Math.exp(S * z);
  } else {
    // Standard LMS formula
    return M * Math.pow(1 + L * S * z, 1 / L);
  }
}

@Injectable()
export class PercentileService {
  /**
   * Calculate Z-score from measurement using LMS method
   * 
   * Formula:
   * - When L ≠ 0: Z = ((measurement/M)^L - 1) / (L * S)
   * - When L = 0: Z = ln(measurement/M) / S
   */
  calculateZScore(measurement: number, lms: LMSParams): number {
    const { L, M, S } = lms;

    if (Math.abs(L) < 0.001) {
      // When L ≈ 0, use the logarithmic formula
      return Math.log(measurement / M) / S;
    } else {
      // Standard LMS formula
      return (Math.pow(measurement / M, L) - 1) / (L * S);
    }
  }

  /**
   * Calculate percentile from Z-score
   * Percentile = Φ(Z) * 100 where Φ is the standard normal CDF
   */
  zScoreToPercentile(zScore: number): number {
    const percentile = normalCDF(zScore) * 100;
    // Round to 1 decimal place
    return Math.round(percentile * 10) / 10;
  }

  /**
   * Calculate percentile for a measurement given age and gender
   * 
   * @param measurementType - Type of measurement (weight, height, headCircumference)
   * @param measurement - The measurement value (weight in kg, height in cm, head in cm)
   * @param ageInMonths - Baby's age in months (can be fractional)
   * @param gender - Baby's gender ('male' or 'female')
   * @returns PercentileResult with percentile and z-score, or null if calculation not possible
   */
  calculatePercentile(
    measurementType: MeasurementType,
    measurement: number,
    ageInMonths: number,
    gender: Gender,
  ): PercentileResult | null {
    // Validate inputs
    if (measurement <= 0 || ageInMonths < 0) {
      return null;
    }

    // Get LMS parameters for this age and gender
    const lms = getLMSParams(measurementType, gender, ageInMonths);
    if (!lms) {
      return null;
    }

    // Calculate Z-score
    const zScore = this.calculateZScore(measurement, lms);

    // Calculate percentile
    const percentile = this.zScoreToPercentile(zScore);

    return {
      percentile,
      zScore: Math.round(zScore * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Calculate all percentiles for a growth entry
   * 
   * @param weight - Weight in grams (will be converted to kg)
   * @param height - Height in mm (will be converted to cm)
   * @param headCircumference - Head circumference in mm (will be converted to cm)
   * @param dateOfBirth - Baby's date of birth
   * @param measurementDate - Date of the measurement
   * @param gender - Baby's gender
   * @returns GrowthPercentiles object with all calculated percentiles
   */
  calculateGrowthPercentiles(
    weight: number | null,
    height: number | null,
    headCircumference: number | null,
    dateOfBirth: Date,
    measurementDate: Date,
    gender: string,
  ): GrowthPercentiles {
    // Calculate age in months
    const ageInMonths = this.calculateAgeInMonths(dateOfBirth, measurementDate);

    // Normalize gender
    const normalizedGender: Gender =
      gender === 'male' || gender === 'female' ? gender : 'male';

    const result: GrowthPercentiles = {
      weightPercentile: null,
      heightPercentile: null,
      headPercentile: null,
      weightZScore: null,
      heightZScore: null,
      headZScore: null,
    };

    // Calculate weight percentile (convert grams to kg)
    if (weight !== null && weight > 0) {
      const weightKg = weight / 1000;
      const weightResult = this.calculatePercentile(
        'weight',
        weightKg,
        ageInMonths,
        normalizedGender,
      );
      if (weightResult) {
        result.weightPercentile = weightResult.percentile;
        result.weightZScore = weightResult.zScore;
      }
    }

    // Calculate height percentile (convert mm to cm)
    if (height !== null && height > 0) {
      const heightCm = height / 10;
      const heightResult = this.calculatePercentile(
        'height',
        heightCm,
        ageInMonths,
        normalizedGender,
      );
      if (heightResult) {
        result.heightPercentile = heightResult.percentile;
        result.heightZScore = heightResult.zScore;
      }
    }

    // Calculate head circumference percentile (convert mm to cm)
    if (headCircumference !== null && headCircumference > 0) {
      const headCm = headCircumference / 10;
      const headResult = this.calculatePercentile(
        'headCircumference',
        headCm,
        ageInMonths,
        normalizedGender,
      );
      if (headResult) {
        result.headPercentile = headResult.percentile;
        result.headZScore = headResult.zScore;
      }
    }

    return result;
  }

  /**
   * Calculate age in months from date of birth to measurement date
   * Returns fractional months for more precise percentile calculation
   */
  calculateAgeInMonths(dateOfBirth: Date, measurementDate: Date): number {
    const dob = new Date(dateOfBirth);
    const measurement = new Date(measurementDate);

    // Calculate difference in milliseconds
    const diffMs = measurement.getTime() - dob.getTime();

    // Convert to days
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Convert to months (using average days per month: 30.4375)
    return diffDays / 30.4375;
  }

  /**
   * Generate percentile chart data for a specific measurement type and gender
   * Returns data points for common percentile lines (3rd, 15th, 50th, 85th, 97th)
   * 
   * @param measurementType - Type of measurement
   * @param gender - Baby's gender
   * @param startMonth - Starting age in months (default 0)
   * @param endMonth - Ending age in months (default 24)
   * @returns Array of chart data points
   */
  generatePercentileChartData(
    measurementType: MeasurementType,
    gender: Gender,
    startMonth: number = 0,
    endMonth: number = 24,
  ): PercentileChartData[] {
    const chartData: PercentileChartData[] = [];

    // Z-scores for granular percentiles
    const z1 = normalQuantile(0.01);
    const z3 = normalQuantile(0.03);
    const z5 = normalQuantile(0.05);
    const z10 = normalQuantile(0.10);
    const z15 = normalQuantile(0.15);
    const z25 = normalQuantile(0.25);
    const z50 = 0; // 50th percentile is always z=0
    const z75 = normalQuantile(0.75);
    const z85 = normalQuantile(0.85);
    const z90 = normalQuantile(0.90);
    const z95 = normalQuantile(0.95);
    const z97 = normalQuantile(0.97);
    const z99 = normalQuantile(0.99);

    for (let month = startMonth; month <= endMonth; month++) {
      const lms = getLMSParams(measurementType, gender, month);
      if (!lms) continue;

      chartData.push({
        ageMonths: month,
        p1: Math.round(measurementFromZScore(z1, lms) * 100) / 100,
        p3: Math.round(measurementFromZScore(z3, lms) * 100) / 100,
        p5: Math.round(measurementFromZScore(z5, lms) * 100) / 100,
        p10: Math.round(measurementFromZScore(z10, lms) * 100) / 100,
        p15: Math.round(measurementFromZScore(z15, lms) * 100) / 100,
        p25: Math.round(measurementFromZScore(z25, lms) * 100) / 100,
        p50: Math.round(measurementFromZScore(z50, lms) * 100) / 100,
        p75: Math.round(measurementFromZScore(z75, lms) * 100) / 100,
        p85: Math.round(measurementFromZScore(z85, lms) * 100) / 100,
        p90: Math.round(measurementFromZScore(z90, lms) * 100) / 100,
        p95: Math.round(measurementFromZScore(z95, lms) * 100) / 100,
        p97: Math.round(measurementFromZScore(z97, lms) * 100) / 100,
        p99: Math.round(measurementFromZScore(z99, lms) * 100) / 100,
      });
    }

    return chartData;
  }
}
