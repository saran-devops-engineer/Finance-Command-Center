"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArchiveLoanDialog } from "@/components/ui/archive-loan-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { LoanProgressSummary } from "@/components/ui/loan-progress-summary";
import { SaveSuccessBanner } from "@/components/ui/save-success-banner";
import { LoanActionsMenu } from "@/features/loans/loan-actions-menu";
import { GoldLoanSimulator } from "@/features/loans/gold-loan-simulator";
import { WhatIfSimulator } from "@/features/loans/what-if-simulator";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { spacing } from "@/lib/design-tokens";
import { cn, formatInr } from "@/lib/utils";
import { getLoanStatus, isActiveLoan, isArchivedLoan } from "@/lib/loan-status";
import {
  computeMonthlyInterestBurden,
  getGoldRenewalReminder
} from "@/shared/finance/gold-loan-calculations";
import { isGoldLoan } from "@/shared/finance/gold-loan-form";
import {
  formatLoanTypeLabel,
  getArchiveDateLabel,
  getCompletionDateLabel
} from "@/lib/loan-display";
import { getPinnedLoanId, setPinnedLoanId } from "@/lib/pinned-loan";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import {
  archiveLoanRecord,
  softDeleteLoanRecord
} from "@/services/loan-management/loan-lifecycle";
import type { Loan, LoanPayment } from "@/shared/domain/finance";

interface LoanDetailScreenProps {
  loanId: string;
}

export function LoanDetailScreen({ loanId }: LoanDetailScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const showSavedBanner = searchParams.get("saved") === "1";

  const loadLoan = useCallback(async () => {
    const [profile, localLoan, localPayments] = await Promise.all([
      indexedDbFinanceRepository.getProfile(),
      indexedDbFinanceRepository.getLoan(loanId),
      indexedDbFinanceRepository.listLoanPayments(loanId)
    ]);

    if (!profile?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    if (!localLoan || getLoanStatus(localLoan) === "deleted") {
      setLoan(null);
      setPayments([]);
      setIsLoading(false);
      return;
    }

    setLoan(localLoan);
    setPayments(localPayments);
    setIsPinned(isActiveLoan(localLoan) && getPinnedLoanId() === loanId);
    setIsLoading(false);
  }, [loanId, router]);

  useEffect(() => {
    setIsLoading(true);
    void loadLoan();
  }, [loadLoan]);

  useFinanceDataReload(() => {
    void loadLoan();
  });

  const interestShare = loan
    ? Math.round((loan.interestPaid / Math.max(loan.interestPaid + loan.principalPaid, 1)) * 100)
    : 0;
  const principalShare = 100 - interestShare;

  const attentionMessage =
    loan && isActiveLoan(loan) ? getLoanDetailAttention(loan) : null;
  const isArchived = loan ? isArchivedLoan(loan) : false;

  function togglePinnedLoan() {
    if (!loan) {
      return;
    }

    const nextPinned = !isPinned;
    setPinnedLoanId(nextPinned ? loan.id : null);
    setIsPinned(nextPinned);
  }

  async function confirmDeleteLoan() {
    if (!loan) {
      return;
    }

    setIsDeleting(true);
    setIsFadingOut(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 220);
    });

    await softDeleteLoanRecord(indexedDbFinanceRepository, loan.id);
    router.replace("/loans");
  }

  async function confirmArchiveLoan(archiveReason?: string) {
    if (!loan) {
      return;
    }

    setIsArchiving(true);
    setIsFadingOut(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 220);
    });

    await archiveLoanRecord(indexedDbFinanceRepository, loan.id, archiveReason);
    router.replace("/loans?view=archived");
  }

  if (isLoading) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading loan details.
          </h1>
        </header>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className={spacing.page}>
        <header className="space-y-4 pt-4">
          <Link
            href="/loans"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Loans
          </Link>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Loan not found.
          </h1>
        </header>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          spacing.page,
          "transition-opacity duration-300",
          isFadingOut ? "opacity-0" : "opacity-100"
        )}
      >
        {showSavedBanner ? (
          <SaveSuccessBanner message="Loan updated. Calculations refreshed across your command center." />
        ) : null}

        <header className="space-y-4 pt-4">
          <Link
            href="/loans"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Loans
          </Link>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  {formatLoanTypeLabel(loan)} loan · {loan.lender}
                </p>
                {isArchived ? (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Archived
                  </span>
                ) : null}
              </div>
              <h1 className="font-display text-4xl leading-tight tracking-[-0.05em]">
                {loan.name}
              </h1>
            </div>
            {isActiveLoan(loan) ? (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={togglePinnedLoan}
                  aria-pressed={isPinned}
                >
                  <Star
                    className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`}
                    strokeWidth={1.8}
                  />
                  {isPinned ? "Pinned" : "Pin"}
                </Button>
                <LoanActionsMenu
                  loanId={loan.id}
                  loanName={loan.name}
                  onArchive={() => setShowArchiveDialog(true)}
                  onDelete={() => setShowDeleteDialog(true)}
                />
              </div>
            ) : null}
          </div>
        </header>

        <Card className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Outstanding
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
              {formatInr(loan.outstandingBalance)}
            </p>
          </div>

          <LoanProgressSummary
            principalPaid={loan.principalPaid}
            originalAmount={loan.originalAmount}
          />
        </Card>

        {isArchived ? (
          <Card className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Completion date</p>
                <p className="font-semibold">{getCompletionDateLabel(loan)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Archive date</p>
                <p className="font-semibold">{getArchiveDateLabel(loan)}</p>
              </div>
            </div>
            {loan.archiveReason ? (
              <p className="text-sm leading-6 text-muted-foreground">{loan.archiveReason}</p>
            ) : null}
            <Button type="button" variant="secondary" className="w-full" disabled>
              Restore loan (soon)
            </Button>
          </Card>
        ) : null}

        {attentionMessage ? (
          <Card className="space-y-3">
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/55">
                <Info className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Decision note
                </p>
                <h2 className="mt-1 font-display text-2xl tracking-[-0.04em]">
                  {attentionMessage.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {attentionMessage.description}
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {isGoldLoan(loan) ? (
          <MetricCardGrid>
            <MetricCard
              label="Monthly interest"
              value={formatInr(
                Math.round(
                  computeMonthlyInterestBurden(loan.outstandingBalance, loan.annualInterestRate)
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

        {loan.notes ? (
          <Card className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Notes
            </p>
            <p className="text-sm leading-6 text-muted-foreground">{loan.notes}</p>
          </Card>
        ) : null}

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Paid so far
          </p>
          <Card className="divide-y divide-border/70 p-0">
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="font-semibold">Interest paid</p>
                <p className="text-xs text-muted-foreground">{interestShare}% of tracked repayment</p>
              </div>
              <p className="font-semibold">{formatInr(loan.interestPaid)}</p>
            </div>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="font-semibold">Principal reduced</p>
                <p className="text-xs text-muted-foreground">{principalShare}% of tracked repayment</p>
              </div>
              <p className="font-semibold">{formatInr(loan.principalPaid)}</p>
            </div>
          </Card>
        </section>

        {isActiveLoan(loan) ? (
          <Button asChild className="w-full">
            <Link href={`/loans/${loan.id}/payment`}>Log payment</Link>
          </Button>
        ) : null}

        {isActiveLoan(loan) ? (
          isGoldLoan(loan) ? (
            <GoldLoanSimulator loan={loan} />
          ) : (
            <WhatIfSimulator loan={loan} />
          )
        ) : null}

        {payments.length > 0 ? (
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Recent payments
            </p>
            <Card className="divide-y divide-border/70 p-0">
              {payments
                .slice()
                .sort((first, second) => second.paidOn.localeCompare(first.paidOn))
                .slice(0, 4)
                .map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <p className="font-semibold capitalize">
                        {payment.kind.replace("-", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">{payment.paidOn}</p>
                    </div>
                    <p className="font-semibold">{formatInr(payment.amount)}</p>
                  </div>
                ))}
            </Card>
          </section>
        ) : null}
      </div>

      <ArchiveLoanDialog
        open={showArchiveDialog}
        isWorking={isArchiving}
        onCancel={() => setShowArchiveDialog(false)}
        onConfirm={(archiveReason) => void confirmArchiveLoan(archiveReason)}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        title={`Delete ${loan.name}?`}
        description="This action permanently removes this loan from your command center and hides all associated payment history. Future versions may support restore."
        confirmLabel="Delete"
        isDestructive
        isWorking={isDeleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => void confirmDeleteLoan()}
      />
    </>
  );
}

function getLoanDetailAttention(loan: Loan) {
  const daysUntilDue = getDaysUntil(loan.nextDueDate);
  const monthlyInterest = Math.round(loan.outstandingBalance * (loan.annualInterestRate / 12 / 100));

  if (isGoldLoan(loan)) {
    const reminder = getGoldRenewalReminder(loan.renewalDate ?? loan.nextDueDate);

    if (reminder.isOverdue) {
      return {
        title: "Gold loan renewal overdue",
        description: `Renew or repay to avoid penalties. Interest is running at about ${formatInr(monthlyInterest)} per month.`
      };
    }

    if (reminder.shouldRemind) {
      return {
        title: `Gold loan renewal in ${reminder.daysRemaining} day${reminder.daysRemaining === 1 ? "" : "s"}`,
        description: `Plan the renewal ahead of time. This loan costs about ${formatInr(monthlyInterest)} in interest each month.`
      };
    }

    return {
      title: "Interest-only gold loan",
      description: `You are paying about ${formatInr(monthlyInterest)} in interest each month. A one-time principal payment lowers this immediately.`
    };
  }

  if (loan.isOverdue) {
    return {
      title: "This loan is overdue",
      description: `Prioritize the missed EMI before making optional prepayments.`
    };
  }

  if (daysUntilDue === 1) {
    return {
      title: "EMI due tomorrow",
      description: `Keep ${formatInr(loan.monthlyEmi)} ready so this payment does not become a penalty risk.`
    };
  }

  if (loan.annualInterestRate >= 12) {
    return {
      title: "High-interest loan",
      description: `This loan is estimated to cost about ${formatInr(monthlyInterest)} in interest this month.`
    };
  }

  return {
    title: "Track this loan steadily",
    description: "Regular payments and occasional prepayment simulations will show whether closing early is worth it."
  };
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
