import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(320);
const passwordSchema = z.string().min(8).max(128);

async function redirectUrl(path: string) {
  const request = getRequest();
  if (!request) throw new Error("Unable to determine the Moonirat URL.");
  const { getServerConfig } = await import("@/lib/config.server");
  const { nodeEnv, publicAppUrl } = getServerConfig();
  if (nodeEnv === "production" && !publicAppUrl) {
    throw new Error("Moonirat's public URL is not configured.");
  }
  const base = new URL(publicAppUrl ?? request.url);
  if (nodeEnv === "production" && base.protocol !== "https:") {
    throw new Error("Moonirat's public URL must use HTTPS.");
  }
  if (base.username || base.password) {
    throw new Error("Moonirat's public URL is invalid.");
  }
  return new URL(path, base.origin).toString();
}

async function hashBucket(value: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value).digest("hex");
}

async function enforceEmailRateLimit(
  supabaseAdmin: {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  },
  email: string,
) {
  const request = getRequest();
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",") ?? [];
  // Replit's trusted proxy appends the connection address; ignore client-supplied leading values.
  const client = forwarded.at(-1)?.trim() || "unknown";
  const buckets = [
    { value: `email:${email}`, limit: 3 },
    { value: `client:${client}`, limit: 10 },
  ];

  for (const bucket of buckets) {
    const { data, error } = await supabaseAdmin.rpc("consume_auth_email_rate_limit", {
      p_bucket_hash: await hashBucket(bucket.value),
      p_limit: bucket.limit,
      p_window_seconds: 15 * 60,
    });
    if (error) throw new Error("Unable to validate the email request.");
    if (data !== true) {
      throw new Error("Too many email requests. Please wait 15 minutes and try again.");
    }
  }
}

function rateLimitClient(client: unknown) {
  return client as {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  };
}

function isExistingAccountError(message: string) {
  return /already (been )?registered|already exists|user.*exists/i.test(message);
}

function acceptedSignup() {
  return {
    requiresEmailVerification: true,
    message:
      "If this email can be registered, a verification link has been sent. Existing users can sign in or reset their password.",
  };
}

function publicSignupError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (isExistingAccountError(message)) return null;
  if (/too many email requests/i.test(message)) {
    throw new Error("Too many email requests. Please wait 15 minutes and try again.");
  }
  throw new Error("We could not complete account creation. Please try again shortly.");
}

export const signUpWithAuthEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: emailSchema,
      password: passwordSchema,
      displayName: z.string().trim().min(1).max(100),
    }),
  )
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, { sendAuthEmail }, { createSignupEmail }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@/lib/auth-email.server"),
      import("@/lib/auth-email-templates.server"),
    ]);
    const email = data.email.toLowerCase();
    await enforceEmailRateLimit(rateLimitClient(supabaseAdmin), email);
    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      password: data.password,
      options: {
        data: { display_name: data.displayName },
        redirectTo: await redirectUrl("/auth"),
      },
    });

    if (error) {
      console.error("[Auth] Signup link generation failed", error.message);
      publicSignupError(error);
      return acceptedSignup();
    }

    try {
      const emailMessage = createSignupEmail(data.displayName, linkData.properties.action_link);
      await sendAuthEmail({ ...emailMessage, to: email });
    } catch (sendError) {
      const { AuthEmailDeliveryError } = await import("@/lib/auth-email.server");
      if (sendError instanceof AuthEmailDeliveryError && sendError.definitelyNotSent && linkData.user?.id) {
        const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(linkData.user.id);
        if (cleanupError) console.error("[Auth] Failed to clean up unsent signup", cleanupError);
      }
      console.error("[Auth] Signup email delivery failed", sendError);
      publicSignupError(sendError);
    }

    return acceptedSignup();
  });

export const requestPasswordResetWithAuthEmail = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: emailSchema }))
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, { sendAuthEmail }, { createPasswordResetEmail }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@/lib/auth-email.server"),
      import("@/lib/auth-email-templates.server"),
    ]);
    const email = data.email.toLowerCase();
    await enforceEmailRateLimit(rateLimitClient(supabaseAdmin), email);
    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: await redirectUrl("/reset-password") },
    });

    // Do not reveal whether an account exists for an email address.
    if (error || !linkData?.properties?.action_link) {
      if (error) console.error("[Auth] Recovery link generation failed", error.message);
      return { accepted: true };
    }

    try {
      const emailMessage = createPasswordResetEmail(linkData.properties.action_link);
      await sendAuthEmail({ ...emailMessage, to: email });
    } catch (sendError) {
      console.error("[Auth] Recovery email delivery failed", sendError);
    }

    return { accepted: true };
  });