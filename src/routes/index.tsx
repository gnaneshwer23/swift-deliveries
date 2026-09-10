import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import {
  SUITE_PRODUCTS,
  SUITE_DIFFERENCE,
  SUITE_LIFECYCLE,
  SUITE_TAGLINE,
} from "@/lib/marketing/suite-data";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  Briefcase,
  Target,
  Zap,
  Shield,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeliverX — Professional Intelligence Platform" },
      {
        name: "description",
        content:
          "Build experience, land opportunities and succeed in the role with AI teammates and evidence-backed Professional Intelligence.",
      },
      {
        property: "og:title",
        content: "DeliverX — Professional Intelligence Platform",
      },
      {
        property: "og:description",
        content:
          "Build experience, land opportunities and succeed in the role with AI teammates and evidence-backed Professional Intelligence.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <HeroSection />
      <TrustSection />
      <ProblemSection />
      <ProductsSection />
      <JourneySection />
      <DifferenceSection />
      <CTASection />
    </MarketingLayout>
  );
}

function HeroSection() {
  return (
    <section className="mkt-hero-mesh relative overflow-hidden px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
      <div className="mx-auto max-w-[var(--mkt-maxw)]">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mkt-label inline-flex items-center gap-2 rounded-full border border-[var(--mkt-border)] bg-white/70 px-3 py-1.5 backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            {SUITE_TAGLINE}
          </span>
          <h1 className="mt-6 font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] tracking-[-0.03em] text-[var(--mkt-text1)]">
            Build the experience. Land the role. Succeed with AI teammates.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-[var(--mkt-text2)]">
            DeliverX is the Professional Intelligence platform for product people: practise inside
            living organisations, package your evidence, and collaborate with role-based AI
            teammates in one workspace.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--mkt-green)] px-7 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-[var(--mkt-green-m)] hover:shadow-lg"
            >
              Start for free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--mkt-border-l)] bg-white px-7 py-3.5 text-base font-medium text-[var(--mkt-text2)] transition-all hover:border-[var(--mkt-green-l)] hover:text-[var(--mkt-green)]"
            >
              See how it works
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-4xl">
          <div className="mkt-hero-float mkt-soft-panel-light aspect-[16/10] p-2 shadow-2xl">
            <div className="flex h-full flex-col rounded-[calc(var(--mkt-radius-panel)-0.5rem)] border border-[var(--mkt-border)] bg-[var(--mkt-s2)] p-6">
              <div className="flex items-center gap-2 border-b border-[var(--mkt-border)] pb-4">
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-[var(--mkt-red)]" />
                  <span className="size-3 rounded-full bg-[var(--mkt-amber)]" />
                  <span className="size-3 rounded-full bg-[var(--mkt-green-l)]" />
                </div>
                <span className="ml-3 text-xs text-[var(--mkt-text3)]">Professional Workspace</span>
              </div>
              <div className="grid flex-1 gap-4 pt-4 md:grid-cols-3">
                <div className="mkt-soft-panel col-span-2 p-4">
                  <div className="mkt-label mb-2">Sprint goals</div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
                      >
                        <CheckCircle2 className="size-4 text-[var(--mkt-green-l)]" />
                        <div className="h-2 flex-1 rounded-full bg-[var(--mkt-s3)]" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mkt-soft-panel p-4">
                  <div className="mkt-label mb-2">AI teammates</div>
                  <div className="space-y-2">
                    {["PM Copilot", "Engineering Lead", "Design Partner"].map((role) => (
                      <div
                        key={role}
                        className="flex items-center gap-2 rounded-lg bg-white p-2 text-xs font-medium text-[var(--mkt-text2)] shadow-sm"
                      >
                        <Users className="size-3.5 text-[var(--mkt-green-m)]" />
                        {role}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const items = [
    "No credit card required",
    "Pilot access open",
    "Human-in-the-loop AI",
  ];
  return (
    <section className="border-y border-[var(--mkt-border)] bg-[var(--mkt-s1)] px-5 py-5 lg:px-8">
      <div className="mx-auto flex max-w-[var(--mkt-maxw)] flex-wrap items-center justify-center gap-3">
        {items.map((item) => (
          <span key={item} className="mkt-trust-pill">
            <CheckCircle2 className="size-3.5 text-[var(--mkt-green-l)]" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[var(--mkt-maxw)]">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mkt-label">The gap</span>
          <h2 className="mkt-section-title mt-3">
            Resumes promise. Evidence wins.
          </h2>
          <p className="mkt-section-sub mx-auto">
            Traditional hiring and delivery tools are disconnected. DeliverX connects experience,
            readiness and delivery in one continuous path — so every project compounds into
            career momentum.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Briefcase,
              title: "Experience without proof",
              body: "Candidates practise in isolation; employers guess at capability.",
            },
            {
              icon: Target,
              title: "Opportunity without signal",
              body: "Applications rely on keywords instead of labelled, verifiable evidence.",
            },
            {
              icon: Zap,
              title: "Delivery without support",
              body: "New hires switch tools instead of continuing the same intelligence loop.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="mkt-card p-6">
              <div className="mkt-feature-icon mb-4">
                <Icon className="size-5" />
              </div>
              <h3 className="font-serif text-lg tracking-[-0.01em] text-[var(--mkt-text1)]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-text2)]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  return (
    <section className="bg-[var(--mkt-s1)] px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[var(--mkt-maxw)]">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mkt-label">The suite</span>
          <h2 className="mkt-section-title mt-3">One connected path, three stages</h2>
          <p className="mkt-section-sub mx-auto">
            Experience builds evidence. Launchpad turns evidence into opportunity. Professional
            Workspace turns opportunity into confident delivery.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {SUITE_PRODUCTS.map((product) => (
            <Link
              key={product.id}
              to={product.href}
              className="mkt-card mkt-card-lift group block p-6"
            >
              <span className="mkt-label">{product.stage}</span>
              <h3 className="mt-3 font-serif text-2xl tracking-[-0.02em] text-[var(--mkt-text1)] group-hover:text-[var(--mkt-green)]">
                {product.name}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--mkt-text2)]">
                {product.promise}
              </p>
              <p className="mt-4 text-xs text-[var(--mkt-text3)]">{product.detail}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--mkt-green)]">
                {product.cta}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  return (
    <section className="px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[var(--mkt-maxw)]">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mkt-label">The journey</span>
          <h2 className="mkt-section-title mt-3">From first project to senior impact</h2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {SUITE_LIFECYCLE.map((stage, index) => (
            <div key={stage.name} className="relative mkt-soft-panel p-6">
              <span className="absolute -top-3 left-6 inline-flex size-7 items-center justify-center rounded-full bg-[var(--mkt-green)] text-xs font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-2 font-serif text-xl tracking-[-0.01em] text-[var(--mkt-text1)]">
                {stage.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-[var(--mkt-green-m)]">{stage.line}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--mkt-text2)]">{stage.outcome}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DifferenceSection() {
  return (
    <section className="bg-[var(--mkt-s1)] px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[var(--mkt-maxw)]">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="mkt-label">Why DeliverX</span>
            <h2 className="mkt-section-title mt-3">Professional Intelligence, not just another tool</h2>
            <p className="mkt-section-sub">
              We combine AI teammates, structured evidence and a continuous readiness model so
              product people can prove and improve their craft at every stage.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SUITE_DIFFERENCE.map((item) => (
              <div key={item.title} className="mkt-card p-5">
                <div className="mkt-feature-icon mb-3">
                  <Shield className="size-4" />
                </div>
                <h3 className="font-serif text-base tracking-[-0.01em] text-[var(--mkt-text1)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-text2)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[var(--mkt-maxw)]">
        <div className="mkt-soft-panel-highlight px-5 py-14 text-center lg:px-8 lg:py-20">
          <h2 className="font-serif text-[clamp(1.75rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em]">
            Start building your Professional Intelligence today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-light leading-relaxed text-white/85">
            Join the pilot. Experience, Launchpad and Professional Workspace are open for early
            access.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-[var(--mkt-green)] shadow-md transition-all hover:bg-[var(--mkt-s2)]"
          >
            Create your account
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
