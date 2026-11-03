import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Read one inbox item in full, including its body. Use before triaging an item you have not read.",
  schema: z.object({
    id: z.string().describe("Inbox item id from list-items"),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }, ctx) => {
    const email =
      ctx?.userEmail ?? fail("Sign in to read your inbox.", { statusCode: 401 });
    const t = schema.inboxItems;
    const [row] = await getDb()
      .select()
      .from(t)
      .where(and(eq(t.id, id), eq(t.ownerEmail, email)))
      .limit(1);
    if (!row)
      fail("Inbox item not found.", { errorCode: "not_found", statusCode: 404 });
    return {
      id: row.id,
      program: row.program,
      subject: row.subject,
      body: row.body,
      receivedAt: row.receivedAt,
      kind: row.kind,
      urgency: row.urgency,
      reason: row.reason,
      status: row.status,
    };
  },
});
