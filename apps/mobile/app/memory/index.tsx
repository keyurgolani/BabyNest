/**
 * Memory Screen
 * Photo journal/timeline view for capturing baby moments
 */

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDatabaseService } from "../../src/database/DatabaseService";
import { createApiClient, ApiError } from "../../src/services/ApiClient";
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

// Memory grouped by date
interface MemoryDateGroup {
  date: string;
  displayDate: string;
  memories: LocalMemoryEntry[];
}

// Entry type info
const ENTRY_TYPE_INFO: Record<MemoryEntryType, { icon: string; label: string; color: string }> = {
  photo: { icon: "📷", label: "Photo", color: "bg-blue-500" },
  milestone: { icon: "🏆", label: "Milestone", color: "bg-purple-500" },
  first: { icon: "⭐", label: "First", color: "bg-amber-500" },
  note: { icon: "📝", label: "Note", color: "bg-green-500" },
};

// View mode type
type ViewMode = "timeline" | "grid";

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
 * Format date for display
 */
function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
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
 * Group memories by date
 */
function groupMemoriesByDate(memories: LocalMemoryEntry[]): MemoryDateGroup[] {
  const groups = new Map<string, LocalMemoryEntry[]>();

  for (const memory of memories) {
    const dateKey = memory.takenAt.split("T")[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(memory);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, dateMemories]) => ({
      date,
      displayDate: formatDisplayDate(date),
      memories: dateMemories.sort(
        (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
      ),
    }));
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 48) / 3;

export default function MemoryScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const router = useRouter();

  // State
  const [memories, setMemories] = useState<LocalMemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<MemoryEntryType>("photo");
  const [newTitle, setNewTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load memories
  const loadMemories = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const entries = await dbInstance.getAllAsync<LocalMemoryEntry>(
        `SELECT * FROM memory_entries WHERE babyId = ? AND isDeleted = 0 ORDER BY takenAt DESC`,
        [activeBaby.id]
      );
      setMemories(entries);
    } catch (error) {
      console.error("[MemoryScreen] Error loading memories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Group memories by date for timeline view
  const memoryGroups = groupMemoriesByDate(memories);

  // Request permission and pick image from library
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to add memories."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setNewPhotoUrl(""); // Clear URL input when image is selected
      setUploadError(null);
    }
  };

  // Take a photo with camera
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow camera access to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setNewPhotoUrl(""); // Clear URL input when image is selected
      setUploadError(null);
    }
  };

  // Upload image to server
  const uploadImage = async (image: ImagePicker.ImagePickerAsset): Promise<string | null> => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const apiClient = await createApiClient();
      
      if (!apiClient) {
        setUploadError("Server not configured. Please set up server connection in settings.");
        return null;
      }

      if (!apiClient.hasAuthToken()) {
        setUploadError("Not logged in. Please sign in to upload images.");
        return null;
      }

      // Extract filename from URI
      const imageUri = image.uri;
      const uriParts = imageUri.split("/");
      const fileName = uriParts[uriParts.length - 1] ?? `memory_${Date.now()}.jpg`;
      const mimeType = image.mimeType ?? "image/jpeg";

      const response = await apiClient.uploadFile(imageUri, fileName, mimeType);
      return response.url;
    } catch (error) {
      console.error("[MemoryScreen] Upload error:", error);
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          setUploadError("Unauthorized. Please sign in again.");
        } else if (error.statusCode === 413) {
          setUploadError("Image too large. Please choose a smaller image.");
        } else {
          setUploadError(`Upload failed: ${error.message}`);
        }
      } else {
        setUploadError("Failed to upload image. Please try again.");
      }
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle adding a new memory
  const handleAddMemory = async () => {
    if (!activeBaby) return;
    
    // Need either a selected image or a URL
    if (!selectedImage && !newPhotoUrl.trim()) {
      Alert.alert("Error", "Please select an image or enter a photo URL");
      return;
    }

    setIsSaving(true);
    try {
      let photoUrl = newPhotoUrl.trim();

      // Upload image if selected
      if (selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage);
        if (!uploadedUrl) {
          setIsSaving(false);
          return; // Upload failed, error already shown
        }
        photoUrl = uploadedUrl;
      }

      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const now = new Date().toISOString();
      const id = generateUUID();

      await dbInstance.runAsync(
        `INSERT INTO memory_entries (id, babyId, caregiverId, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, title, note, photoUrl, thumbnailUrl, entryType, linkedEntryId, linkedEntryType, takenAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          activeBaby.id,
          "local-user",
          now,
          now,
          null,
          0,
          "pending",
          null,
          newTitle.trim() || null,
          newNote.trim() || null,
          photoUrl,
          null,
          selectedType,
          null,
          null,
          now,
        ]
      );

      setShowAddModal(false);
      setNewTitle("");
      setNewNote("");
      setNewPhotoUrl("");
      setSelectedImage(null);
      setSelectedType("photo");
      setUploadError(null);
      await loadMemories();
      Alert.alert("✨ Memory Added!", "Your precious moment has been saved.");
    } catch (error) {
      console.error("[MemoryScreen] Error saving memory:", error);
      Alert.alert("Error", "Failed to save memory.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting a memory
  const handleDeleteMemory = async (memoryId: string) => {
    Alert.alert(
      "Delete Memory",
      "Are you sure you want to delete this memory?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const db = getDatabaseService();
              await db.initialize();
              const dbInstance = await db["getDb"]();
              const now = new Date().toISOString();
              await dbInstance.runAsync(
                `UPDATE memory_entries SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
                [now, memoryId]
              );
              await loadMemories();
            } catch (error) {
              console.error("[MemoryScreen] Error deleting memory:", error);
              Alert.alert("Error", "Failed to delete memory.");
            }
          },
        },
      ]
    );
  };

  // No baby selected state
  if (!activeBaby) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">📸</Text>
          <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            No Baby Selected
          </Text>
          <Text className={`text-center mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Please select or add a baby profile to capture memories.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render timeline item
  const renderTimelineItem = (memory: LocalMemoryEntry) => {
    const typeInfo = ENTRY_TYPE_INFO[memory.entryType];
    return (
      <Pressable
        key={memory.id}
        onPress={() => router.push(`/memory/${memory.id}`)}
        onLongPress={() => handleDeleteMemory(memory.id)}
        className={`mb-4 rounded-xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        {/* Photo */}
        <View className="aspect-video bg-gray-300">
          <Image
            source={{ uri: memory.photoUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {/* Type badge */}
          <View className={`absolute top-3 left-3 px-2 py-1 rounded-full flex-row items-center ${typeInfo.color}`}>
            <Text className="text-sm mr-1">{typeInfo.icon}</Text>
            <Text className="text-xs text-white font-medium">{typeInfo.label}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-4">
          {memory.title && (
            <Text className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
              {memory.title}
            </Text>
          )}
          {memory.note && (
            <Text
              className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              numberOfLines={2}
            >
              {memory.note}
            </Text>
          )}
          <View className="flex-row items-center mt-2">
            <Ionicons
              name="time-outline"
              size={14}
              color={darkMode ? "#9ca3af" : "#6b7280"}
            />
            <Text className={`text-xs ml-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              {formatTime(memory.takenAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  // Render grid item
  const renderGridItem = ({ item: memory }: { item: LocalMemoryEntry }) => {
    const typeInfo = ENTRY_TYPE_INFO[memory.entryType];
    return (
      <Pressable
        onPress={() => router.push(`/memory/${memory.id}`)}
        onLongPress={() => handleDeleteMemory(memory.id)}
        className="m-1"
        style={{ width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE }}
      >
        <View className="flex-1 rounded-lg overflow-hidden bg-gray-300">
          <Image
            source={{ uri: memory.photoUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {/* Type indicator */}
          <View className={`absolute bottom-1 right-1 w-6 h-6 rounded-full items-center justify-center ${typeInfo.color}`}>
            <Text className="text-xs">{typeInfo.icon}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Memories
            </Text>
            <Text className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {activeBaby.name}'s photo journal • {memories.length} memories
            </Text>
          </View>

          {/* View mode toggle */}
          <View className={`flex-row rounded-lg overflow-hidden ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
            <Pressable
              onPress={() => setViewMode("timeline")}
              className={`px-3 py-2 ${viewMode === "timeline" ? "bg-fuchsia-600" : ""}`}
            >
              <Ionicons
                name="list"
                size={20}
                color={viewMode === "timeline" ? "#ffffff" : darkMode ? "#9ca3af" : "#6b7280"}
              />
            </Pressable>
            <Pressable
              onPress={() => setViewMode("grid")}
              className={`px-3 py-2 ${viewMode === "grid" ? "bg-fuchsia-600" : ""}`}
            >
              <Ionicons
                name="grid"
                size={20}
                color={viewMode === "grid" ? "#ffffff" : darkMode ? "#9ca3af" : "#6b7280"}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className={darkMode ? "text-gray-400" : "text-gray-500"}>Loading...</Text>
        </View>
      ) : memories.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-6xl mb-4">📸</Text>
          <Text className={`text-xl font-semibold text-center ${darkMode ? "text-white" : "text-gray-900"}`}>
            No Memories Yet
          </Text>
          <Text className={`text-center mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Start capturing precious moments by tapping the + button below.
          </Text>
        </View>
      ) : viewMode === "timeline" ? (
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {memoryGroups.map((group) => (
            <View key={group.date} className="mb-6">
              {/* Date header */}
              <View className="flex-row items-center mb-3">
                <View className={`w-3 h-3 rounded-full ${darkMode ? "bg-fuchsia-500" : "bg-purple-500"}`} />
                <Text className={`ml-3 font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {group.displayDate}
                </Text>
                <Text className={`ml-2 text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  ({group.memories.length})
                </Text>
              </View>

              {/* Timeline line */}
              <View className="ml-1.5 pl-5 border-l-2 border-gray-300 dark:border-gray-700">
                {group.memories.map(renderTimelineItem)}
              </View>
            </View>
          ))}
          <View className="h-24" />
        </ScrollView>
      ) : (
        <FlatList
          data={memories}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View className="h-24" />}
        />
      )}

      {/* Floating Action Button */}
      <Pressable
        onPress={() => setShowAddModal(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-fuchsia-600 items-center justify-center shadow-lg"
        style={{
          shadowColor: "#c026d3",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      {/* Add Memory Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowAddModal(false)} />
          <View className={`rounded-t-3xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="w-12 h-1 rounded-full bg-gray-300 self-center mb-4" />

            <Text className={`text-xl font-bold text-center mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Add Memory
            </Text>

            {/* Entry type selector */}
            <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Memory Type
            </Text>
            <View className="flex-row gap-2 mb-4">
              {(Object.keys(ENTRY_TYPE_INFO) as MemoryEntryType[]).map((type) => {
                const info = ENTRY_TYPE_INFO[type];
                const isSelected = selectedType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedType(type)}
                    className={`flex-1 p-3 rounded-xl items-center ${
                      isSelected ? "bg-fuchsia-600" : darkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <Text className="text-xl mb-1">{info.icon}</Text>
                    <Text
                      className={`text-xs font-medium ${
                        isSelected ? "text-white" : darkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Photo selection */}
            <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Photo *
            </Text>
            
            {/* Image preview or picker buttons */}
            {selectedImage ? (
              <View className="mb-4">
                <View className="rounded-xl overflow-hidden aspect-[4/3] bg-gray-300">
                  <Image
                    source={{ uri: selectedImage.uri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                <Pressable
                  onPress={() => {
                    setSelectedImage(null);
                    setUploadError(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#ffffff" />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={pickImage}
                  className={`flex-1 p-4 rounded-xl items-center flex-row justify-center ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <Ionicons
                    name="images-outline"
                    size={24}
                    color={darkMode ? "#d1d5db" : "#4b5563"}
                  />
                  <Text className={`ml-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Gallery
                  </Text>
                </Pressable>
                <Pressable
                  onPress={takePhoto}
                  className={`flex-1 p-4 rounded-xl items-center flex-row justify-center ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={darkMode ? "#d1d5db" : "#4b5563"}
                  />
                  <Text className={`ml-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Camera
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Or use URL */}
            {!selectedImage && (
              <>
                <Text className={`text-xs text-center mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  — or enter a URL —
                </Text>
                <TextInput
                  value={newPhotoUrl}
                  onChangeText={(text) => {
                    setNewPhotoUrl(text);
                    setUploadError(null);
                  }}
                  placeholder="https://example.com/photo.jpg"
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  className={`p-4 rounded-xl mb-4 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </>
            )}

            {/* Upload error message */}
            {uploadError && (
              <View className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                <Text className="text-red-600 dark:text-red-400 text-sm">{uploadError}</Text>
              </View>
            )}

            {/* Title input */}
            <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Title (optional)
            </Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="First smile!"
              placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
              className={`p-4 rounded-xl mb-4 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
            />

            {/* Note input */}
            <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Note (optional)
            </Text>
            <TextInput
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Add a memory or note..."
              placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
              multiline
              numberOfLines={3}
              className={`p-4 rounded-xl mb-4 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />

            {/* Action buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  setNewTitle("");
                  setNewNote("");
                  setNewPhotoUrl("");
                  setSelectedImage(null);
                  setSelectedType("photo");
                  setUploadError(null);
                }}
                className={`flex-1 p-4 rounded-xl items-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                style={{ minHeight: 56 }}
              >
                <Text className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAddMemory}
                disabled={isSaving || isUploading || (!selectedImage && !newPhotoUrl.trim())}
                className={`flex-1 p-4 rounded-xl items-center flex-row justify-center ${
                  isSaving || isUploading || (!selectedImage && !newPhotoUrl.trim()) ? "bg-gray-400" : "bg-fuchsia-600"
                }`}
                style={{ minHeight: 56 }}
              >
                {(isSaving || isUploading) && (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                )}
                <Text className="font-semibold text-white">
                  {isUploading ? "Uploading..." : isSaving ? "Saving..." : "Save Memory"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
