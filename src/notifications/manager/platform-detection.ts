import type { NotificationCapabilityState, NotificationProviderIdValue } from "@/notifications/models";
import { getNotificationTestingPlatformOverride } from "@/notifications/testing/testing-overrides";

export interface PlatformCapabilities {
  hasNotificationApi: boolean;
  hasPushApi: boolean;
  hasServiceWorker: boolean;
  isInstalledPwa: boolean;
  notificationPermission: NotificationPermission | "unsupported";
}

export function detectPlatformCapabilities(): PlatformCapabilities {
  if (typeof window === "undefined") {
    return {
      hasNotificationApi: false,
      hasPushApi: false,
      hasServiceWorker: false,
      isInstalledPwa: false,
      notificationPermission: "unsupported"
    };
  }

  const hasNotificationApi = "Notification" in window;
  const hasPushApi = "PushManager" in window && "serviceWorker" in navigator;
  const hasServiceWorker = "serviceWorker" in navigator;

  let isInstalledPwa = false;
  try {
    isInstalledPwa =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    isInstalledPwa = false;
  }

  const notificationPermission = hasNotificationApi
    ? Notification.permission
    : ("unsupported" as const);

  const base: PlatformCapabilities = {
    hasNotificationApi,
    hasPushApi,
    hasServiceWorker,
    isInstalledPwa,
    notificationPermission
  };

  const override = getNotificationTestingPlatformOverride();
  if (!override) {
    return base;
  }

  return {
    ...base,
    ...override,
    notificationPermission: override.notificationPermission ?? base.notificationPermission
  };
}

export function buildCapabilityState(platform: PlatformCapabilities): NotificationCapabilityState {
  const deviceSupported = platform.hasNotificationApi;
  const deviceActive =
    deviceSupported && platform.notificationPermission === "granted";

  return {
    inAppReminders: true,
    notificationCenter: true,
    deviceNotifications: deviceActive,
    deviceNotificationsSupported: deviceSupported
  };
}

export const PROVIDER_PRIORITY: readonly NotificationProviderIdValue[] = [
  "native_mobile",
  "web_push",
  "browser",
  "in_app_center"
] as const;

export function unsupportedDeviceMessage(): string {
  return "Your device doesn't support device notifications. You'll continue receiving reminders inside Finance Command Center.";
}
