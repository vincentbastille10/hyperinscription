import { getRuntimeEnv } from "./runtime-env";

type Mail = {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export async function sendMailjet(mail: Mail) {
  const env = getRuntimeEnv();
  const apiKey = env.MJ_API_KEY as string | undefined;
  const apiSecret = env.MJ_API_SECRET as string | undefined;
  const fromEmail = (env.MJ_FROM_EMAIL as string | undefined) || "no-reply@spectramedia.online";
  const fromName = (env.MJ_FROM_NAME as string | undefined) || "Vincent Letort — Spectra Media AI";

  if (!apiKey || !apiSecret) return { delivered: false, reason: "mailjet_not_configured" };

  const message: Record<string, unknown> = {
    From: { Email: fromEmail, Name: fromName },
    To: [{ Email: mail.to, Name: mail.toName || mail.to }],
    Subject: mail.subject,
    TextPart: mail.text,
  };
  if (mail.html) message.HTMLPart = mail.html;
  if (mail.replyTo) message.ReplyTo = { Email: mail.replyTo };

  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ Messages: [message] }),
  });

  if (!response.ok) {
    return { delivered: false, reason: "mailjet_error", status: response.status };
  }
  return { delivered: true };
}
