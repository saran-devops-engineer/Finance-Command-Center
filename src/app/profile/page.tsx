"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { SaveSuccessBanner } from "@/components/ui/save-success-banner";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { card, radius, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { financeRepository, type BackupPreview } from "@/repositories";
import { AppEvent, ScreenName, trackApplicationEvent, trackScreenViewed } from "@/core/analytics";
import { notifyFinanceDataRestored } from "@/lib/finance-data-events";
import type { UserProfile } from "@/shared/domain/finance";

const preferences = (profile: UserProfile | null) =>
  [
    ["Currency", profile?.currency === "INR" || !profile?.currency ? "INR ₹" : profile.currency],
    ["Storage", "On-device only"],
    ["Backup", "Readable JSON file"],
    ["Appearance", "Automatic"],
    ["Passcode", "Planned"]
  ] as const;

const privacyPrinciples = [
  {
    title: "Stored on this device",
    description: "Your live financial data stays in this browser's IndexedDB."
  },
  {
    title: "No account required",
    description: "V1 does not use login, backend storage, or cloud sync."
  },
  {
    title: "Portable recovery",
    description: "Structured JSON files are for backup, restore, and migration."
  }
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [lastRestoreAt, setLastRestoreAt] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const hasTrackedSettingsOpen = useRef(false);

  useEffect(() => {
    setShowSavedBanner(new URLSearchParams(window.location.search).get("saved") === "1");
  }, []);

  const loadProfile = useCallback(async () => {
    const [localProfile, settings] = await Promise.all([
      financeRepository.getProfile(),
      financeRepository.getSettings()
    ]);

    if (!localProfile?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    setProfile(localProfile);
    setLastBackupAt(settings.lastBackupAt);
    setLastRestoreAt(settings.lastRestoreAt);
  }, [router]);

  useEffect(() => {
    void loadProfile();

    if (!hasTrackedSettingsOpen.current) {
      hasTrackedSettingsOpen.current = true;
      trackScreenViewed(ScreenName.PROFILE);
      trackApplicationEvent(AppEvent.SETTINGS_OPENED);
    }
  }, [loadProfile]);

  useFinanceDataReload(() => {
    void loadProfile();
  });

  const displayName = getDisplayName(profile);
  const initial = displayName.charAt(0).toUpperCase();

  async function handleCreateBackup() {
    setIsWorking(true);
    setBackupStatus(null);

    try {
      const backup = await financeRepository.exportBackup();
      const url = URL.createObjectURL(backup.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = backup.filename;
      link.click();
      URL.revokeObjectURL(url);
      await financeRepository.saveSettings({ lastBackupAt: backup.createdAt });
      setLastBackupAt(backup.createdAt);
      setBackupStatus("JSON backup created. Store the file somewhere safe.");
      trackApplicationEvent(AppEvent.BACKUP_CREATED, { filename: backup.filename });
      trackApplicationEvent(AppEvent.EXPORT_JSON);
    } catch (error) {
      setBackupStatus(getErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  }

  async function handleRestoreBackup(file: File | undefined) {
    if (!file) {
      return;
    }

    setIsWorking(true);
    setBackupStatus(null);

    try {
      const preview = await financeRepository.inspectBackup(file);
      const shouldRestore = window.confirm(createRestoreSummary(preview));

      if (!shouldRestore) {
        setBackupStatus("Restore cancelled.");
        return;
      }

      const restored = await financeRepository.restoreBackup(file);
      const restoredAt = new Date().toISOString();
      await financeRepository.saveSettings({ lastRestoreAt: restoredAt });
      setLastRestoreAt(restoredAt);
      setBackupStatus(
        `Restored JSON backup from ${new Date(restored.createdAt).toLocaleDateString("en-IN")}.`
      );

      // Phase 4 — refresh every subscribed screen from IndexedDB, then return to dashboard.
      notifyFinanceDataRestored();
      trackApplicationEvent(AppEvent.BACKUP_RESTORED);
      trackApplicationEvent(AppEvent.IMPORT_JSON);
      await loadProfile();
      router.replace("/");
    } catch (error) {
      setBackupStatus(getErrorMessage(error));
    } finally {
      setIsWorking(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <MobileShell>
      <div className={spacing.page}>
        {showSavedBanner ? (
          <SaveSuccessBanner message="Profile updated. Your greeting and snapshot are refreshed." />
        ) : null}

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
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-3xl tracking-[-0.04em]">
              {displayName}
            </h2>
            <p className="text-sm text-muted-foreground">Private ledger · on-device only</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/profile/edit">Edit</Link>
          </Button>
        </Card>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Data ownership
          </p>
          <Card className="space-y-4">
            <h2 className="font-display text-3xl tracking-[-0.04em]">
              Your data stays with you.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Finance Command Center reads and writes from this device first. Backups
              are portable files you control.
            </p>
            <div className="space-y-3">
              {privacyPrinciples.map((principle) => (
                <div key={principle.title} className={cn("bg-white/45", radius.inner, card.paddingCompact)}>
                  <p className="font-medium">{principle.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Reminders
          </p>
          <Card className="divide-y divide-border/70 p-0">
            <Link
              href="/notifications"
              className="flex items-center justify-between gap-4 p-5 transition hover:bg-white/30"
            >
              <div>
                <p className="font-medium">Notification Center</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Timeline-based reminders that work offline
                </p>
              </div>
              <span className="text-sm text-muted-foreground">Open</span>
            </Link>
          </Card>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Data & privacy
          </p>
          <Card className="divide-y divide-border/70 p-0">
            {preferences(profile).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 p-5">
                <p className="font-medium">{label}</p>
                <p className="text-right text-sm text-muted-foreground">{value}</p>
              </div>
            ))}
          </Card>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Backup & restore
          </p>
          <Card className="space-y-5">
            <div className="space-y-2">
              <h2 className="font-display text-3xl tracking-[-0.04em]">
                Create Backup
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Save a copy of your financial data so you can restore it if you
                change devices or lose your browser data.
              </p>
            </div>

            <MetricCardGrid>
              <MetricCard label="Backup" value={formatStoredDate(lastBackupAt)} />
              <MetricCard label="Restore" value={formatStoredDate(lastRestoreAt)} />
            </MetricCardGrid>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                disabled={isWorking}
                onClick={() => void handleCreateBackup()}
              >
                {isWorking ? "Working..." : "Create Backup"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isWorking}
                onClick={() => fileInputRef.current?.click()}
              >
                Restore Backup
              </Button>
            </div>

            <div className={cn("bg-white/45", radius.inner, card.paddingCompact)}>
              <p className="font-medium">Restore Backup</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Restore your previously saved financial data from a backup file.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => void handleRestoreBackup(event.target.files?.[0])}
            />

            {backupStatus ? (
              <div className={cn("bg-white/45", radius.inner, card.paddingCompact)}>
                <p className="text-sm leading-6 text-muted-foreground">{backupStatus}</p>
              </div>
            ) : null}

            <p className="text-xs leading-5 text-muted-foreground">
              JSON backups are readable files. Keep them somewhere private. Future
              versions can add password encryption using the same backup service.
            </p>
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

function formatStoredDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}

function createRestoreSummary(preview: BackupPreview) {
  return [
    "Restore this backup?",
    "",
    `Backup date: ${new Date(preview.createdAt).toLocaleString("en-IN")}`,
    `App version: ${preview.appVersion}`,
    `Loans: ${preview.metadata.loanCount}`,
    `Payment records: ${preview.metadata.loanPaymentCount}`,
    `Income sources: ${preview.metadata.incomeSources}`,
    `Expense categories: ${preview.metadata.expenseCategories}`,
    "",
    "This will replace the current on-device data."
  ].join("\n");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
