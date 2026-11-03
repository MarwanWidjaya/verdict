import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

const DEMO_ITEMS = [
  {
    program: "NovaCart (via BugBounty Platform)",
    subject: "Report triaged: Stored XSS in checkout — Low, $250 bounty",
    body: "Good news: your report 'Stored XSS in checkout comments' has been triaged as Low severity with a $250 bounty. The team has shipped a fix and asks you to retest within 7 days to confirm the issue is resolved. The bounty is released after the retest passes.",
    receivedAt: "2026-11-03T14:12:00.000Z",
  },
  {
    program: "Finlytic API",
    subject: "More info needed on report #B-221 — reply within 5 days",
    body: "Thanks for the detailed write-up on the tenant-isolation bypass. One question before we can finish triage: does the bypass also work from a second workspace you own, or only against the demo tenant? Please reply within 5 days; reports without a reply are closed as needs-more-info.",
    receivedAt: "2026-11-03T09:03:00.000Z",
  },
  {
    program: "BugBounty Platform",
    subject: "October changelog: new dashboard, badges, and faster payouts",
    body: "This month on the platform: a redesigned researcher dashboard, three new profile badges, payout batching changes, and a recap of the community meetup. Read the full post on our blog.",
    receivedAt: "2026-11-02T17:45:00.000Z",
  },
  {
    program: "BugBounty Platform",
    subject: "Payout sent: $480",
    body: "A payout of $480 for two resolved reports has been sent to your linked account. No action is needed. The breakdown is attached to your payouts page.",
    receivedAt: "2026-11-02T08:20:00.000Z",
  },
  {
    program: "BugBounty Platform",
    subject: "Identity verification expires in 3 days",
    body: "Your identity verification expires in 3 days. Paid programs require a current verification. Re-verify from your settings page to avoid an interruption to submissions and payouts.",
    receivedAt: "2026-11-01T19:30:00.000Z",
  },
  {
    program: "CloudDesk",
    subject: "New program launch: CloudDesk API, bounties up to $5,000",
    body: "We just launched our public bug bounty program. Scope covers the CloudDesk API and web app, with bounties from $100 to $5,000. Read the program brief and happy hunting.",
    receivedAt: "2026-11-01T11:00:00.000Z",
  },
  {
    program: "ShopLane",
    subject: "Report closed as duplicate",
    body: "Your report 'IDOR on order receipts' was closed as a duplicate of an earlier report covering the same root cause. No bounty is awarded for duplicates. Thanks for the submission — the underlying issue is being fixed.",
    receivedAt: "2026-10-31T15:26:00.000Z",
  },
];

export default defineAction({
  description:
    "Load the demo inbox (sample bounty mail) for the current user. Only works while the inbox is empty.",
  schema: z.object({}),
  run: async (_args, ctx) => {
    const email =
      ctx?.userEmail ?? fail("Sign in to load the demo inbox.", { statusCode: 401 });
    const t = schema.inboxItems;
    const existing = await getDb()
      .select({ id: t.id })
      .from(t)
      .where(eq(t.ownerEmail, email))
      .limit(1);
    if (existing.length)
      fail("The demo inbox loads only into an empty inbox.", {
        errorCode: "not_empty",
        statusCode: 409,
      });
    const orgId = ctx?.orgId ?? null;
    const rows = DEMO_ITEMS.map((item) => ({
      id: crypto.randomUUID(),
      ...item,
      ownerEmail: email,
      orgId,
    }));
    await getDb().insert(t).values(rows);
    return { inserted: rows.length };
  },
});
