/**
 * Handoff Summary Service for BabyNest
 * Generates quick summaries of recent baby activities for caregiver handoffs
 * Helps parents share important information when handing off baby care duties
 */

import {
  getSleepPredictionService,
  formatDuration,
} from "./SleepPredictionService";
import { getDatabaseService } from "../database/DatabaseService";
import type {
  LocalFeedingEntry,
  LocalSleepEntry,
  LocalDiaperEntry,
} from "../database/types";

/**
 * Alert/concern types for handoff
 */
export type HandoffAlertType =
  | "feeding-overdue"
  | "low-wet-diapers"
  | "long-awake"
  | "no-dirty-diaper"
  | "low-sleep";

/**
 * Alert severity levels
 */
export type AlertSeverity = "info" | "warning" | "urgent";

/**
 * Handoff alert structure
 */
export interface HandoffAlert {
  type: HandoffAlertType;
  message: string;
  severity: AlertSeverity;
  emoji: string;
}

/**
 * Last activity summary
 */
export interface LastActivitySummary {
  /** Type of activity */
  type: "feeding" | "sleep" | "diaper";
  /** When the activity occurred */
  timestamp: Date;
  /** Minutes since the activity */
  minutesAgo: number;
  /** Human-readable time ago string */
  timeAgoText: string;
  /** Activity-specific details */
  details: string;
  /** Emoji for the activity */
  emoji: string;
}

/**
 * Daily totals for handoff summary
 */
export interface DailyTotals {
  feedingCount: number;
  totalFeedingMl: number;
  totalSleepMinutes: number;
  napCount: number;
  diaperCount: number;
  wetDiaperCount: number;
  dirtyDiaperCount: number;
}

/**
 * Wake window status for handoff
 */
export interface WakeWindowStatus {
  currentAwakeMinutes: number;
  status: "well-rested" | "approaching-tired" | "overtired";
  statusText: string;
  suggestedNextNapTime: Date | null;
  suggestedNextNapText: string | null;
}

/**
 * Complete handoff summary
 */
export interface HandoffSummary {
  /** Baby name */
  babyName: string;
  /** Generation timestamp */
  generatedAt: Date;
  /** Last feeding activity */
  lastFeeding: LastActivitySummary | null;
  /** Last sleep activity */
  lastSleep: LastActivitySummary | null;
  /** Last diaper activity */
  lastDiaper: LastActivitySummary | null;
  /** Wake window status */
  wakeWindow: WakeWindowStatus | null;
  /** Daily totals */
  dailyTotals: DailyTotals;
  /** Alerts and concerns */
  alerts: HandoffAlert[];
  /** Custom notes from caregiver */
  customNotes: string;
}

/**
 * Format minutes ago to human-readable text
 */
function formatTimeAgo(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours < 24) {
    if (mins === 0) return `${hours}h ago`;
    return `${hours}h ${mins}m ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Get feeding details text
 */
function getFeedingDetails(entry: LocalFeedingEntry): string {
  switch (entry.type) {
    case "breastfeeding": {
      const leftMin = entry.leftDuration ? Math.round(entry.leftDuration / 60) : 0;
      const rightMin = entry.rightDuration ? Math.round(entry.rightDuration / 60) : 0;
      const totalMin = leftMin + rightMin;
      if (entry.lastSide) {
        return `breastfeeding, ${totalMin}m (last: ${entry.lastSide})`;
      }
      return `breastfeeding, ${totalMin}m`;
    }
    case "bottle": {
      const amount = entry.amount ?? 0;
      const bottleType = entry.bottleType === "breastMilk" ? "breast milk" : entry.bottleType ?? "formula";
      return `bottle, ${amount}ml ${bottleType}`;
    }
    case "pumping": {
      const pumpedAmount = entry.pumpedAmount ?? 0;
      return `pumping, ${pumpedAmount}ml`;
    }
    case "solid":
      return `solid food${entry.foodType ? ` (${entry.foodType})` : ""}`;
    default:
      return entry.type;
  }
}

/**
 * Get sleep details text
 */
function getSleepDetails(entry: LocalSleepEntry): string {
  const duration = entry.duration ?? 0;
  const durationText = formatDuration(duration);
  const sleepType = entry.sleepType === "nap" ? "nap" : "night sleep";
  
  if (entry.endTime) {
    return `Woke from ${durationText} ${sleepType}`;
  }
  return `${sleepType} in progress`;
}

/**
 * Get diaper details text
 */
function getDiaperDetails(entry: LocalDiaperEntry): string {
  switch (entry.type) {
    case "wet":
      return "wet";
    case "dirty":
      return "dirty";
    case "mixed":
      return "wet + dirty";
    case "dry":
      return "dry";
    default:
      return entry.type;
  }
}

/**
 * Handoff Summary Service class
 */
export class HandoffSummaryService {
  /**
   * Generate a complete handoff summary for a baby
   */
  async generateSummary(
    babyId: string,
    babyName: string,
    dateOfBirth: Date | string,
    lookbackHours: number = 8
  ): Promise<HandoffSummary> {
    const db = getDatabaseService();
    await db.initialize();

    const now = new Date();
    const _lookbackTime = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Fetch recent entries
    const [feedingEntries, sleepEntries, diaperEntries] = await Promise.all([
      db.getFeedingEntries(babyId, 100),
      db.getSleepEntries(babyId, 100),
      db.getDiaperEntries(babyId, 100),
    ]);

    // Get last activities
    const lastFeeding = this.getLastFeeding(feedingEntries, now);
    const lastSleep = this.getLastSleep(sleepEntries, now);
    const lastDiaper = this.getLastDiaper(diaperEntries, now);

    // Get wake window status
    const wakeWindow = await this.getWakeWindowStatus(babyId, dateOfBirth);

    // Calculate daily totals
    const dailyTotals = this.calculateDailyTotals(
      feedingEntries,
      sleepEntries,
      diaperEntries,
      startOfDay
    );

    // Generate alerts
    const alerts = this.generateAlerts(
      lastFeeding,
      lastSleep,
      lastDiaper,
      dailyTotals,
      wakeWindow,
      now
    );

    return {
      babyName,
      generatedAt: now,
      lastFeeding,
      lastSleep,
      lastDiaper,
      wakeWindow,
      dailyTotals,
      alerts,
      customNotes: "",
    };
  }

  /**
   * Get last feeding activity
   */
  private getLastFeeding(
    entries: LocalFeedingEntry[],
    now: Date
  ): LastActivitySummary | null {
    if (entries.length === 0) return null;

    const lastEntry = entries[0]; // Already sorted by timestamp DESC
    const timestamp = new Date(lastEntry.timestamp);
    const minutesAgo = (now.getTime() - timestamp.getTime()) / (1000 * 60);

    return {
      type: "feeding",
      timestamp,
      minutesAgo,
      timeAgoText: formatTimeAgo(minutesAgo),
      details: getFeedingDetails(lastEntry),
      emoji: "🍼",
    };
  }

  /**
   * Get last sleep activity (completed sleep)
   */
  private getLastSleep(
    entries: LocalSleepEntry[],
    now: Date
  ): LastActivitySummary | null {
    // Find the most recent completed sleep
    const completedSleep = entries.find((e) => e.endTime !== null);
    if (!completedSleep) return null;

    const timestamp = new Date(completedSleep.endTime!);
    const minutesAgo = (now.getTime() - timestamp.getTime()) / (1000 * 60);

    return {
      type: "sleep",
      timestamp,
      minutesAgo,
      timeAgoText: formatTimeAgo(minutesAgo),
      details: getSleepDetails(completedSleep),
      emoji: "😴",
    };
  }

  /**
   * Get last diaper activity
   */
  private getLastDiaper(
    entries: LocalDiaperEntry[],
    now: Date
  ): LastActivitySummary | null {
    if (entries.length === 0) return null;

    const lastEntry = entries[0];
    const timestamp = new Date(lastEntry.timestamp);
    const minutesAgo = (now.getTime() - timestamp.getTime()) / (1000 * 60);

    return {
      type: "diaper",
      timestamp,
      minutesAgo,
      timeAgoText: formatTimeAgo(minutesAgo),
      details: getDiaperDetails(lastEntry),
      emoji: "👶",
    };
  }

  /**
   * Get wake window status using SleepPredictionService
   */
  private async getWakeWindowStatus(
    babyId: string,
    dateOfBirth: Date | string
  ): Promise<WakeWindowStatus | null> {
    try {
      const sleepService = getSleepPredictionService();
      const prediction = await sleepService.getPrediction(babyId, dateOfBirth);

      if (!prediction) return null;

      let statusText: string;
      switch (prediction.status) {
        case "well-rested":
          statusText = "well-rested";
          break;
        case "approaching-tired":
          statusText = "getting tired";
          break;
        case "overtired":
          statusText = "overtired";
          break;
      }

      let suggestedNextNapText: string | null = null;
      if (prediction.predictedSleepTime) {
        const napTime = prediction.predictedSleepTime;
        suggestedNextNapText = `around ${napTime.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`;
      }

      return {
        currentAwakeMinutes: prediction.currentAwakeMinutes,
        status: prediction.status,
        statusText,
        suggestedNextNapTime: prediction.predictedSleepTime,
        suggestedNextNapText,
      };
    } catch (error) {
      console.error("[HandoffSummaryService] Error getting wake window:", error);
      return null;
    }
  }

  /**
   * Calculate daily totals
   */
  private calculateDailyTotals(
    feedingEntries: LocalFeedingEntry[],
    sleepEntries: LocalSleepEntry[],
    diaperEntries: LocalDiaperEntry[],
    startOfDay: Date
  ): DailyTotals {
    // Filter to today's entries
    const todayFeedings = feedingEntries.filter(
      (e) => new Date(e.timestamp) >= startOfDay
    );
    const todaySleeps = sleepEntries.filter(
      (e) => new Date(e.startTime) >= startOfDay
    );
    const todayDiapers = diaperEntries.filter(
      (e) => new Date(e.timestamp) >= startOfDay
    );

    // Calculate feeding totals
    let totalFeedingMl = 0;
    for (const entry of todayFeedings) {
      if (entry.amount) totalFeedingMl += entry.amount;
      if (entry.pumpedAmount) totalFeedingMl += entry.pumpedAmount;
    }

    // Calculate sleep totals
    let totalSleepMinutes = 0;
    let napCount = 0;
    for (const entry of todaySleeps) {
      if (entry.duration) totalSleepMinutes += entry.duration;
      if (entry.sleepType === "nap") napCount++;
    }

    // Calculate diaper totals
    let wetDiaperCount = 0;
    let dirtyDiaperCount = 0;
    for (const entry of todayDiapers) {
      if (entry.type === "wet" || entry.type === "mixed") wetDiaperCount++;
      if (entry.type === "dirty" || entry.type === "mixed") dirtyDiaperCount++;
    }

    return {
      feedingCount: todayFeedings.length,
      totalFeedingMl,
      totalSleepMinutes,
      napCount,
      diaperCount: todayDiapers.length,
      wetDiaperCount,
      dirtyDiaperCount,
    };
  }

  /**
   * Generate alerts based on activity patterns
   */
  private generateAlerts(
    lastFeeding: LastActivitySummary | null,
    lastSleep: LastActivitySummary | null,
    lastDiaper: LastActivitySummary | null,
    dailyTotals: DailyTotals,
    wakeWindow: WakeWindowStatus | null,
    now: Date
  ): HandoffAlert[] {
    const alerts: HandoffAlert[] = [];
    const currentHour = now.getHours();

    // Check feeding - alert if more than 3.5 hours since last feeding
    if (lastFeeding && lastFeeding.minutesAgo > 210) {
      const hoursAgo = Math.round(lastFeeding.minutesAgo / 60 * 10) / 10;
      alerts.push({
        type: "feeding-overdue",
        message: `Due for feeding soon (~${hoursAgo}h since last)`,
        severity: lastFeeding.minutesAgo > 300 ? "warning" : "info",
        emoji: "🍼",
      });
    }

    // Check wet diapers - should have at least 1 per 3-4 hours during day
    // By afternoon, should have at least 3-4 wet diapers
    if (currentHour >= 12 && dailyTotals.wetDiaperCount < 3) {
      alerts.push({
        type: "low-wet-diapers",
        message: `Only ${dailyTotals.wetDiaperCount} wet diaper${dailyTotals.wetDiaperCount !== 1 ? "s" : ""} today - monitor hydration`,
        severity: dailyTotals.wetDiaperCount < 2 ? "warning" : "info",
        emoji: "💧",
      });
    }

    // Check for no dirty diaper in 24+ hours (for babies over 6 weeks)
    if (lastDiaper) {
      const lastDirtyDiaper = lastDiaper.details.includes("dirty");
      if (!lastDirtyDiaper && dailyTotals.dirtyDiaperCount === 0) {
        alerts.push({
          type: "no-dirty-diaper",
          message: "No dirty diaper today",
          severity: "info",
          emoji: "📝",
        });
      }
    }

    // Check wake window status
    if (wakeWindow && wakeWindow.status === "overtired") {
      alerts.push({
        type: "long-awake",
        message: `Baby has been awake ${formatDuration(wakeWindow.currentAwakeMinutes)} - may be overtired`,
        severity: "warning",
        emoji: "😴",
      });
    }

    // Check total sleep for the day (by evening)
    if (currentHour >= 18 && dailyTotals.totalSleepMinutes < 120) {
      alerts.push({
        type: "low-sleep",
        message: `Only ${formatDuration(dailyTotals.totalSleepMinutes)} total sleep today`,
        severity: "info",
        emoji: "💤",
      });
    }

    return alerts;
  }

  /**
   * Generate shareable text summary
   */
  generateShareableText(summary: HandoffSummary, customNotes?: string): string {
    const now = summary.generatedAt;
    const dateStr = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    let text = `🍼 BabyNest Handoff for ${summary.babyName}\n`;
    text += `📅 ${dateStr} at ${timeStr}\n\n`;

    // Last activities
    text += "LAST ACTIVITIES:\n";
    if (summary.lastFeeding) {
      text += `🍼 Fed: ${summary.lastFeeding.timeAgoText} (${summary.lastFeeding.details})\n`;
    } else {
      text += "🍼 Fed: No recent feeding logged\n";
    }

    if (summary.lastSleep) {
      text += `😴 Slept: ${summary.lastSleep.details} (${summary.lastSleep.timeAgoText})\n`;
    } else {
      text += "😴 Slept: No recent sleep logged\n";
    }

    if (summary.lastDiaper) {
      text += `👶 Diaper: ${summary.lastDiaper.timeAgoText} (${summary.lastDiaper.details})\n`;
    } else {
      text += "👶 Diaper: No recent diaper logged\n";
    }

    // Wake window
    if (summary.wakeWindow) {
      text += `\n⏰ WAKE WINDOW: ${formatDuration(summary.wakeWindow.currentAwakeMinutes)} (${summary.wakeWindow.statusText})\n`;
      if (summary.wakeWindow.suggestedNextNapText) {
        text += `🎯 Next nap suggested ${summary.wakeWindow.suggestedNextNapText}\n`;
      }
    }

    // Daily notes
    text += "\n📝 NOTES:\n";
    text += `- ${summary.dailyTotals.feedingCount} feeding${summary.dailyTotals.feedingCount !== 1 ? "s" : ""} today`;
    if (summary.dailyTotals.totalFeedingMl > 0) {
      text += ` (total ${summary.dailyTotals.totalFeedingMl}ml)`;
    }
    text += "\n";
    text += `- ${formatDuration(summary.dailyTotals.totalSleepMinutes)} total sleep today\n`;
    text += `- ${summary.dailyTotals.diaperCount} diaper${summary.dailyTotals.diaperCount !== 1 ? "s" : ""} (${summary.dailyTotals.wetDiaperCount} wet, ${summary.dailyTotals.dirtyDiaperCount} dirty)\n`;

    // Alerts
    if (summary.alerts.length > 0) {
      text += "\n⚠️ HEADS UP:\n";
      for (const alert of summary.alerts) {
        text += `- ${alert.message}\n`;
      }
    }

    // Custom notes
    const notes = customNotes ?? summary.customNotes;
    if (notes && notes.trim()) {
      text += `\n💬 CAREGIVER NOTES:\n${notes}\n`;
    }

    return text;
  }

  /**
   * Get quick tips based on baby's current state
   */
  getQuickTips(summary: HandoffSummary): string[] {
    const tips: string[] = [];

    // Wake window tips
    if (summary.wakeWindow) {
      switch (summary.wakeWindow.status) {
        case "well-rested":
          tips.push("Baby is well-rested - great time for play and tummy time!");
          break;
        case "approaching-tired":
          tips.push("Watch for sleepy cues - yawning, eye rubbing, fussiness");
          tips.push("Start winding down activities soon");
          break;
        case "overtired":
          tips.push("Baby may be overtired - try calming activities");
          tips.push("A dark, quiet room may help settle baby");
          break;
      }
    }

    // Feeding tips
    if (summary.lastFeeding && summary.lastFeeding.minutesAgo > 180) {
      tips.push("Baby may be getting hungry - watch for feeding cues");
    }

    // General tips based on time of day
    const hour = summary.generatedAt.getHours();
    if (hour >= 18 && hour < 21) {
      tips.push("Evening routine time - consider bath, feeding, and bedtime prep");
    }

    return tips;
  }
}

// Singleton instance
let handoffSummaryServiceInstance: HandoffSummaryService | null = null;

/**
 * Get the singleton handoff summary service instance
 */
export function getHandoffSummaryService(): HandoffSummaryService {
  if (!handoffSummaryServiceInstance) {
    handoffSummaryServiceInstance = new HandoffSummaryService();
  }
  return handoffSummaryServiceInstance;
}

export default HandoffSummaryService;
