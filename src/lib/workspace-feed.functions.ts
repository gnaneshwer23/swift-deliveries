import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FeedItem = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  at: string;
  href: string;
};

export type WorkspaceFeed = {
  inbox: FeedItem[];
  timeline: FeedItem[];
};

/**
 * Inbox and Timeline are derived views over records the person already owns.
 * Nothing is created here, and no AI content is generated or persisted.
 */
export const getWorkspaceFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WorkspaceFeed> => {
    const { supabase, userId } = context;

    const [suggestions, tasks, meetings, documents, evidence, judgements, claims, submissions, reviews, applications] =
      await Promise.all([
        supabase
          .from("workspace_ai_suggestions")
          .select("id,kind,title,status,created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("workspace_tasks")
          .select("id,title,status,priority,due_at,updated_at")
          .eq("owner_id", userId)
          .order("updated_at", { ascending: false })
          .limit(40),
        supabase
          .from("workspace_meetings")
          .select("id,title,status,scheduled_at,created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("workspace_documents")
          .select("id,title,status,updated_at")
          .eq("owner_id", userId)
          .order("updated_at", { ascending: false })
          .limit(25),
        supabase
          .from("evidence_ledger")
          .select("id,summary,strength,capability_key,occurred_at")
          .eq("owner_id", userId)
          .order("occurred_at", { ascending: false })
          .limit(40),
        supabase
          .from("capability_judgements")
          .select("id,capability_key,level,band,created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("snapshot_claims")
          .select("id,capability_key,verified,attestation_status,updated_at")
          .eq("owner_id", userId)
          .order("updated_at", { ascending: false })
          .limit(25),
        supabase
          .from("coaching_submissions")
          .select("id,state,submitted_at,reviewed_at")
          .eq("owner_id", userId)
          .order("submitted_at", { ascending: false })
          .limit(25),
        supabase
          .from("performance_reviews")
          .select("id,period_label,status,reviewer_decision,submitted_at,reviewed_at,created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("job_applications")
          .select("id,company,role_title,stage,next_step,next_step_at,updated_at")
          .eq("owner_id", userId)
          .order("updated_at", { ascending: false })
          .limit(30),
      ]);

    const firstError = [
      suggestions.error,
      tasks.error,
      meetings.error,
      documents.error,
      evidence.error,
      judgements.error,
      claims.error,
      submissions.error,
      reviews.error,
      applications.error,
    ].find(Boolean);
    if (firstError) throw new Error(firstError.message);

    const inbox: FeedItem[] = [];
    const now = Date.now();

    for (const s of suggestions.data ?? []) {
      if (s.status !== "ready") continue;
      inbox.push({
        id: `suggestion-${s.id}`,
        kind: "AI draft waiting",
        title: s.title,
        detail: "An AI draft is waiting for your approval, edit or dismissal. It is not submitted.",
        at: s.created_at,
        href: "/workspace/projects",
      });
    }
    for (const t of tasks.data ?? []) {
      if (t.status === "blocked") {
        inbox.push({
          id: `task-${t.id}`,
          kind: "Task blocked",
          title: t.title,
          detail: `Priority ${t.priority}. Blocked and waiting on you.`,
          at: t.updated_at,
          href: "/workspace/projects",
        });
      } else if (t.due_at && t.status !== "done" && new Date(t.due_at).getTime() < now) {
        inbox.push({
          id: `task-due-${t.id}`,
          kind: "Task overdue",
          title: t.title,
          detail: `Due ${new Date(t.due_at).toLocaleDateString("en-GB")}.`,
          at: t.due_at,
          href: "/workspace/projects",
        });
      }
    }
    for (const m of meetings.data ?? []) {
      if (m.status !== "planned") continue;
      inbox.push({
        id: `meeting-${m.id}`,
        kind: "Meeting planned",
        title: m.title,
        detail: m.scheduled_at
          ? `Scheduled ${new Date(m.scheduled_at).toLocaleString("en-GB")}.`
          : "No date set yet.",
        at: m.scheduled_at ?? m.created_at,
        href: "/workspace/projects",
      });
    }
    for (const d of documents.data ?? []) {
      if (d.status !== "working") continue;
      inbox.push({
        id: `document-${d.id}`,
        kind: "Artefact unsubmitted",
        title: d.title,
        detail: "Working artefact. Submitting freezes it and records evidence.",
        at: d.updated_at,
        href: "/workspace/projects",
      });
    }
    for (const s of submissions.data ?? []) {
      if (s.state === "rejected") {
        inbox.push({
          id: `submission-${s.id}`,
          kind: "Coaching returned",
          title: "A coach returned a submission",
          detail: "Read the coach note and resubmit when ready.",
          at: s.reviewed_at ?? s.submitted_at,
          href: "/workspace/coaching",
        });
      }
    }
    for (const r of reviews.data ?? []) {
      if (r.status === "draft") {
        inbox.push({
          id: `review-${r.id}`,
          kind: "Review in draft",
          title: `${r.period_label} performance review`,
          detail: "Your self-assessment is not submitted for review yet.",
          at: r.created_at,
          href: "/workspace/reviews",
        });
      } else if (r.status === "reviewed" && r.reviewer_decision === "returned") {
        inbox.push({
          id: `review-returned-${r.id}`,
          kind: "Review returned",
          title: `${r.period_label} performance review`,
          detail: "A reviewer asked for more detail before confirming.",
          at: r.reviewed_at ?? r.created_at,
          href: "/workspace/reviews",
        });
      }
    }
    for (const a of applications.data ?? []) {
      if (a.stage === "closed" || !a.next_step) continue;
      inbox.push({
        id: `application-${a.id}`,
        kind: "Application next step",
        title: `${a.role_title} · ${a.company}`,
        detail: a.next_step_at
          ? `${a.next_step} — ${new Date(a.next_step_at).toLocaleDateString("en-GB")}`
          : a.next_step,
        at: a.next_step_at ?? a.updated_at,
        href: "/workspace/applications",
      });
    }

    const timeline: FeedItem[] = [];
    for (const e of evidence.data ?? []) {
      timeline.push({
        id: `evidence-${e.id}`,
        kind: "Evidence recorded",
        title: e.summary,
        detail: `Strength: ${e.strength}${e.capability_key ? ` · ${e.capability_key}` : ""}`,
        at: e.occurred_at,
        href: "/workspace/evidence",
      });
    }
    for (const j of judgements.data ?? []) {
      timeline.push({
        id: `judgement-${j.id}`,
        kind: "Capability judged",
        title: `${j.capability_key} judged at level ${j.level}`,
        detail: `${j.band} confidence. Judgements never light a Verified signal.`,
        at: j.created_at,
        href: "/workspace/capability",
      });
    }
    for (const c of claims.data ?? []) {
      if (!c.verified) continue;
      timeline.push({
        id: `claim-${c.id}`,
        kind: "Verified (external)",
        title: `${c.capability_key} verified by independent attestation`,
        detail: `Attestation status: ${c.attestation_status}`,
        at: c.updated_at,
        href: "/workspace/capability",
      });
    }
    for (const s of submissions.data ?? []) {
      timeline.push({
        id: `submitted-${s.id}`,
        kind: s.state === "confirmed" ? "Verified (coach)" : "Coaching submitted",
        title:
          s.state === "confirmed"
            ? "A coach confirmed your submission"
            : `Coaching submission ${s.state}`,
        detail:
          s.state === "confirmed"
            ? "Coach confirmation is separate from independent external verification."
            : "Waiting on a coach decision.",
        at: s.reviewed_at ?? s.submitted_at,
        href: "/workspace/coaching",
      });
    }
    for (const r of reviews.data ?? []) {
      if (r.status !== "reviewed") continue;
      timeline.push({
        id: `review-done-${r.id}`,
        kind: "Performance review",
        title: `${r.period_label} review ${r.reviewer_decision}`,
        detail: "Written by a human reviewer.",
        at: r.reviewed_at ?? r.created_at,
        href: "/workspace/reviews",
      });
    }

    const byNewest = (a: FeedItem, b: FeedItem) => new Date(b.at).getTime() - new Date(a.at).getTime();
    return {
      inbox: inbox.sort(byNewest).slice(0, 40),
      timeline: timeline.sort(byNewest).slice(0, 80),
    };
  });
