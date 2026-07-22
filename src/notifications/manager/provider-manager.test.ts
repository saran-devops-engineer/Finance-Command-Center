import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  NotificationProviderId,
  type FinancialNotificationSettings
} from "@/notifications/models";
import {
  DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
  normalizeNotificationSettings
} from "@/notifications/settings/defaults";
import {
  getNotificationProviderManager,
  resetNotificationProviderManagerForTests
} from "@/notifications/manager/provider-manager";
import * as platformDetection from "@/notifications/manager/platform-detection";

const BASE_SETTINGS: FinancialNotificationSettings = {
  ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
  updatedAt: "2026-07-21T12:00:00.000Z"
};

describe("Notification Provider Manager", () => {
  beforeEach(() => {
    resetNotificationProviderManagerForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetNotificationProviderManagerForTests();
  });

  it("selects browser provider when Notification API is available", () => {
    vi.spyOn(platformDetection, "detectPlatformCapabilities").mockReturnValue({
      hasNotificationApi: true,
      hasPushApi: false,
      hasServiceWorker: false,
      isInstalledPwa: false,
      notificationPermission: "default"
    });

    const manager = getNotificationProviderManager();
    expect(manager.selectBestProvider().id).toBe(NotificationProviderId.BROWSER);
    expect(manager.selectDeviceProvider()?.id).toBe(NotificationProviderId.BROWSER);
  });

  it("falls back to in-app center when browser notifications are unsupported", () => {
    vi.spyOn(platformDetection, "detectPlatformCapabilities").mockReturnValue({
      hasNotificationApi: false,
      hasPushApi: false,
      hasServiceWorker: false,
      isInstalledPwa: false,
      notificationPermission: "unsupported"
    });

    const manager = getNotificationProviderManager();
    expect(manager.selectBestProvider().id).toBe(NotificationProviderId.IN_APP_CENTER);
    expect(manager.selectDeviceProvider()).toBeNull();
  });

  it("skips web push in V1 even when push APIs exist", () => {
    vi.spyOn(platformDetection, "detectPlatformCapabilities").mockReturnValue({
      hasNotificationApi: true,
      hasPushApi: true,
      hasServiceWorker: true,
      isInstalledPwa: true,
      notificationPermission: "granted"
    });

    const manager = getNotificationProviderManager();
    expect(manager.selectBestProvider().id).toBe(NotificationProviderId.BROWSER);
    expect(manager.selectDeviceProvider()?.id).toBe(NotificationProviderId.BROWSER);
  });

  it("enables reminders with a friendly unsupported message when device notifications fail", async () => {
    vi.spyOn(platformDetection, "detectPlatformCapabilities").mockReturnValue({
      hasNotificationApi: false,
      hasPushApi: false,
      hasServiceWorker: false,
      isInstalledPwa: false,
      notificationPermission: "unsupported"
    });

    const manager = getNotificationProviderManager();
    const result = await manager.enableNotifications(BASE_SETTINGS);

    expect(result.settings.enabled).toBe(true);
    expect(result.settings.deliveryMode).toBe("automatic");
    expect(result.settings.activeProviderId).toBe(NotificationProviderId.IN_APP_CENTER);
    expect(result.capabilities.inAppReminders).toBe(true);
    expect(result.capabilities.notificationCenter).toBe(true);
    expect(result.userMessage).toContain("Your device doesn't support device notifications");
  });

  it("requests permission when enabling on a supported browser", async () => {
    vi.spyOn(platformDetection, "detectPlatformCapabilities").mockReturnValue({
      hasNotificationApi: true,
      hasPushApi: false,
      hasServiceWorker: false,
      isInstalledPwa: false,
      notificationPermission: "default"
    });

    const manager = getNotificationProviderManager();
    const browserProvider = manager.selectDeviceProvider()!;
    vi.spyOn(browserProvider, "requestPermission").mockResolvedValue("granted");

    const result = await manager.enableNotifications(BASE_SETTINGS);

    expect(browserProvider.requestPermission).toHaveBeenCalled();
    expect(result.settings.enabled).toBe(true);
    expect(result.settings.capabilities.deviceNotifications).toBe(true);
  });

  it("keeps in-app reminders when permission is denied", async () => {
    vi.spyOn(platformDetection, "detectPlatformCapabilities").mockReturnValue({
      hasNotificationApi: true,
      hasPushApi: false,
      hasServiceWorker: false,
      isInstalledPwa: false,
      notificationPermission: "default"
    });

    const manager = getNotificationProviderManager();
    const browserProvider = manager.selectDeviceProvider()!;
    vi.spyOn(browserProvider, "requestPermission").mockResolvedValue("denied");

    const result = await manager.enableNotifications(BASE_SETTINGS);

    expect(result.settings.enabled).toBe(true);
    expect(result.settings.capabilities.deviceNotifications).toBe(false);
    expect(result.settings.capabilities.inAppReminders).toBe(true);
  });

  it("disables device delivery while keeping notification center capability", async () => {
    vi.spyOn(platformDetection, "detectPlatformCapabilities").mockReturnValue({
      hasNotificationApi: true,
      hasPushApi: false,
      hasServiceWorker: false,
      isInstalledPwa: false,
      notificationPermission: "granted"
    });

    const manager = getNotificationProviderManager();
    const enabled = await manager.enableNotifications(BASE_SETTINGS);
    const disabled = await manager.disableNotifications(enabled.settings);

    expect(disabled.enabled).toBe(false);
    expect(disabled.capabilities.deviceNotifications).toBe(false);
    expect(disabled.capabilities.notificationCenter).toBe(true);
    expect(disabled.activeProviderId).toBe(NotificationProviderId.IN_APP_CENTER);
  });

  it("migrates legacy defaultProviderId during normalization", () => {
    const normalized = normalizeNotificationSettings({
      ...BASE_SETTINGS,
      defaultProviderId: NotificationProviderId.BROWSER,
      activeProviderId: undefined
    });

    expect(normalized.activeProviderId).toBe(NotificationProviderId.BROWSER);
    expect(normalized.deliveryMode).toBe("automatic");
  });
});
