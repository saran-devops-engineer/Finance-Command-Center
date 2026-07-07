import type {
  FinanceDataSnapshot,
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";

export interface FinanceRepository {
  getProfile(): Promise<UserProfile | null>;
  saveProfile(value: UserProfile): Promise<void>;
  getMoneyBreakdown(): Promise<MoneyBreakdown | null>;
  saveMoneyBreakdown(value: MoneyBreakdown): Promise<void>;
  listLoans(): Promise<Loan[]>;
  listArchivedLoans(): Promise<Loan[]>;
  getLoan(id: string): Promise<Loan | null>;
  saveLoan(value: Loan): Promise<void>;
  softDeleteLoan(id: string): Promise<void>;
  archiveLoan(id: string, archiveReason?: string): Promise<void>;
  listAllLoanPayments(): Promise<LoanPayment[]>;
  listLoanPayments(loanId: string): Promise<LoanPayment[]>;
  saveLoanPayment(value: LoanPayment): Promise<void>;
  listUpcomingDues(): Promise<UpcomingDue[]>;
  saveUpcomingDue(value: UpcomingDue): Promise<void>;
  deleteUpcomingDue(id: string): Promise<void>;
  createDataSnapshot(): Promise<FinanceDataSnapshot>;
  replaceAllData(value: FinanceDataSnapshot): Promise<void>;
}
