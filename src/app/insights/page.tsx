"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card } from "@/components/ui/card";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import { createFinancialSnapshot } from "@/services/financial-snapshot/create-snapshot";
import type { FinancialSnapshot } from "@/shared/domain/finance";

export default function InsightsPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInsights() {
      const [profile, moneyBreakdown, loans, upcomingDues] = await Promise.all([
        indexedDbFinanceRepository.getProfile(),
        indexedDbFinanceRepository.getMoneyBreakdown(),
        indexedDbFinanceRepository.listLoans(),
        indexedDbFinanceRepository.listUpcomingDues()
      ]);

      if (!isMounted) {
        return;
      }

      if (!profile?.onboardingCompleted || !moneyBreakdown) {
        router.replace("/onboarding");
        return;
      }

      setSnapshot(
        createFinancialSnapshot({
          money: moneyBreakdown,
          loans,
          upcomingDues
        })
      );
    }

    void loadInsights();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <MobileShell>
      <div className="space-y-8">
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Intelligence
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            What matters this month
          </h1>
        </header>

        <section className="space-y-4">
          {snapshot?.recommendations.map((recommendation) => (
            <Card key={recommendation.id} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {recommendation.category.replace("-", " ")}
              </p>
              <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
                {recommendation.title}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {recommendation.description}
              </p>
            </Card>
          ))}
          {!snapshot ? (
            <Card>
              <p className="text-sm leading-6 text-muted-foreground">
                Reading your private on-device ledger.
              </p>
            </Card>
          ) : null}
        </section>
      </div>
    </MobileShell>
  );
}
