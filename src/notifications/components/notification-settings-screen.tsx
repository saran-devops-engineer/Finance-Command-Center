"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { spacing } from "@/lib/design-tokens";
import { financeRepository } from "@/repositories";
import { AppRoute } from "@/navigation";
import {
  NotificationPrivacyLevel,
  NotificationProviderId,
  type FinancialNotificationSettings
} from "@/notifications/models";
import { DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS } from "@/notifications/settings/defaults";
import { createBrowserFinancialNotificationProvider } from "@/notifications/providers";

export function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<FinancialNotificationSettings>(
    DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS
  );
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    trackScreenViewed(ScreenName.SETTINGS);
    void financeRepository.getNotificationSettings().then((value) => {
      if (value) {
        setSettings(value);
      }
    });
  }, []);

  async function save(next: FinancialNotificationSettings) {
    setSettings(next);
    await financeRepository.saveNotificationSettings({
      ...next,
      updatedAt: new Date().toISOString()
    });
    setStatus("Notification settings saved.");
  }

  async function requestBrowserPermission() {
    const provider = createBrowserFinancialNotificationProvider();
    const permission = await provider.requestPermission();
    setStatus(`Browser permission: ${permission}`);
  }

  return (
    <MobileShell>
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Settings
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Notification Settings
          </h1>
        </header>

        <Card className="divide-y divide-border/70 p-0">
          <SettingRow
            label="Enable notifications"
            value={settings.enabled ? "On" : "Off"}
            onToggle={() => void save({ ...settings, enabled: !settings.enabled })}
          />
          <SettingRow
            label="Privacy level"
            value={settings.privacyLevel}
            onToggle={() =>
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
            onToggle={() => void save({ ...settings, groupingEnabled: !settings.groupingEnabled })}
          />
          <SettingRow
            label="Quiet hours"
            value={
              settings.quietHours.enabled
                ? `${settings.quietHours.startHour}:00 – ${settings.quietHours.endHour}:00`
                : "Off"
            }
            onToggle={() =>
              void save({
                ...settings,
                quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled }
              })
            }
          />
          <SettingRow
            label="Default provider"
            value={settings.defaultProviderId}
            onToggle={() =>
              void save({
                ...settings,
                defaultProviderId:
                  settings.defaultProviderId === NotificationProviderId.BROWSER
                    ? NotificationProviderId.WEB_PUSH
                    : NotificationProviderId.BROWSER
              })
            }
          />
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => void requestBrowserPermission()}>
            Request Browser Permission
          </Button>
          <Button asChild variant="secondary">
            <Link href={AppRoute.NOTIFICATIONS}>Back to Notification Center</Link>
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
  onToggle
}: {
  label: string;
  value: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-4 p-5 text-left"
      onClick={onToggle}
    >
      <span className="font-medium">{label}</span>
      <span className="text-sm capitalize text-muted-foreground">{value.replaceAll("_", " ")}</span>
    </button>
  );
}
