"use client";

import { useLogs } from "@/context/log-context";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock } from "lucide-react";

export function RecentActivityFeed() {
  const { logs } = useLogs();
  const recentLogs = logs.slice(0, 5);

  if (logs.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</h3>
      </div>
      
      <div className="flex flex-col gap-3">
        {recentLogs.map((log, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
             {/* Icon Placeholder based on type */}
             <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-lg">
                    {log.type === 'feed' ? '🍼' : 
                     log.type === 'sleep' ? '😴' : 
                     log.type === 'diaper' ? '💩' : '📝'}
                </span>
             </div>
             
             <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate break-words">
                    {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                    {/* Add specific details if available in note or subtype */}
                </p>
                <p className="text-xs text-muted-foreground">
                    {log.notes || "No notes"}
                </p>
             </div>

             <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-1 rounded-lg">
                 <Clock className="w-3 h-3" />
                 {formatDistanceToNow(new Date(log.startTime), { addSuffix: true })}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
