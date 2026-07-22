import type { NotificationDeliveryPayload } from "@/notifications/models";
import { NotificationProviderId } from "@/notifications/models";
import type { FinancialNotificationProvider } from "@/notifications/providers/provider.interface";

/** In-app Notification Center — always available; queue is the source of truth. */
export function createInAppCenterProvider(): FinancialNotificationProvider {
  return {
    id: NotificationProviderId.IN_APP_CENTER,

    isSupported() {
      return true;
    },

    requestPermission() {
      return Promise.resolve("granted" as NotificationPermission);
    },

    async deliver(_payload: NotificationDeliveryPayload) {
      // Reminders are persisted in the queue and Notification Center.
    }
  };
}
