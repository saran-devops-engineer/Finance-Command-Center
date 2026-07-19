"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { card, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { getProductTypeListPath, PRODUCT_TYPE_CATALOG } from "@/products";
import { ProductAvailability } from "@/shared/domain/product";
import type { ProductTypeSummary } from "@/shared/domain/product";
import { financeRepository } from "@/repositories";
import { isGoldLoan } from "@/shared/finance/gold-loan-form";

export function ProductsScreen() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<ProductTypeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasTrackedScreenView = useRef(false);

  const loadProductSummaries = useCallback(async () => {
    const [profile, loans, chits] = await Promise.all([
      financeRepository.getProfile(),
      financeRepository.listLoans(),
      financeRepository.listChits()
    ]);

    if (!profile?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    const activeLoans = loans.filter((loan) => loan.status !== "archived" && loan.status !== "deleted");
    const goldLoans = activeLoans.filter((loan) => isGoldLoan(loan));
    const standardLoans = activeLoans.filter((loan) => !isGoldLoan(loan));
    const activeChits = chits.filter((chit) => chit.status === "active");

    const counts: Record<string, number> = {
      loans: standardLoans.length,
      "gold-loans": goldLoans.length,
      chits: activeChits.length
    };

    setSummaries(
      PRODUCT_TYPE_CATALOG.map((entry) => ({
        productTypeId: entry.productTypeId,
        label: entry.pluralLabel,
        description: entry.description,
        availability: entry.availability,
        activeCount: counts[entry.productTypeId] ?? 0
      }))
    );
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    void loadProductSummaries();
  }, [loadProductSummaries]);

  useEffect(() => {
    if (!isLoading && !hasTrackedScreenView.current) {
      hasTrackedScreenView.current = true;
      trackScreenViewed(ScreenName.PRODUCTS);
    }
  }, [isLoading]);

  useFinanceDataReload(() => {
    void loadProductSummaries();
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
          What do you owe?
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Financial instruments grouped by type. Select a product to view details, history, and actions.
        </p>
      </header>

      <section className="space-y-3">
        {summaries.map((summary) => (
          <ProductTypeCard key={summary.productTypeId} summary={summary} />
        ))}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Quick add
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/loans/new"
            className="rounded-[20px] border border-border bg-white/45 px-4 py-3 text-center text-sm font-medium"
          >
            Add loan
          </Link>
          <Link
            href="/chits/new"
            className="rounded-[20px] border border-border bg-white/45 px-4 py-3 text-center text-sm font-medium"
          >
            Add chit
          </Link>
        </div>
      </section>
    </div>
  );
}

function ProductTypeCard({ summary }: { summary: ProductTypeSummary }) {
  const isComingSoon = summary.availability === ProductAvailability.COMING_SOON;
  const href = getProductTypeListPath(summary.productTypeId);
  const countLabel =
    summary.activeCount > 0 ? `${summary.activeCount} active` : isComingSoon ? "Coming soon" : "None yet";

  const content = (
    <Card
      className={cn(
        "flex items-center justify-between gap-4",
        card.paddingCompact,
        isComingSoon && "opacity-70"
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{summary.label}</h2>
          <span className="text-xs text-muted-foreground">({countLabel})</span>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{summary.description}</p>
      </div>
      {!isComingSoon ? <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" /> : null}
    </Card>
  );

  if (isComingSoon) {
    return content;
  }

  return (
    <Link href={href} className="block transition hover:opacity-90">
      {content}
    </Link>
  );
}
