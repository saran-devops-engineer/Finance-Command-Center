"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppEvent, trackApplicationEvent } from "@/core/analytics";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { card, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  buildFamilyProductTypeSummaries,
  getAddFinancialProductPath,
  getFamilyProductTypePath,
  getFinancialFamilyDefinition,
  getFinancialFamilyPath,
  type FamilyProductTypeSummary,
  type FinancialFamilyIdValue
} from "@/products/families";
import { financeRepository } from "@/repositories";

interface FamilyScreenProps {
  familyId: FinancialFamilyIdValue;
}

export function FamilyScreen({ familyId }: FamilyScreenProps) {
  const router = useRouter();
  const family = getFinancialFamilyDefinition(familyId);
  const [summaries, setSummaries] = useState<FamilyProductTypeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasTrackedFamilyOpen = useRef(false);

  const loadTypeSummaries = useCallback(async () => {
    const [profile, loans, chits] = await Promise.all([
      financeRepository.getProfile(),
      financeRepository.listLoans(),
      financeRepository.listChits()
    ]);

    if (!profile?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    setSummaries(buildFamilyProductTypeSummaries(familyId, loans, chits));
    setIsLoading(false);
  }, [familyId, router]);

  useEffect(() => {
    void loadTypeSummaries();
  }, [loadTypeSummaries]);

  useEffect(() => {
    if (!isLoading && !hasTrackedFamilyOpen.current) {
      hasTrackedFamilyOpen.current = true;
      trackApplicationEvent(AppEvent.FAMILY_OPENED, { family_id: familyId });
    }
  }, [familyId, isLoading]);

  useFinanceDataReload(() => {
    void loadTypeSummaries();
  });

  if (!family) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading {family.label.toLowerCase()}.
          </h1>
        </header>
      </div>
    );
  }

  const hasActiveTypes = summaries.some((summary) => summary.availability === "active");

  return (
    <div className={spacing.page}>
      <header className="space-y-3 pt-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Products
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {family.label}
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            {family.label}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">{family.description}</p>
        </div>
      </header>

      <section className="space-y-3" aria-label={`${family.label} product types`}>
        {summaries.map((summary) => (
          <ProductTypeCard key={summary.creationTypeId} summary={summary} />
        ))}
      </section>

      {hasActiveTypes ? (
        <section className="space-y-3">
          <Button asChild className="w-full">
            <Link href={getAddFinancialProductPath(familyId)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Product
            </Link>
          </Button>
        </section>
      ) : null}
    </div>
  );
}

function ProductTypeCard({ summary }: { summary: FamilyProductTypeSummary }) {
  const isComingSoon = summary.availability === "coming-soon";
  const href = getFamilyProductTypePath(summary.familyId, summary.creationTypeId);

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
