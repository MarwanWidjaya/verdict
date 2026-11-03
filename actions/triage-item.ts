import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Record a triage decision for one inbox item: kind (verdict = a decision on the hunter's work, action = needs the hunter's reply or a step, noise = marketing or system mail), urgency (high when money, a deadline, or a waiting counterparty is involved), and a one-line reason. Read the item with get-item first if you have not seen its body.",
  schema: z.object({
    id: z.string().describe("Inbox item id from list-items"),
    kind: z.enum(["verdict", "action", "noise"]).describe("Triage kind"),
    urgency: z
      .enum(["normal", "high"])
      .describe("high when money, a deadline, or a waiting counterparty is involved"),
    reason: z
      .string()
      .min(1)
      .max(200)
      .describe("One line on why this kind and urgency"),
  }),
  run: async ({ id, kind, urgency, reason }, ctx) => {
    const email =
      ctx?.userEmail ?? fail("Sign in to triage your inbox.", { statusCode: 401 });
    const t = schema.inboxItems;
    const [updated] = await getDb()
      .update(t)
      .set({ kind, urgency, reason })
      .where(and(eq(t.id, id), eq(t.ownerEmail, email)))
      .returning({ id: t.id });
    if (!updated)
      fail("Inbox item not found.", { errorCode: "not_found", statusCode: 404 });
    return { id, kind, urgency, reason };
  },
});
