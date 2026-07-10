/** Phase 8 — splash must not block startup beyond this duration. */
export const SPLASH_MAX_DURATION_MS = 1200;

/**
 * Resolves when bootstrap completes. No artificial delay is added; the splash
 * dismisses immediately once initialization finishes.
 */
export async function waitForSplashDismissal(bootstrapPromise: Promise<unknown>) {
  await bootstrapPromise;
}
