"use client";

import { useEffect, useState, type ReactNode } from "react";
import { WelcomeScreen } from "@/features/welcome/welcome-screen";
import { isInstallPromptDismissed } from "@/lib/pwa/install-prompt-dismissal";
import { isStandaloneDisplayMode } from "@/lib/pwa/register-service-worker";
import { useInstallPrompt } from "@/lib/pwa/use-install-prompt";
import { financeRepository } from "@/repositories";

interface InstallWelcomeGateProps {
  children: ReactNode;
}

type WelcomeGateDecision = "pending" | "skip" | "show";

/**
 * Welcome / install experience (Phase 6) with remembered dismiss choice (Phase 7).
 * Skipped when installed, recently dismissed, or after successful installation.
 */
export function InstallWelcomeGate({ children }: InstallWelcomeGateProps) {
  const [decision, setDecision] = useState<WelcomeGateDecision>("pending");
  const [isInstalling, setIsInstalling] = useState(false);
  const { canNativeInstall, isInstalled, promptInstall } = useInstallPrompt();

  useEffect(() => {
    let isMounted = true;

    async function evaluateWelcomeGate() {
      if (isStandaloneDisplayMode()) {
        if (isMounted) {
          setDecision("skip");
        }
        return;
      }

      try {
        const settings = await financeRepository.getSettings();
        const shouldSkip = isInstallPromptDismissed(settings.installPromptDismissedAt);

        if (isMounted) {
          setDecision(shouldSkip ? "skip" : "show");
        }
      } catch (error) {
        console.error("[FCC] Failed to read install prompt settings:", error);
        if (isMounted) {
          setDecision("show");
        }
      }
    }

    void evaluateWelcomeGate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isInstalled) {
      setDecision("skip");
    }
  }, [isInstalled]);

  if (decision === "pending") {
    return null;
  }

  if (decision === "skip") {
    return <>{children}</>;
  }

  async function handleInstall() {
    setIsInstalling(true);

    try {
      const accepted = await promptInstall();
      if (accepted) {
        setDecision("skip");
      }
    } finally {
      setIsInstalling(false);
    }
  }

  async function handleContinue() {
    setDecision("skip");

    try {
      await financeRepository.saveSettings({
        installPromptDismissedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("[FCC] Failed to persist install prompt dismissal:", error);
    }
  }

  return (
    <WelcomeScreen
      canNativeInstall={canNativeInstall}
      isInstalling={isInstalling}
      onInstall={() => void handleInstall()}
      onContinue={() => void handleContinue()}
    />
  );
}
