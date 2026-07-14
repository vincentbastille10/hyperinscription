import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { campaigns } from "../../../../db/schema";
import { isHyperScriptAuthorized } from "../../../../lib/api-auth";

export async function GET(request: Request) {
  if (!isHyperScriptAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rows = await getDb().select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(30);
  return Response.json({ campaigns: rows });
}

export async function POST(request: Request) {
  if (!isHyperScriptAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as { externalRunId?: string; city?: string; activities?: string[]; locale?: string; status?: string };
  if (!payload.externalRunId || !payload.city || !payload.activities?.length) return Response.json({ error: "invalid_run" }, { status: 400 });
  const now = Date.now();
  const existing = await getDb().select().from(campaigns).where(eq(campaigns.externalRunId, payload.externalRunId)).limit(1);
  if (existing[0]) {
    await getDb().update(campaigns).set({ status: payload.status || existing[0].status, updatedAt: now }).where(eq(campaigns.externalRunId, payload.externalRunId));
    return Response.json({ ok: true, campaign: { ...existing[0], status: payload.status || existing[0].status, updatedAt: now } });
  }
  const [campaign] = await getDb().insert(campaigns).values({ externalRunId: payload.externalRunId, city: payload.city, activitiesJson: JSON.stringify(payload.activities), locale: payload.locale || "fr", status: payload.status || "running", createdAt: now, updatedAt: now }).returning();
  return Response.json({ ok: true, campaign }, { status: 201 });
}
