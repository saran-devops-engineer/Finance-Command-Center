"use client";

import { useEffect, useState, type ReactNode } from "react";
import { InstallWelcomeGate } from "@/components/install-welcome-gate";
import { SplashScreen } from "@/features/splash/splash-screen";
import { bootstrapApplication, getApplicationServices } from "@/core/application/application-container";
import { AppEvent, trackApplicationEvent } from "@/core/analytics";
import { registerServiceWorker, isStandaloneDisplayMode } from "@/lib/pwa/register-service-worker";
import { waitForSplashDismissal } from "@/lib/pwa/splash-timing";

interface AppBootstrapProps {
  children: ReactNode;
}

/** Never block the UI indefinitely if IndexedDB, migration, or analytics stalls. */
const BOOTSTRAP_TIMEOUT_MS = 12_000;

function withBootstrapTimeout<T>(promise: Promise<T>): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => {
      window.setTimeout(() => resolve(undefined), BOOTSTRAP_TIMEOUT_MS);
    })
  ]);
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
    const isStandalone = isStandaloneDisplayMode();

    if (isStandalone) {
      setShowSplash(true);
    }

    registerServiceWorker();

    const services = getApplicationServices();
    const bootstrapPromise = withBootstrapTimeout(
      bootstrapApplication(services)
        .then(() => {
          trackApplicationEvent(AppEvent.APP_OPENED);
        })
        .catch((error) => {
          services.errorService.report(error, { phase: "bootstrap" });
        })
    );

    void waitForSplashDismissal(bootstrapPromise).finally(() => {
      setIsReady(true);
      setShowSplash(false);
    });
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
