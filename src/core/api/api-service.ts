import type { ConfigurationService } from "@/core/configuration/configuration-service";
import type { ApiProvider, ApiRequestOptions } from "@/core/api/api-provider.interface";
import {
  ApiEndpoints,
  type AnalyticsBatchRequest,
  type AnalyticsBatchResponse,
  type FeedbackRequest,
  type FeedbackResponse,
  type ReleaseNotesResponse,
  type RemoteConfigResponse,
  type VersionResponse
} from "@/core/api/api-endpoints";

export class ApiService {
  constructor(
    private readonly provider: ApiProvider,
    private readonly configuration: ConfigurationService
  ) {}

  get<T>(path: string, options?: ApiRequestOptions) {
    return this.provider.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.provider.request<T>(path, { ...options, method: "POST", body });
  }

  put<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.provider.request<T>(path, { ...options, method: "PUT", body });
  }

  delete<T>(path: string, options?: ApiRequestOptions) {
    return this.provider.request<T>(path, { ...options, method: "DELETE" });
  }

  upload<T>(path: string, file: File | Blob, options?: ApiRequestOptions) {
    return this.provider.upload<T>(path, file, options);
  }

  hasBackend() {
    return Boolean(this.configuration.getApiBaseUrl());
  }

  getRemoteConfig() {
    return this.get<RemoteConfigResponse>(ApiEndpoints.config);
  }

  getVersion() {
    return this.get<VersionResponse>(ApiEndpoints.version);
  }

  getReleaseNotes() {
    return this.get<ReleaseNotesResponse>(ApiEndpoints.releaseNotes);
  }

  submitFeedback(payload: FeedbackRequest) {
    return this.post<FeedbackResponse>(ApiEndpoints.feedback, payload);
  }

  submitAnalyticsBatch(payload: AnalyticsBatchRequest) {
    return this.post<AnalyticsBatchResponse>(ApiEndpoints.analytics, payload);
  }
}

export function createApiService(provider: ApiProvider, configuration: ConfigurationService) {
  return new ApiService(provider, configuration);
}

export { ApiEndpoints };
