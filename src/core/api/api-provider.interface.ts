export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T;
  headers: Record<string, string>;
}

export interface ApiErrorDetails {
  status: number;
  message: string;
  url: string;
  method: HttpMethod;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly url: string;
  readonly method: HttpMethod;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = "ApiRequestError";
    this.status = details.status;
    this.url = details.url;
    this.method = details.method;
  }
}

export interface ApiProvider {
  request<T>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>>;
  upload<T>(path: string, file: File | Blob, options?: ApiRequestOptions): Promise<ApiResponse<T>>;
}
