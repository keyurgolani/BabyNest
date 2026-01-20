"use client";

import { useEffect, useState } from "react";
import { 
  api, 
  DashboardUpcomingResponse,
  BabySummaryDto,
  DashboardAggregateResponse,
  DashboardAlertsResponse
} from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Baby, AlertTriangle, Calendar, Activity } from "lucide-react";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function FamilyDashboardPage() {
  const [summary, setSummary] = useState<DashboardAggregateResponse | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlertsResponse | null>(null);
  const [upcoming, setUpcoming] = useState<DashboardUpcomingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, alertsData, upcomingData] = await Promise.all([
          api.dashboard.getAggregateSummary(),
          api.dashboard.getAlerts(),
          api.dashboard.getUpcoming(),
        ]);
        setSummary(summaryData);
        setAlerts(alertsData);
        setUpcoming(upcomingData);
      } catch (error) {
        console.error("Failed to fetch family dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-aurora">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen w-full bg-aurora p-6">
      <motion.div 
        className="max-w-6xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Icons.Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Family Overview</h1>
            <p className="text-muted-foreground">At-a-glance view of all your little ones</p>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Baby className="w-4 h-4" /> Total Babies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary?.totalBabies || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {summary?.totalAlerts || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {upcoming?.total || 0}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Babies Details */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Baby Activity (Last 24h)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summary?.babies.map((baby) => (
              <BabySummaryCard key={baby.babyId} baby={baby} />
            ))}
            {(!summary?.babies || summary.babies.length === 0) && (
              <p className="text-muted-foreground">No babies found.</p>
            )}
          </div>
        </motion.div>

        {/* Alerts & Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts List */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Active Alerts
            </h2>
            <Card className="bg-card/50 border-0">
              <CardContent className="p-0">
                {alerts?.alerts && alerts.alerts.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {alerts.alerts.map((alert, i) => (
                      <div key={i} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{alert.title}</h4>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                              {alert.babyName}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No active alerts. Everything looking good!
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Upcoming
            </h2>
            <Card className="bg-card/50 border-0">
              <CardContent className="p-0">
                {upcoming?.events && upcoming.events.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {upcoming.events.map((event, i) => (
                      <div key={i} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {new Date(event.scheduledTime).getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              {event.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {event.babyName}
                            {event.description && ` • ${event.description}`}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(event.scheduledTime), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No upcoming events scheduled.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function BabySummaryCard({ baby }: { baby: BabySummaryDto }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-primary/10">
      <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{baby.babyName}</CardTitle>
          <Badge variant="outline">{baby.ageMonths}m old</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <Icons.Feed className="w-5 h-5 mx-auto mb-1 text-pink-500" />
              <div className="text-lg font-bold">{baby.feedingsLast24h}</div>
              <div className="text-[10px] text-muted-foreground">Feeds</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <Icons.Sleep className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
              <div className="text-lg font-bold">{baby.sleepLast24h}</div>
              <div className="text-[10px] text-muted-foreground">Sleeps</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <Icons.Diaper className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
              <div className="text-lg font-bold">{baby.diapersLast24h}</div>
              <div className="text-[10px] text-muted-foreground">Diapers</div>
            </div>
          </div>
          
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Last Feed:</span>
              <span className="font-medium text-foreground">
                {baby.lastFeeding ? formatDistanceToNow(new Date(baby.lastFeeding), { addSuffix: true }) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Sleep:</span>
              <span className="font-medium text-foreground">
                {baby.lastSleep ? formatDistanceToNow(new Date(baby.lastSleep), { addSuffix: true }) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Diaper:</span>
              <span className="font-medium text-foreground">
                {baby.lastDiaper ? formatDistanceToNow(new Date(baby.lastDiaper), { addSuffix: true }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
