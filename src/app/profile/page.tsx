"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Card } from "@/components/ui/card";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import type { UserProfile } from "@/shared/domain/finance";

const preferences = [
  ["Currency", "INR ₹"],
  ["Storage", "On-device only"],
  ["Backup", "Planned for V1.1"],
  ["Appearance", "Automatic"],
  ["Passcode", "Planned"]
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const localProfile = await indexedDbFinanceRepository.getProfile();

      if (!isMounted) {
        return;
      }

      if (!localProfile?.onboardingCompleted) {
        router.replace("/onboarding");
        return;
      }

      setProfile(localProfile);
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const displayName = getDisplayName(profile);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <MobileShell>
      <div className="space-y-8">
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Account
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            {displayName}
          </h1>
        </header>

        <Card className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary font-display text-2xl text-primary-foreground">
            {initial}
          </div>
          <div>
            <h2 className="font-display text-3xl tracking-[-0.04em]">
              {displayName}
            </h2>
            <p className="text-sm text-muted-foreground">Private ledger · on-device only</p>
          </div>
        </Card>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Data & privacy
          </p>
          <Card className="divide-y divide-border/70 p-0">
            {preferences.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 p-5">
                <p className="font-medium">{label}</p>
                <p className="text-right text-sm text-muted-foreground">{value}</p>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </MobileShell>
  );
}

function getDisplayName(profile: UserProfile | null) {
  const displayName = profile?.displayName.trim() ?? "";
  const normalizedName = displayName.toLowerCase();

  if (!displayName || normalizedName === "vikram" || normalizedName === "friend") {
    return "Arjun";
  }

  return displayName;
}
