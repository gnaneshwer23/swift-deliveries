import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/cookies")({
  head: () =>
    pageHead(
      "/cookies",
      "Cookies — DeliverX",
      "The cookies and browser storage DeliverX uses. No analytics or advertising cookies.",
    ),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="DeliverX uses only the cookies it needs to keep you signed in and remember a layout preference. There are no analytics or advertising cookies."
    >
      <LegalSection title="Cookies we set">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Sign-in session (essential):</b> set by our sign-in provider so you stay signed in.
            Without it you cannot use your workspace.
          </li>
          <li>
            <b>Sidebar layout (preference):</b> <code>sidebar_state</code> remembers whether the
            workspace sidebar is open. It lasts 7 days.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Storage in your browser">
        <p>
          Some drafts and settings stay in your browser and are not sent to us until you submit
          them: a product brief you are writing and the “Explain as we go” setting are kept in local
          storage; onboarding answers in progress are kept only until you close the tab. Clearing
          your browser data removes them.
        </p>
      </LegalSection>

      <LegalSection title="Other sites">
        <p>
          If you pay, Stripe Checkout runs on Stripe’s own pages and sets its own cookies there.
          Pages load web fonts from Google, which receives your IP address but sets no cookies for
          this.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can block or delete cookies in your browser settings. Blocking the sign-in cookie
          stops you signing in.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
