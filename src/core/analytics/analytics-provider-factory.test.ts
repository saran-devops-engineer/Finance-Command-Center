import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createConfigurationService } from "@/core/configuration/configuration-service";
import { createDefaultConfigurationProvider } from "@/core/configuration/default-configuration-provider";
import { createAnalyticsProvider } from "@/core/analytics/analytics-provider-factory";
import { createPostHogProvider } from "@/core/analytics/posthog-provider";
import { createClarityProvider } from "@/core/analytics/clarity-provider";

vi.mock("@/core/analytics/posthog-provider", () => ({
  createPostHogProvider: vi.fn(() => ({ provider: "posthog" }))
}));

vi.mock("@/core/analytics/clarity-provider", () => ({
  createClarityProvider: vi.fn(() => ({ provider: "clarity" }))
}));

describe("Analytics provider factory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  });

  it("creates a composite provider when PostHog and Clarity are both configured", () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "clarity_test";

    const configuration = createConfigurationService(createDefaultConfigurationProvider());
    const provider = createAnalyticsProvider(configuration) as {
      track: (event: string) => void;
    };

    expect(createPostHogProvider).toHaveBeenCalledTimes(1);
    expect(createClarityProvider).toHaveBeenCalledTimes(1);
    expect(provider.track).toBeTypeOf("function");
  });

  it("creates noop provider when no analytics vendors are configured", () => {
    const configuration = createConfigurationService(createDefaultConfigurationProvider());
    const provider = createAnalyticsProvider(configuration);

    expect(createPostHogProvider).not.toHaveBeenCalled();
    expect(createClarityProvider).not.toHaveBeenCalled();
    expect(provider.track).toBeTypeOf("function");
  });
});
