"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { api } from "@/lib/api-client";
import { Memory } from "@babynest/types";
import { 
  TrendingUp, Scale, Ruler, Activity, Heart, Clock, 
  Camera, ChevronRight, Baby, Thermometer, Pill, Star,
  Moon, Droplets, Utensils
} from "lucide-react";

export default function TrackingPage() {
  return (
    <MobileContainer>
      <div className="p-4 space-y-4 pb-32 overflow-y-auto">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-heading font-bold text-foreground">Tracking</h1>
          <p className="text-sm text-muted-foreground">Monitor your baby&apos;s progress</p>
        </div>

        {/* Memories widget - Full width on mobile */}
        <div className="grid grid-cols-1 gap-3">
          <MemoriesWidget />
        </div>

        {/* Timeline - Full width on mobile */}
        <div className="grid grid-cols-1 gap-3">
          <MiniTimelineWidget />
        </div>

        {/* Milestones and Health - 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MilestonesWidget />
          <HealthWidget />
        </div>

        {/* Growth and Activities - Full width on mobile, 2 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GrowthWidget />
          <ActivityWidget />
        </div>
      </div>
    </MobileContainer>
  );
}

// Growth Widget
function GrowthWidget() {
  const [latestGrowth, setLatestGrowth] = useState<{ weight: number; height: number; head: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGrowth = async () => {
      try {
        const response = await api.growth.list({ pageSize: 1 });
        if (response.data.length > 0) {
          const latest = response.data[0];
          setLatestGrowth({
            weight: latest.weight ? latest.weight / 1000 : 0,
            height: latest.height ? latest.height / 10 : 0,
            head: latest.headCircumference ? latest.headCircumference / 10 : 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch growth:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrowth();
  }, []);

  return (
    <Card className="p-4 border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
      <Link href="/tracking/growth" className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-foreground">Growth</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : latestGrowth && (latestGrowth.weight > 0 || latestGrowth.height > 0) ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-emerald-500/15 rounded-lg">
            <div className="flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs text-muted-foreground">Weight</span>
            </div>
            <span className="text-sm font-bold text-foreground">{latestGrowth.weight.toFixed(1)} kg</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-blue-500/15 rounded-lg">
            <div className="flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-muted-foreground">Height</span>
            </div>
            <span className="text-sm font-bold text-foreground">{latestGrowth.height.toFixed(1)} cm</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-purple-500/15 rounded-lg">
            <div className="flex items-center gap-2">
              <Baby className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-muted-foreground">Head</span>
            </div>
            <span className="text-sm font-bold text-foreground">{latestGrowth.head.toFixed(1)} cm</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Scale className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <span className="text-xs text-muted-foreground">No data yet</span>
        </div>
      )}
    </Card>
  );
}

// Activity Widget
function ActivityWidget() {
  const [stats, setStats] = useState<{ tummyTime: number; outdoor: number; play: number; bath: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.activities.list();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayActivities = response.data.filter(a => 
          a.startTime && new Date(a.startTime).getTime() >= today.getTime()
        );
        
        const stats = { tummyTime: 0, outdoor: 0, play: 0, bath: 0 };
        todayActivities.forEach(a => {
          const duration = a.duration || 0;
          switch (a.activityType) {
            case "tummy_time": stats.tummyTime += duration; break;
            case "outdoor": stats.outdoor += duration; break;
            case "play": stats.play += duration; break;
            case "bath": stats.bath += 1; break;
          }
        });
        setStats(stats);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const hasActivity = stats && (stats.tummyTime > 0 || stats.outdoor > 0 || stats.play > 0 || stats.bath > 0);

  return (
    <Card className="p-4 border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5">
      <Link href="/tracking/activities" className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-foreground">Activities</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : hasActivity ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center p-2 bg-pink-500/15 rounded-lg">
            <span className="text-base">👶</span>
            <span className="text-xs font-bold text-foreground">{stats.tummyTime}m</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-green-500/15 rounded-lg">
            <span className="text-base">🌳</span>
            <span className="text-xs font-bold text-foreground">{stats.outdoor}m</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-amber-500/15 rounded-lg">
            <span className="text-base">🎮</span>
            <span className="text-xs font-bold text-foreground">{stats.play}m</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-cyan-500/15 rounded-lg">
            <span className="text-base">🛁</span>
            <span className="text-xs font-bold text-foreground">{stats.bath}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <span className="text-xs text-muted-foreground">No activity today</span>
        </div>
      )}
    </Card>
  );
}

// Health Widget
function HealthWidget() {
  const [healthStats, setHealthStats] = useState<{ symptoms: number; medications: number; vaccinations: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const [symptomsRes, medsRes, vaccinesRes] = await Promise.all([
          api.health.symptoms.list().catch(() => ({ data: [] })),
          api.health.medications.list().catch(() => ({ data: [] })),
          api.health.vaccinations.list().catch(() => ({ data: [] })),
        ]);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        setHealthStats({
          symptoms: symptomsRes.data.filter(s => new Date(s.timestamp) >= weekAgo).length,
          medications: medsRes.data.filter(m => new Date(m.timestamp) >= weekAgo).length,
          vaccinations: vaccinesRes.data.length,
        });
      } catch (err) {
        console.error("Failed to fetch health:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <Card className="p-4 border-0 bg-gradient-to-br from-rose-500/10 to-rose-500/5">
      <Link href="/tracking/health" className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-foreground">Health</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : healthStats ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-red-500/15 rounded-lg">
            <div className="flex items-center gap-2">
              <Thermometer className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs text-muted-foreground">Symptoms</span>
            </div>
            <span className="text-sm font-bold text-foreground">{healthStats.symptoms}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-blue-500/15 rounded-lg">
            <div className="flex items-center gap-2">
              <Pill className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Meds</span>
            </div>
            <span className="text-sm font-bold text-foreground">{healthStats.medications}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-green-500/15 rounded-lg">
            <div className="flex items-center gap-2">
              <Icons.Vaccination className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-muted-foreground">Vaccines</span>
            </div>
            <span className="text-sm font-bold text-foreground">{healthStats.vaccinations}</span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

// Milestones Widget
function MilestonesWidget() {
  const [stats, setStats] = useState<{ achieved: number; upcoming: number } | null>(null);
  const [upcomingMilestones, setUpcomingMilestones] = useState<Array<{ name: string; category: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const response = await api.milestones.getByCategory();
        setStats({
          achieved: response.summary.achievedCount,
          upcoming: response.summary.upcomingCount,
        });
        
        // Collect upcoming milestones from all categories
        const upcoming: Array<{ name: string; category: string }> = [];
        const categories = ['motor', 'cognitive', 'social', 'language'] as const;
        
        categories.forEach(cat => {
          response[cat]
            .filter(m => m.isUpcoming && !m.isAchieved)
            .slice(0, 2) // Take up to 2 from each category
            .forEach(m => {
              upcoming.push({
                name: m.definition.name,
                category: cat,
              });
            });
        });
        
        // Take first 3 upcoming milestones
        setUpcomingMilestones(upcoming.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch milestones:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMilestones();
  }, []);

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'motor': return '🏃';
      case 'cognitive': return '🧠';
      case 'social': return '👋';
      case 'language': return '💬';
      default: return '⭐';
    }
  };

  return (
    <Card className="p-4 border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
      <Link href="/milestones" className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Star className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-foreground">Milestones</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      
      {isLoading ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        </div>
      ) : stats ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center p-2 bg-green-500/15 rounded-lg">
              <span className="text-lg font-bold text-foreground">{stats.achieved}</span>
              <span className="text-[10px] text-muted-foreground">Achieved</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-amber-500/15 rounded-lg">
              <span className="text-lg font-bold text-foreground">{stats.upcoming}</span>
              <span className="text-[10px] text-muted-foreground">Upcoming</span>
            </div>
          </div>
          
          {upcomingMilestones.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Next Up</span>
              {upcomingMilestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 bg-purple-500/10 rounded-lg">
                  <span className="text-sm">{getCategoryEmoji(m.category)}</span>
                  <span className="text-[11px] text-foreground truncate">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Star className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <span className="text-xs text-muted-foreground">Track milestones</span>
        </div>
      )}
    </Card>
  );
}

// Mini Timeline Widget - Shows recent activity
interface TimelineEntry {
  id: string;
  type: 'feeding' | 'sleep' | 'diaper' | 'activity';
  timestamp: Date;
  label: string;
  detail?: string;
}

function MiniTimelineWidget() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const [feedingsRes, sleepRes, diapersRes] = await Promise.all([
          api.feedings.list({ pageSize: 5 }).catch(() => ({ data: [] })),
          api.sleep.list({ pageSize: 5 }).catch(() => ({ data: [] })),
          api.diapers.list({ pageSize: 5 }).catch(() => ({ data: [] })),
        ]);

        const allEntries: TimelineEntry[] = [];

        feedingsRes.data.forEach(f => {
          let label = 'Feeding';
          let detail = '';
          if (f.type === 'bottle' && f.amount) {
            label = 'Bottle';
            detail = `${f.amount}ml`;
          } else if (f.type === 'breastfeeding') {
            label = 'Nursing';
            const duration = (f.leftDuration || 0) + (f.rightDuration || 0);
            if (duration > 0) detail = `${duration}min`;
          } else if (f.type === 'solid') {
            label = 'Solids';
            detail = f.foodType || '';
          }
          allEntries.push({
            id: f.id,
            type: 'feeding',
            timestamp: new Date(f.timestamp),
            label,
            detail,
          });
        });

        sleepRes.data.forEach(s => {
          const duration = s.duration ? `${Math.round(s.duration / 60)}h ${s.duration % 60}m` : '';
          allEntries.push({
            id: s.id,
            type: 'sleep',
            timestamp: new Date(s.startTime),
            label: s.sleepType === 'nap' ? 'Nap' : 'Night Sleep',
            detail: duration,
          });
        });

        diapersRes.data.forEach(d => {
          allEntries.push({
            id: d.id,
            type: 'diaper',
            timestamp: new Date(d.timestamp),
            label: 'Diaper',
            detail: d.type.charAt(0).toUpperCase() + d.type.slice(1),
          });
        });

        // Sort by timestamp descending and take top 8
        allEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setEntries(allEntries.slice(0, 8));
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecentActivity();
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getIcon = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'feeding': return <Utensils className="w-3 h-3" />;
      case 'sleep': return <Moon className="w-3 h-3" />;
      case 'diaper': return <Droplets className="w-3 h-3" />;
      case 'activity': return <Activity className="w-3 h-3" />;
    }
  };

  const getColor = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'feeding': return 'bg-orange-500/15 text-orange-600 dark:text-orange-400';
      case 'sleep': return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400';
      case 'diaper': return 'bg-green-500/15 text-green-600 dark:text-green-400';
      case 'activity': return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400';
    }
  };

  return (
    <Card className="p-4 border-0 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 h-full flex flex-col">
      <Link href="/tracking/timeline" className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-foreground">Timeline</span>
          <p className="text-xs text-muted-foreground">Recent activity</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Link>
      
      {isLoading ? (
        <div className="flex-1 space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {entries.map((entry) => (
            <div 
              key={entry.id} 
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", getColor(entry.type))}>
                {getIcon(entry.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{entry.label}</p>
                {entry.detail && (
                  <p className="text-[10px] text-muted-foreground truncate">{entry.detail}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(entry.timestamp)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Clock className="w-10 h-10 text-muted-foreground/30 mb-2" />
          <span className="text-xs text-muted-foreground">No recent activity</span>
        </div>
      )}
      
      <Link 
        href="/tracking/timeline"
        className="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 transition-all active:scale-95"
      >
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">View Full Timeline</span>
      </Link>
    </Card>
  );
}

// Memories Widget - Large, cycles through random memories
function MemoriesWidget() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentMemory, setCurrentMemory] = useState<Memory | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const response = await api.memories.list({ pageSize: 50 });
        setMemories(response.data);
        if (response.data.length > 0) {
          const randomIndex = Math.floor(Math.random() * response.data.length);
          setCurrentMemory(response.data[randomIndex]);
          setCurrentIndex(randomIndex);
        }
      } catch (err) {
        console.error("Failed to fetch memories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemories();
  }, []);

  // Cycle through memories every 30 seconds
  useEffect(() => {
    if (memories.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % memories.length;
        setCurrentIndex(nextIndex);
        setCurrentMemory(memories[nextIndex]);
        setIsTransitioning(false);
      }, 300);
    }, 30000);

    return () => clearInterval(interval);
  }, [memories, currentIndex]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="p-4 border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 overflow-hidden">
      <Link href="/memories" className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-foreground">Memories</span>
          <p className="text-xs text-muted-foreground">{memories.length} photos & moments</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Link>
      
      {isLoading ? (
        <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
      ) : currentMemory ? (
        <Link href="/memories" className="block">
          <div 
            className={cn(
              "relative h-64 rounded-xl overflow-hidden transition-all duration-300",
              isTransitioning && "opacity-0 scale-95"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentMemory.photoUrl}
              alt={currentMemory.title || "Memory"}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://api.dicebear.com/7.x/shapes/svg?seed=Memory&backgroundColor=f3f4f6";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              {currentMemory.title && (
                <p className="text-white font-semibold text-sm truncate">{currentMemory.title}</p>
              )}
              <p className="text-white/80 text-xs">{formatDate(currentMemory.takenAt)}</p>
            </div>
            {memories.length > 1 && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/40 rounded-full">
                <span className="text-white text-[10px] font-medium">
                  {currentIndex + 1} / {memories.length}
                </span>
              </div>
            )}
          </div>
        </Link>
      ) : (
        <Link href="/memories" className="block">
          <div className="flex flex-col items-center justify-center h-64 bg-amber-500/10 rounded-xl">
            <Camera className="w-12 h-12 text-amber-500/40 mb-2" />
            <span className="text-sm text-muted-foreground">No memories yet</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 mt-1">Tap to add your first</span>
          </div>
        </Link>
      )}
    </Card>
  );
}
