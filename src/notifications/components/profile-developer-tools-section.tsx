"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AppRoute } from "@/navigation";
import { useDeveloperToolsEnabled } from "@/hooks/use-developer-tools-enabled";

export function ProfileDeveloperToolsSection() {
  const enabled = useDeveloperToolsEnabled();

  if (!enabled) {
    return null;
  }

  return (
    <section className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Developer Tools
      </p>
      <Card className="divide-y divide-border/70 p-0">
        <Link
          href={AppRoute.PROFILE_DEVELOPER_NOTIFICATION_TESTING}
          className="flex items-center justify-between gap-4 p-5 transition hover:bg-white/30"
        >
          <div>
            <p className="font-medium">Notification Testing</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate and verify reminders on demand — non-production only
            </p>
          </div>
          <span className="text-sm text-muted-foreground">Open</span>
        </Link>
      </Card>
    </section>
  );
}
