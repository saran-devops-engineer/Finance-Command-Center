export type AnalyticsEventProperties = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsUserTraits {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsProvider {
  initialize(): Promise<void>;
  track(event: string, properties?: AnalyticsEventProperties): void;
  screen(name: string, properties?: AnalyticsEventProperties): void;
  identify(userId: string, traits?: AnalyticsUserTraits): void;
  error(error: unknown, context?: AnalyticsEventProperties): void;
  timing(name: string, durationMs: number, properties?: AnalyticsEventProperties): void;
  setUserProperty(key: string, value: string | number | boolean | null): void;
  flush(): Promise<void>;
}
