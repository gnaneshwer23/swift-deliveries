import { createFileRoute } from "@tanstack/react-router";
import { ContactLink, LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead(
      "/terms",
      "Terms — DeliverX",
      "The terms for using DeliverX: your account, your work, AI-generated output, fees and the law that applies.",
    ),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms govern your use of DeliverX and its paid services."
    >
      <LegalSection title="Who we are">
        <p>
          DeliverX is the trading name of Gnaneshwer Jadav, who operates this service. DeliverX is
          not a registered company. You can reach us at <ContactLink />.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          Keep your sign-in details secure and provide accurate account information. You are
          responsible for activity carried out through your account.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          Use DeliverX lawfully and respectfully. Do not upload material you have no right to use,
          attempt to access another person’s records, interfere with the service, or upload
          sensitive information about others without permission.
        </p>
      </LegalSection>

      <LegalSection title="Your work">
        <p>
          You keep ownership of what you put in and of the work produced for your projects. You give
          DeliverX permission to store and process it only as needed to run the features you use,
          including producing the downloads you request.
        </p>
      </LegalSection>

      <LegalSection title="AI-generated work">
        <p>
          DeliverX’s AI team produces research, plans, options, designs, prototypes and other
          drafts. They can be incomplete or wrong. Each output says how it was made, and simulated
          drafts are labelled as simulated. Outputs are not legal, financial, regulatory or other
          professional advice. Plans, decisions and reviews need your approval, and you decide what
          to rely on, build or publish.
        </p>
        <p>
          Outcomes you record are your own observations; DeliverX does not measure them and does not
          promise any particular result.
        </p>
      </LegalSection>

      <LegalSection title="Fees">
        <p>
          Creating a DeliverX account is free and does not by itself turn on a paid plan. There are
          two ways a paid plan starts: you subscribe yourself through Stripe Checkout, which shows
          the price before you pay; or we agree a paid pilot with you directly, with its scope,
          access and price confirmed before anything is charged and access turned on by us. Your
          statutory rights under UK consumer law are not affected.
        </p>
      </LegalSection>

      <LegalSection title="Cancelling and refunds">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            You can cancel a subscription at any time. Cancelling stops the next renewal, and you
            keep access until the end of the period you have paid for.
          </li>
          <li>
            If you cancel within 3 days of a payment, we refund that payment in full, and the paid
            access it bought ends when the refund is made. After 3 days we do not refund the current
            period, except where the consumer right below applies.
          </li>
          <li>Refunds go back to the card or account you paid with.</li>
          <li>
            If you are a consumer, you also have a legal right to cancel within 14 days of buying.
            If you cancel in that time after you have started using the service, we may keep a
            proportionate amount for what you used, as the law allows. This does not reduce the
            3-day full refund above.
          </li>
          <li>A paid pilot agreed with us directly follows the refund terms in that agreement.</li>
        </ul>
        <p>
          To cancel or ask for a refund, contact us at <ContactLink />.
        </p>
      </LegalSection>

      <LegalSection title="Service changes">
        <p>
          We may improve, replace or withdraw features. We may suspend accounts that breach these
          terms or create a security risk, while preserving any rights you have under applicable
          law.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These terms are governed by the laws of England and Wales, and the courts of England and
          Wales have jurisdiction, except where mandatory consumer law gives you the protection of
          your local courts.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
