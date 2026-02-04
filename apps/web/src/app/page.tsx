"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useBaby } from "@/context/baby-context";
import {
  QuickActionsCard,
  RemindersCard,
  MilestonesCard,
  AISummaryCard,
  UpcomingMedications,
  TopQuickActions,
  HeroCard,
  QuickStatsBar,
} from "@/components/dashboard";
// Lazy-loaded FeedingPrediction for improved initial load time (Requirement 21.2)
import { LazyFeedingPrediction } from "@/components/lazy/insights";
import { api, SleepStatisticsResponse, GrowthResponse, ActivityListResponse, FeedingStatisticsResponse, DiaperStatisticsResponse } from "@/lib/api-client";
import { motion } from "framer-motion";
import { EditBabyProfileModal } from "@/components/settings/edit-baby-profile-modal";
import { Memory } from "@babynest/types";
import { Download, Loader2, Calendar, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export default function Home() {
  const { baby, babyId, refreshBaby } = useBaby();
  const [showEditModal, setShowEditModal] = useState(false);
  const [randomMemory, setRandomMemory] = useState<Memory | null>(null);
  const [sleepStats, setSleepStats] = useState<SleepStatisticsResponse | null>(null);
  const [feedingStats, setFeedingStats] = useState<FeedingStatisticsResponse | null>(null);
  const [diaperStats, setDiaperStats] = useState<DiaperStatisticsResponse | null>(null);
  const [latestGrowth, setLatestGrowth] = useState<GrowthResponse | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityListResponse | null>(null);
  const [downloading, setDownloading] = useState(false);

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
        tempReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
    <motion.main
      className="flex flex-col w-full h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Hero Avatar - More compact */}
      <motion.div variants={itemVariants} className="flex justify-between items-center flex-shrink-0 py-3 px-4 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Hero Avatar */}
          <HeroCard
            photoUrl={baby?.photoUrl}
            name={baby?.name || "Baby"}
            showEditOverlay={!!baby}
            onEditClick={() => setShowEditModal(true)}
          />

          {/* Baby Info */}
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground truncate">
                {baby?.name || "Baby"}
              </h1>
              {babyAge && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  {babyAge}
                </span>
              )}
            </div>
            {/* Quick Stats Bar */}
            <QuickStatsBar
              feedingStats={feedingStats}
              diaperStats={diaperStats}
              sleepStats={sleepStats}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center flex-shrink-0 md:hidden">
          <TopQuickActions />
        </div>
      </motion.div>

      {/* Compact Dashboard Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 lg:pb-4">
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 auto-rows-auto"
        >
          {/* Quick Actions - Desktop only, spans 8 cols */}
          <motion.div variants={itemVariants} className="hidden md:block lg:col-span-8">
            <QuickActionsCard />
          </motion.div>

          {/* AI Summary - Full width on mobile/tablet, spans 4 cols on desktop */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-4">
            <AISummaryCard />
          </motion.div>

          {/* Feeding Prediction + Medications Row */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <LazyFeedingPrediction />
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-4">
            <UpcomingMedications />
          </motion.div>

          {/* Reminders + Milestones Row */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <RemindersCard />
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-4">
            <MilestonesCard />
          </motion.div>

          {/* Memory Card - Compact */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <Link href="/memories" className="group block h-full">
              <GlassCard interactive className="h-full min-h-[140px] relative overflow-hidden !p-0">
                {randomMemory ? (
                  <>
                    <Image
                      src={randomMemory.photoUrl}
                      alt={randomMemory.title || "Memory"}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-memory)]/20 flex items-center justify-center">
                      <Icons.Memories className="w-6 h-6 text-[var(--color-memory)]" />
                    </div>
                    <span className="text-sm text-foreground font-medium">No memories yet</span>
                    <span className="text-xs text-muted-foreground text-center">Tap to add your first memory</span>
                  </div>
                )}
              </GlassCard>
            </Link>
          </motion.div>

          {/* Quick Navigation Grid - 4 compact cards in a row */}
          <motion.div variants={itemVariants} className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Family Card */}
              <Link href="/family" className="group">
                <GlassCard interactive size="sm" className="h-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-feed)]/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <Users className="w-4 h-4 text-[var(--color-feed)]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-foreground block truncate">Family</span>
                      <span className="text-xs text-muted-foreground truncate block">All babies</span>
                    </div>
                  </div>
                </GlassCard>
              </Link>

              {/* Timeline Card */}
              <Link href="/tracking/timeline" className="group">
                <GlassCard interactive size="sm" className="h-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-activity)]/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <Icons.Stats className="w-4 h-4 text-[var(--color-activity)]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-foreground block truncate">Timeline</span>
                      <span className="text-xs text-muted-foreground truncate block">History</span>
                    </div>
                  </div>
                </GlassCard>
              </Link>

              {/* Growth Card */}
              <Link href="/tracking/growth" className="group">
                <GlassCard interactive size="sm" className="h-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-growth)]/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <Icons.Growth className="w-4 h-4 text-[var(--color-growth)]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-foreground block truncate">Growth</span>
                      <span className="text-xs text-muted-foreground truncate block">
                        {latestGrowth?.weight ? `${(latestGrowth.weight / 1000).toFixed(1)}kg` : "Track"}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </Link>

              {/* Activities Card */}
              <Link href="/tracking/activities" className="group">
                <GlassCard interactive size="sm" className="h-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-nursing)]/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <Icons.Activity className="w-4 h-4 text-[var(--color-nursing)]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-foreground block truncate">Activities</span>
                      <span className="text-xs text-muted-foreground truncate block">
                        {recentActivities?.data?.length ? `${recentActivities.data.length} logged` : "Daily fun"}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </div>
          </motion.div>

          {/* Weekly Report Card - Compact */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <GlassCard size="sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-sleep)]/20 flex items-center justify-center flex-shrink-0">
                    <Icons.Report className="w-4 h-4 text-[var(--color-sleep)]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-foreground block truncate">Weekly Report</span>
                    <span className="text-xs text-muted-foreground truncate block">Last 7 days</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="h-8 px-2.5 text-xs bg-[var(--color-sleep)] hover:bg-[var(--color-sleep)]/80 text-white rounded-lg flex-shrink-0"
                >
                  {downloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 mr-1" />
                      PDF
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <Link
                  href="/report"
                  className="text-[var(--color-sleep)] font-medium hover:underline flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3" />
                  Custom range
                </Link>
                <Link
                  href="/report?tab=scheduled"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Schedule →
                </Link>
              </div>
            </GlassCard>
          </motion.div>
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
  );
}
