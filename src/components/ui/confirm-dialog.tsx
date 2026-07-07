"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { card, radius } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isWorking?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  isDestructive = false,
  isWorking = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
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

        <div className="grid grid-cols-2 gap-3">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="secondary"
            disabled={isWorking}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            disabled={isWorking}
            onClick={onConfirm}
          >
            {isWorking ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
