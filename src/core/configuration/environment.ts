/**
 * Application environment resolution.
 *
 * Production builds may target non-production environments via NEXT_PUBLIC_APP_ENV
 * (e.g. QA, UAT). Developer tools are hidden only when environment is production.
 */

export const AppEnvironment = {
  DEVELOPMENT: "development",
  REPLICA: "replica",
  QA: "qa",
  UAT: "uat",
  PRE_PRODUCTION: "pre-production",
  PRODUCTION: "production",
  TEST: "test"
} as const;

export type AppEnvironmentValue = (typeof AppEnvironment)[keyof typeof AppEnvironment];

const NON_PRODUCTION_ENVIRONMENTS = new Set<AppEnvironmentValue>([
  AppEnvironment.DEVELOPMENT,
  AppEnvironment.REPLICA,
  AppEnvironment.QA,
  AppEnvironment.UAT,
  AppEnvironment.PRE_PRODUCTION,
  AppEnvironment.TEST
]);

export function normalizeAppEnvironment(value: string | undefined): AppEnvironmentValue | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/_/g, "-");

  switch (normalized) {
    case "development":
    case "dev":
      return AppEnvironment.DEVELOPMENT;
    case "replica":
      return AppEnvironment.REPLICA;
    case "qa":
      return AppEnvironment.QA;
    case "uat":
      return AppEnvironment.UAT;
    case "pre-production":
    case "preproduction":
    case "preprod":
      return AppEnvironment.PRE_PRODUCTION;
    case "production":
    case "prod":
      return AppEnvironment.PRODUCTION;
    case "test":
      return AppEnvironment.TEST;
    default:
      return null;
  }
}

export function resolveAppEnvironment(): AppEnvironmentValue {
  const explicit =
    normalizeAppEnvironment(process.env.NEXT_PUBLIC_APP_ENV) ??
    normalizeAppEnvironment(process.env.APP_ENV);

  if (explicit) {
    return explicit;
  }

  // Vercel preview deployments (e.g. develop branch) use NODE_ENV=production but are not
  // user-facing production — expose via next.config env at build time.
  const vercelEnv =
    process.env.NEXT_PUBLIC_VERCEL_ENV?.trim().toLowerCase() ??
    process.env.VERCEL_ENV?.trim().toLowerCase();

  if (vercelEnv === "preview") {
    return AppEnvironment.DEVELOPMENT;
  }

  if (vercelEnv === "development") {
    return AppEnvironment.DEVELOPMENT;
  }

  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv === "production") {
    return AppEnvironment.PRODUCTION;
  }

  if (nodeEnv === "test") {
    return AppEnvironment.TEST;
  }

  return AppEnvironment.DEVELOPMENT;
}

export function isProductionEnvironment(
  environment: AppEnvironmentValue = resolveAppEnvironment()
): boolean {
  return environment === AppEnvironment.PRODUCTION;
}

export function areDeveloperToolsEnabled(
  environment: AppEnvironmentValue = resolveAppEnvironment()
): boolean {
  return NON_PRODUCTION_ENVIRONMENTS.has(environment);
}

export function getEnvironmentLabel(environment: AppEnvironmentValue): string {
  switch (environment) {
    case AppEnvironment.DEVELOPMENT:
      return "Development";
    case AppEnvironment.REPLICA:
      return "Replica";
    case AppEnvironment.QA:
      return "QA";
    case AppEnvironment.UAT:
      return "UAT";
    case AppEnvironment.PRE_PRODUCTION:
      return "Pre-Production";
    case AppEnvironment.PRODUCTION:
      return "Production";
    case AppEnvironment.TEST:
      return "Test";
    default:
      return environment;
  }
}
