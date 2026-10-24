import { useId, useState } from "react";
import { ArrowDown, FileSearch, GitBranch, ShieldQuestion, UserRound } from "lucide-react";

const RESPONSES = [
  {
    label: "Request more evidence",
    status: "Evidence requested",
    next: "Research Synthesis receives the open question: where do people leave setup, and what source can explain why?",
    scope: "Keep implementation on hold. Ask for authorised notes and baseline data.",
  },
  {
    label: "Scope an investigation",
    status: "Investigation scoped",
    next: "The experiment brief describes how to investigate deferring optional details, with a baseline and guardrail still required.",
    scope:
      "Investigate the hypothesis only. No live product change, customer contact or deployment.",
  },
  {
    label: "Reject the recommendation",
    status: "Recommendation rejected",
    next: "Keep the evidence and reviewer objection in the record. Reframe the question before proposing another direction.",
    scope: "No downstream investigation is authorised by this example choice.",
  },
];

export function MissionDecisionExample() {
  const [choice, setChoice] = useState<number | null>(null);
  const id = useId();
  const response = choice === null ? null : RESPONSES[choice]!;
  return (
    <div className="mission-decision-example">
      <div className="mission-case-trail">
        <div>
          <FileSearch aria-hidden="true" />
          <span>Research Synthesis</span>
          <h3>E-01 · Setup description</h3>
          <p>
            Several details are requested before the first useful action. This is a sample
            assertion, not observed behaviour.
          </p>
        </div>
        <ArrowDown
          className="mission-trail-arrow"
          aria-label="Evidence passes to Product Discovery"
        />
        <div>
          <GitBranch aria-hidden="true" />
          <span>Product Discovery</span>
          <h3>D-01 · Compare three options</h3>
          <p>
            Remove fields, defer optional details, or explain them. Provisional direction:
            investigate deferring optional details.
          </p>
        </div>
        <ArrowDown className="mission-trail-arrow" aria-label="Options pass to a challenge" />
        <div className="mission-objection">
          <ShieldQuestion aria-hidden="true" />
          <span>Review challenge</span>
          <h3>The cause is still unknown.</h3>
          <p>
            Without abandonment evidence, implementation is not justified. This objection stays
            beside the recommendation.
          </p>
        </div>
      </div>
      <div className="mission-owner-desk">
        <div className="mission-owner-title">
          <UserRound aria-hidden="true" />
          <span>Product owner · you</span>
          <span className="mission-example-chip">Example only</span>
        </div>
        <h3>What should happen next?</h3>
        <p>Choose the scope, send it back or stop the work.</p>
        <div
          className="mission-response-options"
          role="group"
          aria-label="Explore an example owner decision"
        >
          {RESPONSES.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={choice === index}
              aria-controls={id}
              onClick={() => setChoice(index)}
            >
              {item.label}
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
        <div className="mission-response" id={id} aria-live="polite">
          <span>{response ? response.status : "Owner decision pending"}</span>
          <h4>{response ? "Next handoff" : "The decision belongs to you."}</h4>
          <p>
            {response
              ? response.next
              : "Inspect the evidence and challenge before choosing a direction. No choice has been made in this example."}
          </p>
          {response && (
            <p className="mission-scope">
              <strong>Scope:</strong> {response.scope}
            </p>
          )}
        </div>
        {choice !== null && (
          <button className="mission-reset" type="button" onClick={() => setChoice(null)}>
            Reset example decision
          </button>
        )}
        <small>
          Choices stay on this page and reset when you leave. Nothing is saved or approved in your
          workspace.
        </small>
      </div>
    </div>
  );
}
