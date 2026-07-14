export type HyperInscriptionEnv = {
  DB?: D1Database;
  MJ_API_KEY?: string;
  MJ_API_SECRET?: string;
  MJ_FROM_EMAIL?: string;
  MJ_FROM_NAME?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_MONTHLY?: string;
  STRIPE_PRICE_ANNUAL?: string;
  STRIPE_PRICE_ONESHOT?: string;
  HYPERINSCRIPTION_API_TOKEN?: string;
  [key: string]: unknown;
};

declare global {
  // The Worker entrypoint refreshes this reference at the beginning of every request.
  // Bindings are deployment-wide and identical across concurrent requests.
  var __HYPERINSCRIPTION_ENV__: HyperInscriptionEnv | undefined;
}

export function setRuntimeEnv(value: HyperInscriptionEnv) {
  globalThis.__HYPERINSCRIPTION_ENV__ = value;
}

export function getRuntimeEnv() {
  return globalThis.__HYPERINSCRIPTION_ENV__ || {};
}
