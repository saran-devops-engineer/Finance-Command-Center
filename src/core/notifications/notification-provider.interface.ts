export interface NotificationPayload {
  title: string;
  body?: string;
  tag?: string;
  data?: Record<string, string | number | boolean | null>;
}

export interface NotificationProvider {
  isSupported(): boolean;
  requestPermission(): Promise<NotificationPermission>;
  show(payload: NotificationPayload): Promise<void>;
}

export interface ScheduledNotificationRequest extends NotificationPayload {
  scheduledAt: string;
}

export interface NotificationScheduler {
  schedule(request: ScheduledNotificationRequest): Promise<string>;
  cancel(notificationId: string): Promise<void>;
}
