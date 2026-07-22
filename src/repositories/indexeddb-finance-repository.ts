import type { FinanceRepository } from "@/core/repository/finance-repository";
import {
  DEFAULT_DEVICE_PREFERENCES,
  DEFAULT_USER_APP_STATE,
  DEVICE_PREFERENCES_STORAGE_KEY,
  USER_APP_STATE_ID,
  type AppSettings,
  type DevicePreferences,
  type UserAppState
} from "@/repositories/app-settings";
import { runLegacyStorageMigration } from "@/repositories/legacy-migration";
import {
  getFinanceBootstrapCache,
  invalidateFinanceBootstrapCache,
  isFinanceCacheWarm
} from "@/repositories/finance-data-cache";
import { preloadFinanceData } from "@/repositories/finance-preload";
import {
  shouldClearPinnedLoan,
  verifyRestoredSnapshot
} from "@/repositories/restore-verification";
import type {
  FinanceDataSnapshot,
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import type { Chit } from "@/shared/domain/chit";
import type { IncomeProfile } from "@/shared/domain/income";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import { CommitmentReviewStatus } from "@/shared/domain/commitment-record";
import type {
  FinancialTimeline,
  FinancialTimelineSettings,
  TimelineActivity,
  TimelineEvent
} from "@/shared/domain/financial-timeline";
import { TIMELINE_SETTINGS_ID } from "@/shared/domain/financial-timeline";
import type {
  FinancialNotification,
  FinancialNotificationSettings,
  NotificationHistoryEntry
} from "@/notifications/models";
import { NOTIFICATION_SETTINGS_ID } from "@/notifications/models";
import {
  CURRENT_DATA_SCHEMA_VERSION,
  DataSchemaVersion,
  SCHEMA_META_ID,
  type SchemaMeta
} from "@/shared/domain/schema-version";
import {
  createJsonBackup,
  inspectJsonBackup,
  restoreJsonBackup
} from "@/storage/backup/backup-service";
import { getFinanceDatabase } from "@/storage/indexeddb/database";
import { migrateSchemaV1ToV2, migrateSchemaV2ToV3, migrateSchemaV3ToV4 } from "@/storage/migration";
import { filterActiveChits, filterArchivedChits, normalizeChit } from "@/lib/chit-status";
import { filterActiveLoans, filterArchivedLoans, normalizeLoan } from "@/lib/loan-status";

const MONEY_BREAKDOWN_ID = "current-month";
const PROFILE_ID = "primary";
const INCOME_PROFILE_ID = "primary";

const ALL_STORES = [
  "profile",
  "moneyBreakdown",
  "loans",
  "loanPayments",
  "upcomingDues",
  "appState",
  "chits",
  "incomeProfile",
  "commitments",
  "schemaMeta",
  "financialTimelines",
  "timelineEvents",
  "timelineActivities",
  "timelineSettings",
  "notificationQueue",
  "notificationHistory",
  "notificationSettings"
] as const;

/** @internal Concrete IndexedDB adapter — import `financeRepository` from `@/repositories` instead. */
export const indexedDbFinanceRepository: FinanceRepository = {
  async initializeDatabase() {
    await getFinanceDatabase();
  },

  async migrateFromLegacyStorage() {
    await getFinanceDatabase();

    return runLegacyStorageMigration({
      readUserAppState,
      writeUserAppState,
      readDevicePreferences,
      writeDevicePreferences,
      hasIndexedDbFinancialData,
      replaceAllData: (snapshot) => indexedDbFinanceRepository.replaceAllData(snapshot),
      createDataSnapshot: () => indexedDbFinanceRepository.createDataSnapshot()
    });
  },

  async migrateDataSchema() {
    const [
      moneyBreakdown,
      existingIncomeProfile,
      existingCommitments,
      existingSchemaMeta,
      loans,
      loanPayments,
      chits,
      existingTimelines,
      existingTimelineSettings
    ] = await Promise.all([
      indexedDbFinanceRepository.getMoneyBreakdown(),
      indexedDbFinanceRepository.getIncomeProfile(),
      indexedDbFinanceRepository.listCommitments(),
      indexedDbFinanceRepository.getSchemaMeta(),
      indexedDbFinanceRepository.listLoans(),
      indexedDbFinanceRepository.listAllLoanPayments(),
      indexedDbFinanceRepository.listChits(),
      indexedDbFinanceRepository.listFinancialTimelines(),
      indexedDbFinanceRepository.getTimelineSettings()
    ]);

    const v2Result = migrateSchemaV1ToV2({
      moneyBreakdown,
      existingIncomeProfile,
      existingCommitments,
      existingSchemaMeta
    });

    if (v2Result.migrated) {
      invalidateFinanceBootstrapCache();
      const database = await getFinanceDatabase();
      const transaction = database.transaction(
        ["incomeProfile", "commitments", "schemaMeta"],
        "readwrite"
      );

      if (v2Result.incomeProfile) {
        await transaction.objectStore("incomeProfile").put({
          ...v2Result.incomeProfile,
          id: INCOME_PROFILE_ID
        });
      }

      await transaction.objectStore("commitments").clear();
      await Promise.all(
        v2Result.commitments.map((commitment) =>
          transaction.objectStore("commitments").put(commitment)
        )
      );
      await transaction.objectStore("schemaMeta").put(v2Result.schemaMeta);
      await transaction.done;
    }

    const v3Result = migrateSchemaV2ToV3({
      loans: [...loans, ...(await indexedDbFinanceRepository.listArchivedLoans())],
      loanPayments,
      chits: [...chits, ...(await indexedDbFinanceRepository.listArchivedChits())],
      existingTimelines,
      existingSchemaMeta: v2Result.migrated ? v2Result.schemaMeta : existingSchemaMeta,
      existingSettings: existingTimelineSettings
    });

    if (v3Result.migrated) {
      invalidateFinanceBootstrapCache();
      const database = await getFinanceDatabase();
      const transaction = database.transaction(
        ["financialTimelines", "timelineEvents", "timelineActivities", "timelineSettings", "schemaMeta"],
        "readwrite"
      );

      await Promise.all(
        v3Result.timelines.map((timeline) =>
          transaction.objectStore("financialTimelines").put(timeline)
        )
      );
      await Promise.all(
        v3Result.events.map((event) => transaction.objectStore("timelineEvents").put(event))
      );
      await Promise.all(
        v3Result.activities.map((activity) =>
          transaction.objectStore("timelineActivities").put(activity)
        )
      );
      await transaction.objectStore("timelineSettings").put(v3Result.settings);
      await transaction.objectStore("schemaMeta").put(v3Result.schemaMeta);
      await transaction.done;
    }

    const v4Result = migrateSchemaV3ToV4({
      existingSchemaMeta: v3Result.migrated
        ? v3Result.schemaMeta
        : v2Result.migrated
          ? v2Result.schemaMeta
          : existingSchemaMeta,
      existingSettings: await indexedDbFinanceRepository.getNotificationSettings()
    });

    if (v4Result.migrated) {
      invalidateFinanceBootstrapCache();
      const database = await getFinanceDatabase();
      const transaction = database.transaction(
        ["notificationSettings", "schemaMeta"],
        "readwrite"
      );
      await transaction.objectStore("notificationSettings").put(v4Result.settings);
      await transaction.objectStore("schemaMeta").put(v4Result.schemaMeta);
      await transaction.done;
    }

    if (v4Result.migrated) {
      return {
        migrated: true,
        fromVersion: v4Result.fromVersion,
        toVersion: DataSchemaVersion.V4,
        incomeProfile: existingIncomeProfile,
        commitments: existingCommitments,
        schemaMeta: v4Result.schemaMeta,
        commitmentsCreated: 0,
        needsReviewCount: v4Result.schemaMeta.needsReviewCount,
        notes: v4Result.notes,
        message: v4Result.message
      };
    }

    if (v3Result.migrated) {
      return {
        migrated: true,
        fromVersion: v3Result.fromVersion,
        toVersion: DataSchemaVersion.V3,
        incomeProfile: existingIncomeProfile,
        commitments: existingCommitments,
        schemaMeta: v3Result.schemaMeta,
        commitmentsCreated: 0,
        needsReviewCount: v3Result.schemaMeta.needsReviewCount,
        notes: v3Result.notes,
        message: v3Result.message
      };
    }

    if (v2Result.migrated) {
      return v2Result;
    }

    return v2Result;
  },

  async clearDatabase() {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const transaction = database.transaction([...ALL_STORES], "readwrite");

    await Promise.all(ALL_STORES.map((store) => transaction.objectStore(store).clear()));
    await transaction.done;
  },

  async getSettings() {
    if (isFinanceCacheWarm()) {
      return getFinanceBootstrapCache()!.settings;
    }

    const [userState, devicePrefs] = await Promise.all([
      readUserAppState(),
      Promise.resolve(readDevicePreferences())
    ]);

    return mergeAppSettings(userState, devicePrefs);
  },

  async saveSettings(value) {
    invalidateFinanceBootstrapCache();
    const current = await indexedDbFinanceRepository.getSettings();
    const existingUserState = await readUserAppState();
    const next = { ...current, ...value };

    await writeUserAppState({
      id: USER_APP_STATE_ID,
      pinnedLoanId: next.pinnedLoanId,
      lastBackupAt: next.lastBackupAt,
      lastRestoreAt: next.lastRestoreAt,
      legacyFinancialMigrationCompletedAt:
        existingUserState.legacyFinancialMigrationCompletedAt
    });

    writeDevicePreferences({
      theme: next.theme,
      installPromptDismissedAt: next.installPromptDismissedAt,
      appVersion: next.appVersion,
      featureFlags: next.featureFlags
    });

    return next;
  },

  async exportBackup() {
    const backup = await createJsonBackup({ repository: indexedDbFinanceRepository });
    return {
      blob: backup.blob,
      filename: backup.filename,
      createdAt: backup.backup.createdAt
    };
  },

  async inspectBackup(file) {
    return inspectJsonBackup(file);
  },

  async restoreBackup(file) {
    const result = await restoreJsonBackup({ file, repository: indexedDbFinanceRepository });
    await indexedDbFinanceRepository.migrateDataSchema();

    const verified = await indexedDbFinanceRepository.createDataSnapshot();
    verifyRestoredSnapshot(result.snapshot, verified);

    const settings = await indexedDbFinanceRepository.getSettings();
    if (shouldClearPinnedLoan(settings.pinnedLoanId, verified.loans)) {
      await indexedDbFinanceRepository.saveSettings({ pinnedLoanId: null });
    }

    invalidateFinanceBootstrapCache();
    await preloadFinanceData(indexedDbFinanceRepository);

    return result;
  },

  async getProfile() {
    if (isFinanceCacheWarm()) {
      return getFinanceBootstrapCache()!.profile;
    }

    const database = await getFinanceDatabase();
    const profile = await database.get("profile", PROFILE_ID);
    return profile ?? null;
  },

  async saveProfile(value: UserProfile) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("profile", value);
  },

  async getMoneyBreakdown() {
    if (isFinanceCacheWarm()) {
      return getFinanceBootstrapCache()!.moneyBreakdown;
    }

    const database = await getFinanceDatabase();
    const record = await database.get("moneyBreakdown", MONEY_BREAKDOWN_ID);

    if (!record) {
      return null;
    }

    return {
      monthlyIncome: record.monthlyIncome,
      mandatoryExpenses: record.mandatoryExpenses,
      emis: record.emis,
      loanPayments: record.loanPayments,
      insurance: record.insurance,
      rent: record.rent,
      utilityBills: record.utilityBills,
      fixedCommitments: record.fixedCommitments,
      emergencyBuffer: record.emergencyBuffer
    };
  },

  async saveMoneyBreakdown(value: MoneyBreakdown) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("moneyBreakdown", {
      ...value,
      id: MONEY_BREAKDOWN_ID,
      updatedAt: new Date().toISOString()
    });
  },

  async getIncomeProfile() {
    const database = await getFinanceDatabase();
    const record = await database.get("incomeProfile", INCOME_PROFILE_ID);
    if (!record) {
      return null;
    }

    const { id: _id, ...profile } = record;
    return profile;
  },

  async saveIncomeProfile(value: IncomeProfile) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("incomeProfile", { ...value, id: INCOME_PROFILE_ID });
  },

  async listCommitments() {
    const database = await getFinanceDatabase();
    return database.getAll("commitments");
  },

  async listCommitmentsNeedingReview() {
    const database = await getFinanceDatabase();
    return database.getAllFromIndex(
      "commitments",
      "by-review-status",
      CommitmentReviewStatus.NEEDS_REVIEW
    );
  },

  async getCommitment(id: string) {
    const database = await getFinanceDatabase();
    return (await database.get("commitments", id)) ?? null;
  },

  async saveCommitment(value: CommitmentRecord) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("commitments", value);
  },

  async deleteCommitment(id: string) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.delete("commitments", id);
  },

  async getSchemaMeta() {
    const database = await getFinanceDatabase();
    return (await database.get("schemaMeta", SCHEMA_META_ID)) ?? null;
  },

  async listLoans() {
    if (isFinanceCacheWarm()) {
      return getFinanceBootstrapCache()!.loans;
    }

    const database = await getFinanceDatabase();
    const loans = await database.getAll("loans");
    return filterActiveLoans(loans.map(normalizeLoan));
  },

  async listArchivedLoans() {
    const database = await getFinanceDatabase();
    const loans = await database.getAll("loans");
    return filterArchivedLoans(loans.map(normalizeLoan));
  },

  async getLoan(id: string) {
    const database = await getFinanceDatabase();
    const loan = await database.get("loans", id);
    return loan ? normalizeLoan(loan) : null;
  },

  async saveLoan(value: Loan) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("loans", normalizeLoan(value));
  },

  async softDeleteLoan(id: string) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const loan = await database.get("loans", id);

    if (!loan) {
      return;
    }

    await database.put(
      "loans",
      normalizeLoan({
        ...loan,
        status: "deleted",
        deletedAt: new Date().toISOString()
      })
    );
  },

  async archiveLoan(id: string, archiveReason?: string) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const loan = await database.get("loans", id);

    if (!loan) {
      return;
    }

    await database.put(
      "loans",
      normalizeLoan({
        ...loan,
        status: "archived",
        archivedAt: new Date().toISOString(),
        archiveReason: archiveReason?.trim() || undefined
      })
    );
  },

  async listChits() {
    const database = await getFinanceDatabase();
    const chits = await database.getAll("chits");
    return filterActiveChits(chits.map(normalizeChit));
  },

  async listArchivedChits() {
    const database = await getFinanceDatabase();
    const chits = await database.getAll("chits");
    return filterArchivedChits(chits.map(normalizeChit));
  },

  async getChit(id: string) {
    const database = await getFinanceDatabase();
    const chit = await database.get("chits", id);
    return chit ? normalizeChit(chit) : null;
  },

  async saveChit(value: Chit) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("chits", normalizeChit(value));
  },

  async softDeleteChit(id: string) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const chit = await database.get("chits", id);

    if (!chit) {
      return;
    }

    await database.put(
      "chits",
      normalizeChit({
        ...chit,
        status: "deleted",
        deletedAt: new Date().toISOString()
      })
    );
  },

  async archiveChit(id: string, archiveReason?: string) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const chit = await database.get("chits", id);

    if (!chit) {
      return;
    }

    await database.put(
      "chits",
      normalizeChit({
        ...chit,
        status: "archived",
        archivedAt: new Date().toISOString(),
        archiveReason: archiveReason?.trim() || undefined
      })
    );
  },

  async listAllLoanPayments() {
    const database = await getFinanceDatabase();
    return database.getAll("loanPayments");
  },

  async listLoanPayments(loanId: string) {
    const database = await getFinanceDatabase();
    return database.getAllFromIndex("loanPayments", "by-loan-id", loanId);
  },

  async saveLoanPayment(value: LoanPayment) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("loanPayments", value);
  },

  async listUpcomingDues() {
    if (isFinanceCacheWarm()) {
      return getFinanceBootstrapCache()!.upcomingDues;
    }

    const database = await getFinanceDatabase();
    return database.getAllFromIndex("upcomingDues", "by-due-date");
  },

  async saveUpcomingDue(value: UpcomingDue) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("upcomingDues", value);
  },

  async deleteUpcomingDue(id: string) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.delete("upcomingDues", id);
  },

  async listFinancialTimelines() {
    const database = await getFinanceDatabase();
    return database.getAll("financialTimelines");
  },

  async getFinancialTimeline(id: string) {
    const database = await getFinanceDatabase();
    return (await database.get("financialTimelines", id)) ?? null;
  },

  async getFinancialTimelineByProduct(productTypeId: string, productId: string) {
    const database = await getFinanceDatabase();
    const timelines = await database.getAllFromIndex("financialTimelines", "by-product-id", productId);
    return timelines.find((timeline) => timeline.productTypeId === productTypeId) ?? null;
  },

  async saveFinancialTimeline(value: FinancialTimeline) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("financialTimelines", value);
  },

  async deleteFinancialTimelineCascade(timelineId: string) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const events = await database.getAllFromIndex("timelineEvents", "by-timeline-id", timelineId);
    const activities = await database.getAllFromIndex("timelineActivities", "by-timeline-id", timelineId);
    const transaction = database.transaction(
      ["financialTimelines", "timelineEvents", "timelineActivities"],
      "readwrite"
    );

    await transaction.objectStore("financialTimelines").delete(timelineId);
    await Promise.all(events.map((event) => transaction.objectStore("timelineEvents").delete(event.id)));
    await Promise.all(
      activities.map((activity) => transaction.objectStore("timelineActivities").delete(activity.id))
    );
    await transaction.done;
  },

  async listTimelineEvents(timelineId: string) {
    const database = await getFinanceDatabase();
    return database.getAllFromIndex("timelineEvents", "by-timeline-id", timelineId);
  },

  async saveTimelineEvents(events: TimelineEvent[]) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const transaction = database.transaction(["timelineEvents"], "readwrite");
    await Promise.all(events.map((event) => transaction.objectStore("timelineEvents").put(event)));
    await transaction.done;
  },

  async listTimelineActivities(timelineId: string) {
    const database = await getFinanceDatabase();
    return database.getAllFromIndex("timelineActivities", "by-timeline-id", timelineId);
  },

  async saveTimelineActivities(activities: TimelineActivity[]) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const transaction = database.transaction(["timelineActivities"], "readwrite");
    await Promise.all(
      activities.map((activity) => transaction.objectStore("timelineActivities").put(activity))
    );
    await transaction.done;
  },

  async getTimelineSettings() {
    const database = await getFinanceDatabase();
    return (await database.get("timelineSettings", TIMELINE_SETTINGS_ID)) ?? null;
  },

  async saveTimelineSettings(value: FinancialTimelineSettings) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("timelineSettings", value);
  },

  async listNotificationQueue() {
    const database = await getFinanceDatabase();
    return database.getAll("notificationQueue");
  },

  async saveNotificationQueue(items: FinancialNotification[]) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const transaction = database.transaction(["notificationQueue"], "readwrite");
    await Promise.all(items.map((item) => transaction.objectStore("notificationQueue").put(item)));
    await transaction.done;
  },

  async listNotificationHistory() {
    const database = await getFinanceDatabase();
    return database.getAll("notificationHistory");
  },

  async saveNotificationHistory(items: NotificationHistoryEntry[]) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const transaction = database.transaction(["notificationHistory"], "readwrite");
    await Promise.all(items.map((item) => transaction.objectStore("notificationHistory").put(item)));
    await transaction.done;
  },

  async getNotificationSettings() {
    const database = await getFinanceDatabase();
    return (await database.get("notificationSettings", NOTIFICATION_SETTINGS_ID)) ?? null;
  },

  async saveNotificationSettings(value: FinancialNotificationSettings) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("notificationSettings", value);
  },

  async createDataSnapshot() {
    const database = await getFinanceDatabase();
    const [
      profile,
      moneyRecord,
      loans,
      loanPayments,
      upcomingDues,
      chits,
      incomeRecord,
      commitments,
      schemaMeta,
      financialTimelines,
      timelineEvents,
      timelineActivities,
      timelineSettings,
      notificationQueue,
      notificationHistory,
      notificationSettings
    ] = await Promise.all([
      database.get("profile", PROFILE_ID),
      database.get("moneyBreakdown", MONEY_BREAKDOWN_ID),
      database.getAll("loans"),
      database.getAll("loanPayments"),
      database.getAllFromIndex("upcomingDues", "by-due-date"),
      database.getAll("chits"),
      database.get("incomeProfile", INCOME_PROFILE_ID),
      database.getAll("commitments"),
      database.get("schemaMeta", SCHEMA_META_ID),
      database.getAll("financialTimelines"),
      database.getAll("timelineEvents"),
      database.getAll("timelineActivities"),
      database.get("timelineSettings", TIMELINE_SETTINGS_ID),
      database.getAll("notificationQueue"),
      database.getAll("notificationHistory"),
      database.get("notificationSettings", NOTIFICATION_SETTINGS_ID)
    ]);
    const moneyBreakdown = moneyRecord
      ? {
          monthlyIncome: moneyRecord.monthlyIncome,
          mandatoryExpenses: moneyRecord.mandatoryExpenses,
          emis: moneyRecord.emis,
          loanPayments: moneyRecord.loanPayments,
          insurance: moneyRecord.insurance,
          rent: moneyRecord.rent,
          utilityBills: moneyRecord.utilityBills,
          fixedCommitments: moneyRecord.fixedCommitments,
          emergencyBuffer: moneyRecord.emergencyBuffer
        }
      : null;

    const incomeProfile = incomeRecord
      ? (({ id: _id, ...rest }: IncomeProfile & { id: string }) => rest)(incomeRecord)
      : null;

    return {
      schemaVersion: schemaMeta?.schemaVersion ?? CURRENT_DATA_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      profile: profile ?? null,
      moneyBreakdown,
      loans,
      loanPayments,
      upcomingDues,
      chits: chits.map(normalizeChit),
      incomeProfile,
      commitments,
      financialTimelines,
      timelineEvents,
      timelineActivities,
      timelineSettings: timelineSettings ?? undefined,
      notificationQueue,
      notificationHistory,
      notificationSettings: notificationSettings ?? undefined
    };
  },

  async replaceAllData(value: FinanceDataSnapshot) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const transaction = database.transaction(
      [
        "profile",
        "moneyBreakdown",
        "loans",
        "loanPayments",
        "upcomingDues",
        "chits",
        "incomeProfile",
        "commitments",
        "schemaMeta",
        "financialTimelines",
        "timelineEvents",
        "timelineActivities",
        "timelineSettings",
        "notificationQueue",
        "notificationHistory",
        "notificationSettings"
      ],
      "readwrite"
    );

    await Promise.all([
      transaction.objectStore("profile").clear(),
      transaction.objectStore("moneyBreakdown").clear(),
      transaction.objectStore("loans").clear(),
      transaction.objectStore("loanPayments").clear(),
      transaction.objectStore("upcomingDues").clear(),
      transaction.objectStore("chits").clear(),
      transaction.objectStore("incomeProfile").clear(),
      transaction.objectStore("commitments").clear(),
      transaction.objectStore("schemaMeta").clear(),
      transaction.objectStore("financialTimelines").clear(),
      transaction.objectStore("timelineEvents").clear(),
      transaction.objectStore("timelineActivities").clear(),
      transaction.objectStore("timelineSettings").clear(),
      transaction.objectStore("notificationQueue").clear(),
      transaction.objectStore("notificationHistory").clear(),
      transaction.objectStore("notificationSettings").clear()
    ]);

    if (value.profile) {
      await transaction.objectStore("profile").put(value.profile);
    }

    if (value.moneyBreakdown) {
      await transaction.objectStore("moneyBreakdown").put({
        ...value.moneyBreakdown,
        id: MONEY_BREAKDOWN_ID,
        updatedAt: new Date().toISOString()
      });
    }

    if (value.incomeProfile) {
      await transaction.objectStore("incomeProfile").put({
        ...value.incomeProfile,
        id: INCOME_PROFILE_ID
      });
    }

    await Promise.all([
      ...value.loans.map((loan) =>
        transaction.objectStore("loans").put(normalizeLoan(loan))
      ),
      ...value.loanPayments.map((payment) =>
        transaction.objectStore("loanPayments").put(payment)
      ),
      ...value.upcomingDues.map((due) => transaction.objectStore("upcomingDues").put(due)),
      ...(value.chits ?? []).map((chit) => transaction.objectStore("chits").put(normalizeChit(chit))),
      ...(value.commitments ?? []).map((commitment) =>
        transaction.objectStore("commitments").put(commitment)
      ),
      ...(value.financialTimelines ?? []).map((timeline) =>
        transaction.objectStore("financialTimelines").put(timeline)
      ),
      ...(value.timelineEvents ?? []).map((event) =>
        transaction.objectStore("timelineEvents").put(event)
      ),
      ...(value.timelineActivities ?? []).map((activity) =>
        transaction.objectStore("timelineActivities").put(activity)
      ),
      ...(value.notificationQueue ?? []).map((notification) =>
        transaction.objectStore("notificationQueue").put(notification)
      ),
      ...(value.notificationHistory ?? []).map((entry) =>
        transaction.objectStore("notificationHistory").put(entry)
      )
    ]);

    const schemaVersion = value.schemaVersion ?? 1;
    if (
      schemaVersion >= 2 ||
      value.incomeProfile ||
      (value.commitments?.length ?? 0) > 0 ||
      (value.financialTimelines?.length ?? 0) > 0 ||
      (value.notificationQueue?.length ?? 0) > 0
    ) {
      const meta: SchemaMeta = {
        id: SCHEMA_META_ID,
        schemaVersion:
          schemaVersion >= 4 || (value.notificationQueue?.length ?? 0) > 0
            ? DataSchemaVersion.V4
            : schemaVersion >= 3 || (value.financialTimelines?.length ?? 0) > 0
              ? DataSchemaVersion.V3
              : DataSchemaVersion.V2,
        migratedAt: new Date().toISOString(),
        migrationNotes: ["Restored from backup."],
        needsReviewCount: (value.commitments ?? []).filter(
          (item) => item.reviewStatus === CommitmentReviewStatus.NEEDS_REVIEW
        ).length
      };
      await transaction.objectStore("schemaMeta").put(meta);
    }

    if (value.timelineSettings) {
      await transaction.objectStore("timelineSettings").put(value.timelineSettings);
    }

    if (value.notificationSettings) {
      await transaction.objectStore("notificationSettings").put(value.notificationSettings);
    }

    await transaction.done;
  }
};

function mergeAppSettings(userState: UserAppState, devicePrefs: DevicePreferences): AppSettings {
  return {
    pinnedLoanId: userState.pinnedLoanId,
    lastBackupAt: userState.lastBackupAt,
    lastRestoreAt: userState.lastRestoreAt,
    theme: devicePrefs.theme,
    installPromptDismissedAt: devicePrefs.installPromptDismissedAt,
    appVersion: devicePrefs.appVersion,
    featureFlags: devicePrefs.featureFlags
  };
}

async function readUserAppState(): Promise<UserAppState> {
  const database = await getFinanceDatabase();
  const record = await database.get("appState", USER_APP_STATE_ID);

  if (!record) {
    return { ...DEFAULT_USER_APP_STATE };
  }

  return {
    id: USER_APP_STATE_ID,
    pinnedLoanId: record.pinnedLoanId ?? null,
    lastBackupAt: record.lastBackupAt ?? null,
    lastRestoreAt: record.lastRestoreAt ?? null,
    legacyFinancialMigrationCompletedAt: record.legacyFinancialMigrationCompletedAt ?? null
  };
}

async function writeUserAppState(state: UserAppState) {
  const database = await getFinanceDatabase();
  await database.put("appState", {
    id: USER_APP_STATE_ID,
    pinnedLoanId: state.pinnedLoanId,
    lastBackupAt: state.lastBackupAt,
    lastRestoreAt: state.lastRestoreAt,
    legacyFinancialMigrationCompletedAt: state.legacyFinancialMigrationCompletedAt
  });
}

async function hasIndexedDbFinancialData(): Promise<boolean> {
  const database = await getFinanceDatabase();
  const [profile, money, loans, chits] = await Promise.all([
    database.get("profile", PROFILE_ID),
    database.get("moneyBreakdown", MONEY_BREAKDOWN_ID),
    database.getAll("loans"),
    database.getAll("chits")
  ]);

  return Boolean(profile) || Boolean(money) || loans.length > 0 || chits.length > 0;
}

function readDevicePreferences(): DevicePreferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_DEVICE_PREFERENCES, featureFlags: {} };
  }

  const raw = localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY);

  if (!raw) {
    return { ...DEFAULT_DEVICE_PREFERENCES, featureFlags: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DevicePreferences>;
    return {
      theme: parsed.theme ?? DEFAULT_DEVICE_PREFERENCES.theme,
      installPromptDismissedAt: parsed.installPromptDismissedAt ?? null,
      appVersion: parsed.appVersion ?? null,
      featureFlags: parsed.featureFlags ?? {}
    };
  } catch {
    return { ...DEFAULT_DEVICE_PREFERENCES, featureFlags: {} };
  }
}

function writeDevicePreferences(prefs: DevicePreferences) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: DevicePreferences = {
    theme: prefs.theme,
    installPromptDismissedAt: prefs.installPromptDismissedAt,
    appVersion: prefs.appVersion,
    featureFlags: prefs.featureFlags
  };

  localStorage.setItem(DEVICE_PREFERENCES_STORAGE_KEY, JSON.stringify(payload));
}
