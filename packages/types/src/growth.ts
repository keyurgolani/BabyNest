/**
 * Growth Tracking Types
 */

import { PaginationMetaDto } from './api';

// Growth response from API
export interface GrowthResponse {
  id: string;
  babyId: string;
  caregiverId: string;
  weight: number | null; // in grams
  height: number | null; // in mm
  headCircumference: number | null; // in mm
  weightPercentile: number | null;
  heightPercentile: number | null;
  headPercentile: number | null;
  notes: string | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  isDeleted: boolean;
}

// Growth list response from API
export interface GrowthListResponse {
  data: GrowthResponse[];
  meta: PaginationMetaDto;
}

// Create growth DTO
export interface CreateGrowthDto {
  timestamp?: string;
  weight?: number; // in grams
  height?: number; // in mm
  headCircumference?: number; // in mm
  notes?: string;
}

// Update growth DTO
export interface UpdateGrowthDto {
  timestamp?: string;
  weight?: number; // in grams
  height?: number; // in mm
  headCircumference?: number; // in mm
  notes?: string;
}

// Growth Percentiles types
export interface PercentileDataPoint {
  ageMonths: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

// Legacy type - kept for backward compatibility
export interface GrowthPercentilesResponse {
  babyId: string;
  babyName: string;
  babyAgeMonths: number;
  gender: string;
  weight: {
    current: number | null;
    percentile: number | null;
    percentileData: PercentileDataPoint[];
    measurements: Array<{ ageMonths: number; value: number }>;
  };
  height: {
    current: number | null;
    percentile: number | null;
    percentileData: PercentileDataPoint[];
    measurements: Array<{ ageMonths: number; value: number }>;
  };
  headCircumference: {
    current: number | null;
    percentile: number | null;
    percentileData: PercentileDataPoint[];
    measurements: Array<{ ageMonths: number; value: number }>;
  };
}

// Actual API response types for percentile chart
export interface PercentileChartDataPoint {
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

export interface PercentileChartResponse {
  measurementType: 'weight' | 'height' | 'headCircumference';
  gender: string;
  unit: string;
  data: PercentileChartDataPoint[];
  measurements: Array<{ ageMonths: number; value: number; percentile: number | null }>;
}

// Actual API response types for growth velocity
export interface VelocityDataPoint {
  fromDate: string;
  toDate: string;
  daysBetween: number;
  weightVelocity: number | null;
  heightVelocity: number | null;
  headCircumferenceVelocity: number | null;
  weightChange: number | null;
  heightChange: number | null;
  headCircumferenceChange: number | null;
}

export interface VelocitySummary {
  averageWeightVelocity: number | null;
  averageHeightVelocity: number | null;
  averageHeadCircumferenceVelocity: number | null;
  totalWeightChange: number | null;
  totalHeightChange: number | null;
  totalHeadCircumferenceChange: number | null;
}

export interface VelocityResponse {
  babyId: string;
  timeUnit: 'day' | 'week';
  unitDescription: string;
  measurementCount: number;
  velocityData: VelocityDataPoint[];
  summary: VelocitySummary;
}

// Legacy type - kept for backward compatibility
export interface GrowthVelocityResponse {
  babyId: string;
  babyName: string;
  babyAgeMonths: number;
  weight: {
    velocityPerWeek: number | null;
    velocityPerMonth: number | null;
    expectedVelocityPerWeek: { min: number; max: number };
    status: 'below' | 'normal' | 'above';
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  height: {
    velocityPerWeek: number | null;
    velocityPerMonth: number | null;
    expectedVelocityPerMonth: { min: number; max: number };
    status: 'below' | 'normal' | 'above';
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  headCircumference: {
    velocityPerWeek: number | null;
    velocityPerMonth: number | null;
    status: 'below' | 'normal' | 'above';
  };
  overallAssessment: string;
  recommendations: string[];
}
