import { getDb } from "../../../../db";
import { demos } from "../../../../db/schema";
import { isHyperScriptAuthorized } from "../../../../lib/api-auth";
import { prospectMail } from "../../../../lib/email-templates";
import type { DemoConfig, DemoOption } from "../../../components/RegistrationDemo";

function safeWebsite(raw?: string) {
  if (!raw) return null;
  const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  const host = url.hostname.toLowerCase();
  const privateHost = host === "localhost" || host.endsWith(".local") || host === "::1" || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  if (!/^https?:$/.test(url.protocol) || privateHost || url.username || url.password) throw new Error("unsafe_website_url");
  return url;
}

function stripHtml(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function crawlWebsite(raw?: string) {
  const url = safeWebsite(raw);
  if (!url) return { title: "", description: "", text: "" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "user-agent": "HyperInscription/1.0 (+https://spectramedia.online)" } });
    if (!response.ok) return { title: "", description: "", text: "" };
    const html = (await response.text()).slice(0, 350_000);
    const title = stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
    const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] || "";
    return { title, description: stripHtml(description), text: stripHtml(html).slice(0, 12_000) };
  } finally {
    clearTimeout(timer);
  }
}

function makeOptions(activity: string): DemoOption[] {
  const normalized = activity.toLocaleLowerCase("fr");
  if (normalized.includes("danse")) return [
    { id: "eveil", title: "Éveil", category: "Enfants", schedule: "Mercredi · 10h00", price: 180, remaining: 7 },
    { id: "ados", title: "Cours ados", category: "Adolescents", schedule: "Mercredi · 17h30", price: 230, remaining: 4 },
    { id: "adultes", title: "Cours adultes", category: "Adultes", schedule: "Jeudi · 19h30", price: 260, remaining: 11 },
  ];
  if (normalized.includes("pétanque")) return [
    { id: "licence", title: "Licence annuelle", category: "Adhésion", schedule: "Saison complète", price: 55, remaining: 30 },
    { id: "jeunes", title: "École de pétanque", category: "Jeunes", schedule: "Samedi · 10h00", price: 35, remaining: 9 },
    { id: "concours", title: "Inscription concours", category: "Événement", schedule: "Dimanche · 9h00", price: 12, remaining: 18 },
  ];
  if (normalized.includes("théâtre")) return [
    { id: "adultes", title: "Théâtre adulte", category: "Adultes", schedule: "Mardi · 19h00", price: 240, remaining: 8 },
    { id: "ados", title: "Atelier ados", category: "13–17 ans", schedule: "Mercredi · 17h30", price: 195, remaining: 3 },
    { id: "impro", title: "Improvisation", category: "Tous niveaux", schedule: "Jeudi · 19h30", price: 210, remaining: 12 },
  ];
  return [
    { id: "annuel", title: "Adhésion annuelle", category: "Adhésion", schedule: "Saison 2026–2027", price: 80, remaining: 22 },
    { id: "atelier-1", title: "Atelier découverte", category: "Débutants", schedule: "Mercredi · 18h00", price: 120, remaining: 8 },
    { id: "atelier-2", title: "Atelier confirmé", category: "Confirmés", schedule: "Vendredi · 19h00", price: 160, remaining: 5 },
  ];
}

function makeSlug(organization: string) {
  const base = organization.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "demo";
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function POST(request: Request) {
  if (!isHyperScriptAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as {
    websiteUrl?: string;
    organization?: string;
    recipientEmail?: string;
    firstName?: string;
    city?: string;
    activity?: string;
    locale?: "fr" | "en";
    googleWebhookUrl?: string;
  };
  const activity = payload.activity?.trim() || "Association";
  const locale = payload.locale === "en" ? "en" : "fr";
  let crawl = { title: "", description: "", text: "" };
  try { crawl = await crawlWebsite(payload.websiteUrl); } catch { /* La démo peut être créée même si le site bloque le crawl. */ }
  const organization = payload.organization?.trim() || crawl.title.split(/[|—–-]/)[0].trim() || "Votre organisation";
  const slug = makeSlug(organization);
  const initials = organization.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const config: DemoConfig = {
    slug,
    organization,
    subtitle: locale === "en" ? "Online registrations" : "Inscriptions en ligne",
    initials,
    accent: "#6d5dfc",
    intro: locale === "en" ? "Select an activity. Schedules, prices and availability update automatically." : "Choisissez une activité. Les horaires, tarifs et places se mettent à jour automatiquement.",
    options: makeOptions(activity),
    recipientEmail: payload.recipientEmail,
    googleSheetEnabled: Boolean(payload.googleWebhookUrl),
  };
  const now = Date.now();
  await getDb().insert(demos).values({
    slug,
    organization,
    websiteUrl: payload.websiteUrl,
    recipientEmail: payload.recipientEmail,
    locale,
    activity,
    city: payload.city,
    configJson: JSON.stringify(config),
    googleWebhookUrl: payload.googleWebhookUrl,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    createdAt: now,
  });
  const demoUrl = `${new URL(request.url).origin}/d/${slug}`;
  const mail = prospectMail({ locale, firstName: payload.firstName, organization, city: payload.city, demoUrl });
  return Response.json({ ok: true, demoUrl, slug, expiresAt: now + 7 * 24 * 60 * 60 * 1000, config, crawl: { title: crawl.title, description: crawl.description }, mail });
}
