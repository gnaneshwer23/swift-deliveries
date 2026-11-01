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
      intro="DeliverX sets one kind of cookie: the sign-in session that keeps you signed in. There are no analytics or advertising cookies."
    >
      <LegalSection title="Cookies we set">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Sign-in session (essential):</b> set by our sign-in provider so you stay signed in.
            Without it you cannot use your workspace.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Storage in your browser">
        <p>
          A product brief you are writing on the public site and the “Explain as we go” setting are
          kept in your browser’s local storage and are not sent to us until you submit the brief.
          Onboarding answers are kept in your browser while you work and are also saved to your
          account as a draft as you move between steps. Clearing your browser data removes only the
          copies in your browser.
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
