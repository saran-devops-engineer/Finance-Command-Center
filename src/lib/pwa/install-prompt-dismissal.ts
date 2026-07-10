/** How long "Continue Without Installing" suppresses the welcome screen. */
export const INSTALL_PROMPT_DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Returns true when the user dismissed the install welcome within the last 30 days.
 */
export function isInstallPromptDismissed(
  dismissedAt: string | null,
  nowMs: number = Date.now()
) {
  if (!dismissedAt) {
    return false;
  }

  const dismissedMs = Date.parse(dismissedAt);
  if (Number.isNaN(dismissedMs)) {
    return false;
  }

  return nowMs - dismissedMs < INSTALL_PROMPT_DISMISS_DURATION_MS;
}
