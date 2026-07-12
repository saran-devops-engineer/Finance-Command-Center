import type { Chit } from "@/shared/domain/chit";
import type {
  FinanceDataSnapshot,
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import type { AppSettings } from "@/repositories/app-settings";
import type { BackupPreview, RestoredBackupSummary } from "@/storage/backup/backup-format";

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
  clearDatabase(): Promise<void>;

  getProfile(): Promise<UserProfile | null>;
  saveProfile(value: UserProfile): Promise<void>;
  getMoneyBreakdown(): Promise<MoneyBreakdown | null>;
  saveMoneyBreakdown(value: MoneyBreakdown): Promise<void>;

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

  exportBackup(): Promise<FinanceBackupExport>;
  inspectBackup(file: File): Promise<BackupPreview>;
  restoreBackup(file: File): Promise<RestoredBackupSummary>;

  createDataSnapshot(): Promise<FinanceDataSnapshot>;
  replaceAllData(value: FinanceDataSnapshot): Promise<void>;
}

export type { BackupPreview, RestoredBackupSummary };
