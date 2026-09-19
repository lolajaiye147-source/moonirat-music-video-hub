type PublicSupabaseConfig = {
  url: string;
  publishableKey: string;
};

function required(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Missing required public configuration: ${name}`);
  }
  return normalized;
}

function validHttpUrl(value: string, name: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid URL in public configuration: ${name}`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Unsupported URL protocol in public configuration: ${name}`);
  }
  return parsed.toString().replace(/\/$/, "");
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
  const publishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (typeof process !== "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);

  return {
    url: validHttpUrl(required(url, "VITE_SUPABASE_URL"), "VITE_SUPABASE_URL"),
    publishableKey: required(
      publishableKey,
      "VITE_SUPABASE_PUBLISHABLE_KEY",
    ),
  };
}