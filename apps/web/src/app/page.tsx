"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useRef } from "react";
import { useBaby } from "@/context/baby-context";
import {
  QuickActionsCard,
  RemindersCard,
  MilestonesCard,
  AISummaryCard,
  UpcomingMedications,
  TopQuickActions,
} from "@/components/dashboard";
import { FeedingPrediction } from "@/components/insights/FeedingPrediction";
import { api, SleepStatisticsResponse, GrowthResponse, ActivityListResponse, FeedingStatisticsResponse, DiaperStatisticsResponse } from "@/lib/api-client";
import { motion } from "framer-motion";
import { EditBabyProfileModal } from "@/components/settings/edit-baby-profile-modal";
import { Memory } from "@babynest/types";
import { Download, Loader2, Calendar, Users } from "lucide-react";

export default function Home() {
  const { baby, babyId, refreshBaby } = useBaby();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [showEditModal, setShowEditModal] = useState(false);
  const [randomMemory, setRandomMemory] = useState<Memory | null>(null);
  const [sleepStats, setSleepStats] = useState<SleepStatisticsResponse | null>(null);
  const [feedingStats, setFeedingStats] = useState<FeedingStatisticsResponse | null>(null);
  const [diaperStats, setDiaperStats] = useState<DiaperStatisticsResponse | null>(null);
  const [latestGrowth, setLatestGrowth] = useState<GrowthResponse | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityListResponse | null>(null);
  const [downloading, setDownloading] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Fetch random memory
  const fetchRandomMemory = async () => {
    try {
      const response = await api.memories.list();
      if (response.data && response.data.length > 0) {
        const randomIndex = Math.floor(Math.random() * response.data.length);
        setRandomMemory(response.data[randomIndex]);
      }
    } catch (error) {
      console.error("Failed to fetch memories:", error);
    }
  };

  // Fetch sleep statistics for today
  const fetchSleepStats = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      const stats = await api.statistics.sleep({ 
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      });
      setSleepStats(stats);
    } catch (error) {
      console.error("Failed to fetch sleep stats:", error);
    }
  };

  // Fetch feeding statistics for today
  const fetchFeedingStats = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      const stats = await api.statistics.feedings({ 
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      });
      setFeedingStats(stats);
    } catch (error) {
      console.error("Failed to fetch feeding stats:", error);
    }
  };

  // Fetch diaper statistics for today
  const fetchDiaperStats = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      const stats = await api.statistics.diapers({ 
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      });
      setDiaperStats(stats);
    } catch (error) {
      console.error("Failed to fetch diaper stats:", error);
    }
  };

  // Fetch latest growth measurement
  const fetchLatestGrowth = async () => {
    try {
      const response = await api.growth.list();
      if (response.data && response.data.length > 0) {
        setLatestGrowth(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch growth:", error);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const response = await api.activities.list();
      setRecentActivities(response);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  };

  // Fetch latest temperature reading
  const fetchLatestTemperature = async () => {
    try {
      const response = await api.health.symptoms.list();
      // Find the most recent fever/temperature reading
      const tempReadings = response.data.filter(s => s.symptomType === 'fever' && s.temperature !== null);
      if (tempReadings.length > 0) {
        // Sort by timestamp descending and get the most recent
        const sorted = tempReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        // Only show if within last 24 hours - removed display as state was removed
      }
    } catch (error) {
      console.error("Failed to fetch temperature:", error);
    }
  };

  // Handle PDF download
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const blob = await api.export.downloadPDFReport({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `baby-report-${endDate.toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download report:", error);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    // Only fetch data when we have an active baby
    if (babyId) {
      fetchRandomMemory();
      fetchSleepStats();
      fetchFeedingStats();
      fetchDiaperStats();
      fetchLatestGrowth();
      fetchRecentActivities();
      fetchLatestTemperature();
    }
  }, [babyId]);

  const babyAge = useMemo(() => {
    if (!baby?.age) return "";
    const { years, months, days } = baby.age;
    if (years > 0) {
      return `${years}y ${months}m`;
    }
    if (months > 0) {
      return `${months}m ${days}d`;
    }
    return `${days} days`;
  }, [baby]);

  // Format relative time (e.g., "2h ago", "30m ago")
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Quick info items for the status bar
  const quickInfo = useMemo(() => {
    const items: { icon: React.ReactNode; label: string; value: string; color: string }[] = [];
    
    // Last feeding
    if (feedingStats?.lastFeeding) {
      const feedType = feedingStats.lastFeeding.type === 'breastfeeding' ? 'Nursed' : 
                       feedingStats.lastFeeding.type === 'bottle' ? 'Bottle' : 
                       feedingStats.lastFeeding.type === 'pumping' ? 'Pumped' : 'Solids';
      items.push({
        icon: <Icons.Feed className="w-3.5 h-3.5" />,
        label: `Fed (${feedType})`,
        value: formatTimeAgo(feedingStats.lastFeeding.timestamp),
        color: 'text-amber-600 dark:text-amber-400'
      });
    }
    
    // Last diaper
    if (diaperStats?.lastDiaper) {
      const diaperType = diaperStats.lastDiaper.type === 'wet' ? 'Wet' : 
                         diaperStats.lastDiaper.type === 'dirty' ? 'Dirty' : 
                         diaperStats.lastDiaper.type === 'mixed' ? 'Mixed' : 'Dry';
      items.push({
        icon: <Icons.Diaper className="w-3.5 h-3.5" />,
        label: `Diaper (${diaperType})`,
        value: formatTimeAgo(diaperStats.lastDiaper.timestamp),
        color: 'text-sky-600 dark:text-sky-400'
      });
    }
    
    // Wake window
    if (sleepStats?.currentWakeWindowFormatted) {
      items.push({
        icon: <Icons.Sleep className="w-3.5 h-3.5" />,
        label: 'Awake',
        value: sleepStats.currentWakeWindowFormatted,
        color: 'text-violet-600 dark:text-violet-400'
      });
    }
    
    return items;
  }, [feedingStats, diaperStats, sleepStats]);

  // Handle parallax tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    const maxTilt = 15;
    const tiltX = (mouseY / (rect.height / 2)) * maxTilt;
    const tiltY = -(mouseX / (rect.width / 2)) * maxTilt;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <div className="h-screen w-full bg-aurora text-foreground relative flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-white/40 pointer-events-none" />
      <motion.main
        className="relative z-10 flex flex-col w-full mx-auto px-4 h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      {/* Header with Hero Avatar - Fixed */}
      <motion.div variants={itemVariants} className="flex justify-between items-center md:items-start flex-shrink-0 py-4 gap-4">
        <div className="flex items-center md:items-start gap-4 flex-1 min-w-0">
          {/* Parallax Hero Avatar */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div
              ref={heroRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={() => baby && !baby.photoUrl && setShowEditModal(true)}
              className={`relative ${!baby?.photoUrl ? 'cursor-pointer' : ''} group`}
              style={{ perspective: "500px" }}
              title={!baby?.photoUrl ? "Click to add profile photo" : undefined}
            >
              <div
                className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg transition-transform duration-200 ease-out relative"
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={baby?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Baby"}
                  alt={baby?.name || "Baby"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Baby";
                  }}
                />
                {/* Edit overlay on hover - only show when no photo */}
                {!baby?.photoUrl && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Icons.Edit className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10 transition-opacity duration-200"
                style={{
                  opacity: Math.abs(tilt.x) + Math.abs(tilt.y) > 0 ? 0.6 : 0.3,
                }}
              />
            </div>
            {/* Age badge - shown below avatar on mobile only */}
            {babyAge && (
              <span className="md:hidden text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium glow-soft">
                {babyAge}
              </span>
            )}
          </div>

          {/* Baby Info */}
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground text-shadow-soft truncate">
                {baby?.name || "Baby"}
              </h1>
              {/* Age badge - shown next to name on desktop */}
              {babyAge && (
                <span className="hidden md:inline-block text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium glow-soft flex-shrink-0">
                  {babyAge}
                </span>
              )}
            </div>
            {/* Quick Info Bar */}
            {quickInfo.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                {quickInfo.map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/60 dark:bg-black/20 border border-border/50 ${item.color}`}
                  >
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                    <span className="text-xs opacity-60">·</span>
                    <span className="text-xs font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start flex-shrink-0 md:hidden">
          <TopQuickActions />
        </div>
      </motion.div>

      {/* Two Column Layout - Fills remaining height */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 overflow-y-auto lg:overflow-hidden min-h-0">
        {/* Left Column: Actions, AI Summary, Reports, Navigation */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6 overflow-visible lg:overflow-y-auto pb-32 lg:pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
          {/* Quick Action Shortcuts - Hidden on mobile since they're in the header */}
          <div className="hidden md:block">
            <QuickActionsCard />
          </div>

          {/* AI Summary */}
          <AISummaryCard />

          {/* Mobile Only: Right column cards */}
          <div className="lg:hidden flex flex-col gap-6">
            <FeedingPrediction />
            <UpcomingMedications />
            <RemindersCard />
            <MilestonesCard />
          </div>

          {/* Memory + Navigation Links Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
            {/* Random Memory - Left Half (Square) */}
            <Link
              href="/memories"
              className="group relative aspect-square rounded-xl border border-rose-200/50 dark:border-rose-800/30 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                {randomMemory ? (
                  <>
                    <Image
                      src={randomMemory.photoUrl}
                      alt={randomMemory.title || "Memory"}
                      fill
                      sizes="(max-width: 768px) 50vw, 200px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority
                      unoptimized={randomMemory.photoUrl.startsWith("http")}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://api.dicebear.com/7.x/shapes/svg?seed=Memory&backgroundColor=f3f4f6";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-sm text-white/90 font-medium line-clamp-1">
                        {randomMemory.title || "Memory"}
                      </span>
                      <span className="text-xs text-white/70">
                        {new Date(randomMemory.takenAt).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                      <Icons.Memories className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">No memories yet</span>
                    <span className="text-xs text-muted-foreground/70">Tap to add your first memory</span>
                  </div>
                )}
              </div>
            </Link>

            {/* Navigation Cards - Right Half (Stacked Vertically) */}
            <div className="flex flex-col gap-2">
              {/* Family Overview Card */}
              <Link
                href="/family"
                className="group flex-1 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Family Overview</span>
                      <span className="text-[10px] text-muted-foreground">All babies & alerts</span>
                    </div>
                  </div>
                  <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>

              {/* Statistics Card */}
              <Link
                href="/tracking/timeline"
                className="group flex-1 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/50 dark:border-blue-800/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icons.Stats className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Timeline</span>
                      <span className="text-[10px] text-muted-foreground">
                        Activity history
                      </span>
                    </div>
                  </div>
                  <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>

              {/* Growth Card */}
              <Link
                href="/tracking/growth"
                className="group flex-1 p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icons.Growth className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Growth</span>
                      <span className="text-[10px] text-muted-foreground">
                        {latestGrowth?.weight ? `${(latestGrowth.weight / 1000).toFixed(1)}kg` : "Track progress"}
                      </span>
                    </div>
                  </div>
                  <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>

              {/* Activities Card */}
              <Link
                href="/tracking/activities"
                className="group flex-1 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-800/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icons.Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Activities</span>
                      <span className="text-[10px] text-muted-foreground">
                        {recentActivities?.data?.length ? `${recentActivities.data.length} logged` : "Daily fun"}
                      </span>
                    </div>
                  </div>
                  <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>

              {/* Weekly Report Card */}
              <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 border border-sky-200/50 dark:border-sky-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center">
                      <Icons.Report className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Weekly Report</span>
                      <span className="text-[10px] text-muted-foreground">Last 7 days</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="h-7 px-2 text-xs bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    {downloading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-1" />
                        PDF
                      </>
                    )}
                  </Button>
                </div>
                <div className="mt-2 pt-2 border-t border-sky-200/50 dark:border-sky-800/30 flex items-center justify-between">
                  <Link
                    href="/report"
                    className="text-[10px] text-sky-600 dark:text-sky-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3" />
                    Custom range
                  </Link>
                  <Link
                    href="/scheduled-reports"
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Schedule →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Feeding, Medications, Reminders, Milestones - Desktop Only */}
        <motion.div variants={itemVariants} className="hidden lg:flex flex-col gap-6 overflow-visible lg:overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
          {/* Feeding Prediction */}
          <FeedingPrediction />

          {/* Upcoming Medications */}
          <UpcomingMedications />

          {/* Reminders */}
          <RemindersCard />

          {/* Milestones */}
          <MilestonesCard />
        </motion.div>
      </div>

      {/* Edit Baby Profile Modal */}
      {showEditModal && baby && (
        <EditBabyProfileModal
          baby={baby}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            refreshBaby();
          }}
        />
      )}
    </motion.main>
    </div>
  );
}
