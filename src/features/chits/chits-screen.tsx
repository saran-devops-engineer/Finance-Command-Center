"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { getChitProviderDisplay, getPrizeStatusLabel } from "@/lib/chit-display";
import { card, radius, spacing } from "@/lib/design-tokens";
import { cn, formatInr } from "@/lib/utils";
import { financeRepository } from "@/repositories";
import { deriveChitMetrics } from "@/shared/finance/chit-calculations";
import type { Chit } from "@/shared/domain/chit";

type ChitsView = "active" | "archived";

export function ChitsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeChits, setActiveChits] = useState<Chit[]>([]);
  const [archivedChits, setArchivedChits] = useState<Chit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ChitsView>("active");
  const hasTrackedScreenView = useRef(false);

  const loadChits = useCallback(async () => {
    const [profile, localActiveChits, localArchivedChits] = await Promise.all([
      financeRepository.getProfile(),
      financeRepository.listChits(),
      financeRepository.listArchivedChits()
    ]);

    if (!profile?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    setActiveChits(localActiveChits);
    setArchivedChits(localArchivedChits);
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    const requestedView = searchParams.get("view");
    if (requestedView === "archived") {
      setView("archived");
    }
  }, [searchParams]);

  useEffect(() => {
    void loadChits();
  }, [loadChits]);

  useEffect(() => {
    if (!isLoading && !hasTrackedScreenView.current) {
      hasTrackedScreenView.current = true;
      trackScreenViewed(ScreenName.CHITS);
    }
  }, [isLoading]);

  useFinanceDataReload(() => {
    void loadChits();
  });

  const totalMonthlyContribution = activeChits.reduce(
    (sum, chit) => sum + (deriveChitMetrics(chit).remainingMonths > 0 ? chit.monthlyContribution : 0),
    0
  );
  const totalRemaining = activeChits.reduce(
    (sum, chit) => sum + deriveChitMetrics(chit).totalRemainingContribution,
    0
  );

  if (isLoading) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading your chits.
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Chit funds
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">Your chits</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Track chit contributions, prize status, and remaining months.
        </p>
      </header>

      <ChitViewTabs view={view} onChange={setView} />

      {view === "active" ? (
        <>
          <MetricCardGrid columns={3}>
            <MetricCard label="Active chits" value={String(activeChits.length)} />
            <MetricCard
              label="Monthly"
              value={formatInr(totalMonthlyContribution, { compact: true })}
            />
            <MetricCard
              label="Remaining"
              value={formatInr(totalRemaining, { compact: true })}
            />
          </MetricCardGrid>

          <Button asChild className="w-full gap-2">
            <Link href="/chits/new">
              <Plus className="h-4 w-4" />
              Add chit
            </Link>
          </Button>

          <section className={spacing.section}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Active chits
            </p>
            <div className={cn("flex flex-col", spacing.cardStack)}>
              {activeChits.length === 0 ? (
                <Card className={cn("space-y-2", card.paddingCompact)}>
                  <h2 className="font-display text-3xl tracking-[-0.04em]">
                    No chits added yet.
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Add your first chit to track monthly contributions and prize status.
                  </p>
                </Card>
              ) : null}

              {activeChits.map((chit) => (
                <ChitDashboardCard key={chit.id} chit={chit} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className={spacing.section}>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Archived chits
          </p>
          <div className={cn("flex flex-col", spacing.cardStack)}>
            {archivedChits.length === 0 ? (
              <Card className={cn("space-y-2", card.paddingCompact)}>
                <h2 className="font-display text-3xl tracking-[-0.04em]">
                  No archived chits yet.
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Completed chits will appear here after you archive them.
                </p>
              </Card>
            ) : null}

            {archivedChits.map((chit) => (
              <Link key={chit.id} href={`/chits/${chit.id}`} className="block">
                <Card className={cn("space-y-4", card.paddingCompact)}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {getChitProviderDisplay(chit)}
                      </p>
                      <h2 className="mt-1 font-display text-3xl leading-tight tracking-[-0.04em]">
                        {chit.chitName}
                      </h2>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Archived
                    </span>
                  </div>
                  {chit.archiveReason ? (
                    <p className="text-sm leading-6 text-muted-foreground">{chit.archiveReason}</p>
                  ) : null}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ChitDashboardCard({ chit }: { chit: Chit }) {
  const metrics = deriveChitMetrics(chit);

  return (
    <Link href={`/chits/${chit.id}`} className="block">
      <Card className={cn("space-y-4", card.paddingCompact)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {getChitProviderDisplay(chit)}
            </p>
            <h2 className="mt-1 font-display text-3xl leading-tight tracking-[-0.04em]">
              {chit.chitName}
            </h2>
          </div>
          <p className="text-sm font-semibold">{formatInr(chit.monthlyContribution)}/mo</p>
        </div>

        <MetricCardGrid>
          <MetricCard label="Current month" value={`Month ${chit.currentRunningMonth}`} />
          <MetricCard label="Prize status" value={getPrizeStatusLabel(chit)} valueKind="text" />
          <MetricCard label="Remaining" value={`${metrics.remainingMonths} mo`} />
          <MetricCard label="Next due" value={formatDueDate(chit.nextDueDate)} />
        </MetricCardGrid>
      </Card>
    </Link>
  );
}

function ChitViewTabs({
  view,
  onChange
}: {
  view: ChitsView;
  onChange: (view: ChitsView) => void;
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
