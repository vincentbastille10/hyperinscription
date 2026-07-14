import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { clients, demos, registrations } from "../../../db/schema";
import { sendMailjet } from "../../../lib/mailjet";

type SelectedOption = { title?: string; category?: string; schedule?: string; price?: number };

function escapeHtml(value: unknown) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({})) as {
    slug?: string;
    organization?: string;
    fields?: Record<string, FormDataEntryValue | string>;
    selectedOptions?: SelectedOption[];
    total?: number;
  };
  const slug = payload.slug?.trim() || "";
  const name = String(payload.fields?.name || "").trim();
  const email = String(payload.fields?.email || "").trim();
  if (!slug || !name || !email.includes("@")) {
    return Response.json({ error: "missing_required_fields" }, { status: 400 });
  }

  try {
    const db = getDb();
    const demoRows = await db.select().from(demos).where(eq(demos.slug, slug)).limit(1);
    const clientRows = demoRows.length ? [] : await db.select().from(clients).where(eq(clients.slug, slug)).limit(1);
    const demo = demoRows[0];
    const client = clientRows[0];
    const source = demo || client;
    if (!source) return Response.json({ error: "form_not_found" }, { status: 404 });

    const organization = source.organization || payload.organization || "Organisation";
    const selections = payload.selectedOptions || [];
    const now = Date.now();
    const recipient = demo?.recipientEmail || client?.email;
    const webhook = demo?.googleWebhookUrl || client?.googleWebhookUrl;
    const lines = selections.map((item) => `- ${item.title || "Activité"} · ${item.schedule || ""} · ${Number(item.price || 0)} €`).join("\n");
    const subject = `Nouvelle inscription — ${name} — ${organization}`;
    const text = `Nouvelle inscription reçue pour ${organization}.\n\nNom : ${name}\nEmail : ${email}\nTéléphone : ${String(payload.fields?.phone || "")}\nDate de naissance : ${String(payload.fields?.birthDate || "")}\nMessage : ${String(payload.fields?.message || "")}\n\nChoix :\n${lines}\n\nTotal indicatif : ${Number(payload.total || 0)} €`;
    const html = `<h2>Nouvelle inscription — ${escapeHtml(organization)}</h2><p><b>Nom :</b> ${escapeHtml(name)}<br><b>Email :</b> ${escapeHtml(email)}<br><b>Téléphone :</b> ${escapeHtml(payload.fields?.phone)}</p><h3>Choix</h3><ul>${selections.map((item) => `<li>${escapeHtml(item.title)} — ${escapeHtml(item.schedule)} — ${Number(item.price || 0)} €</li>`).join("")}</ul><p><b>Total indicatif : ${Number(payload.total || 0)} €</b></p>`;

    const mailResult = recipient
      ? await sendMailjet({ to: recipient, toName: organization, subject, text, html, replyTo: email })
      : { delivered: false, reason: "recipient_missing" };

    let sheetDelivered = false;
    if (webhook) {
      try {
        const response = await fetch(webhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...payload, sourceSlug: slug, receivedAt: new Date(now).toISOString() }),
        });
        sheetDelivered = response.ok || response.type === "opaque";
      } catch {
        sheetDelivered = false;
      }
    }

    const [saved] = await db.insert(registrations).values({
      sourceSlug: slug,
      organization,
      registrantName: name,
      registrantEmail: email,
      registrantPhone: String(payload.fields?.phone || ""),
      fieldsJson: JSON.stringify(payload.fields || {}),
      selectionsJson: JSON.stringify(selections),
      totalCents: Math.round(Number(payload.total || 0) * 100),
      emailDelivered: mailResult.delivered,
      sheetDelivered,
      createdAt: now,
    }).returning({ id: registrations.id });

    return Response.json({ ok: true, id: saved.id, emailDelivered: mailResult.delivered, sheetDelivered });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "registration_failed";
    return Response.json({ error: "registration_failed", detail }, { status: 500 });
  }
}
