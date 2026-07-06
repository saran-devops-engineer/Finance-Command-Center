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

export interface UserProfile {
  id: string;
  displayName: string;
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
