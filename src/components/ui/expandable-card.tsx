import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { card, radius } from "@/lib/design-tokens";

interface ExpandableCardProps {
  title: string;
  description: string;
  actionLabel: string;
  icon: ReactNode;
  isExpanded: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
  children: ReactNode;
}

export function ExpandableCard({
  title,
  description,
  actionLabel,
  icon,
  isExpanded,
  onExpandedChange,
  children
}: ExpandableCardProps) {
  return (
    <section
      className={cn(
        "overflow-hidden border border-white/70 bg-card/80 shadow-card backdrop-blur",
        radius.card
      )}
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => onExpandedChange(!isExpanded)}
        className={cn(
          "flex min-h-[72px] w-full items-center gap-4 text-left outline-none transition hover:bg-white/35 focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none",
          card.paddingCompact
        )}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/60 text-primary">
          {icon}
        </span>
        <span className="min-w-0 flex-1 space-y-1">
          <span className="block font-display text-2xl leading-tight tracking-[-0.04em]">
            {title}
          </span>
          <span className="block text-sm leading-5 text-muted-foreground line-clamp-2">
            {description}
          </span>
          {!isExpanded ? (
            <span className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              {actionLabel}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none",
            isExpanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "space-y-4 border-t border-border/60",
              card.padding,
              "pt-4"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
