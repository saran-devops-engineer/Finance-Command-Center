import type { Loan } from "@/shared/domain/finance";

export type CommitmentPriority = "critical" | "high" | "medium" | "low";

export type CommitmentStatus = "upcoming" | "due-soon" | "completed";

export type CommitmentSourceModule = "home-loan" | "gold-loan" | string;

export interface FinancialCommitment {
  id: string;
  sourceModule: CommitmentSourceModule;
  commitmentType: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  priority: CommitmentPriority;
  status: CommitmentStatus;
  loanId?: string;
}

export interface CommitmentBuildContext {
  loans: Loan[];
  referenceDate?: string;
}

export interface CommitmentProvider {
  moduleId: CommitmentSourceModule;
  buildCommitments(context: CommitmentBuildContext): FinancialCommitment[];
}

export type CommitmentGroupId = "this-month" | "next-month" | "next-90-days";

export interface CommitmentGroup {
  id: CommitmentGroupId;
  label: string;
  commitments: FinancialCommitment[];
  totalAmount: number;
}
