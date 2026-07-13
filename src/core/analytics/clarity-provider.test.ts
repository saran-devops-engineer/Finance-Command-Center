import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createConfigurationService } from "@/core/configuration/configuration-service";
import { createDefaultConfigurationProvider } from "@/core/configuration/default-configuration-provider";
import { createClarityProvider } from "@/core/analytics/clarity-provider";
import { AppEvent } from "@/core/analytics/events";

const clarityMocks = vi.hoisted(() => ({
  init: vi.fn(),
  event: vi.fn(),
  set: vi.fn(),
  identify: vi.fn()
}));

vi.mock("@microsoft/clarity", () => ({
  default: clarityMocks
}));

describe("Clarity analytics provider", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false })
    });
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "test-distinct-id"),
      setItem: vi.fn()
    });

    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "clarity-test-project";
    clarityMocks.init.mockReset();
    clarityMocks.event.mockReset();
    clarityMocks.set.mockReset();
    clarityMocks.identify.mockReset();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  });

  it("initializes Clarity once during startup", async () => {
    const configuration = createConfigurationService(createDefaultConfigurationProvider());
    const provider = createClarityProvider(configuration);

    await provider.initialize();
    await provider.initialize();

    expect(clarityMocks.init).toHaveBeenCalledTimes(1);
    expect(clarityMocks.init).toHaveBeenCalledWith("clarity-test-project");
    expect(clarityMocks.identify).toHaveBeenCalledWith("test-distinct-id");
  });

  it("tracks taxonomy events without sending financial properties", async () => {
    const configuration = createConfigurationService(createDefaultConfigurationProvider());
    const provider = createClarityProvider(configuration);

    await provider.initialize();
    provider.track(AppEvent.HOME_LOAN_CREATED, { loan_id: "loan-1" });

    expect(clarityMocks.event).toHaveBeenCalledWith(AppEvent.HOME_LOAN_CREATED);
    expect(clarityMocks.set).not.toHaveBeenCalled();
  });

  it("identifies users with display name only", async () => {
    const configuration = createConfigurationService(createDefaultConfigurationProvider());
    const provider = createClarityProvider(configuration);

    await provider.initialize();
    provider.identify("user-123", {
      displayName: "Arjun",
      monthlyIncome: 150000
    });

    expect(clarityMocks.identify).toHaveBeenCalledWith(
      "user-123",
      undefined,
      undefined,
      "Arjun"
    );
  });

  it("continues silently when initialization fails", async () => {
    clarityMocks.init.mockImplementation(() => {
      throw new Error("Clarity unavailable");
    });

    const configuration = createConfigurationService(createDefaultConfigurationProvider());
    const provider = createClarityProvider(configuration);

    await expect(provider.initialize()).resolves.toBeUndefined();
    expect(() => provider.track(AppEvent.APP_OPENED)).not.toThrow();
  });
});
