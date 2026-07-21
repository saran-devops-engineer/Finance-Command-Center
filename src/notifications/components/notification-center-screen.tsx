"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenName, trackScreenViewed } from "@/core/analytics";
import { card, radius, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { AppRoute } from "@/navigation";
import { NotificationActionType } from "@/notifications/models";
import { useNotificationCenter } from "@/notifications/hooks/use-notification-center";

const filters = [
  ["unread", "Unread"],
  ["all", "All"],
  ["snoozed", "Snoozed"],
  ["history", "History"]
] as const;

export function NotificationCenterScreen() {
  const hasTracked = useRef(false);
  const { filter, setFilter, query, setQuery, visible, summary, isLoading, refresh, performAction } =
    useNotificationCenter();

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      trackScreenViewed(ScreenName.NOTIFICATIONS);
    }
  }, []);

  return (
    <MobileShell>
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Reminders
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Notification Center
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Every reminder comes from your Financial Timeline — never from banks or SMS.
          </p>
        </header>

        <Card className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Unread" value={String(summary.unreadCount)} />
          <Metric label="Today" value={String(summary.todayCount)} />
          <Metric label="Overdue" value={String(summary.overdueCount)} />
          <Metric label="Snoozed" value={String(summary.snoozedCount)} />
        </Card>

        <div className="flex flex-wrap gap-2">
          {filters.map(([id, label]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={filter === id ? "primary" : "secondary"}
              onClick={() => setFilter(id)}
            >
              {label}
            </Button>
          ))}
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search reminders"
          className={cn(
            "w-full rounded-2xl border border-border/70 bg-white/60 px-4 py-3 text-sm outline-none",
            radius.inner
          )}
        />

        <div className="space-y-3">
          {isLoading ? (
            <Card className="text-sm text-muted-foreground">Loading reminders…</Card>
          ) : visible.length === 0 ? (
            <Card className="space-y-2">
              <p className="font-medium">No reminders in this view.</p>
              <p className="text-sm leading-6 text-muted-foreground">
                When Financial Timeline events need attention, they appear here even if OS
                notifications are missed.
              </p>
            </Card>
          ) : (
            visible.map((notification) => (
              <Card key={notification.id} className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {notification.notificationType.replaceAll("_", " ")}
                  </p>
                  <h2 className="font-display text-2xl tracking-[-0.03em]">{notification.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{notification.body}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {notification.dueDate} · {notification.status.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void performAction(notification.id, NotificationActionType.SNOOZE)}
                  >
                    Snooze
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void performAction(notification.id, NotificationActionType.DISMISS)}
                  >
                    Dismiss
                  </Button>
                  <Button asChild type="button" size="sm">
                    <Link href={`/products/${notification.productTypeId}/${notification.productId}`}>
                      Open Product
                    </Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => void refresh()}>
            Refresh
          </Button>
          <Button asChild variant="secondary">
            <Link href={`${AppRoute.NOTIFICATIONS}/settings`}>Notification Settings</Link>
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("bg-white/45", radius.inner, card.paddingCompact)}>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl tracking-[-0.03em]">{value}</p>
    </div>
  );
}
