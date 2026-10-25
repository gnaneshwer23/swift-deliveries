import { PSI_LAYER_LABELS } from "@/lib/psi-journey";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Pause, RotateCcw } from "lucide-react";
import { ProductBrainIllustration } from "@/components/illustrations/product-brain-illustration";
import { BRAIN_ANCHORS } from "@/components/illustrations/product-brain-layout";
import { MissionSampleRecord } from "./mission-sample-record";

const LAYERS = [
  {
    id: "evidence",
    name: PSI_LAYER_LABELS.evidence,
    subtitle: "Give the team a shared starting point.",
    description:
      "Research Synthesis connects your brief, supplied sources and observations. Select an object to inspect its contribution.",
    path: "/product-brain",
  },
  {
    id: "judgement",
    name: PSI_LAYER_LABELS.judgement,
    subtitle: "Compare the options. Challenge the recommendation.",
    description:
      "Product Strategy frames alternatives. Security and Engineering review trade-offs. You decide whether the work can move forward.",
    path: "/how-it-works",
  },
  {
    id: "delivery",
    name: PSI_LAYER_LABELS.delivery,
    subtitle: "Turn approved direction into work you can inspect.",
    description:
      "Design and Engineering shape the prototype. QA checks the output. The record keeps the reasoning alongside the artefacts.",
    path: "/ai-agents",
  },
  {
    id: "feedback",
    name: PSI_LAYER_LABELS.feedback,
    subtitle: "Bring what happened into the next decision.",
    description:
      "You supply an observed result on a supervised mission. It is not measured here. A follow-up stays proposed until you approve it.",
    path: "/product-brain",
  },
] as const;
type Layer = (typeof LAYERS)[number]["id"];
const OBJECTS = [
  {
    id: "sources",
    layer: "evidence",
    label: "Sources",
    role: "Research Synthesis",
    detail:
      "Connect source references to the evidence brief. A missing source remains a gap, not a fact.",
    output: "Evidence register",
  },
  {
    id: "notes",
    layer: "evidence",
    label: "Interview notes",
    role: "Customer research input",
    detail:
      "Use genuine notes supplied by the product owner. Synthetic personas are rehearsal, never customer evidence.",
    output: "Supported observations",
  },
  {
    id: "research",
    layer: "evidence",
    label: "Research",
    role: "Research Planning",
    detail:
      "Frame the research question, constraints and source requirements before comparing options.",
    output: "Research brief",
  },
  {
    id: "results",
    layer: "evidence",
    label: "Observed results",
    role: "Product owner",
    detail:
      "The owner supplies the result and its evidence on the supervised mission. This illustration does not store a measurement.",
    output: "Owner-supplied result",
  },
  {
    id: "strategy",
    layer: "judgement",
    label: "Product Strategy",
    role: "Product Strategy specialist",
    detail:
      "Compare shorter setup with guided onboarding. Keep assumptions, alternatives and trade-offs visible.",
    output: "Recommendation and alternatives",
  },
  {
    id: "review",
    layer: "judgement",
    label: "Security & Engineering",
    role: "Independent review disciplines",
    detail:
      "Inspect risks, feasibility and dissent before the recommendation reaches you. A hard veto cannot be outvoted.",
    output: "Review findings",
  },
  {
    id: "human",
    layer: "judgement",
    label: "You approve",
    role: "Human approval gate",
    detail:
      "Approve, reject or request more evidence. The example pauses here; it cannot approve a real mission.",
    output: "Your decision",
  },
  {
    id: "design",
    layer: "delivery",
    label: "Design",
    role: "Design discipline",
    detail:
      "Translate approved scope into the proposed journey and interface. Planned capabilities are not represented as live agents.",
    output: "UX specification",
  },
  {
    id: "engineering",
    layer: "delivery",
    label: "Engineering",
    role: "Engineering discipline",
    detail:
      "Shape the architecture and inspectable prototype within approved scope. This example does not execute code.",
    output: "Prototype and architecture",
  },
  {
    id: "qa",
    layer: "delivery",
    label: "QA review",
    role: "Quality review discipline",
    detail:
      "Distinguish static checks, executed tests and human review. Only retained execution evidence can support a tested claim.",
    output: "Review record",
  },
  {
    id: "export",
    layer: "delivery",
    label: "Reviewable artefacts",
    role: "Product owner inspection",
    detail:
      "Inspect what was produced, its generation mode and its known limitations. Keep the decision record with the work.",
    output: "Portable project record",
  },
] as const;
const JOURNEY = [
  "sources",
  "strategy",
  "review",
  "human",
  "design",
  "engineering",
  "qa",
  "export",
  "results",
] as const;
type ObjectId = (typeof OBJECTS)[number]["id"];
export function ProductBrainExplorer() {
  const [layer, setLayer] = useState<Layer>("evidence");
  const [selected, setSelected] = useState<ObjectId>("sources");
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const [panel, setPanel] = useState<"scene" | "decision">("scene");
  const ref = useRef<HTMLElement>(null);
  const id = useId().replaceAll(":", "");
  const worldRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.15 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      mq.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!playing || !visible) return;
    const timer = window.setTimeout(() => {
      if (selected === "human" && !approved) {
        setWaiting(true);
        setPlaying(false);
        return;
      }
      const index = JOURNEY.indexOf(selected as (typeof JOURNEY)[number]);
      const next = JOURNEY[index + 1];
      if (!next) {
        setPlaying(false);
        return;
      }
      const object = OBJECTS.find((o) => o.id === next)!;
      setSelected(next);
      setLayer(next === "results" ? "feedback" : object.layer);
      if (next === "human" && !approved) {
        setWaiting(true);
        setPlaying(false);
      }
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [playing, visible, selected, approved]);
  const current = LAYERS.find((l) => l.id === layer)!;
  const object = OBJECTS.find((o) => o.id === selected)!;
  const choose = (objectId: ObjectId) => {
    const o = OBJECTS.find((x) => x.id === objectId)!;
    setSelected(objectId);
    setLayer(o.layer);
    setPlaying(false);
    setWaiting(false);
  };
  const chooseLayer = (next: Layer) => {
    setLayer(next);
    setSelected(next === "feedback" ? "results" : OBJECTS.find((o) => o.layer === next)!.id);
    setPlaying(false);
    setWaiting(false);
  };
  const replay = () => {
    setPanel("scene");
    setSelected("sources");
    setLayer("evidence");
    setApproved(false);
    setWaiting(false);
    setPlaying(true);
  };
  return (
    <section
      className="brain-explorer"
      id="explore-product"
      ref={ref}
      aria-label="Interactive Product Brain example"
    >
      <div className="brain-intro">
        <div>
          <p>Explore DeliverX</p>
          <h2>
            One Product Brain.
            <br />
            Every judgement connected.
          </h2>
        </div>
        <span className="brain-example-badge">Interactive example</span>
      </div>
      <div className="brain-explorer-layout">
        <div className="brain-controls">
          <div className="brain-layer-list" role="group" aria-label="Explore product layers">
            {LAYERS.map((l, i) => (
              <button
                type="button"
                key={l.id}
                aria-pressed={layer === l.id}
                aria-controls={`${id}-world`}
                onClick={() => chooseLayer(l.id)}
              >
                <span>0{i + 1}</span>
                <strong>{l.name}</strong>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
          <div className="brain-layer-copy">
            <h3>{current.subtitle}</h3>
            <p>{current.description}</p>
            <Link to={current.path}>
              Explore this capability <ArrowRight size={14} />
            </Link>
          </div>
          <div className="brain-playback">
            <button
              type="button"
              onClick={() => {
                if (waiting) return;
                if (selected === "results") replay();
                else setPlaying(!playing);
              }}
              disabled={waiting}
              aria-label={playing ? "Pause example journey" : "Play example journey"}
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}{" "}
              {waiting
                ? "Waiting for your example decision"
                : playing
                  ? "Pause journey"
                  : "Play journey"}
            </button>
            <button type="button" onClick={replay} aria-label="Restart example journey">
              <RotateCcw size={15} />
            </button>
          </div>
          {waiting && (
            <button
              type="button"
              className="brain-continue"
              onClick={() => {
                setApproved(true);
                setWaiting(false);
                setPlaying(true);
              }}
            >
              Continue after example approval <ArrowRight size={14} />
            </button>
          )}
          <p className="brain-boundary">
            Sample product: improve onboarding. No real mission is run or approved here.
          </p>
        </div>
        <div className="brain-world-area" id={`${id}-world`}>
          <div
            className="brain-world ix"
            data-layer={layer}
            ref={worldRef}
            onPointerMove={(event) => {
              if (reduced || event.pointerType !== "mouse") return;
              const bounds = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty(
                "--brain-x",
                `${((event.clientX - bounds.left) / bounds.width - 0.5) * 6}px`,
              );
              event.currentTarget.style.setProperty(
                "--brain-y",
                `${((event.clientY - bounds.top) / bounds.height - 0.5) * 4}px`,
              );
            }}
            onPointerLeave={() => {
              worldRef.current?.style.setProperty("--brain-x", "0px");
              worldRef.current?.style.setProperty("--brain-y", "0px");
            }}
          >
            <ProductBrainIllustration
              layer={layer}
              selected={selected}
              waiting={waiting}
              approved={approved}
              hold={!approved && (playing || waiting)}
              live={visible && !reduced}
            />
            <div
              className="brain-hotspots"
              aria-label="Inspect illustrated specialists and artefacts"
            >
              {OBJECTS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`brain-hotspot ${selected === o.id ? "is-selected" : ""}`}
                  style={{
                    left: `${BRAIN_ANCHORS[o.id].x * 100}%`,
                    top: `${BRAIN_ANCHORS[o.id].y * 100}%`,
                  }}
                  onClick={() => choose(o.id)}
                  aria-label={`Inspect ${o.label}`}
                  aria-pressed={selected === o.id}
                >
                  <span className="brain-hotspot-dot" />
                  <span className="brain-hotspot-name">{o.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div
            className="brain-object-strip"
            role="group"
            aria-label="Objects in the selected layer"
          >
            {OBJECTS.filter((o) => o.layer === (layer === "feedback" ? "evidence" : layer)).map(
              (o) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => choose(o.id)}
                  aria-pressed={selected === o.id}
                >
                  {o.label}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
      <div className="brain-inspector" aria-live="polite">
        <div>
          <span>{object.role}</span>
          <h3>{object.label}</h3>
          <p>{object.detail}</p>
        </div>
        <div className="brain-inspector-output">
          <small>What moves forward</small>
          <strong>{object.output}</strong>
          {waiting ? (
            <button
              type="button"
              onClick={() => {
                setApproved(true);
                setWaiting(false);
                setPlaying(true);
              }}
            >
              Approve this example handoff <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPanel(panel === "decision" ? "scene" : "decision")}
            >
              {panel === "decision" ? "Close decision example" : "Inspect sample decision"}
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
      {approved && (
        <p className="brain-example-status" role="status">
          Example approval recorded for this walkthrough only. No workspace data changed.
        </p>
      )}
      {panel === "decision" && (
        <div className="brain-engine-panel">
          <h3>A decision you can inspect</h3>
          <p>
            Inspect the same onboarding example: supplied material, alternatives, a pending owner
            decision and an experiment plan. These are hypothetical sample documents.
          </p>
          <MissionSampleRecord />
        </div>
      )}
    </section>
  );
}
