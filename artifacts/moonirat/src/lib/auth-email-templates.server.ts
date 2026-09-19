type AuthEmailContent = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const colors = {
  background: "#080B18",
  card: "#11172A",
  cardBorder: "#27304A",
  text: "#F5F7FF",
  muted: "#A8B0C5",
  purple: "#8B5CF6",
  blue: "#38BDF8",
  link: "#BFA7FF",
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character]!,
  );
}

function renderAuthEmail({
  preheader,
  title,
  greeting,
  paragraphs,
  actionLabel,
  actionLink,
  fallbackLabel,
  securityNote,
  text,
}: {
  preheader: string;
  title: string;
  greeting: string;
  paragraphs: string[];
  actionLabel: string;
  actionLink: string;
  fallbackLabel: string;
  securityNote: string;
  text: string;
}): AuthEmailContent {
  const safeActionLink = escapeHtml(actionLink);
  const safeFallbackLabel = escapeHtml(fallbackLabel);

  return {
    to: "",
    subject: "",
    text,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <title>${escapeHtml(title)} — Moonirat</title>
  </head>
  <body style="margin:0;background:${colors.background};color:${colors.text};font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${colors.background};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:0 0 24px;text-align:center;">
                <div style="display:inline-block;width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,${colors.purple},${colors.blue});color:#ffffff;font-size:24px;font-weight:800;line-height:44px;text-align:center;">M</div>
                <div style="margin-top:10px;color:${colors.text};font-size:18px;font-weight:700;letter-spacing:0.02em;">Moonirat</div>
              </td>
            </tr>
            <tr>
              <td style="border:1px solid ${colors.cardBorder};border-radius:20px;background:${colors.card};overflow:hidden;">
                <div style="height:5px;background:linear-gradient(90deg,${colors.purple},${colors.blue});"></div>
                <div style="padding:40px 36px 36px;">
                  <p style="margin:0 0 14px;color:${colors.link};font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Moonirat</p>
                  <h1 style="margin:0 0 18px;color:${colors.text};font-size:28px;line-height:1.2;font-weight:700;">${escapeHtml(title)}</h1>
                  <p style="margin:0 0 20px;color:${colors.text};font-size:16px;line-height:1.65;">${escapeHtml(greeting)}</p>
                  ${paragraphs.map((paragraph) => `<p style="margin:0 0 20px;color:${colors.muted};font-size:15px;line-height:1.7;">${escapeHtml(paragraph)}</p>`).join("")}
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 28px;">
                    <tr>
                      <td align="center" style="border-radius:10px;background:linear-gradient(135deg,${colors.purple},${colors.blue});">
                        <a href="${safeActionLink}" target="_blank" rel="noopener" style="display:inline-block;padding:15px 24px;border-radius:10px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(actionLabel)} &rarr;</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 8px;color:${colors.muted};font-size:12px;line-height:1.6;">If the button doesn’t work, copy and paste this link into your browser:</p>
                  <p style="margin:0 0 24px;word-break:break-all;color:${colors.link};font-size:12px;line-height:1.6;"><a href="${safeActionLink}" target="_blank" rel="noopener" style="color:${colors.link};">${safeFallbackLabel}</a></p>
                  <div style="border-top:1px solid ${colors.cardBorder};padding-top:20px;">
                    <p style="margin:0;color:${colors.muted};font-size:12px;line-height:1.6;">${escapeHtml(securityNote)}</p>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 12px 0;text-align:center;">
                <p style="margin:0;color:${colors.muted};font-size:12px;line-height:1.6;">Discover music videos. Follow the artists you love.</p>
                <p style="margin:8px 0 0;color:#707A94;font-size:11px;line-height:1.6;">© ${new Date().getFullYear()} Moonirat · moonirat.space</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

export function createSignupEmail(displayName: string, actionLink: string) {
  const safeName = displayName.trim() || "there";
  const email = renderAuthEmail({
    preheader: "One quick step to start discovering music videos on Moonirat.",
    title: "Verify your email",
    greeting: `Welcome to Moonirat, ${safeName}.`,
    paragraphs: [
      "Your account is ready. Confirm your email address to start discovering music videos, following artists, and building playlists.",
    ],
    actionLabel: "Verify my email",
    actionLink,
    fallbackLabel: actionLink,
    securityNote: "If you did not create a Moonirat account, you can safely ignore this email.",
    text: `Welcome to Moonirat, ${safeName}.

Verify your email to start discovering music videos, following artists, and building playlists:
${actionLink}

If you did not create a Moonirat account, you can safely ignore this email.

— The Moonirat team`,
  });

  return {
    ...email,
    to: "",
    subject: "Verify your Moonirat account",
  };
}

export function createPasswordResetEmail(actionLink: string) {
  const email = renderAuthEmail({
    preheader: "Use this secure link to choose a new Moonirat password.",
    title: "Reset your password",
    greeting: "We received a request to reset your Moonirat password.",
    paragraphs: [
      "Choose a new password using the secure link below. You’ll be able to sign back in as soon as it’s updated.",
    ],
    actionLabel: "Choose a new password",
    actionLink,
    fallbackLabel: actionLink,
    securityNote: "If you did not request a password reset, you can safely ignore this email. Your password will not change.",
    text: `We received a request to reset your Moonirat password.

Choose a new password:
${actionLink}

If you did not request a password reset, you can safely ignore this email. Your password will not change.

— The Moonirat team`,
  });

  return {
    ...email,
    to: "",
    subject: "Reset your Moonirat password",
  };
}