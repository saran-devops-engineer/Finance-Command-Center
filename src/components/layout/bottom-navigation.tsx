"use client";

import { BarChart3, CreditCard, Home, Lightbulb, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="grid grid-cols-5 rounded-[1.75rem] border border-white/70 bg-card/82 px-2 py-3 shadow-soft backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[0.64rem] uppercase tracking-[0.16em] text-muted-foreground transition",
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
