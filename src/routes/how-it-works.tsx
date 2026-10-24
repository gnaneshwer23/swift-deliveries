import { useId, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";

const STEPS = [
  {
    id: "question",
    name: "Question",
    x: 16,
    y: 43,
    line: "The setup question moves to Evidence. The owner approves before export.",
  },
  {
    id: "evidence",
    name: "Evidence",
    x: 36,
    y: 25,
    line: "A sample note moves to Options. The owner approves before export.",
  },
  {
    id: "options",
    name: "Options",
    x: 68,
    y: 26,
    line: "Three options move to Challenge. The owner approves before export.",
  },
  {
    id: "challenge",
    name: "Challenge",
    x: 84,
    y: 49,
    line: "The objection moves to you. The owner approves before export.",
  },
  {
    id: "decision",
    name: "Decision",
    x: 66,
    y: 72,
    line: "Your decision moves to Export. The owner approves before export.",
  },
  {
    id: "export",
    name: "Export",
    x: 34,
    y: 69,
    line: "The pack stays held. The owner approves before export.",
  },
] as const;

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "/how-it-works",
      "Example mission — Why people leave during setup | DeliverX",
      "One sample: why people leave during setup. The question moves through evidence, options, challenge, and a decision. The owner approves before export.",
    ),
  component: ExampleMission,
});

function ExampleMission() {
  const [index, setIndex] = useState(0);
  const group = useId();
  const lineId = useId();
  const step = STEPS[index]!;

  return (
    <MarketingLayout>
      <section className="mission-page">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Example mission</p>
          <h1 className="dxl-h1">Why people leave during setup</h1>
          <div className="mission-sequence" id="sample-record">
            <figure
              className="mission-art"
              style={{ ["--x" as string]: `${step.x}%`, ["--y" as string]: `${step.y}%` }}
            >
              <img
                src="/illustrations/mission-workbench-v1.webp"
                width="1536"
                height="1024"
                alt="Sample workbench. A setup question moves through evidence, options, a challenge, a decision, and a held export."
              />
              <span className="mission-shade" aria-hidden="true" />
              <span className="mission-ring" aria-hidden="true" />
              {STEPS.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  className="mission-hotspot"
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setIndex(itemIndex)}
                />
              ))}
              <figcaption>Sample</figcaption>
            </figure>
            <fieldset className="mission-steps">
              <legend className="sr-only">Sample steps</legend>
              {STEPS.map((item, itemIndex) => (
                <label key={item.id}>
                  <input
                    type="radio"
                    name={group}
                    value={item.id}
                    checked={index === itemIndex}
                    onChange={() => setIndex(itemIndex)}
                  />
                  {item.name}
                </label>
              ))}
            </fieldset>
            <p className="mission-line" id={lineId} aria-live="polite">
              {step.line}
            </p>
          </div>
          <div className="mission-close">
            <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-primary">
              Prepare your brief
            </Link>
            <Link to="/psi" className="dxl-link">
              Product
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
