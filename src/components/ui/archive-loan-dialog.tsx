"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { card, radius } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface ArchiveLoanDialogProps {
  open: boolean;
  isWorking?: boolean;
  title?: string;
  description?: string;
  reasonPlaceholder?: string;
  onConfirm: (archiveReason?: string) => void;
  onCancel: () => void;
}

export function ArchiveLoanDialog({
  open,
  isWorking = false,
  title = "Archive loan?",
  description = "This loan will be removed from your active portfolio but all payment history, documents and statistics will be preserved.",
  reasonPlaceholder = "Loan completed",
  onConfirm,
  onCancel
}: ArchiveLoanDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [archiveReason, setArchiveReason] = useState("");
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setArchiveReason("");
      return;
    }

    cancelButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 px-5 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-16 sm:items-center sm:pb-8">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "relative w-full max-w-[430px] space-y-4 bg-card text-foreground shadow-[0_24px_60px_rgba(0,0,0,0.18)]",
          radius.card,
          card.paddingCompact
        )}
      >
        <div className="space-y-2">
          <h2 id={titleId} className="font-display text-3xl tracking-[-0.04em]">
            {title}
          </h2>
          <p id={descriptionId} className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Archive reason (optional)
          </span>
          <input
            value={archiveReason}
            onChange={(event) => setArchiveReason(event.target.value)}
            placeholder={reasonPlaceholder}
            className={cn(
              "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary",
              radius.input
            )}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="secondary"
            disabled={isWorking}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isWorking}
            onClick={() => onConfirm(archiveReason)}
          >
            {isWorking ? "Working..." : "Archive"}
          </Button>
        </div>
      </div>
    </div>
  );
}
