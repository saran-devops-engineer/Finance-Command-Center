"use client";

import Image from "next/image";
import { useRef, type RefObject } from "react";
import { Check, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { card, radius, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { isIosDevice } from "@/lib/pwa/platform";

const benefits = [
  "Faster Launch",
  "App-like Experience",
  "Offline Support"
] as const;

interface WelcomeScreenProps {
  canNativeInstall: boolean;
  onInstall: () => void;
  onContinue: () => void;
  isInstalling?: boolean;
}

export function WelcomeScreen({
  canNativeInstall,
  onInstall,
  onContinue,
  isInstalling = false
}: WelcomeScreenProps) {
  const isIos = isIosDevice();
  const iosInstructionsRef = useRef<HTMLElement>(null);

  function handleInstallClick() {
    if (isIos) {
      iosInstructionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onInstall();
  }

  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", spacing.page)}>
      <div className="flex flex-1 flex-col justify-center space-y-8 pt-8">
        <div className="space-y-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-[28px] bg-[#17130f] shadow-card">
            <Image
              src="/icon.svg"
              alt=""
              width={80}
              height={80}
              priority
              aria-hidden
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Welcome
            </p>
            <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
              Welcome to Finance Command Center
            </h1>
            <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
              For the best experience, install Finance Command Center on your Home Screen.
            </p>
          </div>
        </div>

        <ul className="mx-auto w-full max-w-sm space-y-3">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className={cn(
                "flex items-center gap-3 bg-white/45 px-4 py-3 text-sm",
                radius.inner
              )}
            >
              <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {isIos ? <IosInstallInstructions ref={iosInstructionsRef} /> : null}
      </div>

      <div className="sticky bottom-0 space-y-3 pb-8 pt-4">
        <Button
          className="w-full"
          size="lg"
          disabled={!isIos && (!canNativeInstall || isInstalling)}
          onClick={() => void handleInstallClick()}
        >
          {isInstalling ? "Opening install…" : "Install App"}
        </Button>

        {!isIos && !canNativeInstall ? (
          <p className="text-center text-xs leading-5 text-muted-foreground">
            Install is not available in this browser session yet. Use your browser menu to
            add this app to your Home Screen, or continue in the browser.
          </p>
        ) : null}

        <Button className="w-full" size="lg" variant="secondary" onClick={onContinue}>
          Continue Without Installing
        </Button>
      </div>
    </div>
  );
}

function IosInstallInstructions({ ref }: { ref: RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={ref}
      className={cn("mx-auto w-full max-w-sm space-y-4 bg-white/45", radius.card, card.padding)}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10">
          <Share className="h-4 w-4 text-primary" strokeWidth={2} />
        </div>
        <div>
          <p className="font-semibold">Install on iPhone or iPad</p>
          <p className="text-xs text-muted-foreground">Safari · Add to Home Screen</p>
        </div>
      </div>

      <ol className="space-y-3 text-sm leading-6 text-muted-foreground">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            1
          </span>
          <span>
            Tap <strong className="text-foreground">Share</strong> in Safari&apos;s toolbar.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            2
          </span>
          <span>
            Tap <strong className="text-foreground">Add to Home Screen</strong>.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            3
          </span>
          <span>
            Open <strong className="text-foreground">Finance Command Center</strong> from your
            Home Screen.
          </span>
        </li>
      </ol>
    </section>
  );
}
