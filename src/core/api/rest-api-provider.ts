import type { ConfigurationService } from "@/core/configuration/configuration-service";
import type {
  ApiProvider,
  ApiRequestOptions,
  ApiResponse,
  HttpMethod
} from "@/core/api/api-provider.interface";
import { ApiRequestError } from "@/core/api/api-provider.interface";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 1;

function buildUrl(baseUrl: string, path: string) {
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function toHeaderRecord(headers: Headers) {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function createRestApiProvider(configuration: ConfigurationService): ApiProvider {
  return {
    async request<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
      const method = (options.method ?? "GET") as HttpMethod;
      const url = buildUrl(configuration.getApiBaseUrl(), path);
      const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const retries = options.retries ?? DEFAULT_RETRIES;
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...options.headers
      };
      const body =
        options.body === undefined || options.body === null
          ? undefined
          : options.body instanceof FormData
            ? options.body
            : JSON.stringify(options.body);

      if (body !== undefined && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      let lastError: unknown;

      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          const response = await fetchWithTimeout(
            url,
            {
              method,
              headers,
              body
            },
            timeoutMs
          );

          const data = (await parseResponseBody(response)) as T;

          if (!response.ok) {
            throw new ApiRequestError({
              status: response.status,
              message: `Request failed with status ${response.status}.`,
              url,
              method
            });
          }

          return {
            ok: true,
            status: response.status,
            data,
            headers: toHeaderRecord(response.headers)
          };
        } catch (error) {
          lastError = error;

          if (attempt >= retries) {
            break;
          }
        }
      }

      if (lastError instanceof ApiRequestError) {
        throw lastError;
      }

      throw new ApiRequestError({
        status: 0,
        message: lastError instanceof Error ? lastError.message : "Network request failed.",
        url,
        method
      });
    },

    upload<T>(path: string, file: File | Blob, options: ApiRequestOptions = {}) {
      const formData = new FormData();
      formData.append("file", file);

      return this.request<T>(path, {
        ...options,
        method: options.method ?? "POST",
        body: formData
      });
    }
  };
}
