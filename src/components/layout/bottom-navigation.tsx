"use client";

import { BarChart3, CreditCard, Home, Lightbulb, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { radius, shell } from "@/lib/design-tokens";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/loans", label: "Loans", icon: CreditCard },
  { href: "/money", label: "Money", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/profile", label: "Profile", icon: UserRound }
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mx-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]",
        shell.maxWidth,
        "px-5"
      )}
    >
      <div
        className={cn(
          "grid h-16 grid-cols-5 border border-white/70 bg-card/82 px-2 shadow-soft backdrop-blur-xl",
          radius.card
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[0.64rem] uppercase tracking-[0.16em] text-muted-foreground transition",
                isActive && "text-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.7} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
