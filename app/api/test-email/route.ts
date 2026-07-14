import { prospectMail } from "../../../lib/email-templates";
import { sendMailjet } from "../../../lib/mailjet";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "invalid_origin" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({})) as { email?: string; locale?: "fr" | "en" };
  const email = payload.email?.trim() || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const locale = payload.locale === "en" ? "en" : "fr";
  const demoUrl = new URL("/", request.url).toString();
  const mail = prospectMail({
    locale,
    firstName: locale === "en" ? "there" : "",
    organization: locale === "en" ? "Your association" : "Votre association",
    demoUrl,
  });
  const action = locale === "en" ? "Open my demo" : "Ouvrir ma démo";
  const html = `
    <div style="margin:0;background:#f4f5f8;padding:36px 16px;font-family:Arial,sans-serif;color:#161820">
      <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5e7ec;border-radius:20px;overflow:hidden">
        <div style="padding:22px 28px;background:#17171e;color:#fff">
          <div style="display:inline-block;background:#6d5dfc;border-radius:12px;padding:10px 12px;font-weight:900">H+</div>
          <strong style="margin-left:12px;letter-spacing:.08em">HYPERINSCRIPTION</strong>
        </div>
        <div style="padding:32px 28px">
          ${mail.text.split("\n").map((line) => line ? `<p style="font-size:15px;line-height:1.65;margin:0 0 12px">${escapeHtml(line)}</p>` : "<div style=\"height:4px\"></div>").join("")}
          <a href="${escapeHtml(demoUrl)}" style="display:inline-block;margin-top:12px;padding:14px 20px;border-radius:11px;background:#6d5dfc;color:#fff;text-decoration:none;font-weight:800">${action} →</a>
        </div>
      </div>
    </div>`;

  const result = await sendMailjet({
    to: email,
    subject: `[TEST] ${mail.subject}`,
    text: mail.text,
    html,
  });

  if (!result.delivered) {
    return Response.json({ delivered: false, error: result.reason }, { status: result.reason === "mailjet_not_configured" ? 503 : 502 });
  }
  return Response.json({ delivered: true });
}
