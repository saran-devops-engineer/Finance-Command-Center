import type { NotificationDeliveryPayload } from "@/notifications/models";

export interface FinancialNotificationProvider {
  readonly id: string;
  isSupported(): boolean;
  requestPermission(): Promise<NotificationPermission | "unsupported">;
  deliver(payload: NotificationDeliveryPayload): Promise<void>;
}

export interface FinancialNotificationProviderRegistry {
  register(provider: FinancialNotificationProvider): void;
  get(providerId: string): FinancialNotificationProvider | null;
  list(): FinancialNotificationProvider[];
}

export function createProviderRegistry(
  providers: FinancialNotificationProvider[] = []
): FinancialNotificationProviderRegistry {
  const registry = new Map<string, FinancialNotificationProvider>();

  for (const provider of providers) {
    registry.set(provider.id, provider);
  }

  return {
    register(provider) {
      registry.set(provider.id, provider);
    },
    get(providerId) {
      return registry.get(providerId) ?? null;
    },
    list() {
      return [...registry.values()];
    }
  };
}
