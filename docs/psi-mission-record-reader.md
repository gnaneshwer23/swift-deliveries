# Mission record reader

Replace the raw Markdown preview on `/how-it-works` with a structured, full-width reader. Four named documents have a desktop directory and a compact mobile selector. Each document presents its ID, status, labelled fields and next handoff without an inner scrollbar. Evidence gaps and hypotheses have separate textual labels and visual accents. Linked record buttons let visitors follow B-01 → E-01/E-02 → D-01 → A-01.

Document downloads are generated from the same structured fields as the visible record. The example remains hypothetical: no customer research, real owner approval, experiment or observed improvement. Choices in the decision exercise do not change the fixed samples.

The surrounding page uses lighter handoff summaries, explicit outcome-state markers and a clearer owner decision surface with a link back to supporting documents. All five original interactive illustrations remain in place.

Validation: TypeScript/build; lint (nine existing warnings). Browser checked all four documents, evidence-to-decision reference navigation, matching decision Markdown download, mobile document selection and no nested scroll/page overflow. Existing illustrations and their controls are unchanged. No database, provider, billing or authentication changes.
