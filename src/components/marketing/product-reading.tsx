type ReadingCard = {
  name: string;
  status: string;
  meta?: string;
  planned?: boolean;
  source: string;
  known: string;
  open: string;
};

function ClayLines() {
  return (
    <span className="psi-clay-lines" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function ReadingBox({ title, body, gap }: { title: string; body: string; gap?: boolean }) {
  return (
    <article className={gap ? "psi-research-box is-gap" : "psi-research-box"}>
      <div className="psi-research-box-face">
        <ClayLines />
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}

export function ProductBench({
  source,
  known,
  open,
  note,
  label,
}: {
  source: string;
  known: string;
  open: string;
  note: string;
  label: string;
}) {
  return (
    <div className="psi-research-bench">
      <div className="psi-research-bench-top" role="group" aria-label={label}>
        <ReadingBox title="Source" body={source} />
        <ReadingBox title="What we know" body={known} />
        <ReadingBox title="Still open" body={open} gap />
      </div>
      <p className="psi-research-bench-note">{note}</p>
    </div>
  );
}

export function ProductCards({ cards, label }: { cards: ReadingCard[]; label: string }) {
  const countClass = cards.length === 4 ? " is-4" : "";
  return (
    <ul className={`psi-reading-cards${countClass}`} aria-label={label}>
      {cards.map((card) => (
        <li
          key={card.name}
          className={card.planned ? "psi-clay-plinth is-planned" : "psi-clay-plinth"}
        >
          <article className="psi-clay-card is-static">
            <span className="psi-clay-mark" aria-hidden="true" />
            <span className={card.planned ? "psi-clay-status is-planned" : "psi-clay-status"}>
              {card.status}
            </span>
            <span className="psi-clay-name">{card.name}</span>
            {card.meta ? <span className="psi-clay-id">{card.meta}</span> : null}
            <dl className="psi-evidence-lines">
              <div>
                <dt>Source</dt>
                <dd>{card.source}</dd>
              </div>
              <div>
                <dt>What we know</dt>
                <dd>{card.known}</dd>
              </div>
              <div className="is-gap">
                <dt>Still open</dt>
                <dd>{card.open}</dd>
              </div>
            </dl>
          </article>
        </li>
      ))}
    </ul>
  );
}
