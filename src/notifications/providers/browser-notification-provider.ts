import { NotificationProviderId, type NotificationDeliveryPayload } from "@/notifications/models";
import type { FinancialNotificationProvider } from "@/notifications/providers/provider.interface";

function openProductFromNotification(data: Record<string, string>) {
  if (typeof window === "undefined") {
    return;
  }

  const productTypeId = data.product_type_id;
  const productId = data.product_id;
  if (productTypeId && productId) {
    window.focus();
    window.location.assign(`/products/${productTypeId}/${productId}`);
  }
}

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

      const notification = new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        data: payload.data
      });

      notification.onclick = () => {
        openProductFromNotification(payload.data);
        notification.close();
      };
    }
  };
}
