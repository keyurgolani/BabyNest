"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_URL, ACCESS_TOKEN_KEY } from "@/lib/constants";
import { FeedingEntry, SleepEntry, DiaperEntry } from "@babynest/types";
import { useBaby } from "./baby-context";

import { BreastSide, ActivityType } from "@/lib/api-client";

export type LogType = "feed" | "sleep" | "diaper";

// Nursing timer state
export interface NursingTimerState {
  isActive: boolean;
  startTime: Date;
  currentSide: BreastSide;
  leftDuration: number; // seconds
  rightDuration: number; // seconds
}

// Activity timer state
export interface ActivityTimerState {
  isActive: boolean;
  startTime: Date;
  activityType: ActivityType;
  duration: number; // seconds
  notes?: string;
}

export interface LogEntry {
  id: string;
  type: LogType;
  startTime: Date;
  endTime?: Date; // For sleep
  notes?: string;
  details: Record<string, unknown>; // Flexible for now
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, "id">) => Promise<void>;
  getRecentLogs: () => LogEntry[];
  babyStatus: "Awake" | "Sleeping";
  setBabyStatus: (status: "Awake" | "Sleeping") => void;
  lastStatusChange: Date;
  setLastStatusChange: (date: Date) => void;
  refreshLogs: () => Promise<void>;
  // Nursing timer
  nursingTimer: NursingTimerState | null;
  startNursingTimer: (side: BreastSide) => void;
  switchNursingSide: () => void;
  stopNursingTimer: () => NursingTimerState | null;
  clearNursingTimer: () => void;
  // Activity timer
  activityTimer: ActivityTimerState | null;
  startActivityTimer: (activityType: ActivityType, notes?: string) => void;
  stopActivityTimer: () => ActivityTimerState | null;
  clearActivityTimer: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export function LogProvider({ children }: { children: React.ReactNode }) {
  const { babyId } = useBaby();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [babyStatus, setBabyStatus] = useState<"Awake" | "Sleeping">("Awake");
  const [lastStatusChange, setLastStatusChange] = useState<Date>(new Date());
  const [nursingTimer, setNursingTimer] = useState<NursingTimerState | null>(null);
  const [activityTimer, setActivityTimer] = useState<ActivityTimerState | null>(null);

  // Update nursing timer durations every second
  useEffect(() => {
    if (!nursingTimer?.isActive) return;
    
    const interval = setInterval(() => {
      setNursingTimer(prev => {
        if (!prev || !prev.isActive) return prev;
        const key = prev.currentSide === "left" ? "leftDuration" : "rightDuration";
        return { ...prev, [key]: prev[key] + 1 };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [nursingTimer?.isActive, nursingTimer?.currentSide]);

  // Update activity timer duration every second
  useEffect(() => {
    if (!activityTimer?.isActive) return;
    
    const interval = setInterval(() => {
      setActivityTimer(prev => {
        if (!prev || !prev.isActive) return prev;
        return { ...prev, duration: prev.duration + 1 };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activityTimer?.isActive]);

  const startNursingTimer = (side: BreastSide) => {
    setNursingTimer({
      isActive: true,
      startTime: new Date(),
      currentSide: side,
      leftDuration: 0,
      rightDuration: 0,
    });
  };

  const switchNursingSide = () => {
    setNursingTimer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentSide: prev.currentSide === "left" ? "right" : "left",
      };
    });
  };

  const stopNursingTimer = () => {
    const timer = nursingTimer;
    // Instead of clearing, just set isActive to false to preserve the data
    setNursingTimer(prev => prev ? { ...prev, isActive: false } : null);
    return timer;
  };

  const clearNursingTimer = () => {
    setNursingTimer(null);
  };

  const startActivityTimer = (activityType: ActivityType, notes?: string) => {
    setActivityTimer({
      isActive: true,
      startTime: new Date(),
      activityType,
      duration: 0,
      notes,
    });
  };

  const stopActivityTimer = () => {
    const timer = activityTimer;
    setActivityTimer(prev => prev ? { ...prev, isActive: false } : null);
    return timer;
  };

  const clearActivityTimer = () => {
    setActivityTimer(null);
  };

  const getHeaders = () => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    
    return headers;
  };

  const fetchLogs = useCallback(async () => {
    if (!babyId) {
      setLogs([]);
      return;
    }

    try {
      const headers = getHeaders();
      const [feedRes, sleepRes, diaperRes] = await Promise.all([
        fetch(`${API_URL}/babies/${babyId}/feedings?page=1&pageSize=50`, { headers }),
        fetch(`${API_URL}/babies/${babyId}/sleep?page=1&pageSize=50`, { headers }),
        fetch(`${API_URL}/babies/${babyId}/diapers?page=1&pageSize=50`, { headers }),
      ]);

      const [feedsRes, sleepsRes, diapersRes] = await Promise.all([
        feedRes.ok ? feedRes.json() : Promise.resolve({ data: [] }),
        sleepRes.ok ? sleepRes.json() : Promise.resolve({ data: [] }),
        diaperRes.ok ? diaperRes.json() : Promise.resolve({ data: [] }),
      ]);

      // Extract data arrays from paginated responses
      const feeds: FeedingEntry[] = feedsRes.data || [];
      const sleeps: SleepEntry[] = sleepsRes.data || [];
      const diapers: DiaperEntry[] = diapersRes.data || [];

      const formatedLogs: LogEntry[] = [];

      feeds.forEach((f) => {
        formatedLogs.push({
          id: f.id,
          type: "feed",
          startTime: new Date(f.timestamp),
          notes: f.notes || undefined,
          details: {
            type: f.type,
            amount: f.amount ? `${f.amount}ml` : undefined,
            duration: f.leftDuration || f.rightDuration ? `${Math.floor(((f.leftDuration || 0) + (f.rightDuration || 0)) / 60)}m` : undefined,
          },
        });
      });

      sleeps.forEach((s) => {
        formatedLogs.push({
          id: s.id,
          type: "sleep",
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
          notes: s.notes || undefined,
          details: {
            duration: s.duration ? `${s.duration}m` : undefined,
          },
        });
      });

      diapers.forEach((d) => {
        formatedLogs.push({
          id: d.id,
          type: "diaper",
          startTime: new Date(d.timestamp),
          notes: d.notes || undefined,
          details: {
            type: d.type,
          },
        });
      });

      // Sort by startTime desc
      formatedLogs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      setLogs(formatedLogs);

      // Determine baby status based on last sleep log
      // If there is an open sleep log (no end time), baby is sleeping
      // Or if the last log was sleep end?
      // Actually sleep logs usually have end time if completed.
      // If we support tracking logic, we'd check if currently sleeping.
      // For now, let's just infer from last relevant event or keep local state?
      // Local state is flaky. Let's infer.
      // Check for any sleep log without endTime?
      const openSleep = sleeps.find((s) => !s.endTime);
      if (openSleep) {
        setBabyStatus("Sleeping");
        setLastStatusChange(new Date(openSleep.startTime));
      } else {
        // If last sleep has end time, we are awake since then.
        // Or we default to Awake.
        setBabyStatus("Awake");
        // Update last status change to the end of last sleep, or start of last awake activity if defined.
        // For simplicity, just use the very last log time if no open sleep.
        if (formatedLogs.length > 0) {
            setLastStatusChange(formatedLogs[0].startTime);
        }
      }

    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  }, [babyId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = async (log: Omit<LogEntry, "id">) => {
    if (!babyId) {
      console.error("No active baby selected");
      return;
    }

    const headers = getHeaders();
    try {
      let url = "";
      let body = {};

      if (log.type === "feed") {
        url = `${API_URL}/babies/${babyId}/feedings`;
        // Map details to API DTO
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const details = log.details as any;
        const notes = details.note;
        if (details.amount) {
            body = {
                type: "bottle",
                amount: parseInt(details.amount.replace("ml", "")),
                bottleType: "formula", // default
                timestamp: log.startTime.toISOString(),
                notes
            };
        } else {
             // Assume breastfeeding
             // Parse duration "5m" -> 300s
             const durVal = parseInt(details.duration?.replace("m", "") || "0");
             body = {
                type: "breastfeeding",
                leftDuration: notes?.includes("Left") ? durVal * 60 : 0,
                rightDuration: notes?.includes("Right") ? durVal * 60 : 0,
                lastSide: notes?.includes("Left") ? "left" : "right",
                timestamp: log.startTime.toISOString(),
                notes
            };
        }
      } else if (log.type === "sleep") {
        url = `${API_URL}/babies/${babyId}/sleep`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const details = log.details as any;
        body = {
            startTime: log.startTime.toISOString(),
            endTime: log.endTime?.toISOString(),
            sleepType: "nap", // default
            notes: details.note
        };
      } else if (log.type === "diaper") {
        url = `${API_URL}/babies/${babyId}/diapers`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const details = log.details as any;
        body = {
            type: details.type.toLowerCase(), // Wet, Dirty -> wet, dirty
            timestamp: log.startTime.toISOString(),
            notes: details.note
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Failed to save log", err);
        throw new Error("Failed to save log");
      }

      // Refresh logs
      await fetchLogs();

    } catch (e) {
      console.error(e);
      // Optimistic update could go here
    }
  };

  const getRecentLogs = () => {
    return logs;
  };

  const refreshLogs = async () => {
      await fetchLogs();
  }

  return (
    <LogContext.Provider value={{ 
      logs, 
      addLog, 
      getRecentLogs, 
      babyStatus, 
      setBabyStatus, 
      lastStatusChange, 
      setLastStatusChange, 
      refreshLogs,
      nursingTimer,
      startNursingTimer,
      switchNursingSide,
      stopNursingTimer,
      clearNursingTimer,
      activityTimer,
      startActivityTimer,
      stopActivityTimer,
      clearActivityTimer,
    }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs() {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error("useLogs must be used within a LogProvider");
  }
  return context;
}
