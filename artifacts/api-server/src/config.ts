function parsePort(rawPort: string | undefined): number {
  if (!rawPort) throw new Error("PORT environment variable is required.");
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return port;
}

function parseOrigins(rawOrigins: string | undefined): string[] {
  if (!rawOrigins?.trim()) return [];
  return rawOrigins
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .map((origin) => {
      const parsed = new URL(origin);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        throw new Error("CORS_ORIGINS may only contain HTTP(S) origins.");
      }
      return parsed.origin;
    });
}

export function getApiConfig() {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parsePort(process.env.PORT),
    corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
    bodyLimit: process.env.API_BODY_LIMIT?.trim() || "1mb",
  };
}