"use client";

import {
  CalendarClock,
  Home,
  Layers,
  Lightbulb,
  UserRound,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { radius, shell } from "@/lib/design-tokens";
import {
  BOTTOM_NAV_ITEMS,
  getActiveNavDomain,
  type BottomNavIconId,
  type BottomNavItemConfig
} from "@/navigation";

const NAV_ICONS: Record<BottomNavIconId, LucideIcon> = {
  home: Home,
  products: Layers,
  commitments: CalendarClock,
  insights: Lightbulb,
  profile: UserRound
};

export function BottomNavigation() {
  const pathname = usePathname();
  const activeDomain = getActiveNavDomain(pathname);

  return (
    <nav
      aria-label="Primary navigation"
      className={cn("pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto", shell.maxWidth)}
    >
      <div className="pointer-events-auto px-3 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] pt-2 sm:px-4">
        <div
          className={cn(
            "flex w-full items-stretch border border-white/70 bg-card/90 shadow-soft backdrop-blur-xl",
            radius.card
          )}
          style={{ minHeight: "var(--fcc-bottom-nav-bar-height)" }}
        >
          {BOTTOM_NAV_ITEMS.map((item) => (
            <BottomNavLink
              key={item.domain}
              item={item}
              isActive={activeDomain === item.domain}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

interface BottomNavLinkProps {
  item: BottomNavItemConfig;
  isActive: boolean;
}

function BottomNavLink({ item, isActive }: BottomNavLinkProps) {
  const Icon = NAV_ICONS[item.icon];

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      title={item.label}
      className={cn(
        "group relative flex min-h-12 min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 px-1 py-2",
        "rounded-[1.25rem] transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
      )}
    >
      {isActive ? (
        <span
          aria-hidden
          className="absolute inset-x-1.5 inset-y-1.5 rounded-[1rem] bg-foreground/[0.06]"
        />
      ) : null}

      <Icon
        aria-hidden
        className="relative h-6 w-6 shrink-0"
        strokeWidth={isActive ? 2.25 : 1.75}
      />

      <span
        aria-hidden
        className={cn(
          "relative block w-full min-w-0 max-w-full truncate text-center leading-none",
          "text-[0.6875rem] sm:text-xs",
          isActive ? "font-semibold" : "font-medium"
        )}
      >
        {item.navLabel}
      </span>
    </Link>
  );
}
