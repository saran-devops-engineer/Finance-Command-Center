import type { AnalyticsService } from "@/core/analytics";
import { AppEvent, trackApplicationEvent } from "@/core/analytics";
import type { ApiService } from "@/core/api";
import type { BackupService } from "@/core/backup";
import type { ConfigurationService } from "@/core/configuration";
import type { ErrorService } from "@/core/error";
import type { NotificationService } from "@/core/notifications";
import type { FinanceRepository, FinanceMigrationResult } from "@/core/repository";
import { createProviderBundle } from "@/core/providers/provider-factory";
import { identifyAnalyticsUser } from "@/core/analytics/analytics-identity";
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

      try {
        const existingMeta = await services.financeRepository.getSchemaMeta();
        const needsSchemaMigration = !existingMeta || existingMeta.schemaVersion < 2;

        if (needsSchemaMigration) {
          trackApplicationEvent(AppEvent.MIGRATION_STARTED, {
            from_schema_version: existingMeta?.schemaVersion ?? 1,
            to_schema_version: 2
          });
          const schemaResult = await services.financeRepository.migrateDataSchema();
          if (schemaResult.migrated) {
            trackApplicationEvent(AppEvent.MIGRATION_COMPLETED, {
              from_schema_version: schemaResult.fromVersion,
              to_schema_version: schemaResult.toVersion,
              commitments_created: schemaResult.commitmentsCreated,
              needs_review_count: schemaResult.needsReviewCount
            });
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Schema migration failed.";
        trackApplicationEvent(AppEvent.MIGRATION_FAILED, {
          message,
          from_schema_version: 1
        });
        services.errorService.report(error instanceof Error ? error : new Error(message));
      }

      await preloadFinanceData(services.financeRepository);

      const profile = await services.financeRepository.getProfile();
      if (profile?.onboardingCompleted) {
        identifyAnalyticsUser(services.analytics, profile.displayName);
      }

      return migrationResult;
    })();
  }

  return bootstrapPromise;
}

export function resetApplicationServicesForTests() {
  applicationServices = null;
  bootstrapPromise = null;
}
