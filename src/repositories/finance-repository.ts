import type {
  FinanceDataSnapshot,
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import type { AppSettings } from "@/repositories/app-settings";
import type {
  BackupPreview,
  RestoredBackupSummary
} from "@/storage/backup/backup-format";

export interface FinanceBackupExport {
  blob: Blob;
  filename: string;
  createdAt: string;
}

export interface FinanceMigrationResult {
  /** Whether any legacy data was migrated into IndexedDB. */
  migrated: boolean;
  /** Human-readable summary for diagnostics. */
  message: string;
}

/**
 * Single data-access contract for Finance Command Center.
 *
 * UI and business logic must depend on this interface only — never on IndexedDB,
 * localStorage, or concrete repository implementations.
 *
 * Storage policy (Phase 2):
 * - All financial data lives in IndexedDB.
 * - User/session state (pinned loan, backup timestamps) lives in IndexedDB.
 * - localStorage may only hold Theme, Install Prompt Dismissed, App Version, Feature Flags.
 */
export interface FinanceRepository {
  // --- Lifecycle ---
  initializeDatabase(): Promise<void>;
  migrateFromLegacyStorage(): Promise<FinanceMigrationResult>;
  clearDatabase(): Promise<void>;

  // --- Profile & cash-flow settings ---
  getProfile(): Promise<UserProfile | null>;
  saveProfile(value: UserProfile): Promise<void>;
  getMoneyBreakdown(): Promise<MoneyBreakdown | null>;
  saveMoneyBreakdown(value: MoneyBreakdown): Promise<void>;

  // --- App preferences (non-financial) ---
  getSettings(): Promise<AppSettings>;
  saveSettings(value: Partial<AppSettings>): Promise<AppSettings>;

  // --- Loans ---
  listLoans(): Promise<Loan[]>;
  listArchivedLoans(): Promise<Loan[]>;
  getLoan(id: string): Promise<Loan | null>;
  saveLoan(value: Loan): Promise<void>;
  softDeleteLoan(id: string): Promise<void>;
  archiveLoan(id: string, archiveReason?: string): Promise<void>;

  // --- Loan payments ---
  listAllLoanPayments(): Promise<LoanPayment[]>;
  listLoanPayments(loanId: string): Promise<LoanPayment[]>;
  saveLoanPayment(value: LoanPayment): Promise<void>;

  // --- Upcoming financial commitments (legacy store: upcomingDues) ---
  listUpcomingDues(): Promise<UpcomingDue[]>;
  saveUpcomingDue(value: UpcomingDue): Promise<void>;
  deleteUpcomingDue(id: string): Promise<void>;

  // --- Backup & restore ---
  exportBackup(): Promise<FinanceBackupExport>;
  inspectBackup(file: File): Promise<BackupPreview>;
  restoreBackup(file: File): Promise<RestoredBackupSummary>;

  // --- Snapshot (internal to backup; exposed for testing/diagnostics) ---
  createDataSnapshot(): Promise<FinanceDataSnapshot>;
  replaceAllData(value: FinanceDataSnapshot): Promise<void>;
}

export type { BackupPreview, RestoredBackupSummary };
