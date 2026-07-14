/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
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
  }
}
