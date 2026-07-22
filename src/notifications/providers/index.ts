import { NotificationProviderId } from "@/notifications/models";
import type { FinancialNotificationProvider } from "@/notifications/providers/provider.interface";
import { createBrowserFinancialNotificationProvider } from "@/notifications/providers/browser-notification-provider";
import { createInAppCenterProvider } from "@/notifications/providers/in-app-center-provider";

function createFutureStubProvider(id: string): FinancialNotificationProvider {
  return {
    id,
    isSupported: () => false,
    requestPermission: async () => "unsupported",
    deliver: async () => undefined
  };
}

/** Internal registry — user never selects from this list. */
export function createInternalProviderRegistry() {
  const providers = new Map<string, FinancialNotificationProvider>([
    [NotificationProviderId.NATIVE_MOBILE, createFutureStubProvider(NotificationProviderId.NATIVE_MOBILE)],
    [NotificationProviderId.WEB_PUSH, createFutureStubProvider(NotificationProviderId.WEB_PUSH)],
    [NotificationProviderId.BROWSER, createBrowserFinancialNotificationProvider()],
    [NotificationProviderId.IN_APP_CENTER, createInAppCenterProvider()],
    [NotificationProviderId.EMAIL, createFutureStubProvider(NotificationProviderId.EMAIL)],
    [NotificationProviderId.SMS, createFutureStubProvider(NotificationProviderId.SMS)],
    [NotificationProviderId.WHATSAPP, createFutureStubProvider(NotificationProviderId.WHATSAPP)]
  ]);

  return {
    get(id: string) {
      return providers.get(id) ?? null;
    },
    list() {
      return [...providers.values()];
    }
  };
}

export { createBrowserFinancialNotificationProvider } from "@/notifications/providers/browser-notification-provider";
export { createInAppCenterProvider } from "@/notifications/providers/in-app-center-provider";
export type { FinancialNotificationProvider } from "@/notifications/providers/provider.interface";
