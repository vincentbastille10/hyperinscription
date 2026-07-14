import { getRuntimeEnv } from "../../../lib/runtime-env";

type Plan = "monthly" | "annual" | "oneshot";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({})) as {
    plan?: Plan;
    locale?: "fr" | "en";
    organization?: string;
    email?: string;
    demoSlug?: string;
  };
  const env = getRuntimeEnv();
  const plan = payload.plan || "monthly";
  const secret = env.STRIPE_SECRET_KEY as string | undefined;
  const prices: Record<Plan, string | undefined> = {
    monthly: env.STRIPE_PRICE_MONTHLY as string | undefined,
    annual: env.STRIPE_PRICE_ANNUAL as string | undefined,
    oneshot: env.STRIPE_PRICE_ONESHOT as string | undefined,
  };
  const price = prices[plan];
  if (!secret || !price) {
    return Response.json({ error: plan === "oneshot" ? "oneshot_quote_required" : "stripe_not_configured" }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const body = new URLSearchParams();
  body.set("mode", plan === "oneshot" ? "payment" : "subscription");
  body.set("line_items[0][price]", price);
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${origin}/?payment=cancelled#tarifs`);
  body.set("allow_promotion_codes", "true");
  body.set("metadata[plan]", plan);
  body.set("metadata[locale]", payload.locale || "fr");
  if (payload.organization) body.set("metadata[organization]", payload.organization);
  if (payload.demoSlug) body.set("metadata[demo_slug]", payload.demoSlug);
  if (payload.email) body.set("customer_email", payload.email);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${secret}:`)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const session = await response.json() as { url?: string; error?: { message?: string } };
  if (!response.ok || !session.url) {
    return Response.json({ error: "stripe_session_failed", detail: session.error?.message }, { status: 502 });
  }
  return Response.json({ url: session.url });
}
