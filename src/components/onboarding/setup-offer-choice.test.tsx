import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PSI_OFFERS } from "@/lib/pilot/psi-catalog";
import { SetupOfferChoice } from "./setup-offer-choice";

const render = (
  value: "builder" | "founder" | "studio" | "demo" | null,
  storedPlan: "builder" | "founder" | "studio" | null = "studio",
) =>
  renderToString(
    <SetupOfferChoice
      value={value}
      onChange={() => undefined}
      storedRequest={storedPlan ? { reference: "DX-AAAAAAAA", plan: storedPlan } : null}
    />,
  ).replaceAll("<!-- -->", "");

describe("setup offer choice", () => {
  it("shows every catalog offer unchecked, and does not claim Studio is chosen", () => {
    const html = render(null);
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/aria-checked="false"/g)).toHaveLength(4);
    expect(html).not.toContain('aria-checked="true"');
    expect(html).not.toContain("Chosen offer");
    expect(html).toContain("It is not selected");
    for (const offer of PSI_OFFERS) {
      expect(html).toContain(`£${offer.amountGbp}/month`);
    }
    expect(html).toContain("No paid pilot");
    expect(html).toContain("Account setup does not activate a paid pilot.");
  });

  it("marks only the offer the founder picked", () => {
    const html = render("founder", null);
    expect(html).toContain("Chosen offer: Founder · £99/month.");
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-checked="true"[^>]*>[\s\S]*Founder/);
    expect(html).not.toContain("Studio · £299/month");
  });

  it("labels the demo path without a paid offer", () => {
    const html = render("demo");
    expect(html).toContain("No paid offer chosen. Demo workspace.");
    expect(html).not.toContain("Chosen offer");
    expect(html).toContain("Account setup does not activate a paid pilot.");
  });
});
