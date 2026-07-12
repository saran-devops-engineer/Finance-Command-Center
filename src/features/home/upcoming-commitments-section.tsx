"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { card, spacing } from "@/lib/design-tokens";
import { cn, formatInr } from "@/lib/utils";
import type { CommitmentGroup, FinancialCommitment } from "@/engines/commitment";
import { getDaysUntil } from "@/engines/commitment";

interface UpcomingCommitmentsSectionProps {
  groups: CommitmentGroup[];
}

export function UpcomingCommitmentsSection({ groups }: UpcomingCommitmentsSectionProps) {
  if (groups.length === 0) {
    return (
      <section className={spacing.section}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Upcoming Financial Commitments
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          No financial commitments scheduled in the next 90 days.
        </p>
      </section>
    );
  }

  return (
    <section className={spacing.section}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Upcoming Financial Commitments
      </p>

      <div className="space-y-3">
        {groups.map((group) => (
          <CommitmentGroupCard key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}

function CommitmentGroupCard({ group }: { group: CommitmentGroup }) {
  const [isExpanded, setIsExpanded] = useState(group.id === "this-month");

  return (
    <Card className={cn("space-y-3", card.paddingCompact)}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={() => setIsExpanded((value) => !value)}
      >
        <div>
          <h3 className="font-semibold">{group.label}</h3>
          <p className="text-xs text-muted-foreground">
            {group.commitments.length} commitment{group.commitments.length === 1 ? "" : "s"} ·{" "}
            {formatInr(group.totalAmount)} required
          </p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            isExpanded ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      {isExpanded ? (
        <ul className="space-y-2">
          {group.commitments.map((commitment) => (
            <CommitmentCard key={commitment.id} commitment={commitment} />
          ))}
        </ul>
      ) : null}

      <p className="border-t border-border/70 pt-3 text-sm font-medium">
        Total commitment amount: {formatInr(group.totalAmount)}
      </p>
    </Card>
  );
}

function CommitmentCard({ commitment }: { commitment: FinancialCommitment }) {
  const daysRemaining = getDaysUntil(commitment.dueDate);
  const content = (
    <Card className={cn("space-y-2 bg-white/45", card.paddingCompact)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold">{commitment.title}</h4>
          <p className="text-xs text-muted-foreground">{formatCommitmentDueDate(commitment.dueDate)}</p>
        </div>
        <p className="shrink-0 font-semibold">{formatInr(commitment.amount)}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
          {formatPriority(commitment.priority)}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
          {formatStatus(commitment.status)}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
          {formatDaysRemaining(daysRemaining)}
        </span>
      </div>
    </Card>
  );

  if (commitment.loanId) {
    return (
      <li>
        <Link href={`/loans/${commitment.loanId}`} className="block">
          {content}
        </Link>
      </li>
    );
  }

  if (commitment.chitId) {
    return (
      <li>
        <Link href={`/chits/${commitment.chitId}`} className="block">
          {content}
        </Link>
      </li>
    );
  }

  return <li>{content}</li>;
}

function formatPriority(priority: FinancialCommitment["priority"]) {
  switch (priority) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
}

function formatStatus(status: FinancialCommitment["status"]) {
  return status === "due-soon" ? "Due Soon" : "Upcoming";
}

function formatDaysRemaining(daysRemaining: number) {
  if (daysRemaining < 0) {
    return `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"} ago`;
  }

  if (daysRemaining === 0) {
    return "Due today";
  }

  if (daysRemaining === 1) {
    return "1 day left";
  }

  return `${daysRemaining} days left`;
}

function formatCommitmentDueDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date.slice(0, 10)}T00:00:00`));
}
