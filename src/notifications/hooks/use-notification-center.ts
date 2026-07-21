"use client";

import { useCallback, useEffect, useState } from "react";
import { financeRepository } from "@/repositories";
import {
  filterNotifications,
  handleNotificationAction,
  sortCenterNotifications,
  summarizeNotificationCenter,
  type NotificationCenterFilter
} from "@/notifications";
import type { FinancialNotification, NotificationCenterSummary } from "@/notifications/models";
import { syncFinancialNotificationsFromTimeline } from "@/notifications/services/timeline-sync-service";
import { DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS } from "@/notifications/settings/defaults";

export function useNotificationCenter() {
  const [filter, setFilter] = useState<NotificationCenterFilter>("unread");
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<FinancialNotification[]>([]);
  const [summary, setSummary] = useState<NotificationCenterSummary>({
    unreadCount: 0,
    snoozedCount: 0,
    overdueCount: 0,
    todayCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await syncFinancialNotificationsFromTimeline(financeRepository);
      const nextQueue = await financeRepository.listNotificationQueue();
      setQueue(nextQueue);
      setSummary(summarizeNotificationCenter(nextQueue));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible = sortCenterNotifications(filterNotifications(queue, filter)).filter((item) => {
    if (!query.trim()) {
      return true;
    }

    const normalized = query.trim().toLowerCase();
    return (
      item.title.toLowerCase().includes(normalized) ||
      item.body.toLowerCase().includes(normalized) ||
      item.productLabel.toLowerCase().includes(normalized)
    );
  });

  async function performAction(
    notificationId: string,
    action: FinancialNotification["actions"][number]
  ) {
    const nowIso = new Date().toISOString();
    const settings = (await financeRepository.getNotificationSettings()) ?? {
      ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
      updatedAt: nowIso
    };
    const history = await financeRepository.listNotificationHistory();
    const { queue: nextQueue, history: nextHistory } = handleNotificationAction(
      queue,
      history,
      {
        notificationId,
        action,
        snoozeMinutes: settings.defaultSnoozeMinutes
      },
      nowIso,
      settings
    );

    await Promise.all([
      financeRepository.saveNotificationQueue(nextQueue),
      financeRepository.saveNotificationHistory(nextHistory)
    ]);
    setQueue(nextQueue);
    setSummary(summarizeNotificationCenter(nextQueue));
  }

  return {
    filter,
    setFilter,
    query,
    setQuery,
    visible,
    summary,
    isLoading,
    refresh,
    performAction
  };
}
