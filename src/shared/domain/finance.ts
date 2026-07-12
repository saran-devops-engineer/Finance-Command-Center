export type FinancialHealthStatus = "healthy" | "attention" | "critical";

export type LoanType =
  | "home"
  | "gold"
  | "personal"
  | "vehicle"
  | "education"
  | "credit-card-emi"
  | "consumer-emi"
  | "friends-family"
  | "other"
  | "custom";

export interface MoneyBreakdown {
  monthlyIncome: number;
  mandatoryExpenses: number;
  emis: number;
  loanPayments: number;
  insurance: number;
  rent: number;
  utilityBills: number;
  fixedCommitments: number;
  emergencyBuffer: number;
}

export type LoanStatus = "active" | "archived" | "deleted";

export type GoldInterestPaymentType = "monthly" | "yearly";

export interface UserProfile {
  id: string;
  displayName: string;
  currency?: string;
  avatarUrl?: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  name: string;
  type: LoanType;
  customTypeName?: string;
  lender: string;
  originalAmount: number;
  outstandingBalance: number;
  annualInterestRate: number;
  monthlyEmi: number;
  principalPaid: number;
  interestPaid: number;
  remainingTenureMonths: number;
  estimatedClosureDate: string;
  nextDueDate: string;
  /** Home Loan V1 — loan start date (`YYYY-MM-DD`). Required when `type === "home"`. */
  loanStartDate?: string;
  /** Home Loan V1 — original tenure in whole months. Required when `type === "home"`. */
  originalLoanTenureMonths?: number;
  /** Home Loan V1 — day of month (1–31) when EMI is paid. Required when `type === "home"`. */
  emiPaymentDay?: number;
  /** Home Loan V1 — when true, auto tenure estimate must not overwrite `remainingTenureMonths`. */
  remainingTenureManuallyOverridden?: boolean;
  /** Gold Loan V1 — interest payment cadence. Required when `type === "gold"`. */
  goldInterestPaymentType?: GoldInterestPaymentType;
  /** Gold Loan V1 — renewal date (`YYYY-MM-DD`). Required when `type === "gold"`. */
  renewalDate?: string;
  /** Gold Loan V1 — optional gold weight in grams. Not used in any V1 calculation. */
  goldWeightGrams?: number;
  notes?: string;
  status?: LoanStatus;
  archivedAt?: string;
  archiveReason?: string;
  deletedAt?: string;
  isOverdue?: boolean;
}

export type LoanPaymentKind = "emi" | "prepayment" | "part-payment";

export interface LoanPayment {
  id: string;
  loanId: string;
  kind: LoanPaymentKind;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  paidOn: string;
  note?: string;
}

export interface UpcomingDue {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  source: "loan" | "emi" | "insurance" | "bill" | "rent";
  isOverdue?: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  tone: "positive" | "warning" | "critical" | "neutral";
  category: "cash-flow" | "debt" | "due-date" | "buffer" | "optimization";
  actionLabel?: string;
}

export interface FinancialSnapshot {
  healthStatus: FinancialHealthStatus;
  healthReason: string;
  availableMoney: number;
  mandatoryCommitments: number;
  debtToIncomeRatio: number;
  upcomingDues: UpcomingDue[];
  recommendations: Recommendation[];
}

export interface FinanceDataSnapshot {
  schemaVersion: 1;
  exportedAt: string;
  profile: UserProfile | null;
  moneyBreakdown: MoneyBreakdown | null;
  loans: Loan[];
  loanPayments: LoanPayment[];
  upcomingDues: UpcomingDue[];
  /** Chit Management V1 — optional for backward-compatible backups. */
  chits?: import("@/shared/domain/chit").Chit[];
}
