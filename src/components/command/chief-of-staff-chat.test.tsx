import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { baseMission } from "@/lib/pilot-mission/test-fixtures";
import { ChiefOfStaffChat } from "./chief-of-staff-chat";

const clean = (html: string) => html.replaceAll("<!-- -->", "").replaceAll("&#x27;", "'");

describe("ChiefOfStaffChat", () => {
  it("opens as Chief of Staff and does not show a confirm button before a question", () => {
    const html = clean(
      renderToString(<ChiefOfStaffChat mission={baseMission()} onAction={() => undefined} />),
    );
    expect(html).toContain("Talk to Chief of Staff");
    expect(html).toContain("DX-001");
    expect(html).toContain("Aria stays the product-manager path");
    expect(html).toContain("What's the budget for this project?");
    expect(html).toContain("Prepare the project documents");
    expect(html).not.toContain("Confirm cancel");
    expect(html).not.toContain("Download project package");
  });
});
