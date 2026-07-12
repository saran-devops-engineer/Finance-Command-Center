import type { ConfigurationService } from "@/core/configuration/configuration-service";
import { APPLICATION_VERSION } from "@/core/configuration/default-configuration-provider";
import type { AnalyticsEventProperties } from "@/core/analytics/analytics-provider.interface";

const ANALYTICS_DISTINCT_ID_KEY = "fcc:analyticsDistinctId";

export function getAnalyticsDistinctId() {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = localStorage.getItem(ANALYTICS_DISTINCT_ID_KEY);

  if (existing) {
    return existing;
  }

  const distinctId = crypto.randomUUID();
  localStorage.setItem(ANALYTICS_DISTINCT_ID_KEY, distinctId);
  return distinctId;
}

function detectBrowser() {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const userAgent = navigator.userAgent;

  if (userAgent.includes("Edg/")) {
    return "Edge";
  }

  if (userAgent.includes("Chrome/")) {
    return "Chrome";
  }

  if (userAgent.includes("Firefox/")) {
    return "Firefox";
  }

  if (userAgent.includes("Safari/")) {
    return "Safari";
  }

  return "Other";
}

function detectOperatingSystem() {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const platform = navigator.platform || navigator.userAgent;

  if (/Win/i.test(platform)) {
    return "Windows";
  }

  if (/Mac/i.test(platform)) {
    return "macOS";
  }

  if (/Linux/i.test(platform)) {
    return "Linux";
  }

  if (/Android/i.test(navigator.userAgent)) {
    return "Android";
  }

  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return "iOS";
  }

  return "Other";
}

export function buildAnalyticsContextProperties(
  configuration: ConfigurationService
): AnalyticsEventProperties {
  return {
    appVersion: configuration.getApplicationVersion() || APPLICATION_VERSION,
    platform: typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches
      ? "installed-pwa"
      : "web",
    browser: detectBrowser(),
    operatingSystem: detectOperatingSystem(),
    timestamp: new Date().toISOString()
  };
}

export function mergeAnalyticsProperties(
  configuration: ConfigurationService,
  properties?: AnalyticsEventProperties
): AnalyticsEventProperties {
  return {
    ...buildAnalyticsContextProperties(configuration),
    ...properties
  };
}
