import type {
  NotificationPayload,
  NotificationProvider
} from "@/core/notifications/notification-provider.interface";

export function createBrowserNotificationProvider(): NotificationProvider {
  return {
    isSupported() {
      return typeof window !== "undefined" && "Notification" in window;
    },

    requestPermission() {
      if (!this.isSupported()) {
        return Promise.resolve("denied" as NotificationPermission);
      }

      return Notification.requestPermission();
    },

    async show(payload: NotificationPayload) {
      if (!this.isSupported()) {
        return;
      }

      if (Notification.permission !== "granted") {
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
