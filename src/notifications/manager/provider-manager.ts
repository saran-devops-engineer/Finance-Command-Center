import type {
  FinancialNotificationSettings,
  NotificationCapabilityState,
  NotificationDeliveryPayload,
  NotificationProviderIdValue
} from "@/notifications/models";
import { NotificationProviderId } from "@/notifications/models";
import {
  buildCapabilityState,
  detectPlatformCapabilities,
  PROVIDER_PRIORITY,
  type PlatformCapabilities
} from "@/notifications/manager/platform-detection";
import { createInternalProviderRegistry } from "@/notifications/providers";
import type { FinancialNotificationProvider } from "@/notifications/providers/provider.interface";

export interface EnableNotificationsResult {
  settings: FinancialNotificationSettings;
  capabilities: NotificationCapabilityState;
  activeProviderId: NotificationProviderIdValue;
  permission: NotificationPermission | "unsupported";
  userMessage: string | null;
}

export class NotificationProviderManager {
  private readonly registry = createInternalProviderRegistry();

  detectPlatform(): PlatformCapabilities {
    return detectPlatformCapabilities();
  }

  /** First supported provider in priority order wins. In-app center is always last resort. */
  selectBestProvider(platform = this.detectPlatform()): FinancialNotificationProvider {
    for (const providerId of PROVIDER_PRIORITY) {
      const provider = this.registry.get(providerId);
      if (!provider) {
        continue;
      }

      if (providerId === NotificationProviderId.WEB_PUSH) {
        continue;
      }

      if (providerId === NotificationProviderId.BROWSER) {
        if (platform.hasNotificationApi) {
          return provider;
        }
        continue;
      }

      if (provider.isSupported()) {
        return provider;
      }
    }

    return this.registry.get(NotificationProviderId.IN_APP_CENTER)!;
  }

  /** Device delivery provider — never in-app center unless nothing else exists. */
  selectDeviceProvider(platform = this.detectPlatform()): FinancialNotificationProvider | null {
    for (const providerId of PROVIDER_PRIORITY) {
      if (providerId === NotificationProviderId.IN_APP_CENTER) {
        return null;
      }

      if (providerId === NotificationProviderId.WEB_PUSH) {
        continue;
      }

      const provider = this.registry.get(providerId);
      if (!provider) {
        continue;
      }

      if (providerId === NotificationProviderId.BROWSER && platform.hasNotificationApi) {
        return provider;
      }

      if (providerId !== NotificationProviderId.BROWSER && provider.isSupported()) {
        return provider;
      }
    }

    return null;
  }

  resolveCapabilities(settings: FinancialNotificationSettings): NotificationCapabilityState {
    const platform = this.detectPlatform();
    const base = buildCapabilityState(platform);

    if (!settings.enabled) {
      return {
        ...base,
        deviceNotifications: false
      };
    }

    return settings.capabilities ?? base;
  }

  async enableNotifications(
    settings: FinancialNotificationSettings
  ): Promise<EnableNotificationsResult> {
    const platform = this.detectPlatform();
    const deviceProvider = this.selectDeviceProvider(platform);
    let permission: NotificationPermission | "unsupported" = "unsupported";
    let userMessage: string | null = null;

    if (deviceProvider && deviceProvider.id === NotificationProviderId.BROWSER) {
      permission = await deviceProvider.requestPermission();
      if (permission === "denied" || permission === "unsupported") {
        userMessage =
          permission === "unsupported"
            ? "Your device doesn't support device notifications. You'll continue receiving reminders inside Finance Command Center."
            : null;
      }
    } else if (!platform.hasNotificationApi) {
      userMessage =
        "Your device doesn't support device notifications. You'll continue receiving reminders inside Finance Command Center.";
    }

    const capabilities = buildCapabilityState({
      ...platform,
      notificationPermission: permission === "unsupported" ? platform.notificationPermission : permission
    });

    const activeProvider = this.selectBestProvider({
      ...platform,
      notificationPermission: capabilities.deviceNotifications ? "granted" : platform.notificationPermission
    });

    const nextSettings: FinancialNotificationSettings = {
      ...settings,
      enabled: true,
      deliveryMode: "automatic",
      capabilities,
      activeProviderId: activeProvider.id as NotificationProviderIdValue,
      updatedAt: new Date().toISOString()
    };

    return {
      settings: nextSettings,
      capabilities,
      activeProviderId: activeProvider.id as NotificationProviderIdValue,
      permission,
      userMessage
    };
  }

  async disableNotifications(
    settings: FinancialNotificationSettings
  ): Promise<FinancialNotificationSettings> {
    const platform = this.detectPlatform();
    const capabilities = buildCapabilityState(platform);

    return {
      ...settings,
      enabled: false,
      capabilities: {
        ...capabilities,
        deviceNotifications: false
      },
      activeProviderId: NotificationProviderId.IN_APP_CENTER,
      updatedAt: new Date().toISOString()
    };
  }

  async deliverDeviceNotification(
    payload: NotificationDeliveryPayload,
    settings: FinancialNotificationSettings
  ): Promise<boolean> {
    if (!settings.enabled) {
      return false;
    }

    const platform = this.detectPlatform();
    const deviceProvider = this.selectDeviceProvider(platform);
    if (!deviceProvider || !settings.capabilities.deviceNotifications) {
      return false;
    }

    if (platform.notificationPermission !== "granted") {
      return false;
    }

    try {
      await deviceProvider.deliver(payload);
      return true;
    } catch {
      return false;
    }
  }
}

let managerInstance: NotificationProviderManager | null = null;

export function getNotificationProviderManager(): NotificationProviderManager {
  if (!managerInstance) {
    managerInstance = new NotificationProviderManager();
  }

  return managerInstance;
}

export function resetNotificationProviderManagerForTests() {
  managerInstance = null;
}
