import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Set an inbox item's status: new (still open), done (handled), or archived (kept for the record).",
  schema: z.object({
    id: z.string().describe("Inbox item id from list-items"),
    status: z.enum(["new", "done", "archived"]).describe("New status"),
  }),
  run: async ({ id, status }, ctx) => {
    const email =
      ctx?.userEmail ?? fail("Sign in to update your inbox.", { statusCode: 401 });
    const t = schema.inboxItems;
    const [updated] = await getDb()
      .update(t)
      .set({ status })
      .where(and(eq(t.id, id), eq(t.ownerEmail, email)))
      .returning({ id: t.id });
    if (!updated)
      fail("Inbox item not found.", { errorCode: "not_found", statusCode: 404 });
    return { id, status };
  },
});
