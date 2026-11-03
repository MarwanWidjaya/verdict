import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import {
  IconArchive,
  IconArrowBackUp,
  IconBolt,
  IconCheck,
  IconPlus,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  program: string;
  subject: string;
  receivedAt: string;
  kind: "unclassified" | "verdict" | "action" | "noise";
  urgency: "normal" | "high";
  reason: string | null;
  status: "new" | "done" | "archived";
};

type FullItem = Item & { body: string };

type Filter = "all" | "unclassified" | "action" | "verdict" | "noise" | "done";

const LIST_PARAMS = {};
const LIST_KEY = ["action", "list-items", LIST_PARAMS];

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function doFirstPick(items: Item[]): Item | undefined {
  const open = items.filter((item) => item.status === "new");
  return (
    open.find((item) => item.kind === "action" && item.urgency === "high") ??
    open.find((item) => item.kind === "action") ??
    open.find((item) => item.urgency === "high")
  );
}

export default function QueueRoute() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useActionQuery("list-items", LIST_PARAMS);
  const items = useMemo(() => (data?.items ?? []) as Item[], [data]);
  const selectedId = searchParams.get("item");
  const selected = items.find((item) => item.id === selectedId);
  const doFirst = useMemo(() => doFirstPick(items), [items]);

  const seed = useActionMutation("seed-inbox", {
    onSuccess: () => toast.success(t("queue.demoLoaded")),
    onError: (error) =>
      toast.error(actionErrorMessage(error) ?? t("queue.demoFailed")),
  });

  const visible = items.filter((item) => {
    if (filter === "all") return item.status !== "archived";
    if (filter === "done") return item.status === "done";
    if (filter === "unclassified")
      return item.status === "new" && item.kind === "unclassified";
    return item.status === "new" && item.kind === filter;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("queue.filterAll") },
    { key: "unclassified", label: t("queue.filterNeedsTriage") },
    { key: "action", label: t("queue.filterAction") },
    { key: "verdict", label: t("queue.filterVerdict") },
    { key: "noise", label: t("queue.filterNoise") },
    { key: "done", label: t("queue.filterDone") },
  ];

  function select(id: string | null) {
    setSearchParams(id ? { item: id } : {});
  }

  function kindBadge(item: Item) {
    if (item.kind === "verdict")
      return <Badge variant="secondary">{t("queue.kindVerdict")}</Badge>;
    if (item.kind === "action")
      return <Badge>{t("queue.kindAction")}</Badge>;
    if (item.kind === "noise")
      return <Badge variant="outline">{t("queue.kindNoise")}</Badge>;
    return <Badge variant="outline">{t("queue.kindUnclassified")}</Badge>;
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((entry) => (
            <Button
              key={entry.key}
              size="sm"
              variant={filter === entry.key ? "default" : "ghost"}
              onClick={() => setFilter(entry.key)}
            >
              {entry.label}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAdd((value) => !value)}
        >
          <IconPlus className="size-4" />
          {t("queue.addTitle")}
        </Button>
      </div>

      {showAdd ? (
        <AddItemForm
          onAdded={(id) => {
            setShowAdd(false);
            select(id);
          }}
        />
      ) : null}

      {isPending ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{t("queue.loadFailed")}</p>
      ) : items.length === 0 ? (
        <section className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm font-medium">{t("queue.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("queue.emptyHint")}
          </p>
          <Button
            className="mt-4"
            disabled={seed.isPending}
            onClick={() => seed.mutate({})}
          >
            {t("queue.loadDemo")}
          </Button>
        </section>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-2">
            {doFirst && filter === "all" ? (
              <button
                type="button"
                onClick={() => select(doFirst.id)}
                className={cn(
                  "w-full rounded-xl border border-primary/40 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10",
                  selectedId === doFirst.id && "ring-2 ring-primary/40",
                )}
              >
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                  <IconBolt className="size-3.5" />
                  {t("queue.doFirst")}
                </span>
                <span className="block truncate text-sm font-medium">
                  {doFirst.subject}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {doFirst.program} · {formatWhen(doFirst.receivedAt)}
                </span>
              </button>
            ) : null}
            {visible.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                {t("queue.empty")}
              </p>
            ) : (
              visible.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item.id)}
                  className={cn(
                    "w-full rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent",
                    selectedId === item.id && "ring-2 ring-primary/40",
                    item.status === "done" && "opacity-60",
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {item.subject}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {item.program} · {formatWhen(item.receivedAt)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {item.urgency === "high" ? (
                        <Badge variant="destructive">
                          {t("queue.urgencyHigh")}
                        </Badge>
                      ) : null}
                      {kindBadge(item)}
                    </span>
                  </span>
                  {item.reason ? (
                    <span className="mt-1.5 block truncate text-xs text-muted-foreground">
                      {item.reason}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
          <div className="lg:sticky lg:top-4">
            {selected ? (
              <ItemDetail
                key={selected.id}
                item={selected}
                queryClient={queryClient}
              />
            ) : (
              <section className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                {t("queue.selectItem")}
              </section>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function ItemDetail({
  item,
  queryClient,
}: {
  item: Item;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const t = useT();
  const { data, isPending } = useActionQuery("get-item", { id: item.id });
  const full = data as FullItem | undefined;
  const [kind, setKind] = useState<Item["kind"]>(
    item.kind === "unclassified" ? "action" : item.kind,
  );
  const [urgency, setUrgency] = useState<Item["urgency"]>(item.urgency);
  const [reason, setReason] = useState(item.reason ?? "");

  const patchList = (patch: Partial<Item>) => {
    queryClient.setQueryData(LIST_KEY, (old: { items: Item[] } | undefined) =>
      old
        ? {
            items: old.items.map((candidate) =>
              candidate.id === item.id ? { ...candidate, ...patch } : candidate,
            ),
          }
        : old,
    );
  };

  const triage = useActionMutation("triage-item", {
    onSuccess: (result) => {
      patchList({
        kind: result.kind as Item["kind"],
        urgency: result.urgency as Item["urgency"],
        reason: result.reason,
      });
      toast.success(t("queue.triageSaved"));
    },
    onError: (error) =>
      toast.error(actionErrorMessage(error) ?? t("queue.triageFailed")),
  });

  const setStatus = useActionMutation("set-item-status", {
    onSuccess: (result) => {
      patchList({ status: result.status as Item["status"] });
    },
    onError: (error) =>
      toast.error(actionErrorMessage(error) ?? t("queue.updateFailed")),
  });

  const kinds: { key: Item["kind"]; label: string }[] = [
    { key: "verdict", label: t("queue.kindVerdict") },
    { key: "action", label: t("queue.kindAction") },
    { key: "noise", label: t("queue.kindNoise") },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-base font-semibold tracking-tight">{item.subject}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {item.program} · {formatWhen(item.receivedAt)}
      </p>
      {isPending ? (
        <Skeleton className="mt-4 h-32 rounded-lg" />
      ) : (
        <p className="mt-4 text-sm whitespace-pre-wrap">{full?.body}</p>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">{t("queue.triageHint")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {kinds.map((entry) => (
            <Button
              key={entry.key}
              size="sm"
              variant={kind === entry.key ? "default" : "outline"}
              onClick={() => setKind(entry.key)}
            >
              {entry.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={urgency === "high" ? "destructive" : "outline"}
            onClick={() =>
              setUrgency(urgency === "high" ? "normal" : "high")
            }
          >
            {t("queue.urgencyHigh")}
          </Button>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="triage-reason">{t("queue.why")}</Label>
          <Input
            id="triage-reason"
            value={reason}
            maxLength={200}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={triage.isPending || !reason.trim()}
            onClick={() =>
              triage.mutate({
                id: item.id,
                kind: kind === "unclassified" ? "action" : kind,
                urgency,
                reason: reason.trim(),
              })
            }
          >
            {t("queue.saveTriage")}
          </Button>
          {item.status === "new" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ id: item.id, status: "done" })}
            >
              <IconCheck className="size-4" />
              {t("queue.markDone")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ id: item.id, status: "new" })}
            >
              <IconArrowBackUp className="size-4" />
              {t("queue.reopen")}
            </Button>
          )}
          {item.status !== "archived" ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={setStatus.isPending}
              onClick={() =>
                setStatus.mutate({ id: item.id, status: "archived" })
              }
            >
              <IconArchive className="size-4" />
              {t("queue.archive")}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AddItemForm({ onAdded }: { onAdded: (id: string) => void }) {
  const t = useT();
  const [program, setProgram] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const add = useActionMutation("add-item", {
    onSuccess: (result) => {
      toast.success(t("queue.added"));
      onAdded(result.id);
    },
    onError: (error) =>
      toast.error(actionErrorMessage(error) ?? t("queue.addFailed")),
  });
  const valid = program.trim() && subject.trim() && body.trim();

  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        add.mutate({
          program: program.trim(),
          subject: subject.trim(),
          body: body.trim(),
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="add-program">{t("queue.program")}</Label>
          <Input
            id="add-program"
            value={program}
            onChange={(event) => setProgram(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-subject">{t("queue.subject")}</Label>
          <Input
            id="add-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="add-body">{t("queue.body")}</Label>
        <Textarea
          id="add-body"
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
        />
      </div>
      <div>
        <Button type="submit" size="sm" disabled={!valid || add.isPending}>
          {add.isPending ? t("queue.adding") : t("queue.add")}
        </Button>
      </div>
    </form>
  );
}
