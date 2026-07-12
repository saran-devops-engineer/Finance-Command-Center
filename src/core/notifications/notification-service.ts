import type { ConfigurationService } from "@/core/configuration/configuration-service";
import type {
  NotificationPayload,
  NotificationProvider,
  ScheduledNotificationRequest
} from "@/core/notifications/notification-provider.interface";

export class NotificationService {
  constructor(
    private readonly provider: NotificationProvider,
    private readonly configuration: ConfigurationService
  ) {}

  isSupported() {
    return this.provider.isSupported();
  }

  isEnabled() {
    return this.configuration.isNotificationsEnabled();
  }

  requestPermission() {
    if (!this.isEnabled()) {
      return Promise.resolve("denied" as NotificationPermission);
    }

    return this.provider.requestPermission();
  }

  show(payload: NotificationPayload) {
    if (!this.isEnabled()) {
      return Promise.resolve();
    }

    return this.provider.show(payload);
  }

  schedule(_request: ScheduledNotificationRequest) {
    return Promise.reject(
      new Error("Scheduled notifications are not implemented in this version.")
    );
  }

  cancel(_notificationId: string) {
    return Promise.resolve();
  }
}

export function createNotificationService(
  provider: NotificationProvider,
  configuration: ConfigurationService
) {
  return new NotificationService(provider, configuration);
}
