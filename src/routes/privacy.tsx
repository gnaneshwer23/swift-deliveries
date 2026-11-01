import { createFileRoute } from "@tanstack/react-router";
import { ContactLink, LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "/privacy",
      "Privacy — DeliverX",
      "What DeliverX stores, who processes it, how long it is kept and the choices you have.",
    ),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="What DeliverX stores, why, who processes it on our behalf, how long it is kept and the choices you have."
    >
      <LegalSection title="Who we are">
        <p>
          DeliverX is the trading name of the data controller for this service. You can reach us
          about anything in this policy at <ContactLink />. A registered company entity is being
          established; this page will be updated with its details when that completes.
        </p>
      </LegalSection>

      <LegalSection title="What we store">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Your account:</b> your name, email address and sign-in details. Passwords are handled
            by our sign-in provider; DeliverX does not see them.
          </li>
          <li>
            <b>Your profile:</b> the goal, role and experience you give during onboarding.
          </li>
          <li>
            <b>Your projects:</b> the questions, briefs, evidence, notes and files you supply;
            meeting notes you paste in, stored exactly as you gave them; the decisions you make and
            the reasons you write; and the drafts and outputs the AI team produces, each labelled
            with how it was made.
          </li>
          <li>
            <b>How the work ran:</b> a record of each step (when it started and finished, who or
            which role did it, which AI model was used, usage and timings), so a project can be
            reviewed and downloaded later.
          </li>
          <li>
            <b>Conversations with Aria:</b> the lines you type or say, and Aria’s replies, for the
            period you choose (see Retention).
          </li>
          <li>
            <b>Voice measurements:</b> timings and counts only (for example, how long a
            transcription took). No audio and no words.
          </li>
          <li>
            <b>Pilot enquiries:</b> the name, email, optional organisation, chosen offer and brief
            you submit, and the follow-up status we record.
          </li>
          <li>
            <b>Payments:</b> if you subscribe, your Stripe customer and subscription references and
            their status. Card details are handled by Stripe and never reach DeliverX.
          </li>
          <li>
            <b>Service records:</b> error and security events needed to keep DeliverX working.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Why we use it (lawful bases)">
        <p>
          To provide your account and the features you use (performing our contract with you); to
          meet payment and legal obligations (contract and legal obligation); and to keep the
          service secure and reliable (legitimate interests). We do not run analytics or advertising
          tracking.
        </p>
      </LegalSection>

      <LegalSection title="AI processing">
        <p>
          When AI model features are switched on, the content a step needs is sent to the AI model
          provider to produce that draft. When they are off, drafts are simulated from templates and
          labelled as simulated. Evidence that looks like it contains personal identifiers is held
          back from the model. AI drafts never decide anything: plans, decisions and reviews need
          your approval. We do not use your content to train AI models.
        </p>
      </LegalSection>

      <LegalSection title="Voice input">
        <p>
          Voice is optional. The microphone is used only between pressing Talk and Send. Your audio
          goes directly from your browser to our transcription provider over an encrypted
          connection; DeliverX’s servers do not receive or keep the audio. The text transcript is
          saved as a line in your conversation, where you can correct it. If spoken replies are
          switched on, the text of Aria’s reply is sent to our speech provider to produce the audio.
        </p>
      </LegalSection>

      <LegalSection title="Web research">
        <p>
          If you choose web research for a project, search queries based on your brief are sent to
          our web search provider. The pages found are cited by reference; their contents are not
          stored in your download.
        </p>
      </LegalSection>

      <LegalSection title="Who processes data for us">
        <p>Records are private to your workspace. We use these providers only to run DeliverX:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Neon: database and sign-in.</li>
          <li>Vercel: hosting and running the application.</li>
          <li>
            OpenAI, the Vercel AI Gateway or OpenRouter (whichever is configured): AI model drafts.
          </li>
          <li>OpenAI: voice transcription.</li>
          <li>ElevenLabs: spoken replies, when switched on.</li>
          <li>Tavily, Exa or Brave Search: web research, when you choose it.</li>
          <li>Stripe: payments.</li>
          <li>
            Google: sign-in with Google, if you use it; and web fonts (your browser requests them
            from Google, which receives your IP address).
          </li>
          <li>Our email delivery provider: sign-in and account emails.</li>
        </ul>
        <p>
          Some of these providers process data outside the UK. We do not share your records with
          anyone else unless the law requires it.
        </p>
      </LegalSection>

      <LegalSection title="Retention and deletion">
        <ul className="list-disc space-y-1 pl-5">
          <li>Account and project data: while your account is active.</li>
          <li>
            Conversations: 1, 7, 30 or 90 days after the last line, as you choose (30 by default),
            then deleted automatically.
          </li>
          <li>Voice measurements: 180 days, then deleted automatically.</li>
          <li>
            Deleting a project from your dashboard stops its work and removes it from view; you can
            restore it. To have a project or your whole account erased permanently, email{" "}
            <ContactLink />.
          </li>
          <li>Payment records: as long as tax and accounting law requires.</li>
        </ul>
        <p>
          Access controls and private storage protect your records, but no online service can
          promise absolute security.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Under UK GDPR you can ask for access to, correction, export or deletion of your personal
          information, object to or restrict processing, and withdraw consent at any time. Once a
          project’s decision pack is exported, you can download its full package yourself. Email{" "}
          <ContactLink /> for anything else. You also have the right to complain to the Information
          Commissioner’s Office (ICO) at ico.org.uk.
        </p>
      </LegalSection>

      <LegalSection title="No sale of personal data">
        <p>We do not sell personal data or use it for advertising.</p>
      </LegalSection>
    </LegalPage>
  );
}
