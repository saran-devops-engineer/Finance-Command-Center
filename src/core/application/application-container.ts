import type { AnalyticsService } from "@/core/analytics";
import type { ApiService } from "@/core/api";
import type { BackupService } from "@/core/backup";
import type { ConfigurationService } from "@/core/configuration";
import type { ErrorService } from "@/core/error";
import type { NotificationService } from "@/core/notifications";
import type { FinanceRepository, FinanceMigrationResult } from "@/core/repository";
import { createProviderBundle } from "@/core/providers/provider-factory";
import { preloadFinanceData } from "@/repositories/finance-preload";

export interface ApplicationServices {
  configuration: ConfigurationService;
  analytics: AnalyticsService;
  api: ApiService;
  backup: BackupService;
  notifications: NotificationService;
  errorService: ErrorService;
  financeRepository: FinanceRepository;
}

let applicationServices: ApplicationServices | null = null;
let bootstrapPromise: Promise<FinanceMigrationResult> | null = null;

export function getApplicationServices(): ApplicationServices {
  if (!applicationServices) {
    applicationServices = createProviderBundle();
  }

  return applicationServices;
}

export function bootstrapApplication(
  services: ApplicationServices = getApplicationServices()
): Promise<FinanceMigrationResult> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await services.analytics.initialize();
      await services.financeRepository.initializeDatabase();
      const migrationResult = await services.financeRepository.migrateFromLegacyStorage();
      await preloadFinanceData(services.financeRepository);
      return migrationResult;
    })();
  }

  return bootstrapPromise;
}

export function resetApplicationServicesForTests() {
  applicationServices = null;
  bootstrapPromise = null;
}
