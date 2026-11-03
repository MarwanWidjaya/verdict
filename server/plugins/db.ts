import { runMigrations } from "@agent-native/core/db";

export default runMigrations(
  [
    {
      version: 1,
      name: "inbox-items",
      sql: `CREATE TABLE IF NOT EXISTS inbox_items (
  id TEXT PRIMARY KEY,
  program TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  received_at TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'unclassified' CHECK (kind IN ('unclassified', 'verdict', 'action', 'noise')),
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'high')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'done', 'archived')),
  owner_email TEXT NOT NULL,
  org_id TEXT,
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS inbox_items_owner_received_idx ON inbox_items (owner_email, received_at);
CREATE INDEX IF NOT EXISTS inbox_items_owner_status_idx ON inbox_items (owner_email, status, kind)`,
    },
  ],
  { table: "verdict_app_migrations" },
);
