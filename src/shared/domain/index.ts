export {
  VisibleDomain,
  CommandCenterQuestion,
  COMMAND_CENTER_QUESTION_LABELS,
  DOMAIN_PRIMARY_QUESTION,
  type VisibleDomainId,
  type CommandCenterQuestionId
} from "@/shared/domain/visible-domains";

export {
  DataSchemaVersion,
  CURRENT_DATA_SCHEMA_VERSION,
  SCHEMA_META_ID,
  isKnownSchemaVersion,
  type DataSchemaVersionValue,
  type SchemaMeta
} from "@/shared/domain/schema-version";

export {
  IncomeMode,
  IncomeSourceKind,
  calculateTotalMonthlyIncome,
  createSimpleIncomeProfile,
  type IncomeModeValue,
  type IncomeSourceKindValue,
  type IncomeSource,
  type IncomeProfile
} from "@/shared/domain/income";

export {
  ProductTypeId,
  ProductAvailability,
  type ProductTypeIdValue,
  type ProductAvailabilityValue,
  type ProductReference,
  type ProductTypeSummary
} from "@/shared/domain/product";

export {
  CommitmentCategory,
  CommitmentFrequency,
  CommitmentPriority,
  CommitmentSourceKind,
  CommitmentReviewStatus,
  type CommitmentCategoryValue,
  type CommitmentFrequencyValue,
  type CommitmentPriorityValue,
  type CommitmentSourceKindValue,
  type CommitmentReviewStatusValue,
  type CommitmentSource,
  type CommitmentRecord
} from "@/shared/domain/commitment-record";

/** Re-export legacy domain types — unchanged in Phase 1. */
export type {
  FinancialHealthStatus,
  LoanType,
  MoneyBreakdown,
  LoanStatus,
  GoldInterestPaymentType,
  UserProfile,
  Loan,
  LoanPaymentKind,
  LoanPayment,
  UpcomingDue,
  Recommendation,
  FinancialSnapshot,
  FinanceDataSnapshot
} from "@/shared/domain/finance";

export type { Chit, ChitDerivedMetrics, ChitStatus } from "@/shared/domain/chit";

export * from "@/shared/domain/financial-timeline";
