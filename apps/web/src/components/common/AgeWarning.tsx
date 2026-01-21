"use client";

import { AlertTriangle } from "lucide-react";
import { useBaby } from "@/context/baby-context";

interface AgeWarningProps {
  minAgeMonths: number;
  activityName: string;
}

export function AgeWarning({ minAgeMonths, activityName }: AgeWarningProps) {
  const { baby } = useBaby();

  if (!baby) return null;

  const today = new Date();
  const birthDate = new Date(baby.dateOfBirth);
  
  // Calculate age in months roughly
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += today.getMonth();
  
  // Adjust if day of month hasn't passed yet
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }

  // If baby is younger than min age, show warning
  if (months < minAgeMonths) {
    return (
      <div className="mx-0 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-400">
            Wait! {baby.name} might be too young for {activityName}.
          </p>
          <p className="text-amber-700 dark:text-amber-500/90 mt-1">
            Recommended age is at least {minAgeMonths} months.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
