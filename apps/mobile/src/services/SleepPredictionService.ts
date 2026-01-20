/**
 * Sleep Prediction Service for BabyNest
 * Predicts optimal nap times based on baby's age, wake windows, and historical sleep patterns
 * Similar to Huckleberry's "SweetSpot" feature
 */

import { getDatabaseService } from "../database/DatabaseService";
import type { LocalSleepEntry } from "../database/types";
import { calculateAge } from "../utils/ageCalculation";

/**
 * Wake window status types
 */
export type WakeWindowStatus = "well-rested" | "approaching-tired" | "overtired";

/**
 * Confidence level for predictions
 */
export type PredictionConfidence = "high" | "medium" | "low";

/**
 * Sleep prediction result
 */
export interface SleepPrediction {
  /** Predicted optimal sleep time */
  predictedSleepTime: Date;
  /** Minutes until predicted sleep time (negative if overdue) */
  minutesUntilSleep: number;
  /** Confidence level of the prediction */
  confidence: PredictionConfidence;
  /** Current wake window status */
  status: WakeWindowStatus;
  /** Current awake duration in minutes */
  currentAwakeMinutes: number;
  /** Recommended wake window range for this age */
  recommendedWakeWindow: {
    minMinutes: number;
    maxMinutes: number;
    averageMinutes: number;
  };
  /** Personalized wake window based on historical data */
  personalizedWakeWindow: number | null;
  /** Percentage of wake window elapsed */
  percentageElapsed: number;
  /** Whether this is likely a nap or night sleep */
  sleepType: "nap" | "night";
  /** Last sleep end time */
  lastSleepEndTime: Date | null;
  /** Whether there's enough historical data for personalization */
  hasHistoricalData: boolean;
  /** Number of sleep entries used for personalization */
  historicalDataPoints: number;
}

/**
 * Age-based wake window guidelines in minutes
 * Based on pediatric sleep research
 */
export const WAKE_WINDOW_GUIDELINES: {
  maxAgeMonths: number;
  minMinutes: number;
  maxMinutes: number;
}[] = [
  { maxAgeMonths: 1, minMinutes: 45, maxMinutes: 60 },    // 0-1 months
  { maxAgeMonths: 2, minMinutes: 60, maxMinutes: 90 },    // 1-2 months
  { maxAgeMonths: 3, minMinutes: 75, maxMinutes: 120 },   // 2-3 months
  { maxAgeMonths: 4, minMinutes: 90, maxMinutes: 150 },   // 3-4 months
  { maxAgeMonths: 6, minMinutes: 120, maxMinutes: 180 },  // 4-6 months
  { maxAgeMonths: 9, minMinutes: 150, maxMinutes: 210 },  // 6-9 months
  { maxAgeMonths: 12, minMinutes: 180, maxMinutes: 240 }, // 9-12 months
  { maxAgeMonths: 18, minMinutes: 210, maxMinutes: 300 }, // 12-18 months
  { maxAgeMonths: 24, minMinutes: 300, maxMinutes: 360 }, // 18-24 months
  { maxAgeMonths: Infinity, minMinutes: 360, maxMinutes: 420 }, // 24+ months
];

/**
 * Get wake window range for a baby's age
 */
export function getWakeWindowRangeForAge(ageMonths: number): {
  minMinutes: number;
  maxMinutes: number;
  averageMinutes: number;
} {
  for (const guideline of WAKE_WINDOW_GUIDELINES) {
    if (ageMonths < guideline.maxAgeMonths) {
      return {
        minMinutes: guideline.minMinutes,
        maxMinutes: guideline.maxMinutes,
        averageMinutes: Math.round((guideline.minMinutes + guideline.maxMinutes) / 2),
      };
    }
  }
  return { minMinutes: 360, maxMinutes: 420, averageMinutes: 390 };
}

/**
 * Determine wake window status based on current awake time
 */
export function getWakeWindowStatus(
  currentAwakeMinutes: number,
  minWakeWindow: number,
  maxWakeWindow: number
): WakeWindowStatus {
  const midpoint = (minWakeWindow + maxWakeWindow) / 2;

  if (currentAwakeMinutes <= midpoint) {
    return "well-rested";
  } else if (currentAwakeMinutes <= maxWakeWindow) {
    return "approaching-tired";
  } else {
    return "overtired";
  }
}

/**
 * Determine if current time suggests nap or night sleep
 */
function determineSleepType(predictedTime: Date): "nap" | "night" {
  const hour = predictedTime.getHours();
  // Night sleep typically starts between 6 PM and 9 PM
  if (hour >= 18 || hour < 6) {
    return "night";
  }
  return "nap";
}

/**
 * Calculate personalized wake window from historical data
 * Uses weighted average favoring more recent entries
 */
function calculatePersonalizedWakeWindow(
  sleepEntries: LocalSleepEntry[]
): { averageMinutes: number; dataPoints: number } | null {
  // Filter to completed sleep entries with valid data
  const validEntries = sleepEntries.filter(
    (entry) => entry.endTime !== null && entry.startTime !== null
  );

  if (validEntries.length < 3) {
    return null; // Not enough data for personalization
  }

  // Sort by timestamp descending (most recent first)
  const sortedEntries = [...validEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Calculate wake windows between consecutive sleep sessions
  const wakeWindows: { minutes: number; weight: number }[] = [];

  for (let i = 0; i < sortedEntries.length - 1; i++) {
    const currentSleepStart = new Date(sortedEntries[i].startTime);
    const previousSleepEnd = sortedEntries[i + 1].endTime
      ? new Date(sortedEntries[i + 1].endTime)
      : null;

    if (previousSleepEnd) {
      const wakeWindowMs = currentSleepStart.getTime() - previousSleepEnd.getTime();
      const wakeWindowMinutes = Math.round(wakeWindowMs / (1000 * 60));

      // Only include reasonable wake windows (15 minutes to 8 hours)
      if (wakeWindowMinutes >= 15 && wakeWindowMinutes <= 480) {
        // Weight more recent entries higher (exponential decay)
        const weight = Math.pow(0.9, i);
        wakeWindows.push({ minutes: wakeWindowMinutes, weight });
      }
    }
  }

  if (wakeWindows.length < 2) {
    return null;
  }

  // Calculate weighted average
  const totalWeight = wakeWindows.reduce((sum, ww) => sum + ww.weight, 0);
  const weightedSum = wakeWindows.reduce(
    (sum, ww) => sum + ww.minutes * ww.weight,
    0
  );
  const averageMinutes = Math.round(weightedSum / totalWeight);

  return { averageMinutes, dataPoints: wakeWindows.length };
}

/**
 * Calculate prediction confidence based on available data
 */
function calculateConfidence(
  hasHistoricalData: boolean,
  dataPoints: number,
  currentAwakeMinutes: number,
  recommendedAverage: number
): PredictionConfidence {
  // High confidence: good historical data and within normal range
  if (hasHistoricalData && dataPoints >= 7) {
    const deviation = Math.abs(currentAwakeMinutes - recommendedAverage) / recommendedAverage;
    if (deviation < 0.3) {
      return "high";
    }
    return "medium";
  }

  // Medium confidence: some historical data
  if (hasHistoricalData && dataPoints >= 3) {
    return "medium";
  }

  // Low confidence: using only age-based defaults
  return "low";
}

/**
 * Sleep Prediction Service class
 */
export class SleepPredictionService {
  /**
   * Get sleep prediction for a baby
   */
  async getPrediction(
    babyId: string,
    dateOfBirth: Date | string
  ): Promise<SleepPrediction | null> {
    try {
      const db = getDatabaseService();
      await db.initialize();

      // Get recent sleep entries for analysis
      const sleepEntries = await db.getSleepEntries(babyId, 30);

      // Calculate baby's age in months
      const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
      const age = calculateAge(dob);
      const ageMonths = age.totalMonths + age.days / 30;

      // Get age-appropriate wake window range
      const recommendedWakeWindow = getWakeWindowRangeForAge(ageMonths);

      // Find the most recent completed sleep
      const lastCompletedSleep = sleepEntries.find(
        (entry) => entry.endTime !== null
      );

      const now = new Date();

      // If no sleep history, return prediction based on age defaults
      if (!lastCompletedSleep || !lastCompletedSleep.endTime) {
        const predictedSleepTime = new Date(
          now.getTime() + recommendedWakeWindow.averageMinutes * 60 * 1000
        );

        return {
          predictedSleepTime,
          minutesUntilSleep: recommendedWakeWindow.averageMinutes,
          confidence: "low",
          status: "well-rested",
          currentAwakeMinutes: 0,
          recommendedWakeWindow,
          personalizedWakeWindow: null,
          percentageElapsed: 0,
          sleepType: determineSleepType(predictedSleepTime),
          lastSleepEndTime: null,
          hasHistoricalData: false,
          historicalDataPoints: 0,
        };
      }

      // Calculate current awake time
      const lastSleepEndTime = new Date(lastCompletedSleep.endTime);
      const awakeMs = now.getTime() - lastSleepEndTime.getTime();
      const currentAwakeMinutes = Math.max(0, Math.round(awakeMs / (1000 * 60)));

      // Calculate personalized wake window from historical data
      const personalizedData = calculatePersonalizedWakeWindow(sleepEntries);
      const hasHistoricalData = personalizedData !== null;
      const historicalDataPoints = personalizedData?.dataPoints ?? 0;

      // Determine the target wake window (blend personalized with age-appropriate)
      let targetWakeWindow: number;
      if (personalizedData) {
        // Blend personalized data with age-appropriate guidelines
        // Weight personalized data more heavily if we have more data points
        const personalizedWeight = Math.min(0.7, 0.3 + (historicalDataPoints / 20) * 0.4);
        targetWakeWindow = Math.round(
          personalizedData.averageMinutes * personalizedWeight +
            recommendedWakeWindow.averageMinutes * (1 - personalizedWeight)
        );

        // Clamp to reasonable bounds based on age
        targetWakeWindow = Math.max(
          recommendedWakeWindow.minMinutes * 0.8,
          Math.min(recommendedWakeWindow.maxMinutes * 1.2, targetWakeWindow)
        );
      } else {
        targetWakeWindow = recommendedWakeWindow.averageMinutes;
      }

      // Calculate predicted sleep time
      const predictedSleepTime = new Date(
        lastSleepEndTime.getTime() + targetWakeWindow * 60 * 1000
      );

      // Calculate minutes until predicted sleep
      const minutesUntilSleep = Math.round(
        (predictedSleepTime.getTime() - now.getTime()) / (1000 * 60)
      );

      // Calculate percentage of wake window elapsed
      const percentageElapsed = Math.round(
        (currentAwakeMinutes / targetWakeWindow) * 100
      );

      // Determine status
      const status = getWakeWindowStatus(
        currentAwakeMinutes,
        recommendedWakeWindow.minMinutes,
        recommendedWakeWindow.maxMinutes
      );

      // Calculate confidence
      const confidence = calculateConfidence(
        hasHistoricalData,
        historicalDataPoints,
        currentAwakeMinutes,
        recommendedWakeWindow.averageMinutes
      );

      return {
        predictedSleepTime,
        minutesUntilSleep,
        confidence,
        status,
        currentAwakeMinutes,
        recommendedWakeWindow,
        personalizedWakeWindow: personalizedData?.averageMinutes ?? null,
        percentageElapsed,
        sleepType: determineSleepType(predictedSleepTime),
        lastSleepEndTime,
        hasHistoricalData,
        historicalDataPoints,
      };
    } catch (error) {
      console.error("[SleepPredictionService] Error getting prediction:", error);
      return null;
    }
  }

  /**
   * Get wake window guidance text for a baby's age
   */
  getWakeWindowGuidance(ageMonths: number): string {
    const range = getWakeWindowRangeForAge(ageMonths);
    const minHours = Math.floor(range.minMinutes / 60);
    const minMins = range.minMinutes % 60;
    const maxHours = Math.floor(range.maxMinutes / 60);
    const maxMins = range.maxMinutes % 60;

    const formatTime = (hours: number, mins: number): string => {
      if (hours === 0) return `${mins}m`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}m`;
    };

    return `${formatTime(minHours, minMins)} - ${formatTime(maxHours, maxMins)}`;
  }

  /**
   * Get status message based on prediction
   */
  getStatusMessage(prediction: SleepPrediction): string {
    switch (prediction.status) {
      case "well-rested":
        if (prediction.minutesUntilSleep > 30) {
          return "Baby is well-rested. Plenty of time before next nap.";
        }
        return "Getting close to nap time. Watch for sleepy cues.";
      case "approaching-tired":
        if (prediction.minutesUntilSleep > 0) {
          return "Baby is getting tired. Start winding down soon.";
        }
        return "Optimal sleep time is now! Look for sleepy cues.";
      case "overtired":
        return "Baby may be overtired. Try to start sleep routine now.";
      default:
        return "";
    }
  }
}

// Singleton instance
let sleepPredictionServiceInstance: SleepPredictionService | null = null;

/**
 * Get the singleton sleep prediction service instance
 */
export function getSleepPredictionService(): SleepPredictionService {
  if (!sleepPredictionServiceInstance) {
    sleepPredictionServiceInstance = new SleepPredictionService();
  }
  return sleepPredictionServiceInstance;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = Math.round(absMinutes % 60);

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format time until sleep with overdue handling
 */
export function formatTimeUntilSleep(minutes: number): string {
  if (minutes <= 0) {
    return `${formatDuration(Math.abs(minutes))} overdue`;
  }
  return formatDuration(minutes);
}
