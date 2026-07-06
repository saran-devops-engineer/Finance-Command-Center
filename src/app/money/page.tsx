"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { PlaceholderScreen } from "@/components/finance/placeholder-screen";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/utils";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import type { MoneyBreakdown } from "@/shared/domain/finance";
import {
  calculateAvailableMoney,
  calculateMandatoryCommitments
} from "@/services/financial-snapshot/available-money";

export default function MoneyPage() {
  const router = useRouter();
  const [moneyBreakdown, setMoneyBreakdown] = useState<MoneyBreakdown | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMoney() {
      const [profile, localMoneyBreakdown] = await Promise.all([
        indexedDbFinanceRepository.getProfile(),
        indexedDbFinanceRepository.getMoneyBreakdown()
      ]);

      if (!isMounted) {
        return;
      }

      if (!profile?.onboardingCompleted || !localMoneyBreakdown) {
        router.replace("/onboarding");
        return;
      }

      setMoneyBreakdown(localMoneyBreakdown);
    }

    void loadMoney();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const mandatoryCommitments = moneyBreakdown
    ? calculateMandatoryCommitments(moneyBreakdown)
    : 0;
  const availableMoney = moneyBreakdown ? calculateAvailableMoney(moneyBreakdown) : 0;

  return (
    <MobileShell>
      <PlaceholderScreen
        eyebrow="Cash flow"
        title="Where your money goes"
        description="A simple monthly summary of income, mandatory commitments, and available money."
      >
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Income</p>
            <p className="font-semibold">
              {formatInr(moneyBreakdown?.monthlyIncome ?? 0, { compact: true })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Committed</p>
            <p className="font-semibold">
              {formatInr(mandatoryCommitments, { compact: true })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Available</p>
            <p className="font-semibold">
              {formatInr(availableMoney, { compact: true })}
            </p>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link href="/money/edit">Edit cash flow</Link>
        </Button>
      </PlaceholderScreen>
    </MobileShell>
  );
}
