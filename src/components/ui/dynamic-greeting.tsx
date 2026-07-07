"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour <= 11) {
    return "Good Morning";
  }

  if (hour >= 12 && hour <= 16) {
    return "Good Afternoon";
  }

  if (hour >= 17 && hour <= 20) {
    return "Good Evening";
  }

  return "Good Night";
}

interface DynamicGreetingProps {
  name: string;
  className?: string;
}

export function DynamicGreeting({ name, className }: DynamicGreetingProps) {
  const greeting = useMemo(() => getTimeGreeting(), []);

  return (
    <h1
      className={cn(
        "font-display text-4xl leading-tight tracking-[-0.04em]",
        className
      )}
    >
      {greeting}, {name}.
    </h1>
  );
}
