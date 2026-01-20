/**
 * Memory Detail Screen
 * View and edit a single memory entry
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDatabaseService } from "../../src/database/DatabaseService";
import { useBabyStore, useActiveBaby } from "../../src/store";

// Memory entry type
type MemoryEntryType = "photo" | "milestone" | "first" | "note";

// Local memory entry interface
interface LocalMemoryEntry {
  id: string;
  babyId: string;
  caregiverId: string;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  isDeleted: number;
  localSyncStatus: string;
  serverVersion: number | null;
  title: string | null;
  note: string | null;
  photoUrl: string;
  thumbnailUrl: string | null;
  entryType: MemoryEntryType;
  linkedEntryId: string | null;
  linkedEntryType: string | null;
  takenAt: string;
}

// Entry type info
const ENTRY_TYPE_INFO: Record<MemoryEntryType, { icon: string; label: string; color: string }> = {
  photo: { icon: "📷", label: "Photo", color: "bg-blue-500" },
  milestone: { icon: "🏆", label: "Milestone", color: "bg-purple-500" },
  first: { icon: "⭐", label: "First", color: "bg-amber-500" },
  note: { icon: "📝", label: "Note", color: "bg-green-500" },
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Format date for display
 */
function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format time for display
 */
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Calculate how long ago the memory was taken
 */
function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const router = useRouter();

  // State
  const [memory, setMemory] = useState<LocalMemoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load memory
  const loadMemory = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const entry = await dbInstance.getFirstAsync<LocalMemoryEntry>(
        `SELECT * FROM memory_entries WHERE id = ? AND isDeleted = 0`,
        [id]
      );
      if (entry) {
        setMemory(entry);
        setEditTitle(entry.title || "");
        setEditNote(entry.note || "");
      }
    } catch (error) {
      console.error("[MemoryDetailScreen] Error loading memory:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!memory) return;
    setIsSaving(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const now = new Date().toISOString();

      await dbInstance.runAsync(
        `UPDATE memory_entries SET title = ?, note = ?, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
        [editTitle.trim() || null, editNote.trim() || null, now, memory.id]
      );

      setIsEditing(false);
      await loadMemory();
    } catch (error) {
      console.error("[MemoryDetailScreen] Error saving memory:", error);
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    Alert.alert(
      "Delete Memory",
      "Are you sure you want to delete this memory? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!memory) return;
            try {
              const db = getDatabaseService();
              await db.initialize();
              const dbInstance = await db["getDb"]();
              const now = new Date().toISOString();
              await dbInstance.runAsync(
                `UPDATE memory_entries SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
                [now, memory.id]
              );
              router.back();
            } catch (error) {
              console.error("[MemoryDetailScreen] Error deleting memory:", error);
              Alert.alert("Error", "Failed to delete memory.");
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={darkMode ? "text-gray-400" : "text-gray-500"}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Not found state
  if (!memory) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">😢</Text>
          <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Memory Not Found
          </Text>
          <Text className={`text-center mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            This memory may have been deleted.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 px-6 py-3 rounded-xl bg-fuchsia-600"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = ENTRY_TYPE_INFO[memory.entryType];

  return (
    <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`} edges={["bottom"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}>
          <Image
            source={{ uri: memory.photoUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {/* Type badge */}
          <View className={`absolute top-4 left-4 px-3 py-1.5 rounded-full flex-row items-center ${typeInfo.color}`}>
            <Text className="text-lg mr-1">{typeInfo.icon}</Text>
            <Text className="text-sm text-white font-medium">{typeInfo.label}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-4">
          {/* Date and time */}
          <View className={`p-4 rounded-xl mb-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <Ionicons name="calendar" size={20} color={darkMode ? "#c026d3" : "#9333ea"} />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {formatFullDate(memory.takenAt)}
                </Text>
                <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {formatTime(memory.takenAt)} • {getTimeAgo(memory.takenAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Title and Note */}
          <View className={`p-4 rounded-xl mb-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            {isEditing ? (
              <>
                <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Title
                </Text>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Add a title..."
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  className={`p-3 rounded-lg mb-4 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
                />

                <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Note
                </Text>
                <TextInput
                  value={editNote}
                  onChangeText={setEditNote}
                  placeholder="Add a note..."
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  multiline
                  numberOfLines={4}
                  className={`p-3 rounded-lg ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
                  style={{ minHeight: 100, textAlignVertical: "top" }}
                />

                <View className="flex-row gap-3 mt-4">
                  <Pressable
                    onPress={() => {
                      setIsEditing(false);
                      setEditTitle(memory.title || "");
                      setEditNote(memory.note || "");
                    }}
                    className={`flex-1 p-3 rounded-lg items-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                  >
                    <Text className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveEdit}
                    disabled={isSaving}
                    className={`flex-1 p-3 rounded-lg items-center ${isSaving ? "bg-gray-400" : "bg-fuchsia-600"}`}
                  >
                    <Text className="font-medium text-white">
                      {isSaving ? "Saving..." : "Save"}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Details
                  </Text>
                  <Pressable onPress={() => setIsEditing(true)} className="p-2 -m-2">
                    <Ionicons name="pencil" size={18} color={darkMode ? "#c026d3" : "#9333ea"} />
                  </Pressable>
                </View>

                {memory.title ? (
                  <Text className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {memory.title}
                  </Text>
                ) : (
                  <Text className={`text-lg italic mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    No title
                  </Text>
                )}

                {memory.note ? (
                  <Text className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {memory.note}
                  </Text>
                ) : (
                  <Text className={`italic ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    No note added
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Baby info */}
          {activeBaby && (
            <View className={`p-4 rounded-xl mb-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <Text className="text-lg">👶</Text>
                </View>
                <View>
                  <Text className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {activeBaby.name}
                  </Text>
                  <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Memory from their journey
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Delete button */}
          <Pressable
            onPress={handleDelete}
            className={`p-4 rounded-xl flex-row items-center justify-center ${darkMode ? "bg-red-900/30" : "bg-red-50"}`}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text className="ml-2 font-medium text-red-500">Delete Memory</Text>
          </Pressable>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
