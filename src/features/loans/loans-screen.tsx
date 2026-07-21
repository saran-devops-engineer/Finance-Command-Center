"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { LoanProgressSummary } from "@/components/ui/loan-progress-summary";
import { FinancialAmount } from "@/components/ui/financial-amount";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { formatInr, cn } from "@/lib/utils";
import {
  formatLoanTypeLabel,
  getArchiveDateLabel,
  getCompletionDateLabel,
  getOutstandingLabel
} from "@/lib/loan-display";
import { card, radius, spacing } from "@/lib/design-tokens";
import { financeRepository } from "@/repositories";
import { computeMonthlyInterestBurden } from "@/shared/finance/gold-loan-calculations";
import { isGoldLoan } from "@/shared/finance/gold-loan-form";
import type { Loan } from "@/shared/domain/finance";
import type { ProductCreationTypeIdValue } from "@/products/creation";
import {
  getFamilyProductTypeNewPath,
  loanMatchesCreationType,
  type FinancialFamilyIdValue
} from "@/products/families";
import { ProductTypeListHeader } from "@/features/products/product-type-list-screen";
import { ProductTypeEmptyState } from "@/features/products/coming-soon-product-type-screen";

type LoansView = "active" | "archived";
type LoansScreenVariant = "all" | "standard" | "gold";

interface LoansScreenProps {
  /** Filters list when rendered under legacy /products/[productType]. */
  variant?: LoansScreenVariant;
  familyId?: FinancialFamilyIdValue;
  creationTypeId?: ProductCreationTypeIdValue;
  productTypeLabel?: string;
}

function filterLoans(
  loans: Loan[],
  variant: LoansScreenVariant,
  creationTypeId?: ProductCreationTypeIdValue
): Loan[] {
  if (creationTypeId) {
    return loans.filter((loan) => loanMatchesCreationType(loan, creationTypeId));
  }

  return filterLoansByVariant(loans, variant);
}

function filterLoansByVariant(loans: Loan[], variant: LoansScreenVariant): Loan[] {
  if (variant === "standard") {
    return loans.filter((loan) => !isGoldLoan(loan));
  }

  if (variant === "gold") {
    return loans.filter((loan) => isGoldLoan(loan));
  }

  return loans;
}

function getLoansScreenCopy(
  variant: LoansScreenVariant,
  productTypeLabel?: string,
  creationTypeId?: ProductCreationTypeIdValue,
  familyId?: FinancialFamilyIdValue
) {
  const addHref =
    creationTypeId && familyId
      ? getFamilyProductTypeNewPath(familyId, creationTypeId)
      : "/products/new?family=loans";

  if (productTypeLabel) {
    return {
      eyebrow: "Loans",
      title: `Your ${productTypeLabel.toLowerCase()}s`,
      loadingTitle: `Reading your ${productTypeLabel.toLowerCase()}s.`,
      addHref,
      addLabel: `Add ${productTypeLabel.toLowerCase()}`,
      emptyTitle: `No ${productTypeLabel.toLowerCase()}s added yet.`,
      emptyDescription: `Add your first ${productTypeLabel.toLowerCase()} to track balances, due dates, and payoff progress.`,
      screenName: creationTypeId === "gold-loan" ? ScreenName.GOLD_LOAN : ScreenName.LOANS
    };
  }

  if (variant === "gold") {
    return {
      eyebrow: "Products",
      title: "Your gold loans",
      loadingTitle: "Reading your gold loans.",
      addHref: "/products/new?family=loans",
      addLabel: "Add loan",
      emptyTitle: "No gold loans added yet.",
      emptyDescription: "Add your first gold loan to track interest and renewal cycles.",
      screenName: ScreenName.GOLD_LOAN
    };
  }

  if (variant === "standard") {
    return {
      eyebrow: "Products",
      title: "Your loans",
      loadingTitle: "Reading your loans.",
      addHref: "/products/new?family=loans",
      addLabel: "Add loan",
      emptyTitle: "No loans added yet.",
      emptyDescription:
        "Add your first loan to track EMI, tenure, and payoff progress.",
      screenName: ScreenName.LOANS
    };
  }

  return {
    eyebrow: "Liabilities",
    title: "Your loans",
    loadingTitle: "Reading your loans.",
    addHref: "/products/new?family=loans",
    addLabel: "Add loan",
    emptyTitle: "No loans added yet.",
    emptyDescription:
      "Add your first loan to track EMI, tenure, and payoff progress.",
    screenName: ScreenName.LOANS
  };
}

export function LoansScreen({
  variant = "all",
  familyId,
  creationTypeId,
  productTypeLabel
}: LoansScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [archivedLoans, setArchivedLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<LoansView>("active");
  const hasTrackedScreenView = useRef(false);
  const copy = getLoansScreenCopy(variant, productTypeLabel, creationTypeId, familyId);

  const loadLoans = useCallback(async () => {
    const [profile, localActiveLoans, localArchivedLoans] = await Promise.all([
      financeRepository.getProfile(),
      financeRepository.listLoans(),
      financeRepository.listArchivedLoans()
    ]);

    if (!profile?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    setActiveLoans(filterLoans(localActiveLoans, variant, creationTypeId));
    setArchivedLoans(filterLoans(localArchivedLoans, variant, creationTypeId));
    setIsLoading(false);
  }, [creationTypeId, router, variant]);

  useEffect(() => {
    const requestedView = searchParams.get("view");
    if (requestedView === "archived") {
      setView("archived");
    }
  }, [searchParams]);

  useEffect(() => {
    void loadLoans();
  }, [loadLoans]);

  useEffect(() => {
    if (!isLoading && !hasTrackedScreenView.current) {
      hasTrackedScreenView.current = true;
      trackScreenViewed(copy.screenName);
    }
  }, [isLoading, copy.screenName]);

  useFinanceDataReload(() => {
    void loadLoans();
  });

  const totalOutstanding = activeLoans.reduce(
    (sum, loan) => sum + loan.outstandingBalance,
    0
  );
  const totalEmi = activeLoans.reduce((sum, loan) => sum + loan.monthlyEmi, 0);
  const estimatedMonthlyInterest = activeLoans.reduce(
    (sum, loan) => sum + estimateMonthlyInterest(loan),
    0
  );
  const prioritizedLoans = [...activeLoans].sort(compareLoanPriority);
  const priorityLoan = prioritizedLoans[0];
  const attentionMessage = priorityLoan ? getLoanAttentionMessage(priorityLoan) : null;

  if (isLoading) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            {copy.loadingTitle}
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-3 pt-4">
        {familyId ? <ProductTypeListHeader familyId={familyId} productTypeLabel={productTypeLabel ?? "Loan"} /> : null}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {copy.eyebrow}
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            {copy.title}
          </h1>
          {variant === "all" && !familyId ? (
            <Link href="/products/community-finance/chit" className="inline-block text-sm font-medium text-primary">
              View your chits
            </Link>
          ) : null}
        </div>
      </header>

      <LoanViewTabs view={view} onChange={setView} />

      {view === "active" ? (
        <>
          <MetricCardGrid columns={3}>
            <MetricCard
              label="Outstanding"
              value={formatInr(totalOutstanding, { compact: true })}
            />
            <MetricCard label="EMI" value={formatInr(totalEmi, { compact: true })} />
            <MetricCard
              label="Int./mo"
              value={formatInr(estimatedMonthlyInterest, { compact: true })}
            />
          </MetricCardGrid>

          {priorityLoan && attentionMessage ? (
            <Card className="space-y-3 bg-primary text-primary-foreground">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-60">
                    Needs attention
                  </p>
                  <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
                    {attentionMessage.title}
                  </h2>
                  <p className="text-sm leading-6 opacity-70">{attentionMessage.description}</p>
                </div>
              </div>
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link href={`/loans/${priorityLoan.id}`}>Review loan</Link>
              </Button>
            </Card>
          ) : null}

          <Button asChild className="w-full gap-2">
            <Link href={copy.addHref}>
              <Plus className="h-4 w-4" />
              {copy.addLabel}
            </Link>
          </Button>

          <section className={spacing.section}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Priority portfolio
            </p>
            <div className={cn("flex flex-col", spacing.cardStack)}>
              {activeLoans.length === 0 ? (
                familyId && creationTypeId ? (
                  <ProductTypeEmptyState
                    familyId={familyId}
                    creationTypeId={creationTypeId}
                    message={copy.emptyDescription}
                  />
                ) : (
                  <Card className={cn("space-y-2", card.paddingCompact)}>
                    <h2 className="font-display text-3xl tracking-[-0.04em]">
                      {copy.emptyTitle}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {copy.emptyDescription}
                    </p>
                  </Card>
                )
              ) : null}

              {prioritizedLoans.map((loan) => (
                <Link key={loan.id} href={`/loans/${loan.id}`} className="block">
                  <Card className={cn("space-y-4", card.paddingCompact)}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {formatLoanTypeLabel(loan)} loan · {loan.lender}
                        </p>
                        <h2 className="mt-1 font-display text-3xl leading-tight tracking-[-0.04em]">
                          {loan.name}
                        </h2>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="font-semibold">
                          <FinancialAmount amount={loan.outstandingBalance} />
                        </p>
                      </div>
                    </div>

                    <LoanProgressSummary
                      principalPaid={loan.principalPaid}
                      originalAmount={loan.originalAmount}
                    />

                    {isGoldLoan(loan) ? (
                      <MetricCardGrid>
                        <MetricCard
                          label="Monthly interest"
                          value={formatInr(
                            Math.round(
                              computeMonthlyInterestBurden(
                                loan.outstandingBalance,
                                loan.annualInterestRate
                              )
                            )
                          )}
                        />
                        <MetricCard label="Rate" value={`${loan.annualInterestRate}% p.a.`} />
                        <MetricCard
                          label="Interest type"
                          value={loan.goldInterestPaymentType === "yearly" ? "Yearly" : "Monthly"}
                          valueKind="text"
                        />
                        <MetricCard
                          label="Renewal"
                          value={formatDueDate(loan.renewalDate ?? loan.nextDueDate)}
                        />
                      </MetricCardGrid>
                    ) : (
                      <MetricCardGrid>
                        <MetricCard label="EMI" value={formatInr(loan.monthlyEmi)} />
                        <MetricCard label="Rate" value={`${loan.annualInterestRate}% p.a.`} />
                        <MetricCard label="Tenure" value={`${loan.remainingTenureMonths} mo`} />
                        <MetricCard label="Next due" value={formatDueDate(loan.nextDueDate)} />
                      </MetricCardGrid>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className={spacing.section}>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Archived portfolio
          </p>
          <div className={cn("flex flex-col", spacing.cardStack)}>
            {archivedLoans.length === 0 ? (
              <Card className={cn("space-y-2", card.paddingCompact)}>
                <h2 className="font-display text-3xl tracking-[-0.04em]">
                  No archived loans yet.
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  When you archive completed loans, they will appear here.
                </p>
              </Card>
            ) : null}

            {archivedLoans.map((loan) => (
              <Link key={loan.id} href={`/loans/${loan.id}`} className="block">
                <Card className={cn("space-y-4", card.paddingCompact)}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {formatLoanTypeLabel(loan)} loan · {loan.lender}
                      </p>
                      <h2 className="mt-1 font-display text-3xl leading-tight tracking-[-0.04em]">
                        {loan.name}
                      </h2>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Archived
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Completion date</p>
                      <p className="font-semibold">{getCompletionDateLabel(loan)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Archive date</p>
                      <p className="font-semibold">{getArchiveDateLabel(loan)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Outstanding balance</p>
                      <p className="font-semibold">{getOutstandingLabel(loan)}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LoanViewTabs({
  view,
  onChange
}: {
  view: LoansView;
  onChange: (view: LoansView) => void;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 rounded-full bg-white/45 p-1", radius.pill)}>
      <button
        type="button"
        className={cn(
          "min-h-11 rounded-full px-4 text-sm font-medium transition",
          view === "active" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        )}
        aria-pressed={view === "active"}
        onClick={() => onChange("active")}
      >
        Active
      </button>
      <button
        type="button"
        className={cn(
          "min-h-11 rounded-full px-4 text-sm font-medium transition",
          view === "archived" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        )}
        aria-pressed={view === "archived"}
        onClick={() => onChange("archived")}
      >
        Archived
      </button>
    </div>
  );
}

function compareLoanPriority(first: Loan, second: Loan) {
  return getLoanPriorityScore(second) - getLoanPriorityScore(first);
}

function getLoanPriorityScore(loan: Loan) {
  const dueSoonBoost = getDaysUntil(loan.nextDueDate) <= 7 ? 600 : 0;
  const overdueBoost = loan.isOverdue ? 1_000 : 0;
  const goldLoanBoost = loan.type === "gold" ? 250 : 0;

  return overdueBoost + dueSoonBoost + goldLoanBoost + loan.annualInterestRate * 25;
}

function getLoanAttentionMessage(loan: Loan) {
  const daysUntilDue = getDaysUntil(loan.nextDueDate);

  if (loan.isOverdue) {
    return {
      title: `${loan.name} is overdue`,
      description: `Clear ${formatInr(loan.monthlyEmi)} first to reduce penalty risk and stress.`
    };
  }

  if (daysUntilDue === 1) {
    return {
      title: `${loan.name} EMI is due tomorrow`,
      description: `Keep ${formatInr(loan.monthlyEmi)} ready before using money elsewhere.`
    };
  }

  if (daysUntilDue >= 0 && daysUntilDue <= 7) {
    return {
      title: `${loan.name} EMI is due in ${daysUntilDue} days`,
      description: `This commitment should be protected before discretionary spending.`
    };
  }

  if (loan.type === "gold") {
    return {
      title: `${loan.name} may be dragging interest`,
      description: `At ${loan.annualInterestRate}% p.a., this is a strong candidate for prepayment.`
    };
  }

  return {
    title: `${loan.name} has the highest interest rate`,
    description: `At ${loan.annualInterestRate}% p.a., review whether a small prepayment helps.`
  };
}

function estimateMonthlyInterest(loan: Loan) {
  return Math.round(loan.outstandingBalance * (loan.annualInterestRate / 12 / 100));
}

function formatDueDate(date: string) {
  const daysUntilDue = getDaysUntil(date);

  if (daysUntilDue === 0) {
    return "Today";
  }

  if (daysUntilDue === 1) {
    return "Tomorrow";
  }

  if (daysUntilDue > 1 && daysUntilDue <= 7) {
    return `In ${daysUntilDue} days`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(`${date}T00:00:00`));
}

function getDaysUntil(date: string) {
  const targetDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((targetDate.getTime() - today.getTime()) / 86_400_000);
}
