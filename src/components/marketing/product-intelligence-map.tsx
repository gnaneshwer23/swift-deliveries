/** Decorative Product Intelligence Map for the public landing hero. Sample content is labelled. */
export function ProductIntelligenceMap() {
  return (
    <div className="dx-pi-map" aria-hidden="true">
      <span className="dx-pi-chip" data-tone="cyan">
        <i /> Market research
      </span>
      <span className="dx-pi-chip" data-tone="violet">
        <i /> User needs
      </span>
      <span className="dx-pi-chip" data-tone="indigo">
        <i /> Product strategy
      </span>
      <span className="dx-pi-chip" data-tone="amber">
        <i /> Risk review
      </span>

      <div className="dx-pi-core">
        <span>Idea</span>
        <strong>
          Help small restaurants reduce food waste
          <em className="dx-pi-sample">Sample</em>
        </strong>
      </div>

      <aside className="dx-pi-float-card" data-kind="package">
        <small>
          Project package
          <em className="dx-pi-sample">Sample</em>
        </small>
        <strong>Brief · evidence · next step</strong>
        <p>Downloadable when the mission record is ready.</p>
      </aside>

      <aside className="dx-pi-float-card" data-kind="brief">
        <small>
          PM briefing
          <em className="dx-pi-sample">Sample</em>
        </small>
        <strong>Recommendation with open risks</strong>
        <p>Plain-language options. You approve the direction.</p>
      </aside>
    </div>
  );
}
