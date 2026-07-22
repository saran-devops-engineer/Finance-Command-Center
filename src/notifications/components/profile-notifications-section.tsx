"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { card, radius } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { financeRepository } from "@/repositories";
import { AppRoute } from "@/navigation";
import {
  CAPABILITY_LABELS,
  DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
  normalizeNotificationSettings
} from "@/notifications/settings/defaults";
import type { FinancialNotificationSettings } from "@/notifications/models";
import { getNotificationProviderManager } from "@/notifications/manager/provider-manager";

export function ProfileNotificationsSection() {
  const [settings, setSettings] = useState<FinancialNotificationSettings>(
    DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const refresh = useCallback(async () => {
    const stored = await financeRepository.getNotificationSettings();
    setSettings(normalizeNotificationSettings(stored));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const manager = getNotificationProviderManager();
  const capabilities = manager.resolveCapabilities(settings);

  async function handleEnable() {
    setIsWorking(true);
    setMessage(null);
    try {
      const result = await manager.enableNotifications(settings);
      await financeRepository.saveNotificationSettings(result.settings);
      setSettings(result.settings);
      setMessage(result.userMessage);
    } finally {
      setIsWorking(false);
    }
  }

  async function handleDisable() {
    setIsWorking(true);
    setMessage(null);
    try {
      const next = await manager.disableNotifications(settings);
      await financeRepository.saveNotificationSettings(next);
      setSettings(next);
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <section className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Notifications
      </p>
      <Card className="space-y-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Status</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {settings.enabled ? "Enabled" : "Disabled"}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={settings.enabled ? "secondary" : "primary"}
              disabled={isWorking}
              onClick={() => void (settings.enabled ? handleDisable() : handleEnable())}
            >
              {settings.enabled ? "Disable" : "Enable Notifications"}
            </Button>
          </div>

          <div className={cn("bg-white/45", radius.inner, card.paddingCompact)}>
            <p className="font-medium">Delivery</p>
            <p className="mt-1 text-sm text-muted-foreground">Automatic</p>
          </div>

          <div className={cn("bg-white/45", radius.inner, card.paddingCompact, "space-y-2")}>
            <p className="font-medium">Capabilities</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>{capabilities.inAppReminders ? "✔" : "○"} {CAPABILITY_LABELS.inAppReminders}</li>
              <li>{capabilities.notificationCenter ? "✔" : "○"} {CAPABILITY_LABELS.notificationCenter}</li>
              <li>
                {capabilities.deviceNotifications ? "✔" : "○"} {CAPABILITY_LABELS.deviceNotifications}
                {!capabilities.deviceNotificationsSupported && settings.enabled ? (
                  <span className="block pt-2 text-xs leading-5">
                    Your device doesn&apos;t support device notifications. You&apos;ll continue
                    receiving reminders inside Finance Command Center.
                  </span>
                ) : null}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary" size="sm">
            <Link href={AppRoute.NOTIFICATIONS}>Notification Center</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={`${AppRoute.NOTIFICATIONS}/settings`}>Notification Settings</Link>
          </Button>
        </div>

        {message ? (
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        ) : null}
      </Card>
    </section>
  );
}
