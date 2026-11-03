/**
 * The case's delivery build for the Room: reads the linked delivery-engine mission, keeps it
 * fresh while work runs, continues the build one step at a time while the owner has the Room
 * open, and records gate decisions. Gates stay human-only: this hook never passes one.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CaseRoomBuild } from "@/components/command/case-room";
import { buildDeliveryRoom } from "@/lib/pilot-mission/delivery-room";
import { buildWorkroom } from "@/lib/pilot-mission/workroom";
import { decideStageGate, runMissionStep } from "@/lib/workforce.functions";
import { missionBundleQuery } from "@/lib/workforce-queries";
import type { MissionBundle } from "@/lib/workforce/types";

const PLACEHOLDER_ID = "00000000-0000-0000-0000-000000000000";
/** Minimum gap between step requests from one open Room. */
const STEP_GAP_MS = 4000;
/** Step requests that change nothing before the Room stops asking (until the record moves). */
const MAX_IDLE_STEPS = 3;

export function useDeliveryBuild(wfMissionId: string | null): CaseRoomBuild | undefined {
  const qc = useQueryClient();
  const options = missionBundleQuery(wfMissionId ?? PLACEHOLDER_ID);
  const query = useQuery({
    ...options,
    enabled: Boolean(wfMissionId),
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return false;
      const state = buildDeliveryRoom(data).state;
      return state === "running" ? 5000 : state === "waiting_on_you" ? 20000 : false;
    },
  });
  const room = useMemo(() => (query.data ? buildDeliveryRoom(query.data) : null), [query.data]);
  const workroom = useMemo(() => (query.data ? buildWorkroom(query.data) : null), [query.data]);

  const merge = (next: MissionBundle) =>
    qc.setQueryData(options.queryKey, (prev) => (prev ? { ...prev, ...next } : prev));

  const step = useMutation({
    mutationFn: (missionId: string) => runMissionStep({ data: { missionId } }),
    onSuccess: (next) => merge(next),
  });
  const decide = useMutation({
    mutationFn: (input: {
      missionId: string;
      taskId: string;
      decision: "approve" | "reject";
      note: string;
    }) =>
      decideStageGate({
        data: {
          missionId: input.missionId,
          taskId: input.taskId,
          decision: input.decision,
          ...(input.note.trim() ? { note: input.note.trim() } : {}),
        },
      }),
    onSuccess: (next) => merge(next),
  });

  // Continue the build while the Room is open; the worker and its schedule cover the rest.
  // After a few steps that save nothing, stop and say so — a silent stop looked like a stall.
  const lastStep = useRef(0);
  const idle = useRef(0);
  const [paused, setPaused] = useState(false);
  const [stallNote, setStallNote] = useState<string | null>(null);
  const done = room?.progress.done ?? 0;
  useEffect(() => {
    idle.current = 0;
    setPaused(false);
    setStallNote(null);
  }, [done]);
  useEffect(() => {
    if (!wfMissionId || !room?.canAdvance || step.isPending || paused) return;
    const wait = Math.max(0, lastStep.current + STEP_GAP_MS - Date.now());
    const timer = setTimeout(() => {
      lastStep.current = Date.now();
      const before = room.progress.done;
      step.mutate(wfMissionId, {
        onSuccess: (next) => {
          if (buildDeliveryRoom(next).progress.done > before) return;
          const note = "note" in next && typeof next.note === "string" ? next.note : null;
          if (note?.startsWith("Waiting for work in progress")) return;
          idle.current += 1;
          if (idle.current >= MAX_IDLE_STEPS) {
            setPaused(true);
            setStallNote(note ?? "The last steps did not save a new document.");
          }
        },
        onError: (error) => {
          idle.current += 1;
          if (idle.current >= MAX_IDLE_STEPS) {
            setPaused(true);
            setStallNote(error instanceof Error ? error.message : "The build step failed.");
          }
        },
      });
    }, wait);
    return () => clearTimeout(timer);
  }, [wfMissionId, room, step, paused]);

  if (!wfMissionId) return undefined;
  const error = query.error ?? decide.error;
  return {
    room,
    workroom,
    error: error instanceof Error ? error.message : error ? "The build could not be loaded." : null,
    deciding: decide.isPending,
    stalled: paused && Boolean(room?.canAdvance),
    stallNote,
    onContinue: () => {
      idle.current = 0;
      setStallNote(null);
      setPaused(false);
    },
    onDecideGate: (taskId, decision, note) =>
      decide.mutate({ missionId: wfMissionId, taskId, decision, note }),
  };
}
