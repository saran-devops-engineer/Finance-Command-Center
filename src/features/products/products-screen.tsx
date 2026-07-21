"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { card, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  buildFinancialFamilySummaries,
  getAddFinancialProductPath,
  getFinancialFamilyPath,
  type FinancialFamilySummary
} from "@/products/families";
import { financeRepository } from "@/repositories";

export function ProductsScreen() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<FinancialFamilySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasTrackedScreenView = useRef(false);

  const loadFamilySummaries = useCallback(async () => {
    const [profile, loans, chits] = await Promise.all([
      financeRepository.getProfile(),
      financeRepository.listLoans(),
      financeRepository.listChits()
    ]);

    if (!profile?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    setSummaries(buildFinancialFamilySummaries(loans, chits));
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    void loadFamilySummaries();
  }, [loadFamilySummaries]);

  useEffect(() => {
    if (!isLoading && !hasTrackedScreenView.current) {
      hasTrackedScreenView.current = true;
      trackScreenViewed(ScreenName.PRODUCTS);
    }
  }, [isLoading]);

  useFinanceDataReload(() => {
    void loadFamilySummaries();
  });

  if (isLoading) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading your products.
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Products
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
          Your financial products
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Organized by financial family. Select a category to view product types, details, and actions.
        </p>
      </header>

      <section className="space-y-3" aria-label="Financial families">
        {summaries.map((summary) => (
          <FinancialFamilyCard key={summary.familyId} summary={summary} />
        ))}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Quick add
        </p>
        <Button asChild className="w-full">
          <Link href={getAddFinancialProductPath()}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Financial Product
          </Link>
        </Button>
      </section>
    </div>
  );
}

function FinancialFamilyCard({ summary }: { summary: FinancialFamilySummary }) {
  const href = getFinancialFamilyPath(summary.familyId);
  const isComingSoon = !summary.isNavigable;

  const content = (
    <Card
      className={cn(
        "flex items-center justify-between gap-4",
        card.paddingCompact,
        isComingSoon && "opacity-70"
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{summary.label}</h2>
          <span className="text-xs text-muted-foreground">({summary.countLabel})</span>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{summary.description}</p>
      </div>
      {!isComingSoon ? (
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      ) : null}
    </Card>
  );

  if (isComingSoon) {
    return (
      <div aria-label={`${summary.label}, coming soon`} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`${summary.label}, ${summary.countLabel}`}
    >
      {content}
    </Link>
  );
}
