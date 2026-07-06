"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import {
  createEncryptedBackup,
  restoreEncryptedBackup
} from "@/storage/backup/backup-service";
import type { UserProfile } from "@/shared/domain/finance";

const preferences = [
  ["Currency", "INR ₹"],
  ["Storage", "On-device only"],
  ["Backup", "Encrypted .fcc file"],
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
    description: "Encrypted .fcc files are for backup, restore, and migration."
  }
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [backupPassword, setBackupPassword] = useState("");
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [lastRestoreAt, setLastRestoreAt] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

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
      setLastBackupAt(localStorage.getItem("fcc:lastBackupAt"));
      setLastRestoreAt(localStorage.getItem("fcc:lastRestoreAt"));
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const displayName = getDisplayName(profile);
  const initial = displayName.charAt(0).toUpperCase();

  async function handleCreateBackup() {
    setIsWorking(true);
    setBackupStatus(null);

    try {
      const backup = await createEncryptedBackup({
        repository: indexedDbFinanceRepository,
        password: backupPassword
      });
      const url = URL.createObjectURL(backup.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = backup.filename;
      link.click();
      URL.revokeObjectURL(url);
      localStorage.setItem("fcc:lastBackupAt", backup.envelope.createdAt);
      setLastBackupAt(backup.envelope.createdAt);
      setBackupStatus("Encrypted backup created. Store the .fcc file somewhere safe.");
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

    const shouldRestore = window.confirm(
      "Restore will replace the current on-device data with this backup. Continue?"
    );

    if (!shouldRestore) {
      return;
    }

    setIsWorking(true);
    setBackupStatus(null);

    try {
      const restored = await restoreEncryptedBackup({
        file,
        password: backupPassword,
        repository: indexedDbFinanceRepository
      });
      const restoredAt = new Date().toISOString();
      localStorage.setItem("fcc:lastRestoreAt", restoredAt);
      setLastRestoreAt(restoredAt);
      setBackupStatus(
        `Restored backup from ${new Date(restored.createdAt).toLocaleDateString("en-IN")}.`
      );
      router.refresh();
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
            Data ownership
          </p>
          <Card className="space-y-4">
            <h2 className="font-display text-3xl tracking-[-0.04em]">
              Your data stays with you.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Finance Command Center reads and writes from this device first. Backups
              are encrypted files you control.
            </p>
            <div className="space-y-3">
              {privacyPrinciples.map((principle) => (
                <div key={principle.title} className="rounded-3xl bg-white/45 p-4">
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

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Secure backup
          </p>
          <Card className="space-y-5">
            <div className="space-y-2">
              <h2 className="font-display text-3xl tracking-[-0.04em]">
                Own your recovery file.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Create an encrypted `.fcc` backup for restore or device migration.
                The app still reads and writes from IndexedDB.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <StatusMetric label="Last backup" value={formatStoredDate(lastBackupAt)} />
              <StatusMetric label="Last restore" value={formatStoredDate(lastRestoreAt)} />
            </div>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Backup password
              </span>
              <input
                value={backupPassword}
                onChange={(event) => setBackupPassword(event.target.value)}
                type="password"
                placeholder="Minimum 8 characters"
                className="h-12 w-full rounded-3xl border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                disabled={isWorking || backupPassword.trim().length < 8}
                onClick={() => void handleCreateBackup()}
              >
                {isWorking ? "Working..." : "Export .fcc"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isWorking || backupPassword.trim().length < 8}
                onClick={() => fileInputRef.current?.click()}
              >
                Restore
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".fcc,application/vnd.finance-command-center.backup"
              className="hidden"
              onChange={(event) => void handleRestoreBackup(event.target.files?.[0])}
            />

            {backupStatus ? (
              <div className="rounded-3xl bg-white/45 p-4">
                <p className="text-sm leading-6 text-muted-foreground">{backupStatus}</p>
              </div>
            ) : null}

            <p className="text-xs leading-5 text-muted-foreground">
              If you forget this password, the backup cannot be recovered. Finance
              Command Center does not store the password.
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

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/45 p-4">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
