/**
 * API Client for BabyNest backend communication
 * Handles HTTP requests with authentication and error handling
 * Validates: Requirements 11.2, 12.1
 */

import type { SyncPayload, SyncResult, SyncChange } from '@babynest/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TrendInsightsResponse, TrendInsightsQuery, TrendPeriod } from '../types/insights';

/**
 * Response from file upload endpoint
 */
export interface UploadResponse {
  url: string;
  thumbnailUrl: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

const STORAGE_KEYS = {
  SERVER_URL: '@babynest/server_url',
  AUTH_TOKEN: '@babynest/auth_token',
  DEVICE_ID: '@babynest/device_id',
};

/**
 * API error with status code and message
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Configuration for the API client
 */
export interface ApiClientConfig {
  serverUrl: string;
  authToken?: string;
  deviceId: string;
  timeout?: number;
}

/**
 * API Client class for making HTTP requests to the BabyNest backend
 */
export class ApiClient {
  private config: ApiClientConfig;
  private defaultTimeout = 30000; // 30 seconds

  constructor(config: ApiClientConfig) {
    this.config = {
      ...config,
      timeout: config.timeout ?? this.defaultTimeout,
    };
  }

  /**
   * Update the auth token
   */
  setAuthToken(token: string): void {
    this.config.authToken = token;
  }

  /**
   * Update the server URL
   */
  setServerUrl(url: string): void {
    this.config.serverUrl = url;
  }

  /**
   * Get the current configuration
   */
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }

  /**
   * Make an HTTP request with timeout and error handling
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.config.serverUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Device-ID': this.config.deviceId,
    };

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetails: unknown;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
        throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`, errorDetails);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      return {} as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError(408, 'Request timeout');
        }
        throw new ApiError(0, error.message);
      }
      
      throw new ApiError(0, 'Unknown error occurred');
    }
  }

  /**
   * Upload a file using multipart/form-data
   * Used for image uploads to the /uploads endpoint
   */
  async uploadFile(fileUri: string, fileName: string, mimeType: string): Promise<UploadResponse> {
    if (!this.config.authToken) {
      throw new ApiError(401, 'Unauthorized: No auth token available');
    }

    const url = `${this.config.serverUrl}/uploads`;
    
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`,
          'X-Device-ID': this.config.deviceId,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetails: unknown;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
        throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`, errorDetails);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError(408, 'Request timeout');
        }
        throw new ApiError(0, error.message);
      }
      
      throw new ApiError(0, 'Unknown error occurred');
    }
  }

  /**
   * Check if the client has an auth token
   */
  hasAuthToken(): boolean {
    return !!this.config.authToken;
  }

  /**
   * Push local changes to the server
   * Validates: Requirements 11.2
   */
  async pushChanges(changes: SyncChange[], lastSyncTime: Date | null): Promise<SyncResult> {
    const payload: SyncPayload = {
      deviceId: this.config.deviceId,
      lastSyncTime: lastSyncTime ?? new Date(0),
      changes,
    };

    return this.request<SyncResult>('POST', '/sync/push', payload);
  }

  /**
   * Pull changes from the server since last sync
   * Validates: Requirements 11.2
   */
  async pullChanges(since: Date): Promise<SyncPayload> {
    const timestamp = since.toISOString();
    return this.request<SyncPayload>('GET', `/sync/pull?since=${encodeURIComponent(timestamp)}`);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('GET', '/health');
  }

  /**
   * Get trend insights for a specific period
   * Validates: AI-powered trend analysis
   */
  async getTrendInsights(
    babyId: string,
    period: TrendPeriod,
    query?: TrendInsightsQuery
  ): Promise<TrendInsightsResponse> {
    let endpoint = `/babies/${babyId}/insights/trends/${period}`;
    const params = new URLSearchParams();
    
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }
    
    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
    
    return this.request<TrendInsightsResponse>('GET', endpoint);
  }

  /**
   * Get daily trend insights
   */
  async getDailyTrendInsights(babyId: string, query?: TrendInsightsQuery): Promise<TrendInsightsResponse> {
    return this.getTrendInsights(babyId, 'daily', query);
  }

  /**
   * Get weekly trend insights
   */
  async getWeeklyTrendInsights(babyId: string, query?: TrendInsightsQuery): Promise<TrendInsightsResponse> {
    return this.getTrendInsights(babyId, 'weekly', query);
  }

  /**
   * Get monthly trend insights
   */
  async getMonthlyTrendInsights(babyId: string, query?: TrendInsightsQuery): Promise<TrendInsightsResponse> {
    return this.getTrendInsights(babyId, 'monthly', query);
  }

  /**
   * Get yearly trend insights
   */
  async getYearlyTrendInsights(babyId: string, query?: TrendInsightsQuery): Promise<TrendInsightsResponse> {
    return this.getTrendInsights(babyId, 'yearly', query);
  }
}

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create a device ID
 */
async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = generateDeviceId();
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

/**
 * Create an API client instance from stored configuration
 */
export async function createApiClient(): Promise<ApiClient | null> {
  const serverUrl = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
  if (!serverUrl) {
    return null;
  }

  const authToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const deviceId = await getOrCreateDeviceId();

  return new ApiClient({
    serverUrl,
    authToken: authToken ?? undefined,
    deviceId,
  });
}

/**
 * Save server URL to storage
 */
export async function saveServerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, url);
}

/**
 * Save auth token to storage
 */
export async function saveAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

/**
 * Clear auth token from storage
 */
export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Get stored server URL
 */
export async function getServerUrl(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
}
