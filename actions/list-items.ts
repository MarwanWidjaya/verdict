import { defineAction, fail } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "List the current user's bounty inbox items, newest first. Filter by status or kind when asked.",
  schema: z.object({
    status: z
      .enum(["new", "done", "archived"])
      .optional()
      .describe("Only items with this status; omit for all"),
    kind: z
      .enum(["unclassified", "verdict", "action", "noise"])
      .optional()
      .describe("Only items with this kind; omit for all"),
  }),
  http: { method: "GET" },
  readOnly: true,
  link: () => ({
    url: buildDeepLink({ view: "queue", to: "/queue" }),
    label: "Open Verdict queue",
  }),
  run: async (args, ctx) => {
    const email =
      ctx?.userEmail ?? fail("Sign in to see your inbox.", { statusCode: 401 });
    const t = schema.inboxItems;
    const filters = [eq(t.ownerEmail, email)];
    if (args.status) filters.push(eq(t.status, args.status));
    if (args.kind) filters.push(eq(t.kind, args.kind));
    const rows = await getDb()
      .select({
        id: t.id,
        program: t.program,
        subject: t.subject,
        receivedAt: t.receivedAt,
        kind: t.kind,
        urgency: t.urgency,
        reason: t.reason,
        status: t.status,
      })
      .from(t)
      .where(and(...filters))
      .orderBy(desc(t.receivedAt))
      .limit(200);
    return { items: rows };
  },
});
