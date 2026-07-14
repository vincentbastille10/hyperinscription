import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { clients, demos } from "../../../db/schema";
import { activationMail } from "../../../lib/email-templates";
import { sendMailjet } from "../../../lib/mailjet";
import { getRuntimeEnv } from "../../../lib/runtime-env";
import type { DemoConfig } from "../../components/RegistrationDemo";

function toHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function validStripeSignature(body: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=") as [string, string]));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  return toHex(digest) === signature;
}

function permanentSlug(organization: string) {
  const base = organization.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 34) || "inscription";
  return `${base}-${crypto.randomUUID().slice(0, 5)}`;
}

export async function POST(request: Request) {
  const env = getRuntimeEnv();
  const secret = env.STRIPE_WEBHOOK_SECRET as string | undefined;
  if (!secret) return Response.json({ error: "webhook_not_configured" }, { status: 503 });
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!await validStripeSignature(body, signature, secret)) return Response.json({ error: "invalid_signature" }, { status: 400 });

  const event = JSON.parse(body) as { type?: string; data?: { object?: Record<string, unknown> } };
  if (event.type !== "checkout.session.completed") return Response.json({ received: true });
  const session = event.data?.object || {};
  const sessionId = String(session.id || "");
  const db = getDb();
  const existing = await db.select().from(clients).where(eq(clients.stripeSessionId, sessionId)).limit(1);
  if (existing[0]) return Response.json({ received: true, duplicate: true });

  const metadata = (session.metadata || {}) as Record<string, string>;
  const customerDetails = (session.customer_details || {}) as Record<string, unknown>;
  const email = String(customerDetails.email || session.customer_email || "");
  if (!email) return Response.json({ error: "customer_email_missing" }, { status: 400 });

  const demoSlug = metadata.demo_slug || "";
  const demoRows = demoSlug ? await db.select().from(demos).where(and(eq(demos.slug, demoSlug))).limit(1) : [];
  const demo = demoRows[0];
  const organization = metadata.organization || demo?.organization || "Votre organisation";
  const slug = permanentSlug(organization);
  const defaultConfig: DemoConfig = {
    slug,
    organization,
    subtitle: "Inscriptions en ligne",
    initials: organization.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(),
    accent: "#6d5dfc",
    intro: "Choisissez une activité puis transmettez votre demande d’inscription.",
    options: [],
    recipientEmail: email,
    googleSheetEnabled: false,
  };
  const config = demo ? JSON.parse(demo.configJson) as DemoConfig : defaultConfig;
  config.slug = slug;
  config.recipientEmail = email;
  const now = Date.now();
  await db.insert(clients).values({
    slug,
    organization,
    email,
    locale: metadata.locale || demo?.locale || "fr",
    plan: metadata.plan || "monthly",
    status: "active",
    configJson: JSON.stringify(config),
    googleWebhookUrl: demo?.googleWebhookUrl,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
    stripeSessionId: sessionId,
    createdAt: now,
    updatedAt: now,
  });

  const formUrl = `${new URL(request.url).origin}/d/${slug}`;
  const mail = activationMail(organization, formUrl);
  await sendMailjet({ to: email, toName: organization, subject: mail.subject, text: mail.text });
  return Response.json({ received: true });
}
