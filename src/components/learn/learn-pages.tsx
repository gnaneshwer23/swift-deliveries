/** Learn by building — the lesson hub and a single lesson (public pages). */
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { LESSONS, type Lesson } from "@/lib/learn/lessons";
import "@/styles/learn.css";

export function LearnHub() {
  return (
    <MarketingLayout>
      <div className="learn">
        <section className="learn-opening">
          <div className="dxl-wrap">
            <p className="dxl-eyebrow">Learn by building</p>
            <h1>
              Product craft,
              <br />
              <span className="dxl-grad">one real step at a time.</span>
            </h1>
            <p className="learn-lede">
              Eight short lessons that follow the steps of a real DeliverX project. Read one, then
              practise it on your own idea beside the AI team. The standards are the same for
              learners and founders: evidence, a human decision and work you can inspect.
            </p>
            <div className="dxl-ctas">
              <Link to="/onboarding" className="dxl-btn dxl-btn-primary">
                Start building <ArrowRight size={16} />
              </Link>
              <Link
                to="/learn/$lessonId"
                params={{ lessonId: LESSONS[0]!.id }}
                className="dxl-btn dxl-btn-ghost"
              >
                Read lesson 1
              </Link>
            </div>
          </div>
        </section>

        <section className="learn-section" aria-labelledby="learn-path-title">
          <div className="dxl-wrap">
            <h2 id="learn-path-title">The path</h2>
            <ol className="learn-grid">
              {LESSONS.map((l) => (
                <li key={l.id}>
                  <Link to="/learn/$lessonId" params={{ lessonId: l.id }} className="learn-card">
                    <span className="learn-n">{String(l.n).padStart(2, "0")}</span>
                    <b>{l.title}</b>
                    <span>{l.summary}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="learn-section learn-how" aria-labelledby="learn-how-title">
          <div className="dxl-wrap">
            <h2 id="learn-how-title">How learning works here</h2>
            <ul className="learn-points">
              <li>
                <b>Your own product, not an exercise.</b>
                <span>Every lesson ends with something to try in a project you started.</span>
              </li>
              <li>
                <b>Explain as we go.</b>
                <span>
                  Switch it on in your dashboard and each step in your project says why it matters.
                </span>
              </li>
              <li>
                <b>Practised means done.</b>
                <span>
                  A lesson is marked practised only when your project record shows that step
                  happened. Reading alone doesn’t tick it.
                </span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}

export function LessonView({ lesson }: { lesson: Lesson }) {
  const prev = LESSONS[lesson.n - 2];
  const next = LESSONS[lesson.n];
  return (
    <MarketingLayout>
      <article className="learn learn-lesson">
        <div className="dxl-wrap learn-narrow">
          <Link to="/learn" className="learn-back">
            <ArrowLeft size={14} aria-hidden="true" /> All lessons
          </Link>
          <p className="dxl-eyebrow">
            Lesson {lesson.n} of {LESSONS.length}
          </p>
          <h1>{lesson.title}</h1>
          <p className="learn-lede">{lesson.summary}</p>

          <section>
            <h2>What it is</h2>
            <p>{lesson.what}</p>
          </section>
          <section>
            <h2>Why it matters</h2>
            <p>{lesson.why}</p>
          </section>
          <section>
            <h2>How DeliverX does it</h2>
            <ul>
              {lesson.how.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
          <section className="learn-mistake">
            <h2>Common mistake</h2>
            <p>{lesson.mistake}</p>
          </section>
          <section className="learn-try">
            <h2>Try it in your project</h2>
            <p>{lesson.tryIt}</p>
            <Link to="/command" className="dxl-btn dxl-btn-primary">
              Open your projects <ArrowRight size={16} />
            </Link>
          </section>

          <nav className="learn-pager" aria-label="Lessons">
            {prev ? (
              <Link to="/learn/$lessonId" params={{ lessonId: prev.id }}>
                <ArrowLeft size={14} aria-hidden="true" /> {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to="/learn/$lessonId" params={{ lessonId: next.id }}>
                {next.title} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
        </div>
      </article>
    </MarketingLayout>
  );
}
