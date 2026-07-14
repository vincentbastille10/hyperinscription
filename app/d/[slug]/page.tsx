import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "../../../db";
import { clients, demos } from "../../../db/schema";
import RegistrationDemo, { type DemoConfig } from "../../components/RegistrationDemo";

export const dynamic = "force-dynamic";

export default async function PersonalizedDemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const demoRows = await db.select().from(demos).where(eq(demos.slug, slug)).limit(1);
  const clientRows = demoRows.length ? [] : await db.select().from(clients).where(eq(clients.slug, slug)).limit(1);
  const record = demoRows[0] || clientRows[0];
  if (!record) notFound();

  const isDemo = "expiresAt" in record;
  // This value is intentionally evaluated per request for the seven-day demo expiry.
  // eslint-disable-next-line react-hooks/purity
  if (isDemo && record.expiresAt < Date.now()) {
    return <main className="expired-demo"><div className="brand-mark">H<span>+</span></div><p>DÉMONSTRATION EXPIRÉE</p><h1>Cette démo privée n’est plus active.</h1><span>Elle peut être réactivée simplement par Spectra Media AI.</span><a href="mailto:contact@spectramedia.online">Demander sa réactivation</a></main>;
  }

  if (isDemo) await db.update(demos).set({ views: sql`${demos.views} + 1` }).where(eq(demos.slug, slug));
  const config = JSON.parse(record.configJson) as DemoConfig;
  config.slug = slug;

  return <main className="public-form-page"><div className="public-form-top"><div className="brand"><span className="brand-mark">H<span>+</span></span><span className="brand-copy"><strong>HYPERINSCRIPTION</strong><small>SPECTRA MEDIA AI</small></span></div>{isDemo && <span>Démo privée · 7 jours</span>}</div><RegistrationDemo config={config}/><p className="powered-by">Formulaire propulsé par HyperInscription · Spectra Media AI</p></main>;
}
