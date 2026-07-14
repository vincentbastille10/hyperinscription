import { getRuntimeEnv } from "./runtime-env";

export function isHyperScriptAuthorized(request: Request) {
  const env = getRuntimeEnv();
  const expected = env.HYPERINSCRIPTION_API_TOKEN as string | undefined;
  // Closed by default: the crawling and demo-generation endpoints never become
  // public merely because a deployment forgot to configure its bridge token.
  if (!expected) return false;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  return provided === expected;
}
