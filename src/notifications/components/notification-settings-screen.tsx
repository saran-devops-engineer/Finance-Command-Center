"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { card, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { financeRepository } from "@/repositories";
import { AppRoute } from "@/navigation";
import {
  NotificationPrivacyLevel,
  type FinancialNotificationSettings
} from "@/notifications/models";
import {
  DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
  normalizeNotificationSettings
} from "@/notifications/settings/defaults";
import { getNotificationProviderManager } from "@/notifications/manager/provider-manager";

export function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<FinancialNotificationSettings>(
    DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    trackScreenViewed(ScreenName.SETTINGS);
    void financeRepository.getNotificationSettings().then((value) => {
      setSettings(normalizeNotificationSettings(value));
    });
  }, []);

  const manager = getNotificationProviderManager();

  async function save(next: FinancialNotificationSettings) {
    const normalized = normalizeNotificationSettings(next);
    setSettings(normalized);
    await financeRepository.saveNotificationSettings({
      ...normalized,
      updatedAt: new Date().toISOString()
    });
    setStatus("Settings saved.");
  }

  async function handleEnableToggle() {
    setIsWorking(true);
    setStatus(null);
    try {
      if (settings.enabled) {
        const next = await manager.disableNotifications(settings);
        await save(next);
        return;
      }

      const result = await manager.enableNotifications(settings);
      await save(result.settings);
      setStatus(result.userMessage ?? "Notifications enabled.");
    } finally {
      setIsWorking(false);
    }
  }

  const privacyLabels = {
    [NotificationPrivacyLevel.PRIVATE]: "Private",
    [NotificationPrivacyLevel.BALANCED]: "Balanced",
    [NotificationPrivacyLevel.DETAILED]: "Detailed"
  } as const;

  return (
    <MobileShell>
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Settings
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Notifications
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Delivery is automatic. Finance Command Center chooses the best method for your device.
          </p>
        </header>

        <Card className="divide-y divide-border/70 p-0">
          <SettingRow label="Enable notifications" value={settings.enabled ? "Enabled" : "Disabled"} />
          <SettingRow label="Delivery" value="Automatic" />
          <SettingRow
            label="Privacy level"
            value={privacyLabels[settings.privacyLevel]}
            onPress={() =>
              void save({
                ...settings,
                privacyLevel:
                  settings.privacyLevel === NotificationPrivacyLevel.PRIVATE
                    ? NotificationPrivacyLevel.BALANCED
                    : settings.privacyLevel === NotificationPrivacyLevel.BALANCED
                      ? NotificationPrivacyLevel.DETAILED
                      : NotificationPrivacyLevel.PRIVATE
              })
            }
          />
          <SettingRow
            label="Smart grouping"
            value={settings.groupingEnabled ? "On" : "Off"}
            onPress={() => void save({ ...settings, groupingEnabled: !settings.groupingEnabled })}
          />
          <SettingRow
            label="Quiet hours"
            value={
              settings.quietHours.enabled
                ? `${settings.quietHours.startHour}:00 – ${settings.quietHours.endHour}:00`
                : "Off"
            }
            onPress={() =>
              void save({
                ...settings,
                quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled }
              })
            }
          />
          <SettingRow
            label="Snooze duration"
            value={`${settings.defaultSnoozeMinutes} minutes`}
            onPress={() =>
              void save({
                ...settings,
                defaultSnoozeMinutes:
                  settings.defaultSnoozeMinutes === 60
                    ? 30
                    : settings.defaultSnoozeMinutes === 30
                      ? 120
                      : 60
              })
            }
          />
        </Card>

        <Card className={cn("space-y-2", card.paddingCompact)}>
          <p className="font-medium">Reminder rules</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Reminders are generated at {settings.reminderOffsetsDays.join(", ")} days before each
            due date, plus due today and overdue alerts.
          </p>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={isWorking} onClick={() => void handleEnableToggle()}>
            {settings.enabled ? "Disable Notifications" : "Enable Notifications"}
          </Button>
          <Button asChild variant="secondary">
            <Link href={AppRoute.NOTIFICATIONS}>Notification Center</Link>
          </Button>
        </div>

        {status ? <Card className="text-sm text-muted-foreground">{status}</Card> : null}
      </div>
    </MobileShell>
  );
}

function SettingRow({
  label,
  value,
  onPress
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const className = "flex w-full items-center justify-between gap-4 p-5 text-left";

  if (!onPress) {
    return (
      <div className={className}>
        <span className="font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{value}</span>
      </div>
    );
  }

  return (
    <button type="button" className={className} onClick={onPress}>
      <span className="font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </button>
  );
}
