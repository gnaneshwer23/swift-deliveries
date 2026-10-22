/** Product destinations shared by auth, setup and the Command Centre. */
import type { DxProfile } from "./dx-profile";

export function safeProductRedirect(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 3000 || !raw.startsWith("/") || /[\\\r\n]/.test(raw))
    return "/command";
  try {
    const url = new URL(raw, "https://deliverx.invalid");
    if (url.origin !== "https://deliverx.invalid" || !/^\/command(?:\/|$)/.test(url.pathname))
      return "/command";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/command";
  }
}

export function firstActionFor(profile: Pick<DxProfile, "goal" | "firstIdea">) {
  if (profile.goal === "Improve an existing product") {
    const search = new URLSearchParams({ intent: "improve" });
    if (profile.firstIdea) search.set("prompt", profile.firstIdea);
    return {
      href: `/command?${search}`,
      label: "Plan my improvement",
      reason: "Start with a focused diagnosis and a plan you can review before work begins.",
    };
  }
  const params = new URLSearchParams();
  if (profile.firstIdea) params.set("idea", profile.firstIdea);
  const href = `/command/programmes${params.size ? `?${params}` : ""}`;
  if (profile.goal === "Validate a new idea")
    return {
      href,
      label: "Validate my idea",
      reason:
        "Start with discovery, compare your options and review the evidence before committing to a build.",
    };
  if (profile.goal === "Learn by building a product")
    return {
      href,
      label: "Start my learning project",
      reason:
        "Bring a product idea, inspect the team's work and practise making the decisions at each approval gate.",
    };
  if (profile.goal === "Build an MVP")
    return {
      href,
      label: "Plan my MVP",
      reason:
        "Shape your idea into a product brief, roadmap and reviewable prototype, with you at each gate.",
    };
  return {
    href,
    label: "Explore a programme",
    reason: "Try your own idea or load the example to explore how the product team works.",
  };
}
