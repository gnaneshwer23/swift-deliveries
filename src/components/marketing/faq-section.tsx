import { Link } from "@tanstack/react-router";

export type FaqItem = { q: string; a: string };

export function FaqSection({
  title = "Questions people actually ask",
  items,
}: {
  title?: string;
  items: FaqItem[];
}) {
  return (
    <div className="surfaces-section">
      <h2 className="heading-2" style={{ marginBottom: 20 }}>
        {title}
      </h2>
      <div className="faq-list">
        {items.map((item) => (
          <div className="faq-item" key={item.q}>
            <div className="faq-q">{item.q}</div>
            <p className="faq-a">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function JourneyCrossSell({ note }: { note: string }) {
  return (
    <div className="surfaces-section">
      <div className="cross-sell">
        <div className="cross-sell-label">Complete Journey</div>
        <h3 className="cross-sell-title">Experience, Launchpad and the Professional Workspace together</h3>
        <p className="cross-sell-text">{note}</p>
        <Link to="/pricing" className="btn btn-primary">
          See the plans →
        </Link>
      </div>
    </div>
  );
}
