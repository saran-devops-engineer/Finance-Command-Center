export const NOTIFICATION_TEST_PREFIX = "fcc-ntest-";

export const NOTIFICATION_TEST_SESSION_KEYS = {
  simulatedTime: "fcc:notification-test:simulated-time",
  offline: "fcc:notification-test:offline",
  unsupported: "fcc:notification-test:unsupported",
  lastNotificationTime: "fcc:notification-test:last-notification-time",
  lastDeliveryTime: "fcc:notification-test:last-delivery-time",
  lastError: "fcc:notification-test:last-error"
} as const;

export function isNotificationTestId(id: string): boolean {
  return id.startsWith(NOTIFICATION_TEST_PREFIX);
}

export function createNotificationTestId(suffix: string): string {
  return `${NOTIFICATION_TEST_PREFIX}${suffix}`;
}
