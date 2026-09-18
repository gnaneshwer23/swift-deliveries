import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

type GuideArticleProps = {
  eyebrow: string;
  title: string;
  meta: string;
  standfirst: string;
  children: ReactNode;
};

export function GuideArticle({ eyebrow, title, meta, standfirst, children }: GuideArticleProps) {
  return (
    <MarketingLayout>
      <article className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[720px]">
          <span className="mkt-label">{eyebrow}</span>
          <h1 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.02em] text-[var(--mkt-text1)] lg:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-xs uppercase tracking-[0.12em] text-[var(--mkt-text3)]">{meta}</p>
          <p className="mt-6 text-lg leading-relaxed text-[var(--mkt-text2)]">{standfirst}</p>

          <div className="mt-12 space-y-5 text-[15px] leading-[1.75] text-[var(--mkt-text2)] [&_h2]:mt-14 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:tracking-[-0.01em] [&_h2]:text-[var(--mkt-text1)] [&_h3]:mt-10 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:text-[var(--mkt-text1)] [&_li]:mt-2 [&_strong]:text-[var(--mkt-text1)] [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>

          <div className="mkt-card mt-16 p-7">
            <h2 className="font-serif text-xl tracking-[-0.01em] text-[var(--mkt-text1)]">
              Put this into practice
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--mkt-text3)]">
              Experience gives you the work to cite, Launchpad packages it, and only an independent
              attestor can light a Verified claim.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <Link to="/signup" className="font-medium text-[var(--mkt-accent)] hover:underline">
                Create an account &rarr;
              </Link>
              <Link
                to="/resources"
                className="font-medium text-[var(--mkt-text2)] hover:text-[var(--mkt-accent)]"
              >
                Back to resources
              </Link>
            </div>
          </div>
        </div>
      </article>
    </MarketingLayout>
  );
}
