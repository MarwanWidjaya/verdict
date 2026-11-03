import { sql } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";

// One hunter's inbox. Private to its creator: every read and write is
// scoped by owner_email in the actions.
export const inboxItems = pgTable("inbox_items", {
  id: text("id").primaryKey(),
  program: text("program").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  receivedAt: text("received_at").notNull(), // UTC ISO; string order = time order
  kind: text("kind", {
    enum: ["unclassified", "verdict", "action", "noise"],
  })
    .notNull()
    .default("unclassified"),
  urgency: text("urgency", { enum: ["normal", "high"] })
    .notNull()
    .default("normal"),
  reason: text("reason"), // the agent's one-line justification, set by triage-item
  status: text("status", { enum: ["new", "done", "archived"] })
    .notNull()
    .default("new"),
  ownerEmail: text("owner_email").notNull(),
  orgId: text("org_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});
