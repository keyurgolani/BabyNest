"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, BabyResponseDto } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { 
  ChevronDown, 
  Check, 
  Plus,
  Baby,
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function MultiBabySelector() {
  const { baby, setBaby, refreshBaby } = useBaby();
  const [babies, setBabies] = useState<BabyResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchBabies();
  }, []);

  const fetchBabies = async () => {
    try {
      setLoading(true);
      const response = await api.babies.list();
      setBabies(response.data);
    } catch (error) {
      console.error("Failed to fetch babies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBaby = (selectedBaby: BabyResponseDto) => {
    setBaby(selectedBaby);
    setShowDropdown(false);
    // Refresh to update all data
    refreshBaby();
  };

  const formatAge = (age: { years: number; months: number; days: number }) => {
    if (age.years > 0) {
      return `${age.years}y ${age.months}m`;
    }
    if (age.months > 0) {
      return `${age.months}m ${age.days}d`;
    }
    return `${age.days} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  // Don't show selector if only one baby
  if (babies.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      {/* Current Baby Button */}
      <Button
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full justify-between gap-2 h-auto py-3 px-4 bg-card hover:bg-accent"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
            {baby?.photoUrl ? (
              <Image 
                src={baby.photoUrl} 
                alt={baby.name} 
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <Baby className="w-5 h-5 text-primary" />
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-foreground truncate">
              {baby?.name || "Select Baby"}
            </p>
            {baby?.age && (
              <p className="text-xs text-muted-foreground">
                {formatAge(baby.age)}
              </p>
            )}
          </div>
        </div>

        {/* Dropdown Icon */}
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform shrink-0",
            showDropdown && "rotate-180"
          )} 
        />
      </Button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Menu */}
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-2 shadow-lg border-2">
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {babies.map((babyItem) => (
                <button
                  key={babyItem.id}
                  onClick={() => handleSelectBaby(babyItem)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                    baby?.id === babyItem.id
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-accent"
                  )}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                    {babyItem.photoUrl ? (
                      <Image 
                        src={babyItem.photoUrl} 
                        alt={babyItem.name} 
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <Baby className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">
                        {babyItem.name}
                      </p>
                      {baby?.id === babyItem.id && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {formatAge(babyItem.age)}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground capitalize">
                        {babyItem.gender}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              {/* Add Baby Button */}
              <Link href="/onboarding">
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left border-t mt-2 pt-3"
                  onClick={() => setShowDropdown(false)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Add Another Baby</p>
                    <p className="text-xs text-muted-foreground">Create new profile</p>
                  </div>
                </button>
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// Multi-Baby Summary Dashboard Component
export function MultiBabySummaryDashboard() {
  const [babies, setBabies] = useState<BabyResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setAlerts] = useState<Array<{
    babyId: string;
    babyName: string;
    type: 'medication' | 'vaccination' | 'appointment';
    message: string;
    urgent: boolean;
  }>>([]);
  const alerts: Array<{
    babyId: string;
    babyName: string;
    type: 'medication' | 'vaccination' | 'appointment';
    message: string;
    urgent: boolean;
  }> = [];

  useEffect(() => {
    fetchAllBabiesData();
  }, []);

  const fetchAllBabiesData = async () => {
    try {
      setLoading(true);
      const response = await api.babies.list();
      setBabies(response.data);
      
      // Fetch alerts for all babies
      // This would need to be implemented to aggregate data across babies
      // For now, we'll show a placeholder
    } catch (error) {
      console.error("Failed to fetch babies data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (babies.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">All Babies Summary</h3>
            <Badge variant="outline">{babies.length} babies</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {babies.map((baby) => (
              <Link 
                key={baby.id} 
                href={`/?baby=${baby.id}`}
                className="p-3 rounded-lg bg-white/50 dark:bg-black/20 hover:bg-white/70 dark:hover:bg-black/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                    {baby.photoUrl ? (
                      <Image 
                        src={baby.photoUrl} 
                        alt={baby.name} 
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <Baby className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="font-medium text-sm text-foreground truncate">
                    {baby.name}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {baby.age.months}m {baby.age.days}d
                </p>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      {/* Alerts Across All Babies */}
      {false && alerts.length > 0 && (
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-foreground">Alerts & Reminders</h3>
            </div>
            
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-3 rounded-lg",
                    alert.urgent 
                      ? "bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                      : "bg-white/50 dark:bg-black/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {alert.babyName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.message}
                      </p>
                    </div>
                    {alert.urgent && (
                      <Badge variant="destructive" className="shrink-0">
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Upcoming Events Across All Babies */}
      <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-foreground">Upcoming Events</h3>
          </div>
          
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming events for any baby
          </p>
        </div>
      </Card>
    </div>
  );
}
