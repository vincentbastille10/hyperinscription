import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { events, prospects } from "../../../../db/schema";
import { isHyperScriptAuthorized } from "../../../../lib/api-auth";

export async function POST(request: Request) {
  if (!isHyperScriptAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as {
    externalId?: string; campaignRunId?: string; organization?: string; websiteUrl?: string; email?: string;
    activity?: string; city?: string; locale?: string; status?: string; score?: number; signal?: string; demoSlug?: string;
  };
  if (!payload.externalId || !payload.organization) return Response.json({ error: "invalid_prospect" }, { status: 400 });
  const now = Date.now();
  const db = getDb();
  const existing = await db.select().from(prospects).where(eq(prospects.externalId, payload.externalId)).limit(1);
  const values = {
    campaignRunId: payload.campaignRunId,
    organization: payload.organization,
    websiteUrl: payload.websiteUrl,
    email: payload.email,
    activity: payload.activity,
    city: payload.city,
    locale: payload.locale || "fr",
    status: payload.status || "found",
    score: Math.max(0, Math.min(100, Number(payload.score || 0))),
    signal: payload.signal,
    demoSlug: payload.demoSlug,
    lastEventAt: now,
  };
  if (existing[0]) await db.update(prospects).set(values).where(eq(prospects.externalId, payload.externalId));
  else await db.insert(prospects).values({ externalId: payload.externalId, ...values, createdAt: now });
  await db.insert(events).values({ eventType: `prospect.${values.status}`, externalId: payload.externalId, payloadJson: JSON.stringify(payload), createdAt: now });
  return Response.json({ ok: true });
}
