import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  organization: text("organization").notNull(),
  email: text("email").notNull(),
  locale: text("locale").notNull().default("fr"),
  plan: text("plan").notNull().default("monthly"),
  status: text("status").notNull().default("active"),
  configJson: text("config_json").notNull(),
  googleWebhookUrl: text("google_webhook_url"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [uniqueIndex("clients_slug_idx").on(table.slug), index("clients_email_idx").on(table.email)]);

export const demos = sqliteTable("demos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  organization: text("organization").notNull(),
  websiteUrl: text("website_url"),
  recipientEmail: text("recipient_email"),
  locale: text("locale").notNull().default("fr"),
  activity: text("activity"),
  city: text("city"),
  configJson: text("config_json").notNull(),
  googleWebhookUrl: text("google_webhook_url"),
  views: integer("views").notNull().default(0),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("demos_slug_idx").on(table.slug), index("demos_email_idx").on(table.recipientEmail)]);

export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  externalRunId: text("external_run_id").notNull(),
  city: text("city").notNull(),
  activitiesJson: text("activities_json").notNull(),
  locale: text("locale").notNull().default("fr"),
  status: text("status").notNull().default("queued"),
  foundCount: integer("found_count").notNull().default(0),
  demoCount: integer("demo_count").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  clickedCount: integer("clicked_count").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [uniqueIndex("campaigns_run_idx").on(table.externalRunId), index("campaigns_status_idx").on(table.status)]);

export const prospects = sqliteTable("prospects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  externalId: text("external_id").notNull(),
  campaignRunId: text("campaign_run_id"),
  organization: text("organization").notNull(),
  websiteUrl: text("website_url"),
  email: text("email"),
  activity: text("activity"),
  city: text("city"),
  locale: text("locale").notNull().default("fr"),
  status: text("status").notNull().default("found"),
  score: integer("score").notNull().default(0),
  signal: text("signal"),
  demoSlug: text("demo_slug"),
  lastEventAt: integer("last_event_at").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("prospects_external_idx").on(table.externalId), index("prospects_score_idx").on(table.score)]);

export const registrations = sqliteTable("registrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceSlug: text("source_slug").notNull(),
  organization: text("organization").notNull(),
  registrantName: text("registrant_name").notNull(),
  registrantEmail: text("registrant_email").notNull(),
  registrantPhone: text("registrant_phone"),
  fieldsJson: text("fields_json").notNull(),
  selectionsJson: text("selections_json").notNull(),
  totalCents: integer("total_cents").notNull().default(0),
  emailDelivered: integer("email_delivered", { mode: "boolean" }).notNull().default(false),
  sheetDelivered: integer("sheet_delivered", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("registrations_slug_idx").on(table.sourceSlug), index("registrations_created_idx").on(table.createdAt)]);

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("event_type").notNull(),
  externalId: text("external_id"),
  payloadJson: text("payload_json").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("events_type_idx").on(table.eventType), index("events_created_idx").on(table.createdAt)]);
