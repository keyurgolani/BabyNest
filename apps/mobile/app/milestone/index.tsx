/**
 * Milestone Screen
 * Track developmental milestones by category with achievement marking
 * Validates: Requirements 7.1, 7.2, 7.4, 14.1
 */

import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDatabaseService } from "../../src/database/DatabaseService";
import type { LocalMilestoneEntry } from "../../src/database/types";
import { useBabyStore, useActiveBaby } from "../../src/store";

// Milestone category type
type MilestoneCategory = "motor" | "cognitive" | "social" | "language";

// Milestone definition interface
interface MilestoneDefinition {
  id: string;
  category: MilestoneCategory;
  name: string;
  description: string;
  expectedAgeMonthsMin: number;
  expectedAgeMonthsMax: number;
}

// Category display info
const CATEGORY_INFO: Record<MilestoneCategory, { icon: string; label: string; color: string }> = {
  motor: { icon: "🏃", label: "Motor Skills", color: "bg-blue-500" },
  cognitive: { icon: "🧠", label: "Cognitive", color: "bg-purple-500" },
  social: { icon: "👋", label: "Social", color: "bg-pink-500" },
  language: { icon: "💬", label: "Language", color: "bg-green-500" },
};

// Milestone definitions based on developmental guidelines
// Validates: Requirements 7.1, 7.3
const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  // Motor milestones (0-24 months)
  { id: "motor-1", category: "motor", name: "Holds head up", description: "Can hold head steady when supported", expectedAgeMonthsMin: 1, expectedAgeMonthsMax: 3 },
  { id: "motor-2", category: "motor", name: "Rolls over", description: "Rolls from tummy to back and back to tummy", expectedAgeMonthsMin: 3, expectedAgeMonthsMax: 6 },
  { id: "motor-3", category: "motor", name: "Sits without support", description: "Can sit independently without falling", expectedAgeMonthsMin: 5, expectedAgeMonthsMax: 8 },
  { id: "motor-4", category: "motor", name: "Crawls", description: "Moves on hands and knees", expectedAgeMonthsMin: 6, expectedAgeMonthsMax: 10 },
  { id: "motor-5", category: "motor", name: "Pulls to stand", description: "Pulls up to standing using furniture", expectedAgeMonthsMin: 8, expectedAgeMonthsMax: 12 },
  { id: "motor-6", category: "motor", name: "Walks independently", description: "Takes steps without holding on", expectedAgeMonthsMin: 9, expectedAgeMonthsMax: 15 },
  { id: "motor-7", category: "motor", name: "Runs", description: "Can run with coordination", expectedAgeMonthsMin: 14, expectedAgeMonthsMax: 20 },
  { id: "motor-8", category: "motor", name: "Kicks a ball", description: "Can kick a ball forward", expectedAgeMonthsMin: 18, expectedAgeMonthsMax: 24 },
  
  // Cognitive milestones
  { id: "cognitive-1", category: "cognitive", name: "Follows objects", description: "Eyes follow moving objects", expectedAgeMonthsMin: 1, expectedAgeMonthsMax: 3 },
  { id: "cognitive-2", category: "cognitive", name: "Recognizes faces", description: "Recognizes familiar faces and objects", expectedAgeMonthsMin: 2, expectedAgeMonthsMax: 4 },
  { id: "cognitive-3", category: "cognitive", name: "Explores with hands", description: "Reaches for and explores objects", expectedAgeMonthsMin: 3, expectedAgeMonthsMax: 6 },
  { id: "cognitive-4", category: "cognitive", name: "Object permanence", description: "Looks for hidden objects", expectedAgeMonthsMin: 6, expectedAgeMonthsMax: 10 },
  { id: "cognitive-5", category: "cognitive", name: "Points to objects", description: "Points to things of interest", expectedAgeMonthsMin: 9, expectedAgeMonthsMax: 14 },
  { id: "cognitive-6", category: "cognitive", name: "Stacks blocks", description: "Can stack 2-4 blocks", expectedAgeMonthsMin: 12, expectedAgeMonthsMax: 18 },
  { id: "cognitive-7", category: "cognitive", name: "Sorts shapes", description: "Sorts shapes and colors", expectedAgeMonthsMin: 18, expectedAgeMonthsMax: 24 },
  { id: "cognitive-8", category: "cognitive", name: "Pretend play", description: "Engages in simple pretend play", expectedAgeMonthsMin: 18, expectedAgeMonthsMax: 24 },

  // Social milestones
  { id: "social-1", category: "social", name: "Social smile", description: "Smiles at people", expectedAgeMonthsMin: 1, expectedAgeMonthsMax: 3 },
  { id: "social-2", category: "social", name: "Laughs", description: "Laughs out loud", expectedAgeMonthsMin: 3, expectedAgeMonthsMax: 5 },
  { id: "social-3", category: "social", name: "Responds to name", description: "Turns when name is called", expectedAgeMonthsMin: 5, expectedAgeMonthsMax: 9 },
  { id: "social-4", category: "social", name: "Stranger anxiety", description: "Shows wariness of strangers", expectedAgeMonthsMin: 6, expectedAgeMonthsMax: 10 },
  { id: "social-5", category: "social", name: "Waves bye-bye", description: "Waves goodbye", expectedAgeMonthsMin: 8, expectedAgeMonthsMax: 12 },
  { id: "social-6", category: "social", name: "Plays peek-a-boo", description: "Enjoys interactive games", expectedAgeMonthsMin: 6, expectedAgeMonthsMax: 10 },
  { id: "social-7", category: "social", name: "Shows affection", description: "Hugs and shows affection", expectedAgeMonthsMin: 12, expectedAgeMonthsMax: 18 },
  { id: "social-8", category: "social", name: "Plays with others", description: "Shows interest in playing with other children", expectedAgeMonthsMin: 18, expectedAgeMonthsMax: 24 },
  
  // Language milestones
  { id: "language-1", category: "language", name: "Coos", description: "Makes cooing sounds", expectedAgeMonthsMin: 1, expectedAgeMonthsMax: 4 },
  { id: "language-2", category: "language", name: "Babbles", description: "Makes babbling sounds (ba-ba, da-da)", expectedAgeMonthsMin: 4, expectedAgeMonthsMax: 8 },
  { id: "language-3", category: "language", name: "Responds to 'no'", description: "Understands and responds to 'no'", expectedAgeMonthsMin: 6, expectedAgeMonthsMax: 10 },
  { id: "language-4", category: "language", name: "First words", description: "Says first meaningful words", expectedAgeMonthsMin: 9, expectedAgeMonthsMax: 14 },
  { id: "language-5", category: "language", name: "Points and vocalizes", description: "Points to things and makes sounds", expectedAgeMonthsMin: 9, expectedAgeMonthsMax: 14 },
  { id: "language-6", category: "language", name: "Says 10+ words", description: "Uses 10 or more words", expectedAgeMonthsMin: 12, expectedAgeMonthsMax: 18 },
  { id: "language-7", category: "language", name: "Two-word phrases", description: "Combines two words together", expectedAgeMonthsMin: 18, expectedAgeMonthsMax: 24 },
  { id: "language-8", category: "language", name: "Follows instructions", description: "Follows simple two-step instructions", expectedAgeMonthsMin: 18, expectedAgeMonthsMax: 24 },
];

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get milestone status based on baby's age
 */
function getMilestoneStatus(
  milestone: MilestoneDefinition,
  ageMonths: number,
  isAchieved: boolean
): "achieved" | "current" | "upcoming" | "delayed" {
  if (isAchieved) return "achieved";
  if (ageMonths < milestone.expectedAgeMonthsMin) return "upcoming";
  if (ageMonths > milestone.expectedAgeMonthsMax + 2) return "delayed"; // 2 month grace period
  return "current";
}

/**
 * Get status color
 */
function getStatusColor(status: string, darkMode: boolean): string {
  switch (status) {
    case "achieved": return "bg-green-500";
    case "current": return darkMode ? "bg-amber-600" : "bg-amber-500";
    case "upcoming": return darkMode ? "bg-gray-600" : "bg-gray-400";
    case "delayed": return "bg-red-500";
    default: return "bg-gray-400";
  }
}

/**
 * Format age range for display
 */
function formatAgeRange(minMonths: number, maxMonths: number): string {
  return `${minMonths}-${maxMonths} months`;
}

export default function MilestoneScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();

  // State
  const [achievedMilestones, setAchievedMilestones] = useState<LocalMilestoneEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory | "all">("all");
  const [showAchieveModal, setShowAchieveModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneDefinition | null>(null);
  const [achieveNotes, setAchieveNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load achieved milestones
  const loadAchievedMilestones = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const entries = await dbInstance.getAllAsync<LocalMilestoneEntry>(
        `SELECT * FROM milestone_entries WHERE babyId = ? AND isDeleted = 0`,
        [activeBaby.id]
      );
      setAchievedMilestones(entries);
    } catch (error) {
      console.error("[MilestoneScreen] Error loading milestones:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadAchievedMilestones();
  }, [loadAchievedMilestones]);

  // Calculate baby's age in months
  const getBabyAgeMonths = (): number => {
    if (!activeBaby) return 0;
    const dob = new Date(activeBaby.dateOfBirth);
    const now = new Date();
    const diffMs = now.getTime() - dob.getTime();
    return diffMs / (1000 * 60 * 60 * 24 * 30.4375);
  };

  const ageMonths = getBabyAgeMonths();

  // Check if milestone is achieved
  const isMilestoneAchieved = (milestoneId: string): boolean => {
    return achievedMilestones.some((m) => m.milestoneId === milestoneId);
  };

  // Get achieved milestone entry
  const getAchievedEntry = (milestoneId: string): LocalMilestoneEntry | undefined => {
    return achievedMilestones.find((m) => m.milestoneId === milestoneId);
  };

  // Handle marking milestone as achieved - Validates: Requirements 7.2
  const handleAchieveMilestone = async () => {
    if (!activeBaby || !selectedMilestone) return;
    setIsSaving(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const now = new Date().toISOString();
      const id = generateUUID();

      await dbInstance.runAsync(
        `INSERT INTO milestone_entries (id, babyId, caregiverId, timestamp, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, milestoneId, achievedDate, photoUrl, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, activeBaby.id, "local-user", now, now, now, null, 0, "pending", null, selectedMilestone.id, now, null, achieveNotes.trim() || null]
      );

      setShowAchieveModal(false);
      setSelectedMilestone(null);
      setAchieveNotes("");
      await loadAchievedMilestones();
      Alert.alert("🎉 Milestone Achieved!", `Congratulations! "${selectedMilestone.name}" has been recorded.`);
    } catch (error) {
      console.error("[MilestoneScreen] Error saving milestone:", error);
      Alert.alert("Error", "Failed to save milestone.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle unmark milestone
  const handleUnmarkMilestone = async (milestoneId: string) => {
    const entry = getAchievedEntry(milestoneId);
    if (!entry) return;

    Alert.alert(
      "Remove Achievement",
      "Are you sure you want to remove this milestone achievement?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const db = getDatabaseService();
              await db.initialize();
              const dbInstance = await db["getDb"]();
              const now = new Date().toISOString();
              await dbInstance.runAsync(
                `UPDATE milestone_entries SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
                [now, entry.id]
              );
              await loadAchievedMilestones();
            } catch (error) {
              console.error("[MilestoneScreen] Error removing milestone:", error);
              Alert.alert("Error", "Failed to remove milestone.");
            }
          },
        },
      ]
    );
  };

  // Filter milestones by category and relevance to baby's age
  // Validates: Requirements 7.1, 7.4
  const getFilteredMilestones = (): MilestoneDefinition[] => {
    let filtered = MILESTONE_DEFINITIONS;
    if (selectedCategory !== "all") {
      filtered = filtered.filter((m) => m.category === selectedCategory);
    }
    // Sort by expected age range
    return filtered.sort((a, b) => a.expectedAgeMonthsMin - b.expectedAgeMonthsMin);
  };

  // Get upcoming milestones - Validates: Requirements 7.4
  const getUpcomingMilestones = (): MilestoneDefinition[] => {
    return MILESTONE_DEFINITIONS.filter((m) => {
      const isAchieved = isMilestoneAchieved(m.id);
      const status = getMilestoneStatus(m, ageMonths, isAchieved);
      return status === "upcoming" || status === "current";
    }).slice(0, 5);
  };

  // Calculate progress stats
  const getProgressStats = () => {
    const total = MILESTONE_DEFINITIONS.length;
    const achieved = achievedMilestones.length;
    const currentMilestones = MILESTONE_DEFINITIONS.filter((m) => {
      const isAchieved = isMilestoneAchieved(m.id);
      return getMilestoneStatus(m, ageMonths, isAchieved) === "current";
    }).length;
    return { total, achieved, current: currentMilestones };
  };

  const stats = getProgressStats();
  const filteredMilestones = getFilteredMilestones();
  const upcomingMilestones = getUpcomingMilestones();

  // No baby selected state
  if (!activeBaby) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">🏆</Text>
          <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            No Baby Selected
          </Text>
          <Text className={`text-center mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Please select or add a baby profile to track milestones.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Milestones
          </Text>
          <Text className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Track {activeBaby.name}'s development • {ageMonths.toFixed(1)} months old
          </Text>
        </View>

        {/* Progress Summary */}
        <View className="px-4 py-3">
          <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Progress Overview
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-3xl">🏆</Text>
                <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {stats.achieved}
                </Text>
                <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Achieved
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-3xl">🎯</Text>
                <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {stats.current}
                </Text>
                <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  In Progress
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-3xl">📊</Text>
                <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {Math.round((stats.achieved / stats.total) * 100)}%
                </Text>
                <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Complete
                </Text>
              </View>
            </View>
            {/* Progress bar */}
            <View className={`mt-4 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
              <View
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${(stats.achieved / stats.total) * 100}%` }}
              />
            </View>
          </View>
        </View>

        {/* Upcoming Milestones - Validates: Requirements 7.4 */}
        {upcomingMilestones.length > 0 && (
          <View className="px-4 py-3">
            <Text className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
              🌟 Coming Up Next
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
              <View className="flex-row gap-3">
                {upcomingMilestones.map((milestone) => {
                  const status = getMilestoneStatus(milestone, ageMonths, false);
                  const categoryInfo = CATEGORY_INFO[milestone.category];
                  return (
                    <Pressable
                      key={milestone.id}
                      onPress={() => {
                        setSelectedMilestone(milestone);
                        setShowAchieveModal(true);
                      }}
                      className={`p-4 rounded-xl w-44 ${darkMode ? "bg-gray-800" : "bg-white"}`}
                      style={{ minHeight: 120 }}
                    >
                      <View className="flex-row items-center mb-2">
                        <Text className="text-xl mr-2">{categoryInfo.icon}</Text>
                        <View className={`px-2 py-0.5 rounded-full ${status === "current" ? "bg-amber-500" : "bg-gray-400"}`}>
                          <Text className="text-xs text-white font-medium">
                            {status === "current" ? "Now" : "Soon"}
                          </Text>
                        </View>
                      </View>
                      <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`} numberOfLines={2}>
                        {milestone.name}
                      </Text>
                      <Text className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatAgeRange(milestone.expectedAgeMonthsMin, milestone.expectedAgeMonthsMax)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Category Filter - Validates: Requirements 7.1 */}
        <View className="px-4 py-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setSelectedCategory("all")}
                className={`px-4 py-3 rounded-xl ${
                  selectedCategory === "all"
                    ? "bg-fuchsia-600"
                    : darkMode ? "bg-gray-800" : "bg-white"
                }`}
                style={{ minHeight: 48 }}
                accessibilityRole="tab"
                accessibilityLabel="All milestones"
                accessibilityState={{ selected: selectedCategory === "all" }}
                accessibilityHint="Tap to show all milestone categories"
              >
                <Text className={`font-medium ${
                  selectedCategory === "all" ? "text-white" : darkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  All
                </Text>
              </Pressable>
              {(Object.keys(CATEGORY_INFO) as MilestoneCategory[]).map((category) => {
                const info = CATEGORY_INFO[category];
                const isSelected = selectedCategory === category;
                return (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    className={`px-4 py-3 rounded-xl flex-row items-center ${
                      isSelected ? "bg-fuchsia-600" : darkMode ? "bg-gray-800" : "bg-white"
                    }`}
                    style={{ minHeight: 48 }}
                    accessibilityRole="tab"
                    accessibilityLabel={`${info.label} milestones`}
                    accessibilityState={{ selected: isSelected }}
                    accessibilityHint={`Tap to filter by ${info.label.toLowerCase()} milestones`}
                  >
                    <Text className="mr-2">{info.icon}</Text>
                    <Text className={`font-medium ${
                      isSelected ? "text-white" : darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Milestones List - Validates: Requirements 7.1, 7.2, 14.1 */}
        <View className="px-4 py-3">
          <Text className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            {selectedCategory === "all" ? "All Milestones" : CATEGORY_INFO[selectedCategory].label}
          </Text>

          {isLoading ? (
            <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Loading...
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredMilestones.map((milestone) => {
                const isAchieved = isMilestoneAchieved(milestone.id);
                const achievedEntry = getAchievedEntry(milestone.id);
                const status = getMilestoneStatus(milestone, ageMonths, isAchieved);
                const categoryInfo = CATEGORY_INFO[milestone.category];

                return (
                  <Pressable
                    key={milestone.id}
                    onPress={() => {
                      if (isAchieved) {
                        handleUnmarkMilestone(milestone.id);
                      } else {
                        setSelectedMilestone(milestone);
                        setShowAchieveModal(true);
                      }
                    }}
                    className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} ${
                      isAchieved ? "border-2 border-green-500" : ""
                    }`}
                    style={{ minHeight: 80 }}
                  >
                    <View className="flex-row items-start">
                      {/* Status indicator */}
                      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${getStatusColor(status, darkMode)}`}>
                        {isAchieved ? (
                          <Ionicons name="checkmark" size={24} color="#ffffff" />
                        ) : (
                          <Text className="text-lg">{categoryInfo.icon}</Text>
                        )}
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {milestone.name}
                          </Text>
                          <View className={`px-2 py-1 rounded-full ${
                            status === "achieved" ? "bg-green-100" :
                            status === "current" ? "bg-amber-100" :
                            status === "delayed" ? "bg-red-100" : "bg-gray-100"
                          }`}>
                            <Text className={`text-xs font-medium ${
                              status === "achieved" ? "text-green-700" :
                              status === "current" ? "text-amber-700" :
                              status === "delayed" ? "text-red-700" : "text-gray-600"
                            }`}>
                              {status === "achieved" ? "✓ Done" :
                               status === "current" ? "In Progress" :
                               status === "delayed" ? "Delayed" : "Upcoming"}
                            </Text>
                          </View>
                        </View>
                        <Text className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {milestone.description}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={darkMode ? "#9ca3af" : "#6b7280"}
                          />
                          <Text className={`text-xs ml-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                            Expected: {formatAgeRange(milestone.expectedAgeMonthsMin, milestone.expectedAgeMonthsMax)}
                          </Text>
                        </View>
                        {achievedEntry && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                            <Text className="text-xs ml-1 text-green-600">
                              Achieved: {new Date(achievedEntry.achievedDate).toLocaleDateString()}
                            </Text>
                          </View>
                        )}
                        {achievedEntry?.notes && (
                          <Text className={`text-xs mt-1 italic ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                            "{achievedEntry.notes}"
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Achievement Modal - Validates: Requirements 7.2, 14.1 */}
      <Modal
        visible={showAchieveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAchieveModal(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1"
            onPress={() => setShowAchieveModal(false)}
          />
          <View className={`rounded-t-3xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="w-12 h-1 rounded-full bg-gray-300 self-center mb-4" />
            
            {selectedMilestone && (
              <>
                <View className="items-center mb-4">
                  <Text className="text-4xl mb-2">🎉</Text>
                  <Text className={`text-xl font-bold text-center ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Mark as Achieved
                  </Text>
                  <Text className={`text-center mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {selectedMilestone.name}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Notes (optional)
                  </Text>
                  <TextInput
                    value={achieveNotes}
                    onChangeText={setAchieveNotes}
                    placeholder="Add a memory or note about this milestone..."
                    placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                    multiline
                    numberOfLines={3}
                    className={`p-4 rounded-xl ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
                    style={{ minHeight: 80, textAlignVertical: "top" }}
                  />
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      setShowAchieveModal(false);
                      setSelectedMilestone(null);
                      setAchieveNotes("");
                    }}
                    className={`flex-1 p-4 rounded-xl items-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                    style={{ minHeight: 56 }}
                  >
                    <Text className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAchieveMilestone}
                    disabled={isSaving}
                    className={`flex-1 p-4 rounded-xl items-center ${isSaving ? "bg-gray-500" : "bg-green-600 active:bg-green-700"}`}
                    style={{ minHeight: 56 }}
                  >
                    <Text className="font-semibold text-white">
                      {isSaving ? "Saving..." : "🏆 Mark Achieved"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
