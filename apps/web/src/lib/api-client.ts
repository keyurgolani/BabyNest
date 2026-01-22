import {
  // Core & Auth
  Memory, Reminder, CreateMemoryDto, CreateReminderDto, UpdateReminderDto,
  MemoryListResponseDto, ReminderListResponseDto, MemoryTimelineResponseDto,
  MemoryTimelineQueryDto,
  UpdateProfileDto, ChangePasswordDto, LoginDto, RegisterDto,
  AuthResponseDto, AuthTokensResponseDto, CaregiverResponseDto,
  BabyResponseDto, BabyListResponseDto, CreateBabyDto,

  CreateInvitationDto, InvitationResponseDto,
  ApiKeyListItem, CreateApiKeyDto, CreateApiKeyResponseDto,
  
  // Health
  MedicationResponse, MedicationListResponse, CreateMedicationDto,
  VaccinationResponse, VaccinationListResponse, CreateVaccinationDto, VaccinationScheduleResponse,
  SymptomResponse, SymptomListResponse, CreateSymptomDto,
  DoctorVisitResponse, DoctorVisitListResponse, CreateDoctorVisitDto,
  
  // Growth
  GrowthResponse, GrowthListResponse, CreateGrowthDto, UpdateGrowthDto,
  PercentileChartResponse, VelocityResponse,
  
  // Feeding
  FeedingResponse, FeedingListResponse, CreateFeedingDto, FeedingSuggestionResponse,
  
  // Sleep
  SleepResponse, SleepListResponse, CreateSleepDto,
  
  // Diaper
  DiaperResponse, DiaperListResponse, CreateDiaperDto,
  
  // Activity
  ActivityResponse, ActivityListResponse, CreateActivityDto,
  
  // Milestone
  MilestoneEntryResponse, MilestoneEntryListResponse, CreateMilestoneDto, UpdateMilestoneDto,
  MilestoneDefinitionResponse, MilestonesByCategoryResponse, MilestoneCategory,
  
  // Dashboard & Reports
  DashboardSummaryResponse, TrendInsightsResponse,
  ScheduledReport, CreateScheduledReportDto, UpdateScheduledReportDto,
  InsightConfigResponse, GeneratedInsightResponse, InsightHistoryListResponse,
  WeeklySummaryResponse, SleepPredictionResponse, AnomalyDetectionResponse,
  
  // Constants/Other
  UploadResponse,
  StatisticsQueryParams,
  ReportQueryParams,
  
  // Auth & Core
  InvitationListItemDto,
  ConfigureInsightCadenceDto, GenerateAdhocInsightDto, InsightHistoryQueryParams,
  NextReminderResponse,
  
  // Statistics & Wake Window
  FeedingStatisticsResponse, SleepStatisticsResponse, DiaperStatisticsResponse, ActivityStatisticsResponse,
  WakeWindowResponse, WakeWindowTimerResponse,
  
  // Dashboard Aggregates
  // DashboardAggregateResponseDto, DashboardAlertsResponseDto, DashboardUpcomingResponseDto, <--- Removed unused
  
  // Caregiver Management
  // CaregiverListResponseDto, UpdateCaregiverRoleDto <--- Removed unused
  
  // Photo Import
  PhotoAnalysisResponse, ConfirmImportRequest, ImportResultResponse,
} from "@babynest/types";

// Local DTO definitions for types missing in @babynest/types
export interface BabySummaryDto {
  babyId: string;
  babyName: string;
  ageMonths: number;
  feedingsLast24h: number;
  sleepLast24h: number;
  diapersLast24h: number;
  lastFeeding: string | null;
  lastSleep: string | null;
  lastDiaper: string | null;
  activeAlerts: number;
}

export interface DashboardAggregateResponse {
  babies: BabySummaryDto[];
  totalBabies: number;
  totalAlerts: number;
}

export enum AlertType {
  MEDICATION_OVERDUE = 'medication_overdue',
  VACCINATION_OVERDUE = 'vaccination_overdue',
  MILESTONE_DELAYED = 'milestone_delayed',
  FEEDING_OVERDUE = 'feeding_overdue',
  DIAPER_OVERDUE = 'diaper_overdue',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface AlertDto {
  babyId: string;
  babyName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  relatedEntryId: string | null;
  timestamp: string;
}

export interface DashboardAlertsResponse {
  alerts: AlertDto[];
  total: number;
}

export enum UpcomingEventType {
  MEDICATION = 'medication',
  VACCINATION = 'vaccination',
  DOCTOR_VISIT = 'doctor_visit',
  REMINDER = 'reminder',
}

export interface UpcomingEventDto {
  babyId: string;
  babyName: string;
  type: UpcomingEventType;
  title: string;
  description: string | null;
  scheduledTime: string;
  relatedEntryId: string | null;
}

export interface DashboardUpcomingResponse {
  events: UpcomingEventDto[];
  total: number;
}

export interface CaregiverListResponseDto {
  data: {
    caregiverId: string;
    name: string;
    email: string;
    role: 'primary' | 'secondary' | 'viewer';
  }[];
  total: number;
}

// AI Provider Configuration Types
export type AiProviderType = 'ollama' | 'openai' | 'anthropic' | 'gemini' | 'openrouter';

export interface AiProviderCapabilities {
  supportsChat: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  maxContextTokens: number;
  defaultTextModel: string;
  defaultVisionModel: string;
  availableModels: string[];
}

export interface AiProviderInfo {
  id: AiProviderType;
  name: string;
  description: string;
  requiresApiKey: boolean;
  capabilities: AiProviderCapabilities;
  documentationUrl: string;
}

export interface AiConfigResponse {
  textProvider?: AiProviderType;
  textModel?: string;
  textEndpoint?: string;
  hasTextApiKey: boolean;
  visionProvider?: AiProviderType;
  visionModel?: string;
  visionEndpoint?: string;
  hasVisionApiKey: boolean;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateAiConfigRequest {
  textProvider?: AiProviderType;
  textApiKey?: string;
  textModel?: string;
  textEndpoint?: string;
  visionProvider?: AiProviderType;
  visionApiKey?: string;
  visionModel?: string;
  visionEndpoint?: string;
  isEnabled?: boolean;
}

export interface TestProviderRequest {
  provider: AiProviderType;
  apiKey?: string;
  model: string;
  endpoint?: string;
  isVision?: boolean;
}

export interface TestProviderResult {
  success: boolean;
  provider: string;
  model: string;
  responseTime?: number;
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  supportsVision?: boolean;
}

export interface ListModelsResponse {
  models: ModelInfo[];
  fromApi: boolean;
}
// Re-export all types so this file acts as a central entry point if needed,
// and to satisfy legacy consumers of this file's exports.
export * from "@babynest/types";

import { API_URL, ACCESS_TOKEN_KEY } from "./constants";

// Custom error class for API errors with status code
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

// Storage key for active baby ID (must match baby-context.tsx)
const ACTIVE_BABY_KEY = "babynest:activeBabyId";

// Get the active baby ID from localStorage
function getActiveBabyId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_BABY_KEY);
}

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(endpoint: string, method: RequestMethod = "GET", body?: unknown): Promise<T> {
  const babyId = getActiveBabyId();
  if (!babyId) {
    throw new Error("No active baby selected. Please create or select a baby profile.");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Use Bearer token from localStorage for authenticated requests
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(`${API_URL}/babies/${babyId}/${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        if (Array.isArray(errorBody.message)) {
          errorMessage = errorBody.message.join(", ");
        } else {
          errorMessage = errorBody.message;
        }
      } else if (errorBody.error) {
        errorMessage = errorBody.error;
      }
    } catch {
      // Failed to parse error body, fallback to statusText
    }

    throw new ApiError(
      errorMessage || `API Error: ${response.status}`,
      response.status,
      response.statusText
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Request function for root-level endpoints (not nested under /babies/{babyId})
async function rootRequest<T>(endpoint: string, method: RequestMethod = "GET", body?: unknown): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Use Bearer token from localStorage for authenticated requests
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(`${API_URL}/${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        if (Array.isArray(errorBody.message)) {
          errorMessage = errorBody.message.join(", ");
        } else {
          errorMessage = errorBody.message;
        }
      } else if (errorBody.error) {
        errorMessage = errorBody.error;
      }
    } catch {
      // Failed to parse error body, fallback to statusText
    }

    throw new ApiError(
      errorMessage || `API Error: ${response.status}`,
      response.status,
      response.statusText
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Helper function to build query string from params object
function buildQueryString(params?: object): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return '';
  const queryParams = new URLSearchParams();
  entries.forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });
  return `?${queryParams.toString()}`;
}

async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: HeadersInit = {};
  
  // Use Bearer token from localStorage for authenticated uploads
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  upload: uploadFile,
  memories: {
    list: (params?: { page?: number; pageSize?: number }) => {
      const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
      return request<MemoryListResponseDto>(`memories${query}`);
    },
    getTimeline: (params?: MemoryTimelineQueryDto) => {
      const query = buildQueryString(params);
      return request<MemoryTimelineResponseDto>(`memories/timeline${query}`);
    },
    create: (data: CreateMemoryDto) => request<Memory>("memories", "POST", data),
    delete: (id: string) => request<void>(`memories/${id}`, "DELETE"),
  },
  reminders: {
    list: (params?: { page?: number; pageSize?: number }) => {
      const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
      return request<ReminderListResponseDto>(`reminders${query}`);
    },
    create: (data: CreateReminderDto) => request<Reminder>("reminders", "POST", data),
    update: (id: string, data: UpdateReminderDto) => request<Reminder>(`reminders/${id}`, "PATCH", data),
    toggle: (id: string, enabled: boolean) => request<Reminder>(`reminders/${id}`, "PATCH", { isActive: enabled }),
    delete: (id: string) => request<void>(`reminders/${id}`, "DELETE"),
  },
  auth: {
    login: (data: LoginDto) => rootRequest<AuthResponseDto>("auth/login", "POST", data),
    register: (data: RegisterDto) => rootRequest<AuthResponseDto>("auth/register", "POST", data),
    refresh: (refreshToken: string) => rootRequest<AuthTokensResponseDto>("auth/refresh", "POST", { refreshToken }),
    me: () => rootRequest<CaregiverResponseDto>("auth/me"),
    updateProfile: (data: UpdateProfileDto) => rootRequest<CaregiverResponseDto>("auth/me", "PATCH", data),
    changePassword: (data: ChangePasswordDto) => rootRequest<void>("auth/change-password", "POST", data),
    listApiKeys: () => rootRequest<ApiKeyListItem[]>("auth/api-keys"),
    createApiKey: (data: CreateApiKeyDto) => rootRequest<CreateApiKeyResponseDto>("auth/api-keys", "POST", data),
    revokeApiKey: (id: string) => rootRequest<void>(`auth/api-keys/${id}`, "DELETE"),
  },
  activities: {
    list: (params?: { page?: number; pageSize?: number }) => {
      const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
      return request<ActivityListResponse>(`activities${query}`);
    },
    create: (data: CreateActivityDto) => request<ActivityResponse>("activities", "POST", data),
    get: (id: string) => request<ActivityResponse>(`activities/${id}`),
    update: (id: string, data: Partial<CreateActivityDto>) => request<ActivityResponse>(`activities/${id}`, "PATCH", data),
    delete: (id: string) => request<void>(`activities/${id}`, "DELETE"),
  },
  growth: {
    list: (params?: { page?: number; pageSize?: number }) => {
      const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
      return request<GrowthListResponse>(`growth${query}`);
    },
    create: (data: CreateGrowthDto) => request<GrowthResponse>("growth", "POST", data),
    get: (id: string) => request<GrowthResponse>(`growth/${id}`),
    update: (id: string, data: UpdateGrowthDto) => request<GrowthResponse>(`growth/${id}`, "PATCH", data),
    delete: (id: string) => request<void>(`growth/${id}`, "DELETE"),
    getPercentiles: (measurementType: 'weight' | 'height' | 'headCircumference' = 'weight') => 
      request<PercentileChartResponse>(`growth/percentiles?measurementType=${measurementType}`),
    getVelocity: () => request<VelocityResponse>("growth/velocity"),
  },
  export: {
    /**
     * Download PDF report from the backend API
     * Returns a Blob that can be used to trigger a file download
     */
    downloadPDFReport: async (params?: ReportQueryParams): Promise<Blob> => {
      const babyId = getActiveBabyId();
      if (!babyId) {
        throw new Error("No active baby selected. Please create or select a baby profile.");
      }

      const queryParams = new URLSearchParams();
      if (params?.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params?.endDate) {
        queryParams.append('endDate', params.endDate);
      }
      
      const queryString = queryParams.toString();
      const endpoint = `export/report/pdf${queryString ? `?${queryString}` : ''}`;
      
      const headers: HeadersInit = {};
      
      // Use Bearer token from localStorage for authenticated requests
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
      
      const response = await fetch(`${API_URL}/babies/${babyId}/${endpoint}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      return response.blob();
    },

    /**
     * Download CSV export for a specific category
     */
    downloadCSV: async (category: string, params?: { startDate?: string; endDate?: string }): Promise<Blob> => {
      const babyId = getActiveBabyId();
      if (!babyId) {
        throw new Error("No active baby selected. Please create or select a baby profile.");
      }

      const queryParams = new URLSearchParams();
      if (category) {
        queryParams.append('category', category);
      }
      if (params?.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params?.endDate) {
        queryParams.append('endDate', params.endDate);
      }
      
      const queryString = queryParams.toString();
      // Use the generic export by category endpoint
      const endpoint = `export/csv${queryString ? `?${queryString}` : ''}`;
      
      const headers: HeadersInit = {};
      
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
      
      const response = await fetch(`${API_URL}/babies/${babyId}/${endpoint}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      return response.blob();
    },

    /**
     * Download CSV export with all data
     */
    downloadAllDataCSV: async (params?: { startDate?: string; endDate?: string }): Promise<Blob> => {
      const babyId = getActiveBabyId();
      if (!babyId) {
        throw new Error("No active baby selected. Please create or select a baby profile.");
      }

      const queryParams = new URLSearchParams();
      if (params?.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params?.endDate) {
        queryParams.append('endDate', params.endDate);
      }
      
      const queryString = queryParams.toString();
      const endpoint = `export/all/csv${queryString ? `?${queryString}` : ''}`;
      
      const headers: HeadersInit = {};
      
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
      
      const response = await fetch(`${API_URL}/babies/${babyId}/${endpoint}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      return response.blob();
    },

    /**
     * Download JSON export with all data (can be re-imported)
     */
    downloadAllDataJSON: async (params?: { startDate?: string; endDate?: string }): Promise<Blob> => {
      const babyId = getActiveBabyId();
      if (!babyId) {
        throw new Error("No active baby selected. Please create or select a baby profile.");
      }

      const queryParams = new URLSearchParams();
      if (params?.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params?.endDate) {
        queryParams.append('endDate', params.endDate);
      }
      
      const queryString = queryParams.toString();
      const endpoint = `export/all/json${queryString ? `?${queryString}` : ''}`;
      
      const headers: HeadersInit = {};
      
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
      
      const response = await fetch(`${API_URL}/babies/${babyId}/${endpoint}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      return response.blob();
    },
  },
  scheduledReports: {
    list: () => request<ScheduledReport[]>("reports/schedule"),
    get: (scheduleId: string) => request<ScheduledReport>(`reports/schedule/${scheduleId}`),
    create: (data: CreateScheduledReportDto) => request<ScheduledReport>("reports/schedule", "POST", data),
    update: (scheduleId: string, data: UpdateScheduledReportDto) => request<ScheduledReport>(`reports/schedule/${scheduleId}`, "PATCH", data),
    toggle: (scheduleId: string, isActive: boolean) => request<ScheduledReport>(`reports/schedule/${scheduleId}`, "PATCH", { isActive }),
    delete: (scheduleId: string) => request<void>(`reports/schedule/${scheduleId}`, "DELETE"),
  },
  health: {
    medications: {
      list: (params?: { page?: number; pageSize?: number }) => {
        const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
        return request<MedicationListResponse>(`health/medications${query}`);
      },
      create: (data: CreateMedicationDto) => request<MedicationResponse>("health/medications", "POST", data),
      get: (id: string) => request<MedicationResponse>(`health/medications/${id}`),
      update: (id: string, data: Partial<CreateMedicationDto>) => request<MedicationResponse>(`health/medications/${id}`, "PATCH", data),
      delete: (id: string) => request<void>(`health/medications/${id}`, "DELETE"),
      getUpcoming: () => request<MedicationResponse[]>(`health/medications/upcoming`),
      markTaken: (id: string) => request<MedicationResponse>(`health/medications/${id}/taken`, "POST"),
    },
    vaccinations: {
      list: (params?: { page?: number; pageSize?: number }) => {
        const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
        return request<VaccinationListResponse>(`health/vaccinations${query}`);
      },
      create: (data: CreateVaccinationDto) => request<VaccinationResponse>("health/vaccinations", "POST", data),
      get: (id: string) => request<VaccinationResponse>(`health/vaccinations/${id}`),
      update: (id: string, data: Partial<CreateVaccinationDto>) => request<VaccinationResponse>(`health/vaccinations/${id}`, "PATCH", data),
      delete: (id: string) => request<void>(`health/vaccinations/${id}`, "DELETE"),
      // Vaccination schedule
      getSchedule: () => request<VaccinationScheduleResponse>(`health/vaccinations/schedule`),
    },
    symptoms: {
      list: (params?: { page?: number; pageSize?: number }) => {
        const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
        return request<SymptomListResponse>(`health/symptoms${query}`);
      },
      create: (data: CreateSymptomDto) => request<SymptomResponse>("health/symptoms", "POST", data),
      get: (id: string) => request<SymptomResponse>(`health/symptoms/${id}`),
      update: (id: string, data: Partial<CreateSymptomDto>) => request<SymptomResponse>(`health/symptoms/${id}`, "PATCH", data),
      delete: (id: string) => request<void>(`health/symptoms/${id}`, "DELETE"),
    },
    doctorVisits: {
      list: (params?: { page?: number; pageSize?: number }) => {
        const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
        return request<DoctorVisitListResponse>(`health/doctor-visits${query}`);
      },
      create: (data: CreateDoctorVisitDto) => request<DoctorVisitResponse>("health/doctor-visits", "POST", data),
      get: (id: string) => request<DoctorVisitResponse>(`health/doctor-visits/${id}`),
      update: (id: string, data: Partial<CreateDoctorVisitDto>) => request<DoctorVisitResponse>(`health/doctor-visits/${id}`, "PATCH", data),
      delete: (id: string) => request<void>(`health/doctor-visits/${id}`, "DELETE"),
    },
    // Vaccination schedule
    getVaccinationSchedule: () => request<VaccinationScheduleResponse>(`health/vaccinations/schedule`),
  },
  feedings: {
    list: (params?: { page?: number; pageSize?: number }) => {
      const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
      return request<FeedingListResponse>(`feedings${query}`);
    },
    create: (data: CreateFeedingDto) => request<FeedingResponse>("feedings", "POST", data),
    get: (id: string) => request<FeedingResponse>(`feedings/${id}`),
    update: (id: string, data: Partial<CreateFeedingDto>) => request<FeedingResponse>(`feedings/${id}`, "PATCH", data),
    delete: (id: string) => request<void>(`feedings/${id}`, "DELETE"),
    getSuggestion: () => request<FeedingSuggestionResponse>(`feedings/suggestion`),
  },
  sleep: {
    list: (params?: { page?: number; pageSize?: number }) => {
      const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
      return request<SleepListResponse>(`sleep${query}`);
    },
    create: (data: CreateSleepDto) => request<SleepResponse>("sleep", "POST", data),
    get: (id: string) => request<SleepResponse>(`sleep/${id}`),
    update: (id: string, data: Partial<CreateSleepDto>) => request<SleepResponse>(`sleep/${id}`, "PATCH", data),
    delete: (id: string) => request<void>(`sleep/${id}`, "DELETE"),
  },
  diapers: {
    list: (params?: { page?: number; pageSize?: number }) => {
      const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
      return request<DiaperListResponse>(`diapers${query}`);
    },
    create: (data: CreateDiaperDto) => request<DiaperResponse>("diapers", "POST", data),
    get: (id: string) => request<DiaperResponse>(`diapers/${id}`),
    update: (id: string, data: Partial<CreateDiaperDto>) => request<DiaperResponse>(`diapers/${id}`, "PATCH", data),
    delete: (id: string) => request<void>(`diapers/${id}`, "DELETE"),
  },
  babies: {
    list: () => rootRequest<BabyListResponseDto>("babies"),
    get: (id: string) => rootRequest<BabyResponseDto>(`babies/${id}`),
    create: (data: CreateBabyDto) => rootRequest<BabyResponseDto>("babies", "POST", data),
    update: (id: string, data: Partial<CreateBabyDto>) => rootRequest<BabyResponseDto>(`babies/${id}`, "PATCH", data),
    delete: (id: string) => rootRequest<void>(`babies/${id}`, "DELETE"),
    removeCaregiver: (babyId: string, caregiverId: string) => rootRequest<void>(`babies/${babyId}/caregivers/${caregiverId}`, "DELETE"),
    listCaregivers: (babyId: string) => rootRequest<CaregiverListResponseDto>(`babies/${babyId}/caregivers`),
    updateCaregiverRole: (babyId: string, caregiverId: string, role: 'primary' | 'secondary') => 
      rootRequest<void>(`babies/${babyId}/caregivers/${caregiverId}/role`, "PATCH", { role }),
  },
  invitations: {
    list: (babyId?: string) => {
      const id = babyId || getActiveBabyId();
      if (!id) throw new Error("No active baby selected");
      return rootRequest<InvitationListItemDto[]>(`auth/invite/${id}`);
    },
    create: (data: CreateInvitationDto) => rootRequest<InvitationResponseDto>("auth/invite", "POST", data),
    validate: (token: string) => rootRequest<{ valid: boolean; babyName: string; inviterName: string; inviteeEmail: string; status: string; expiresAt: string; error?: string }>(`auth/invite/validate/${token}`),
    getPending: () => rootRequest<{ token: string; babyName: string; inviterName: string; expiresAt: string }[]>("auth/invite/pending"),
    accept: (token: string) => rootRequest<{ message: string; babyId: string; babyName: string; role: string }>("auth/invite/accept", "POST", { token }),
    revoke: (id: string) => rootRequest<void>(`auth/invite/${id}`, "DELETE"),
  },
  milestones: {
    /** Get all milestone definitions */
    getDefinitions: (category?: MilestoneCategory) => {
      const query = category ? `?category=${category}` : '';
      return request<MilestoneDefinitionResponse[]>(`milestones/definitions${query}`);
    },
    /** Get specific milestone definition */
    getDefinition: (definitionId: string) =>
      request<MilestoneDefinitionResponse>(`milestones/definitions/${definitionId}`),
    /** Get milestones grouped by category with achievement status */
    getByCategory: () =>
      request<MilestonesByCategoryResponse>(`milestones`),
    /** List achieved milestone entries */
    list: (params?: { page?: number; pageSize?: number }) => {
      const query = buildQueryString({ page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 });
      return request<MilestoneEntryListResponse>(`milestones/achieved${query}`);
    },
    /** Get single milestone entry */
    get: (entryId: string) => request<MilestoneEntryResponse>(`milestones/achieved/${entryId}`),
    /** Create a new milestone achievement */
    create: (data: CreateMilestoneDto) =>
      request<MilestoneEntryResponse>(`milestones`, "POST", data),
    /** Update a milestone achievement */
    update: (entryId: string, data: UpdateMilestoneDto) =>
      request<MilestoneEntryResponse>(`milestones/achieved/${entryId}`, "PATCH", data),
    /** Delete a milestone achievement */
    delete: (entryId: string) => request<void>(`milestones/achieved/${entryId}`, "DELETE"),
  },
  statistics: {
    /** Get feeding statistics */
    feedings: (params?: StatisticsQueryParams) => {
      const query = buildQueryString(params);
      return request<FeedingStatisticsResponse>(`feedings/stats${query}`);
    },
    /** Get sleep statistics */
    sleep: (params?: StatisticsQueryParams) => {
      const query = buildQueryString(params);
      return request<SleepStatisticsResponse>(`sleep/stats${query}`);
    },
    /** Get diaper statistics */
    diapers: (params?: StatisticsQueryParams) => {
      const query = buildQueryString(params);
      return request<DiaperStatisticsResponse>(`diapers/stats${query}`);
    },
    /** Get activity statistics */
    activities: (params?: StatisticsQueryParams) => {
      const query = buildQueryString(params);
      return request<ActivityStatisticsResponse>(`activities/stats${query}`);
    },
  },
  wakeWindow: {
    /** Get current wake window */
    get: () => request<WakeWindowResponse>(`sleep/wake-window`),
  },
  wakeWindowTimer: {
    /** Get wake window timer data with age-appropriate recommendations */
    get: () => request<WakeWindowTimerResponse>(`sleep/wake-window-timer`),
  },
  feedingSuggestion: {
    /** Get feeding suggestion/prediction */
    get: () => request<FeedingStatisticsResponse>(`feedings/suggestion`),
  },
  dashboard: {
    /** Get daily summary for dashboard */
    getDailySummary: (date?: string) => {
      const query = date ? `?date=${date}` : '';
      return request<DashboardSummaryResponse>(`insights/daily-summary${query}`);
    },
    /** Get next upcoming reminder */
    getNextReminder: () => request<NextReminderResponse>(`reminders/next`),
    /** Get AI-powered daily trend insights */
    getDailyInsights: () => request<TrendInsightsResponse>(`insights/trends/daily`),
    /** Get upcoming milestones */
    getUpcomingMilestones: () => request<MilestonesByCategoryResponse>(`milestones`),
    /** Get aggregated summary for all babies */
    getAggregateSummary: () => rootRequest<DashboardAggregateResponse>(`dashboard/summary`),
    /** Get all alerts across babies */
    getAlerts: () => rootRequest<DashboardAlertsResponse>(`dashboard/alerts`),
    /** Get upcoming events for all babies */
    getUpcoming: () => rootRequest<DashboardUpcomingResponse>(`dashboard/upcoming`),
  },
  insights: {
    /** Get insight configuration */
    getConfig: () => request<InsightConfigResponse>(`insights/config`),
    /** Configure insight cadence */
    configureInsightCadence: (data: ConfigureInsightCadenceDto) => 
      request<InsightConfigResponse>(`insights/config`, "POST", data),
    /** Generate adhoc insight */
    generateAdhocInsight: (data: GenerateAdhocInsightDto) =>
      request<GeneratedInsightResponse>(`insights/generate`, "POST", data),
    /** Get insight history */
    getHistory: (params?: InsightHistoryQueryParams) => {
      const query = buildQueryString(params);
      return request<InsightHistoryListResponse>(`insights/history${query}`);
    },
    /** Get weekly summary */
    getWeeklySummary: (params?: { startDate?: string; endDate?: string }) => {
      const query = buildQueryString(params);
      return request<WeeklySummaryResponse>(`insights/weekly-summary${query}`);
    },
    /** Get sleep prediction */
    getSleepPrediction: (params?: { analysisDays?: number }) => {
      const query = buildQueryString(params);
      return request<SleepPredictionResponse>(`insights/sleep-prediction${query}`);
    },
    /** Get anomalies */
    getAnomalies: (params?: { analysisHours?: number }) => {
      const query = buildQueryString(params);
      return request<AnomalyDetectionResponse>(`insights/anomalies${query}`);
    },
    /** Get daily trend insights */
    getDailyTrends: () => request<TrendInsightsResponse>(`insights/trends/daily`),
    /** Get weekly trend insights */
    getWeeklyTrends: () => request<TrendInsightsResponse>(`insights/trends/weekly`),
    /** Get monthly trend insights */
    getMonthlyTrends: () => request<TrendInsightsResponse>(`insights/trends/monthly`),
    /** Get yearly trend insights */
    getYearlyTrends: () => request<TrendInsightsResponse>(`insights/trends/yearly`),
    /** Get trend insights for a specific period */
    getTrends: (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => 
      request<TrendInsightsResponse>(`insights/trends/${period}`),
  },
  aiConfig: {
    /** Get available AI providers */
    getProviders: () => rootRequest<AiProviderInfo[]>('ai-config/providers'),
    /** Get current user's AI configuration */
    getConfig: () => rootRequest<AiConfigResponse>('ai-config'),
    /** Update user's AI configuration */
    updateConfig: (data: UpdateAiConfigRequest) => rootRequest<AiConfigResponse>('ai-config', 'PUT', data),
    /** Delete user's AI configuration (revert to defaults) */
    deleteConfig: () => rootRequest<void>('ai-config', 'DELETE'),
    /** Test a provider configuration */
    testProvider: (data: TestProviderRequest) => rootRequest<TestProviderResult>('ai-config/test', 'POST', data),
    /** List available models for a provider (optionally with API key for dynamic listing) */
    listModels: (provider: AiProviderType, apiKey?: string) => {
      const params = new URLSearchParams({ provider });
      if (apiKey) params.append('apiKey', apiKey);
      return rootRequest<ListModelsResponse>(`ai-config/models?${params.toString()}`);
    },
  },
  photoImport: {
    /** Analyze a photo of handwritten logs */
    analyze: async (file: File): Promise<PhotoAnalysisResponse> => {
      const babyId = getActiveBabyId();
      if (!babyId) {
        throw new Error("No active baby selected. Please create or select a baby profile.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const headers: HeadersInit = {};
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      // Use custom API route with extended timeout for vision model processing
      const response = await fetch(`/api/photo-import/analyze?babyId=${babyId}`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch {
          // Failed to parse error body
        }
        throw new ApiError(errorMessage, response.status, response.statusText);
      }

      return response.json();
    },
    /** Confirm and import extracted entries */
    confirm: async (data: ConfirmImportRequest): Promise<ImportResultResponse> => {
      const babyId = getActiveBabyId();
      if (!babyId) {
        throw new Error("No active baby selected. Please create or select a baby profile.");
      }
      return request<ImportResultResponse>(`babies/${babyId}/photo-import/confirm`, "POST", data);
    },
  },
};
