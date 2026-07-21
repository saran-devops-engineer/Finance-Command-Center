import { NotificationProviderId, type NotificationDeliveryPayload } from "@/notifications/models";
import {
  createProviderRegistry,
  type FinancialNotificationProvider
} from "@/notifications/providers/provider.interface";

export function createBrowserFinancialNotificationProvider(): FinancialNotificationProvider {
  return {
    id: NotificationProviderId.BROWSER,

    isSupported() {
      return typeof window !== "undefined" && "Notification" in window;
    },

    requestPermission() {
      if (!this.isSupported()) {
        return Promise.resolve("unsupported");
      }

      return Notification.requestPermission();
    },

    async deliver(payload: NotificationDeliveryPayload) {
      if (!this.isSupported() || Notification.permission !== "granted") {
        return;
      }

      new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        data: payload.data
      });
    }
  };
}

function createStubProvider(id: string): FinancialNotificationProvider {
  return {
    id,
    isSupported: () => false,
    requestPermission: async () => "unsupported",
    deliver: async () => undefined
  };
}

export function createDefaultProviderRegistry() {
  return createProviderRegistry([
    createBrowserFinancialNotificationProvider(),
    createStubProvider(NotificationProviderId.WEB_PUSH),
    createStubProvider(NotificationProviderId.EMAIL),
    createStubProvider(NotificationProviderId.SMS),
    createStubProvider(NotificationProviderId.WHATSAPP),
    createStubProvider(NotificationProviderId.NATIVE_MOBILE)
  ]);
}

export type { FinancialNotificationProvider } from "@/notifications/providers/provider.interface";
