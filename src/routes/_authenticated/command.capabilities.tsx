import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CommandShell } from "@/components/command/command-shell";
import { TeamDirectory } from "@/components/command/team-directory";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { PROJECT_LIST_LIMIT } from "@/lib/pilot-mission/projects-dashboard";

export const Route = createFileRoute("/_authenticated/command/capabilities")({
  head: () => ({
    meta: [
      { title: "AI team — DeliverX Studio" },
      {
        name: "description",
        content:
          "Every role on the DeliverX team, whether it can run today and which of your projects it works on.",
      },
    ],
  }),
  component: AiTeamPage,
});

function AiTeamPage() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const projects = home.data?.ready ? home.data.missions : [];

  return (
    <CommandShell
      title="AI team"
      hideHeading
      usage={home.data?.ready && home.data.usage ? home.data.usage : undefined}
    >
      {home.isPending ? (
        <p className="cc-muted" role="status" style={{ padding: "2rem" }}>
          Loading the team…
        </p>
      ) : home.isError || !home.data?.ready ? (
        <div role="alert" style={{ padding: "2rem" }}>
          <p>
            Your projects could not be loaded, so the team can’t show who is working on what.
            {home.data && !home.data.ready && home.data.reason ? ` ${home.data.reason}` : ""}
          </p>
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            disabled={home.isFetching}
            onClick={() => void home.refetch()}
          >
            {home.isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      ) : (
        <TeamDirectory projects={projects} capped={projects.length >= PROJECT_LIST_LIMIT} />
      )}
    </CommandShell>
  );
}
