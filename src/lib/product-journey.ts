/** Product destinations shared by auth, setup and the Command Centre. */
import type { DxProfile } from "./dx-profile";

export function safeProductRedirect(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 3000 || !raw.startsWith("/") || /[\\\r\n]/.test(raw))
    return "/command";
  try {
    const url = new URL(raw, "https://deliverx.invalid");
    if (url.origin !== "https://deliverx.invalid" || !/^\/command(?:\/|$)/.test(url.pathname))
      return "/command";
    url.searchParams.delete("prompt");
    url.searchParams.delete("idea");
    const search = url.searchParams.toString();
    return `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
  } catch {
    return "/command";
  }
}

export function firstActionFor(profile: Pick<DxProfile, "goal" | "firstIdea">) {
  // The product question stays on the saved profile. Only the public intent is placed in the URL.
  if (profile.goal === "Improve an existing product") {
    return {
      href: "/command?intent=improve#mission-composer",
      label: "Investigate the question",
      reason:
        "Separate supplied evidence from assumptions, compare options, and approve the decision before any change.",
    };
  }
  if (profile.goal === "Build an MVP") {
    return {
      href: "/command?intent=prototype#mission-composer",
      label: "Shape reviewable work",
      reason:
        "Turn the question into a specification you can inspect. A prototype is an agreed extension, not a deployed product.",
    };
  }
  if (profile.goal === "Learn by building a product") {
    return {
      href: "/command?intent=investigate#mission-composer",
      label: "Start from the question",
      reason:
        "Use the same path as a founder: evidence, a human decision and reviewable work. Learning does not lower that standard.",
    };
  }
  if (profile.goal === "Validate a new idea") {
    return {
      href: "/command?intent=investigate#mission-composer",
      label: "Compare the evidence",
      reason:
        "Bring the product question, compare options against supplied evidence, and decide what happens next.",
    };
  }
  return {
    href: "/command?intent=investigate#mission-composer",
    label: "Open the product question",
    reason:
      "Start with one product question. Evidence, your decision and reviewable work stay together.",
  };
}
