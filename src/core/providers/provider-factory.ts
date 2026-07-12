import { createAnalyticsService, createNoOpAnalyticsProvider } from "@/core/analytics";
import { createApiService, createRestApiProvider } from "@/core/api";
import { createBackupService, createJsonBackupProvider } from "@/core/backup";
import {
  createConfigurationService,
  createDefaultConfigurationProvider
} from "@/core/configuration";
import { createConsoleErrorProvider, createErrorService } from "@/core/error";
import {
  createBrowserNotificationProvider,
  createNotificationService
} from "@/core/notifications";
import type { FinanceRepository } from "@/core/repository/finance-repository";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";

export interface ProviderFactoryOptions {
  financeRepository?: FinanceRepository;
}

export function createFinanceRepository(options: ProviderFactoryOptions = {}) {
  return options.financeRepository ?? indexedDbFinanceRepository;
}

export function createProviderBundle(options: ProviderFactoryOptions = {}) {
  const configurationProvider = createDefaultConfigurationProvider();
  const configuration = createConfigurationService(configurationProvider);
  const errorProvider = createConsoleErrorProvider();
  const errorService = createErrorService(errorProvider);
  const analyticsProvider = createNoOpAnalyticsProvider();
  const analytics = createAnalyticsService(analyticsProvider);
  const apiProvider = createRestApiProvider(configuration);
  const api = createApiService(apiProvider, configuration);
  const notificationProvider = createBrowserNotificationProvider();
  const notifications = createNotificationService(notificationProvider, configuration);
  const financeRepository = createFinanceRepository(options);
  const backupProvider = createJsonBackupProvider();
  const backup = createBackupService(backupProvider, financeRepository);

  return {
    configuration,
    errorService,
    analytics,
    api,
    notifications,
    financeRepository,
    backup
  };
}
