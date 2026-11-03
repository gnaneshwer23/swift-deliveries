/**
 * One label for the mission's next required action, shared by the checkpoint,
 * Aria's lines and the dock. The id and detail still come from `nextRequiredAction`.
 */
export function nextGateLabel(next: { id: string; title: string }): string {
  switch (next.id) {
    case "approve_plan":
      return "Review and approve the plan";
    case "evidence":
    case "compare":
      return "Let the team compare options";
    case "retry":
      return "Try the comparison again";
    case "recover":
      return "Check on the comparison";
    case "research_queued":
      return "The team is investigating";
    case "decide":
      return "Make your decision";
    case "expectation":
      return "Say what you expect to happen";
    case "artefact":
      return "Prepare the decision pack";
    case "export":
      return "Download the decision pack";
    case "cancelled":
      return "This case is cancelled";
    default:
      return next.title;
  }
}
