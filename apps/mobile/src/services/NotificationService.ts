/**
 * Notification Service for Timer and Reminder Notifications
 * Provides persistent notifications when timers are running
 * and scheduled notifications for reminders
 * Validates: Requirements 14.6 (persistent notification when timer is running)
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { TimerType } from "../store/types";

/**
 * Reminder types supported by the system
 */
export type ReminderType = 'feeding' | 'sleep' | 'diaper' | 'medication' | 'custom';

/**
 * Local reminder data structure
 */
export interface LocalReminder {
  id: string;
  babyId: string;
  caregiverId: string;
  type: ReminderType;
  name: string;
  intervalMinutes: number | null;
  scheduledTimes: string[] | null;
  basedOnLastEntry: boolean;
  isEnabled: boolean;
  notifyAllCaregivers: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification IDs for each timer type
const TIMER_NOTIFICATION_IDS: Record<TimerType, string> = {
  breastfeeding: "timer-breastfeeding",
  sleep: "timer-sleep",
  tummyTime: "timer-tummyTime",
  pumping: "timer-pumping",
};

// Timer display names
const TIMER_DISPLAY_NAMES: Record<TimerType, string> = {
  breastfeeding: "Breastfeeding",
  sleep: "Sleep",
  tummyTime: "Tummy Time",
  pumping: "Pumping",
};

// Timer emojis for notifications
const TIMER_EMOJIS: Record<TimerType, string> = {
  breastfeeding: "🤱",
  sleep: "😴",
  tummyTime: "👶",
  pumping: "💧",
};

// Reminder type display names
const REMINDER_DISPLAY_NAMES: Record<ReminderType, string> = {
  feeding: "Feeding",
  sleep: "Sleep",
  diaper: "Diaper",
  medication: "Medication",
  custom: "Reminder",
};

// Reminder type emojis
const REMINDER_EMOJIS: Record<ReminderType, string> = {
  feeding: "🍼",
  sleep: "😴",
  diaper: "🧷",
  medication: "💊",
  custom: "⏰",
};

/**
 * Request notification permissions
 * Should be called on app startup
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus === "granted") {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("[NotificationService] Error requesting permissions:", error);
    return false;
  }
}

/**
 * Check if notification permissions are granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("[NotificationService] Error checking permissions:", error);
    return false;
  }
}

/**
 * Show a persistent notification for a running timer
 * Validates: Requirements 14.6 (display persistent notification with elapsed time)
 */
export async function showTimerNotification(
  timerType: TimerType,
  startTime: Date,
  metadata?: { breastSide?: "left" | "right"; sleepType?: "nap" | "night" }
): Promise<void> {
  try {
    const hasPermission = await hasNotificationPermissions();
    if (!hasPermission) {
      console.debug("[NotificationService] No notification permissions");
      return;
    }

    const displayName = TIMER_DISPLAY_NAMES[timerType];
    const emoji = TIMER_EMOJIS[timerType];
    
    // Build notification body with metadata
    let body = `${displayName} timer is running`;
    if (timerType === "breastfeeding" && metadata?.breastSide) {
      body = `${displayName} on ${metadata.breastSide} side`;
    } else if (timerType === "sleep" && metadata?.sleepType) {
      body = `${metadata.sleepType === "nap" ? "Nap" : "Night sleep"} in progress`;
    }

    // Calculate elapsed time for display
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    await Notifications.scheduleNotificationAsync({
      identifier: TIMER_NOTIFICATION_IDS[timerType],
      content: {
        title: `${emoji} ${displayName} Timer`,
        body: `${body} • Started ${timeStr} ago`,
        data: { timerType, startTime: startTime.toISOString() },
        // Android specific - make it ongoing/persistent
        ...(Platform.OS === "android" && {
          sticky: true,
          autoDismiss: false,
        }),
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error("[NotificationService] Error showing timer notification:", error);
  }
}

/**
 * Update an existing timer notification with new elapsed time
 * This replaces the existing notification with updated content
 */
export async function updateTimerNotification(
  timerType: TimerType,
  startTime: Date,
  metadata?: { breastSide?: "left" | "right"; sleepType?: "nap" | "night" }
): Promise<void> {
  // Simply show a new notification with the same ID - it will replace the existing one
  await showTimerNotification(timerType, startTime, metadata);
}

/**
 * Dismiss the timer notification when timer stops
 * Validates: Requirements 14.6 (dismiss notification when timer stops)
 */
export async function dismissTimerNotification(timerType: TimerType): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(TIMER_NOTIFICATION_IDS[timerType]);
  } catch (error) {
    console.error("[NotificationService] Error dismissing notification:", error);
  }
}

/**
 * Dismiss all timer notifications
 */
export async function dismissAllTimerNotifications(): Promise<void> {
  try {
    const timerTypes: TimerType[] = ["breastfeeding", "sleep", "tummyTime", "pumping"];
    await Promise.all(timerTypes.map((type) => dismissTimerNotification(type)));
  } catch (error) {
    console.error("[NotificationService] Error dismissing all notifications:", error);
  }
}

/**
 * Cancel all scheduled notifications (cleanup)
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("[NotificationService] Error canceling notifications:", error);
  }
}

/**
 * Set up notification response handler
 * Called when user taps on a notification
 */
export function setupNotificationResponseHandler(
  onNotificationTap: (timerType: TimerType) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data && data["timerType"]) {
      onNotificationTap(data["timerType"] as TimerType);
    }
  });
}

// ============================================================================
// Reminder Notification Functions
// ============================================================================

/**
 * Schedule a reminder notification
 * @param reminder The reminder to schedule
 * @param triggerTime When the notification should trigger
 * @param babyName Optional baby name for personalized message
 */
export async function scheduleReminderNotification(
  reminder: LocalReminder,
  triggerTime: Date,
  babyName?: string,
): Promise<string | null> {
  try {
    const hasPermission = await hasNotificationPermissions();
    if (!hasPermission) {
      console.debug("[NotificationService] No notification permissions for reminder");
      return null;
    }

    const displayName = REMINDER_DISPLAY_NAMES[reminder.type];
    const emoji = REMINDER_EMOJIS[reminder.type];
    
    // Build notification content
    const title = `${emoji} ${reminder.name}`;
    let body = `Time for ${babyName ? `${babyName}'s ` : ""}${displayName.toLowerCase()}!`;
    
    if (reminder.type === "feeding") {
      body = `Time to feed ${babyName || "baby"}! 🍼`;
    } else if (reminder.type === "sleep") {
      body = `${babyName || "Baby"} might be ready for sleep 😴`;
    } else if (reminder.type === "diaper") {
      body = `Time to check ${babyName ? `${babyName}'s ` : ""}diaper`;
    } else if (reminder.type === "medication") {
      body = `Time for ${babyName ? `${babyName}'s ` : ""}medication`;
    }

    // Calculate seconds until trigger
    const now = new Date();
    const secondsUntilTrigger = Math.max(1, Math.floor((triggerTime.getTime() - now.getTime()) / 1000));

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: `reminder-${reminder.id}`,
      content: {
        title,
        body,
        data: { 
          reminderId: reminder.id, 
          reminderType: reminder.type,
          babyId: reminder.babyId,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTrigger,
      },
    });

    console.debug(`[NotificationService] Scheduled reminder ${reminder.id} for ${triggerTime.toISOString()}`);
    return notificationId;
  } catch (error) {
    console.error("[NotificationService] Error scheduling reminder notification:", error);
    return null;
  }
}

/**
 * Schedule multiple reminder notifications based on scheduled times
 * @param reminder The reminder with scheduledTimes
 * @param babyName Optional baby name for personalized message
 */
export async function scheduleFixedTimeReminders(
  reminder: LocalReminder,
  babyName?: string,
): Promise<string[]> {
  const notificationIds: string[] = [];
  
  if (!reminder.scheduledTimes || reminder.scheduledTimes.length === 0) {
    return notificationIds;
  }

  try {
    const hasPermission = await hasNotificationPermissions();
    if (!hasPermission) {
      return notificationIds;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Parse scheduled times from JSON if needed
    let times: string[] = reminder.scheduledTimes;
    if (typeof reminder.scheduledTimes === 'string') {
      try {
        times = JSON.parse(reminder.scheduledTimes);
      } catch {
        times = [];
      }
    }

    for (const timeStr of times) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Schedule for today if time hasn't passed, otherwise tomorrow
      const scheduledDate = new Date(todayStr + 'T00:00:00');
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      if (scheduledDate <= now) {
        // Schedule for tomorrow
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      const notificationId = await scheduleReminderNotification(
        reminder,
        scheduledDate,
        babyName,
      );
      
      if (notificationId) {
        notificationIds.push(notificationId);
      }
    }
  } catch (error) {
    console.error("[NotificationService] Error scheduling fixed time reminders:", error);
  }

  return notificationIds;
}

/**
 * Schedule an interval-based reminder
 * @param reminder The reminder with intervalMinutes
 * @param lastEntryTime Optional last entry time for basedOnLastEntry reminders
 * @param babyName Optional baby name for personalized message
 */
export async function scheduleIntervalReminder(
  reminder: LocalReminder,
  lastEntryTime?: Date,
  babyName?: string,
): Promise<string | null> {
  if (!reminder.intervalMinutes) {
    return null;
  }

  try {
    const now = new Date();
    let triggerTime: Date;

    if (reminder.basedOnLastEntry && lastEntryTime) {
      // Calculate trigger time based on last entry
      triggerTime = new Date(lastEntryTime.getTime() + reminder.intervalMinutes * 60 * 1000);
      
      // If trigger time is in the past, schedule for next interval
      if (triggerTime <= now) {
        const elapsed = now.getTime() - lastEntryTime.getTime();
        const intervals = Math.ceil(elapsed / (reminder.intervalMinutes * 60 * 1000));
        triggerTime = new Date(lastEntryTime.getTime() + intervals * reminder.intervalMinutes * 60 * 1000);
      }
    } else {
      // Fixed interval from now
      triggerTime = new Date(now.getTime() + reminder.intervalMinutes * 60 * 1000);
    }

    return await scheduleReminderNotification(reminder, triggerTime, babyName);
  } catch (error) {
    console.error("[NotificationService] Error scheduling interval reminder:", error);
    return null;
  }
}

/**
 * Cancel a specific reminder notification
 * @param reminderId The reminder ID to cancel
 */
export async function cancelReminderNotification(reminderId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`reminder-${reminderId}`);
    console.debug(`[NotificationService] Cancelled reminder notification: ${reminderId}`);
  } catch (error) {
    console.error("[NotificationService] Error cancelling reminder notification:", error);
  }
}

/**
 * Cancel all reminder notifications for a baby
 * @param babyId The baby ID
 */
export async function cancelAllReminderNotifications(): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.identifier.startsWith('reminder-')) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    
    console.debug("[NotificationService] Cancelled all reminder notifications");
  } catch (error) {
    console.error("[NotificationService] Error cancelling all reminder notifications:", error);
  }
}

/**
 * Get all scheduled reminder notifications
 */
export async function getScheduledReminderNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return scheduledNotifications.filter(n => n.identifier.startsWith('reminder-'));
  } catch (error) {
    console.error("[NotificationService] Error getting scheduled reminders:", error);
    return [];
  }
}

/**
 * Reschedule all reminders for a baby after an entry is logged
 * This should be called when a feeding, sleep, diaper, or medication entry is logged
 * @param reminders All enabled reminders for the baby
 * @param entryType The type of entry that was just logged
 * @param entryTime The timestamp of the entry
 * @param babyName Optional baby name for personalized message
 */
export async function rescheduleRemindersAfterEntry(
  reminders: LocalReminder[],
  entryType: ReminderType,
  entryTime: Date,
  babyName?: string,
): Promise<void> {
  try {
    // Find reminders that match this entry type and are based on last entry
    const matchingReminders = reminders.filter(
      r => r.type === entryType && r.basedOnLastEntry && r.isEnabled && !r.isDeleted
    );

    for (const reminder of matchingReminders) {
      // Cancel existing notification
      await cancelReminderNotification(reminder.id);
      
      // Schedule new notification based on the new entry time
      await scheduleIntervalReminder(reminder, entryTime, babyName);
    }
  } catch (error) {
    console.error("[NotificationService] Error rescheduling reminders after entry:", error);
  }
}

export default {
  requestNotificationPermissions,
  hasNotificationPermissions,
  showTimerNotification,
  updateTimerNotification,
  dismissTimerNotification,
  dismissAllTimerNotifications,
  cancelAllNotifications,
  setupNotificationResponseHandler,
  // Reminder functions
  scheduleReminderNotification,
  scheduleFixedTimeReminders,
  scheduleIntervalReminder,
  cancelReminderNotification,
  cancelAllReminderNotifications,
  getScheduledReminderNotifications,
  rescheduleRemindersAfterEntry,
};
