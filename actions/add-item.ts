import { defineAction, fail } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Add a message to the inbox as an unclassified item, ready for triage.",
  schema: z.object({
    program: z.string().min(1).describe("Program or sender name"),
    subject: z.string().min(1).describe("Message subject"),
    body: z.string().min(1).describe("Full message body"),
    receivedAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .describe("When it arrived, ISO 8601 with offset; defaults to now"),
  }),
  link: ({ result }) => ({
    url: buildDeepLink({
      view: "queue",
      to: `/queue?item=${encodeURIComponent(result.id)}`,
      params: { itemId: result.id },
    }),
    label: "Open in Verdict queue",
  }),
  run: async (args, ctx) => {
    const email =
      ctx?.userEmail ?? fail("Sign in to add inbox items.", { statusCode: 401 });
    const item = {
      id: crypto.randomUUID(),
      program: args.program,
      subject: args.subject,
      body: args.body,
      receivedAt: args.receivedAt
        ? new Date(args.receivedAt).toISOString()
        : new Date().toISOString(),
      ownerEmail: email,
      orgId: ctx?.orgId ?? null,
    };
    await getDb().insert(schema.inboxItems).values(item);
    return { id: item.id, program: item.program, subject: item.subject };
  },
});
