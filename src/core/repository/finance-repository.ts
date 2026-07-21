import type { Chit } from "@/shared/domain/chit";
import type {
  FinanceDataSnapshot,
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import type { IncomeProfile } from "@/shared/domain/income";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import type { SchemaMeta } from "@/shared/domain/schema-version";
import type {
  FinancialTimeline,
  FinancialTimelineSettings,
  TimelineActivity,
  TimelineEvent
} from "@/shared/domain/financial-timeline";
import type { AppSettings } from "@/repositories/app-settings";
import type { BackupPreview, RestoredBackupSummary } from "@/storage/backup/backup-format";
import type { SchemaMigrationResult } from "@/storage/migration";

export interface FinanceBackupExport {
  blob: Blob;
  filename: string;
  createdAt: string;
}

export interface FinanceMigrationResult {
  migrated: boolean;
  message: string;
}

/**
 * Single data-access contract for Finance Command Center.
 *
 * UI and business logic must depend on this interface only — never on IndexedDB,
 * localStorage, or concrete repository implementations.
 */
export interface FinanceRepository {
  initializeDatabase(): Promise<void>;
  migrateFromLegacyStorage(): Promise<FinanceMigrationResult>;
  /** Runs V1→V2 domain schema migration. Idempotent. Never deletes V1 data. */
  migrateDataSchema(): Promise<SchemaMigrationResult>;
  clearDatabase(): Promise<void>;

  getProfile(): Promise<UserProfile | null>;
  saveProfile(value: UserProfile): Promise<void>;
  getMoneyBreakdown(): Promise<MoneyBreakdown | null>;
  saveMoneyBreakdown(value: MoneyBreakdown): Promise<void>;

  getIncomeProfile(): Promise<IncomeProfile | null>;
  saveIncomeProfile(value: IncomeProfile): Promise<void>;

  listCommitments(): Promise<CommitmentRecord[]>;
  listCommitmentsNeedingReview(): Promise<CommitmentRecord[]>;
  getCommitment(id: string): Promise<CommitmentRecord | null>;
  saveCommitment(value: CommitmentRecord): Promise<void>;
  deleteCommitment(id: string): Promise<void>;

  getSchemaMeta(): Promise<SchemaMeta | null>;

  getSettings(): Promise<AppSettings>;
  saveSettings(value: Partial<AppSettings>): Promise<AppSettings>;

  listLoans(): Promise<Loan[]>;
  listArchivedLoans(): Promise<Loan[]>;
  getLoan(id: string): Promise<Loan | null>;
  saveLoan(value: Loan): Promise<void>;
  softDeleteLoan(id: string): Promise<void>;
  archiveLoan(id: string, archiveReason?: string): Promise<void>;

  listAllLoanPayments(): Promise<LoanPayment[]>;
  listLoanPayments(loanId: string): Promise<LoanPayment[]>;
  saveLoanPayment(value: LoanPayment): Promise<void>;

  listChits(): Promise<Chit[]>;
  listArchivedChits(): Promise<Chit[]>;
  getChit(id: string): Promise<Chit | null>;
  saveChit(value: Chit): Promise<void>;
  softDeleteChit(id: string): Promise<void>;
  archiveChit(id: string, archiveReason?: string): Promise<void>;

  listUpcomingDues(): Promise<UpcomingDue[]>;
  saveUpcomingDue(value: UpcomingDue): Promise<void>;
  deleteUpcomingDue(id: string): Promise<void>;

  listFinancialTimelines(): Promise<FinancialTimeline[]>;
  getFinancialTimeline(id: string): Promise<FinancialTimeline | null>;
  getFinancialTimelineByProduct(productTypeId: string, productId: string): Promise<FinancialTimeline | null>;
  saveFinancialTimeline(value: FinancialTimeline): Promise<void>;

  listTimelineEvents(timelineId: string): Promise<TimelineEvent[]>;
  saveTimelineEvents(events: TimelineEvent[]): Promise<void>;

  listTimelineActivities(timelineId: string): Promise<TimelineActivity[]>;
  saveTimelineActivities(activities: TimelineActivity[]): Promise<void>;

  getTimelineSettings(): Promise<FinancialTimelineSettings | null>;
  saveTimelineSettings(value: FinancialTimelineSettings): Promise<void>;

  listNotificationQueue(): Promise<import("@/notifications/models").FinancialNotification[]>;
  saveNotificationQueue(items: import("@/notifications/models").FinancialNotification[]): Promise<void>;
  listNotificationHistory(): Promise<import("@/notifications/models").NotificationHistoryEntry[]>;
  saveNotificationHistory(items: import("@/notifications/models").NotificationHistoryEntry[]): Promise<void>;
  getNotificationSettings(): Promise<import("@/notifications/models").FinancialNotificationSettings | null>;
  saveNotificationSettings(value: import("@/notifications/models").FinancialNotificationSettings): Promise<void>;

  exportBackup(): Promise<FinanceBackupExport>;
  inspectBackup(file: File): Promise<BackupPreview>;
  restoreBackup(file: File): Promise<RestoredBackupSummary>;

  createDataSnapshot(): Promise<FinanceDataSnapshot>;
  replaceAllData(value: FinanceDataSnapshot): Promise<void>;
}

export type { BackupPreview, RestoredBackupSummary };
