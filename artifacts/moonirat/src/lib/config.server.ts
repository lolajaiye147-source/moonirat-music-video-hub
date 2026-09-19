import process from "node:process";

type SupabaseServerConfig = {
  url: string;
  publishableKey: string;
};

type SupabaseAdminServerConfig = SupabaseServerConfig & {
  serviceRoleKey: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server configuration: ${name}`);
  return value;
}

function normalizedUrl(name: string): string {
  const value = required(name);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid URL in server configuration: ${name}`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Unsupported URL protocol in server configuration: ${name}`);
  }
  return parsed.toString().replace(/\/$/, "");
}

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    basePath: process.env.BASE_PATH?.trim() || "/",
    publicAppUrl: process.env.PUBLIC_APP_URL?.trim() || undefined,
    publicRedirectHosts: (process.env.PUBLIC_REDIRECT_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  };
}

export function getSupabaseServerConfig(): SupabaseServerConfig {
  return {
    url: normalizedUrl("SUPABASE_URL"),
    publishableKey: required("SUPABASE_PUBLISHABLE_KEY"),
  };
}

export function getSupabaseAdminServerConfig(): SupabaseAdminServerConfig {
  return {
    ...getSupabaseServerConfig(),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
