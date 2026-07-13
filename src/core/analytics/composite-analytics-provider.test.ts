import { describe, expect, it, vi } from "vitest";
import { createCompositeAnalyticsProvider } from "@/core/analytics/composite-analytics-provider";
import type { AnalyticsProvider } from "@/core/analytics/analytics-provider.interface";
import { AppEvent } from "@/core/analytics/events";

function createMockProvider(name: string): AnalyticsProvider {
  return {
    initialize: vi.fn(async () => undefined),
    track: vi.fn(),
    screen: vi.fn(),
    identify: vi.fn(),
    error: vi.fn(),
    timing: vi.fn(),
    setUserProperty: vi.fn(),
    flush: vi.fn(async () => undefined)
  };
}

describe("Composite analytics provider", () => {
  it("dispatches calls to every configured provider", async () => {
    const posthog = createMockProvider("posthog");
    const clarity = createMockProvider("clarity");
    const composite = createCompositeAnalyticsProvider([posthog, clarity]);

    await composite.initialize();
    composite.track(AppEvent.APP_OPENED);
    composite.screen("Home");
    composite.identify("user-1", { displayName: "Arjun" });
    composite.error(new Error("boom"));
    composite.timing("bootstrap", 120);
    composite.setUserProperty("theme", "dark");
    await composite.flush();

    expect(posthog.initialize).toHaveBeenCalledTimes(1);
    expect(clarity.initialize).toHaveBeenCalledTimes(1);
    expect(posthog.track).toHaveBeenCalledWith(AppEvent.APP_OPENED, undefined);
    expect(clarity.track).toHaveBeenCalledWith(AppEvent.APP_OPENED, undefined);
    expect(posthog.screen).toHaveBeenCalledWith("Home", undefined);
    expect(clarity.screen).toHaveBeenCalledWith("Home", undefined);
    expect(posthog.flush).toHaveBeenCalledTimes(1);
    expect(clarity.flush).toHaveBeenCalledTimes(1);
  });

  it("keeps working when one provider throws", () => {
    const healthy = createMockProvider("healthy");
    const failing: AnalyticsProvider = {
      ...createMockProvider("failing"),
      track: vi.fn(() => {
        throw new Error("provider down");
      })
    };

    const composite = createCompositeAnalyticsProvider([healthy, failing]);

    expect(() => composite.track(AppEvent.APP_OPENED)).not.toThrow();
    expect(healthy.track).toHaveBeenCalledWith(AppEvent.APP_OPENED, undefined);
  });
});
