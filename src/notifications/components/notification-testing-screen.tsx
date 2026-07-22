"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { card, radius, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useDeveloperToolsEnabled } from "@/hooks/use-developer-tools-enabled";
import { financeRepository } from "@/repositories";
import { AppRoute } from "@/navigation";
import { NotificationActionType } from "@/notifications/models";
import type { FinancialNotification } from "@/notifications/models";
import type { NotificationTestScenario } from "@/notifications/testing/fixtures";
import {
  clearSimulatedTime,
  clearTestNotificationQueue,
  createTestReminderViaPipeline,
  deliverTestQueueNow,
  disableUnsupportedSimulation,
  enableUnsupportedSimulation,
  generateGroupingTestReminders,
  generateTestReminders,
  getNotificationTestingDiagnostics,
  getNotificationTestingHistoryCounts,
  getNotificationTestingStatus,
  listTestNotifications,
  performTestNotificationAction,
  recoverFromOfflineSimulation,
  requestNotificationTestingPermission,
  resetNotificationTesting,
  runOfflineSimulationTest,
  runScenarioViaPipeline,
  sendPureTestNotification,
  setQuietHoursForTesting,
  simulateQuietHoursNow,
  type NotificationTestingDiagnostics,
  type NotificationTestingHistoryCounts,
  type NotificationTestingStatus
} from "@/notifications/testing/notification-testing-service";

const SCENARIO_BUTTONS: Array<{ id: NotificationTestScenario; label: string }> = [
  { id: "emi_due_tomorrow", label: "EMI Due Tomorrow" },
  { id: "insurance_due", label: "Insurance Due" },
  { id: "credit_card_due", label: "Credit Card Due" },
  { id: "subscription_due", label: "Subscription Due" },
  { id: "overdue_payment", label: "Overdue Payment" },
  { id: "pending_confirmation", label: "Pending Confirmation" },
  { id: "missed_confirmation", label: "Missed Confirmation" }
];

export function NotificationTestingScreen() {
  const router = useRouter();
  const developerToolsEnabled = useDeveloperToolsEnabled();
  const [status, setStatus] = useState<NotificationTestingStatus | null>(null);
  const [diagnostics, setDiagnostics] = useState<NotificationTestingDiagnostics | null>(null);
  const [historyCounts, setHistoryCounts] = useState<NotificationTestingHistoryCounts | null>(null);
  const [testNotifications, setTestNotifications] = useState<FinancialNotification[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const refresh = useCallback(async () => {
    const [nextStatus, nextDiagnostics, nextHistory, nextTests] = await Promise.all([
      getNotificationTestingStatus(financeRepository),
      getNotificationTestingDiagnostics(financeRepository),
      getNotificationTestingHistoryCounts(financeRepository),
      listTestNotifications(financeRepository)
    ]);

    setStatus(nextStatus);
    setDiagnostics(nextDiagnostics);
    setHistoryCounts(nextHistory);
    setTestNotifications(nextTests);
  }, []);

  useEffect(() => {
    if (!developerToolsEnabled) {
      router.replace(AppRoute.PROFILE);
      return;
    }

    trackScreenViewed(ScreenName.SETTINGS);
    void refresh();
  }, [developerToolsEnabled, refresh, router]);

  async function runAction(label: string, action: () => Promise<unknown>) {
    setIsWorking(true);
    setMessage(null);
    try {
      await action();
      setMessage(`${label} completed.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsWorking(false);
    }
  }

  if (!developerToolsEnabled) {
    return null;
  }

  return (
    <MobileShell>
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Developer Tools
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Notification Testing
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Verify the full notification pipeline in under a minute. Test data never modifies real
            financial products.
          </p>
        </header>

        <Card className={cn("space-y-3", card.paddingCompact)}>
          <SectionTitle>Status</SectionTitle>
          <StatusRow label="Notification Permission" value={formatPermission(status?.permission)} />
          <StatusRow label="Current Provider" value={status?.currentProvider ?? "—"} />
          <StatusRow
            label="Notification Center Status"
            value={status?.notificationCenterEnabled ? "Active" : "Inactive"}
          />
          <StatusRow label="Service Worker Status (Future)" value={status?.serviceWorkerStatus ?? "—"} />
          <StatusRow label="Last Notification Time" value={formatTime(status?.lastNotificationTime)} />
        </Card>

        <Card className={cn("space-y-3", card.paddingCompact)}>
          <SectionTitle>Permission & Provider</SectionTitle>
          <ActionRow
            disabled={isWorking}
            onClick={() => void runAction("Permission request", () => requestNotificationTestingPermission(financeRepository))}
          >
            Request Notification Permission
          </ActionRow>
          <ActionRow
            disabled={isWorking}
            onClick={() => void runAction("Test notification", () => sendPureTestNotification())}
          >
            Send Test Notification
          </ActionRow>
          <ActionRow
            disabled={isWorking}
            onClick={() => void runAction("Test reminder", () => createTestReminderViaPipeline(financeRepository))}
          >
            Create Test Reminder
          </ActionRow>
          <ActionRow
            disabled={isWorking}
            onClick={() => void runAction("Deliver queue", () => deliverTestQueueNow(financeRepository))}
          >
            Deliver Pending Device Notifications
          </ActionRow>
        </Card>

        <Card className={cn("space-y-3", card.paddingCompact)}>
          <SectionTitle>Simulate Events</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {SCENARIO_BUTTONS.map((scenario) => (
              <Button
                key={scenario.id}
                type="button"
                size="sm"
                variant="secondary"
                disabled={isWorking}
                onClick={() =>
                  void runAction(scenario.label, () =>
                    runScenarioViaPipeline(financeRepository, scenario.id)
                  )
                }
              >
                {scenario.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className={cn("space-y-3", card.paddingCompact)}>
          <SectionTitle>Queue Testing</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isWorking}
              onClick={() =>
                void runAction("Generate 1 reminder", () => generateTestReminders(financeRepository, 1))
              }
            >
              Generate 1 Reminder
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() =>
                void runAction("Generate 10 reminders", () => generateTestReminders(financeRepository, 10))
              }
            >
              Generate 10 Reminders
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() =>
                void runAction("Generate 100 reminders", () => generateTestReminders(financeRepository, 100))
              }
            >
              Generate 100 Reminders
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() =>
                void runAction("Clear test queue", () => clearTestNotificationQueue(financeRepository))
              }
            >
              Clear Test Queue
            </Button>
          </div>
        </Card>

        <Card className={cn("space-y-3", card.paddingCompact)}>
          <SectionTitle>Grouping Test</SectionTitle>
          <Button
            type="button"
            disabled={isWorking}
            onClick={() =>
              void runAction("Generate multiple notifications", () =>
                generateGroupingTestReminders(financeRepository)
              )
            }
          >
            Generate Multiple Notifications
          </Button>
          <p className="text-sm text-muted-foreground">
            Creates Loan, Insurance, Electricity, and Subscription reminders due tomorrow.
          </p>
        </Card>

        <Card className={cn("space-y-3", card.paddingCompact)}>
          <SectionTitle>Quiet Hours Test</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() =>
                void runAction("Enable quiet hours", () => setQuietHoursForTesting(financeRepository, true))
              }
            >
              Enable Quiet Hours
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() =>
                void runAction("Disable quiet hours", () => setQuietHoursForTesting(financeRepository, false))
              }
            >
              Disable Quiet Hours
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() =>
                void runAction("Simulate quiet-hours time", () => simulateQuietHoursNow(financeRepository))
              }
            >
              Simulate Current Time (23:00 UTC)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() => void runAction("Clear simulated time", () => clearSimulatedTime())}
            >
              Clear Simulated Time
            </Button>
          </div>
        </Card>

        <Card className={cn("space-y-3", card.paddingCompact)}>
          <SectionTitle>Offline & Unsupported</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() =>
                void runAction("Offline simulation", () => runOfflineSimulationTest(financeRepository))
              }
            >
              Offline Simulation
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() =>
                void runAction("Recover after reconnect", () =>
                  recoverFromOfflineSimulation(financeRepository)
                )
              }
            >
              Recover After Reconnect
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() =>
                void runAction("Simulate unsupported", async () => {
                  enableUnsupportedSimulation();
                })
              }
            >
              Simulate Unsupported Notifications
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isWorking}
              onClick={() =>
                void runAction("Clear unsupported simulation", async () => {
                  disableUnsupportedSimulation();
                })
              }
            >
              Clear Unsupported Simulation
            </Button>
          </div>
        </Card>

        <Card className={cn("space-y-3", card.paddingCompact)}>
          <SectionTitle>Test Actions</SectionTitle>
          {testNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create a test reminder to exercise actions.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">{testNotifications[0]?.title}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  NotificationActionType.OPEN_PRODUCT,
                  NotificationActionType.MARK_PAID,
                  NotificationActionType.SNOOZE,
                  NotificationActionType.DISMISS
                ].map((action) => (
                  <Button
                    key={action}
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isWorking || !testNotifications[0]}
                    onClick={() =>
                      void runAction(action, () =>
                        performTestNotificationAction(
                          financeRepository,
                          testNotifications[0]!.id,
                          action
                        )
                      )
                    }
                  >
                    {action.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className={cn("space-y-3", card.paddingCompact)}>
          <SectionTitle>History</SectionTitle>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {historyCounts
              ? Object.entries(historyCounts).map(([key, value]) => (
                  <div key={key} className={cn("bg-white/45", radius.inner, "px-3 py-2")}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{key}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))
              : null}
          </div>
        </Card>

        <Card className={cn("space-y-3", card.paddingCompact)}>
          <SectionTitle>Diagnostics (read-only)</SectionTitle>
          {diagnostics ? (
            <div className="space-y-2 text-sm">
              <DiagRow label="Environment" value={diagnostics.environment} />
              <DiagRow label="Notification API Supported" value={String(diagnostics.notificationApiSupported)} />
              <DiagRow label="Notification Permission" value={formatPermission(diagnostics.notificationPermission)} />
              <DiagRow label="PWA Installed" value={String(diagnostics.pwaInstalled)} />
              <DiagRow label="Provider Selected" value={diagnostics.providerSelected} />
              <DiagRow label="Current Queue Size (test)" value={String(diagnostics.queueSize)} />
              <DiagRow label="Pending Notifications (test)" value={String(diagnostics.pendingNotifications)} />
              <DiagRow label="Failed Notifications (test)" value={String(diagnostics.failedNotifications)} />
              <DiagRow label="Last Delivery Time" value={formatTime(diagnostics.lastDeliveryTime)} />
              <DiagRow label="Last Error" value={diagnostics.lastError ?? "None"} />
              <DiagRow label="Offline Simulation" value={String(diagnostics.offlineSimulation)} />
              <DiagRow label="Unsupported Simulation" value={String(diagnostics.unsupportedSimulation)} />
              <DiagRow label="Simulated Time" value={formatTime(diagnostics.simulatedReferenceIso)} />
            </div>
          ) : null}
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isWorking}
            onClick={() =>
              void runAction("Reset notification testing", () =>
                resetNotificationTesting(financeRepository)
              )
            }
          >
            Reset Notification Testing
          </Button>
          <Button asChild variant="secondary">
            <Link href={AppRoute.NOTIFICATIONS}>Open Notification Center</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={AppRoute.PROFILE}>Back to Profile</Link>
          </Button>
        </div>

        {message ? (
          <Card className="text-sm leading-6 text-muted-foreground">{message}</Card>
        ) : null}
      </div>
    </MobileShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-medium">{children}</p>;
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function DiagRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium">{value}</span>
    </div>
  );
}

function ActionRow({
  children,
  disabled,
  onClick
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" className="w-full justify-start" variant="secondary" disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

function formatPermission(value: NotificationPermission | "unsupported" | undefined) {
  if (!value) {
    return "—";
  }

  if (value === "unsupported") {
    return "Unsupported";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
