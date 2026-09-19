type AuthEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export class AuthEmailDeliveryError extends Error {
  constructor(
    message: string,
    readonly definitelyNotSent: boolean,
  ) {
    super(message);
    this.name = "AuthEmailDeliveryError";
  }
}

function getSender() {
  const sender = process.env.AUTH_EMAIL_FROM?.trim();
  if (!sender) {
    throw new Error("Moonirat auth email is not configured.");
  }
  return sender;
}

function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Moonirat's direct Resend API key is not configured.");
  }
  return apiKey;
}

export async function sendAuthEmail(message: AuthEmail) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getSender(),
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const requestId = response.headers.get("x-request-id");
    let providerMessage = "";
    try {
      const body = (await response.json()) as { message?: unknown };
      if (typeof body.message === "string") providerMessage = `: ${body.message}`;
    } catch {
      // The status code remains enough to classify the delivery failure.
    }
    throw new AuthEmailDeliveryError(
      `Resend rejected the auth email (${response.status})${providerMessage}${requestId ? ` [${requestId}]` : ""}.`,
      response.status >= 400 && response.status < 500,
    );
  }
}