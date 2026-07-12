export {
  bootstrapApplication,
  getApplicationServices,
  resetApplicationServicesForTests,
  type ApplicationServices
} from "@/core/application/application-container";

export type {
  FinanceRepository,
  FinanceBackupExport,
  FinanceMigrationResult
} from "@/core/repository/finance-repository";

export {
  AnalyticsService,
  createAnalyticsService,
  createNoOpAnalyticsProvider,
  type AnalyticsProvider
} from "@/core/analytics";

export {
  ApiService,
  ApiEndpoints,
  createApiService,
  createRestApiProvider,
  type ApiProvider
} from "@/core/api";

export {
  BackupService,
  createBackupService,
  createJsonBackupProvider,
  type BackupProvider
} from "@/core/backup";

export {
  ConfigurationService,
  createConfigurationService,
  createDefaultConfigurationProvider,
  type AppConfiguration,
  type AppSettings,
  type ConfigurationProvider
} from "@/core/configuration";

export {
  NotificationService,
  createNotificationService,
  createBrowserNotificationProvider,
  type NotificationProvider
} from "@/core/notifications";

export {
  ErrorService,
  createErrorService,
  createConsoleErrorProvider,
  type ErrorProvider
} from "@/core/error";

export {
  AppEvent,
  trackAppEvent,
  createAppEvent,
  FINANCE_DATA_UPDATED_EVENT,
  notifyFinanceDataRestored,
  notifyFinanceDataUpdated,
  subscribeFinanceDataUpdated,
  type AppEventName,
  type FinanceDataScope
} from "@/core/events";

export { createFinanceRepository, createProviderBundle } from "@/core/providers";

export {
  ALLOWED_LOCAL_STORAGE_KEYS,
  APPLICATION_SERVICE_KEYS,
  CORE_ARCHITECTURE_VERSION
} from "@/core/shared";
