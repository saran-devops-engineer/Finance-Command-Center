"use client";

import { useEffect, useState, type ReactNode } from "react";
import { InstallWelcomeGate } from "@/components/install-welcome-gate";
import { SplashScreen } from "@/features/splash/splash-screen";
import { isStandaloneDisplayMode, registerServiceWorker } from "@/lib/pwa/register-service-worker";
import { waitForSplashDismissal } from "@/lib/pwa/splash-timing";
import { bootstrapFinanceRepository } from "@/repositories";

interface AppBootstrapProps {
  children: ReactNode;
}

/**
 * App launch gate:
 * 1. Splash screen when installed (Phase 8)
 * 2. Initialize IndexedDB, migration, and preload dashboard data (Phases 3 & 9)
 * 3. Register service worker (Phase 5)
 * 4. Welcome / install screen when not installed (Phase 6–7)
 * 5. Render app
 */
export function AppBootstrap({ children }: AppBootstrapProps) {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const isStandalone = isStandaloneDisplayMode();

    if (isStandalone) {
      setShowSplash(true);
    }

    registerServiceWorker();

    const bootstrapPromise = bootstrapFinanceRepository().catch((error) => {
      console.error("[FCC] Bootstrap / migration failed:", error);
    });

    void waitForSplashDismissal(bootstrapPromise).finally(() => {
      if (isMounted) {
        setIsReady(true);
        setShowSplash(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    if (showSplash) {
      return <SplashScreen />;
    }

    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground">Preparing your command center…</p>
      </div>
    );
  }

  return <InstallWelcomeGate>{children}</InstallWelcomeGate>;
}
