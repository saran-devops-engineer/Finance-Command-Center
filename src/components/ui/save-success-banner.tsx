"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/design-tokens";

interface SaveSuccessBannerProps {
  message: string;
  className?: string;
}

export function SaveSuccessBanner({ message, className }: SaveSuccessBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, 2400);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all duration-500",
        radius.inner,
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        className
      )}
    >
      <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
