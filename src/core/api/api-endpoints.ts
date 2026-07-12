export const ApiEndpoints = {
  config: "/config",
  version: "/version",
  releaseNotes: "/release-notes",
  feedback: "/feedback",
  analytics: "/analytics"
} as const;

export type ApiEndpointKey = keyof typeof ApiEndpoints;

export interface RemoteConfigResponse {
  maintenanceMode?: boolean;
  minimumSupportedVersion?: string;
  featureFlags?: Record<string, boolean>;
}

export interface VersionResponse {
  version: string;
  minimumSupportedVersion: string;
}

export interface ReleaseNotesResponse {
  version: string;
  notes: string[];
}

export interface FeedbackRequest {
  message: string;
  email?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface FeedbackResponse {
  accepted: boolean;
}

export interface AnalyticsBatchRequest {
  events: Array<{
    name: string;
    properties?: Record<string, string | number | boolean | null>;
    timestamp?: string;
  }>;
}

export interface AnalyticsBatchResponse {
  accepted: number;
}
