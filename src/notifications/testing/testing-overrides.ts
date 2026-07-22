import type { PlatformCapabilities } from "@/notifications/manager/platform-detection";
import { NOTIFICATION_TEST_SESSION_KEYS } from "@/notifications/testing/constants";

let platformOverride: Partial<PlatformCapabilities> | null = null;

export function getNotificationTestingPlatformOverride(): Partial<PlatformCapabilities> | null {
  if (platformOverride) {
    return platformOverride;
  }

  if (typeof window === "undefined") {
    return null;
  }

  if (sessionStorage.getItem(NOTIFICATION_TEST_SESSION_KEYS.unsupported) === "1") {
    return {
      hasNotificationApi: false,
      hasPushApi: false,
      notificationPermission: "unsupported"
    };
  }

  return null;
}

export function setNotificationTestingPlatformOverride(
  override: Partial<PlatformCapabilities> | null
): void {
  platformOverride = override;
}

export function getSimulatedReferenceIso(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(NOTIFICATION_TEST_SESSION_KEYS.simulatedTime);
}

export function setSimulatedReferenceIso(iso: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!iso) {
    sessionStorage.removeItem(NOTIFICATION_TEST_SESSION_KEYS.simulatedTime);
    return;
  }

  sessionStorage.setItem(NOTIFICATION_TEST_SESSION_KEYS.simulatedTime, iso);
}

export function isOfflineSimulationEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(NOTIFICATION_TEST_SESSION_KEYS.offline) === "1";
}

export function setOfflineSimulationEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  if (enabled) {
    sessionStorage.setItem(NOTIFICATION_TEST_SESSION_KEYS.offline, "1");
    return;
  }

  sessionStorage.removeItem(NOTIFICATION_TEST_SESSION_KEYS.offline);
}

export function setUnsupportedSimulationEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  if (enabled) {
    sessionStorage.setItem(NOTIFICATION_TEST_SESSION_KEYS.unsupported, "1");
    platformOverride = null;
    return;
  }

  sessionStorage.removeItem(NOTIFICATION_TEST_SESSION_KEYS.unsupported);
  platformOverride = null;
}

export function recordNotificationTestDelivery(iso: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(NOTIFICATION_TEST_SESSION_KEYS.lastNotificationTime, iso);
  sessionStorage.setItem(NOTIFICATION_TEST_SESSION_KEYS.lastDeliveryTime, iso);
  sessionStorage.removeItem(NOTIFICATION_TEST_SESSION_KEYS.lastError);
}

export function recordNotificationTestError(message: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(NOTIFICATION_TEST_SESSION_KEYS.lastError, message);
}

export function readNotificationTestSessionMeta() {
  if (typeof window === "undefined") {
    return {
      lastNotificationTime: null,
      lastDeliveryTime: null,
      lastError: null
    };
  }

  return {
    lastNotificationTime: sessionStorage.getItem(NOTIFICATION_TEST_SESSION_KEYS.lastNotificationTime),
    lastDeliveryTime: sessionStorage.getItem(NOTIFICATION_TEST_SESSION_KEYS.lastDeliveryTime),
    lastError: sessionStorage.getItem(NOTIFICATION_TEST_SESSION_KEYS.lastError)
  };
}

export function clearNotificationTestingSessionState(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of Object.values(NOTIFICATION_TEST_SESSION_KEYS)) {
    sessionStorage.removeItem(key);
  }

  platformOverride = null;
}
