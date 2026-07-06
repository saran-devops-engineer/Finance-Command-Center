import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface PlaceholderScreenProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
  children
}: PlaceholderScreenProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
          {title}
        </h1>
      </header>
      <Card className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        {children}
      </Card>
    </div>
  );
}
