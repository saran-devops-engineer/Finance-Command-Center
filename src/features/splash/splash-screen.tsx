"use client";

import Image from "next/image";
import { spacing } from "@/lib/design-tokens";
import { INSTALLED_APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center bg-background text-center",
        spacing.page
      )}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${INSTALLED_APP_NAME}`}
    >
      <div className="flex flex-col items-center space-y-8">
        <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-[32px] bg-[#17130f] shadow-card">
          <Image
            src="/icon.svg"
            alt=""
            width={96}
            height={96}
            priority
            aria-hidden
          />
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            {INSTALLED_APP_NAME}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Your Personal Finance Hub
          </p>
        </div>

        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Loading...
        </p>
      </div>
    </div>
  );
}
