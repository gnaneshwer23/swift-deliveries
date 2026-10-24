import { FileCheck2 } from "lucide-react";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { commandCentreBootstrapQuery, missionBundleQuery } from "@/lib/workforce-queries";
import { getCapability } from "@/lib/workforce/registry";

export function WorkforceInvolvement() {
  const bootstrap = useQuery(commandCentreBootstrapQuery);
  const supervised = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const [selected, setSelected] = useState("");
  const missions = bootstrap.data?.recentMissions ?? [];
  const id = selected || missions[0]?.id || "";
  const bundle = useQuery({
    ...missionBundleQuery(id),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.mission.status === "running" ? 15_000 : false),
  });
  const tasks = bundle.data?.tasks ?? [];
  const done = tasks.filter((t) => t.status === "completed").length;
  const roleIds = [...new Set(tasks.filter((t) => !t.gate).flatMap((t) => t.capabilityIds))];
  return (
    <section className="ps-workload">
      <div className="ps-section-heading">
        <div>
          <h2>Specialist involvement</h2>
          <p>Assignments and task completion from a selected mission record.</p>
        </div>
        {missions.length > 0 && (
          <select
            aria-label="Mission to inspect"
            value={id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {missions.map((m) => (
              <option value={m.id} key={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        )}
      </div>
      {bootstrap.isError || bundle.isError ? (
        <p className="ps-error">Could not load mission assignments. Refresh to try again.</p>
      ) : bootstrap.isPending || (!!id && bundle.isPending) ? (
        <p className="ps-busy">Loading mission records…</p>
      ) : !id ? (
        <div>
          <p className="ps-subtle">
            No specialist task assignments yet. Your saved decision work is shown below; it does not
            imply agents have executed tasks.
          </p>
          {supervised.isPending ? (
            <p className="ps-busy">Loading saved decision missions…</p>
          ) : supervised.isError ? (
            <p className="ps-error">Decision missions could not load. Refresh to try again.</p>
          ) : !supervised.data?.ready ? (
            <p className="ps-error">{supervised.data?.reason}</p>
          ) : supervised.data.missions.length > 0 ? (
            supervised.data.missions.slice(0, 3).map((m) => (
              <article key={m.id} className="ps-decision-record">
                <FileCheck2 size={19} />
                <div>
                  <small>Saved decision mission</small>
                  <strong>{m.question}</strong>
                  <p>
                    {m.nextTitle} · {m.usageConsumed} usage units
                  </p>
                </div>
                <Link to="/command/supervised/$missionId" params={{ missionId: m.id }}>
                  Open record →
                </Link>
              </article>
            ))
          ) : (
            <div className="ps-empty">
              Start with one product question to create a reviewable evidence and decision trail.{" "}
              <Link to="/command">Open your workspace</Link>.
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="ps-section-heading">
            <span className="ps-pill">
              {done} / {tasks.length} tasks completed
            </span>
            <Link to="/command/missions/$missionId" params={{ missionId: id }}>
              Open mission →
            </Link>
          </div>
          <progress
            aria-label="Recorded task completion"
            value={done}
            max={Math.max(tasks.length, 1)}
            style={{ width: "100%", height: 5, accentColor: "#4567ec", marginBottom: 15 }}
          />
          {roleIds.length > 0 && (
            <div className="ps-contributors">
              {roleIds.map((roleId) => {
                const assigned = tasks.filter((t) => !t.gate && t.capabilityIds.includes(roleId));
                const completed = assigned.filter((t) => t.status === "completed").length;
                return (
                  <div key={roleId}>
                    <strong>{getCapability(roleId)?.name ?? roleId}</strong>
                    <small>
                      {completed} / {assigned.length} assigned tasks completed
                    </small>
                    <progress
                      aria-label={`${getCapability(roleId)?.name ?? roleId} assigned task completion`}
                      max={assigned.length}
                      value={completed}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {tasks.length === 0 ? (
            <div className="ps-empty">No task plan has been saved for this mission.</div>
          ) : (
            tasks.map((t) => (
              <div className="ps-task-row" key={t.id}>
                <strong>{t.title}</strong>
                <small>
                  {t.gate
                    ? "Human approval gate"
                    : t.capabilityIds.map((c) => getCapability(c)?.name ?? c).join(", ") ||
                      "No specialist assigned"}
                  {t.dependsOn.length > 0
                    ? ` · After ${t.dependsOn.map((key) => tasks.find((task) => task.key === key)?.title ?? key).join(", ")}`
                    : ""}
                </small>
                <span className="ps-pill" data-state={t.status}>
                  {t.status.replaceAll("_", " ")}
                </span>
              </div>
            ))
          )}
          <p className="ps-subtle" style={{ marginTop: 15 }}>
            Task completion is not evidence of a measured product outcome. Check the mission
            artefacts for model or simulation provenance.
          </p>
        </>
      )}
    </section>
  );
}
