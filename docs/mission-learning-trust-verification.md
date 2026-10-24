# Homepage sections 05–07: mission, learning and trust

PR #9 was merged into main at 4dc38851c509d5055fcc689781f4c706bcc3f24a before this increment.

Three original built-in-generated isometric scenes extend the shared SectionExplorer used by the approved sections 2 and 3. Artwork and HTML labels are separate, preserving readable, focusable controls. WebP assets are in public/illustrations; generation prompts and the targeted learning-image refinement are recorded in mission-learning-trust-image-prompts.json.

- Mission: product question → evidence → alternatives → human decision → experiment brief → retained record. The existing sample deliberation engine remains available below the illustration.
- Learning: measurement plan → inspectable change → supplied observations → comparison → proposed next question. Outcome review, connected ingestion and automatic learning remain explicitly identified as incomplete/planned. A question marker replaces an initially generated checkmark to avoid implying approval.
- Trust: proposed action → permission scope → usage ceiling → human authority → audit record. The illustration is not certification of production security or measured provider-cost enforcement.

Each labelled object and stage button updates its contributor, input, output, explanation and handoff path. Play/pause/restart, visibility-aware playback, reduced-motion presentation and template downloads are reused. All human gates require example approval, including when a visitor starts playback from a manually selected gate. No example approval changes workspace records or grants tools permission. Shared handoff templates now contain actual Markdown line breaks.

Validation: TypeScript and lint passed with 10 existing warnings; 152 tests passed and 16 skipped; production build and diff checks passed. Browser checks confirmed mission playback pausing at Your decision, explicit continuation, independent trust approval state, and learning capability labels. A learning outcome-review handoff downloaded successfully with genuine multiline Markdown headings. At 390px all three new scenes had no horizontal overflow, all picture labels stayed within their cards, and object selection updated the expected inspector. Desktop screenshots are retained in task outputs.

No real provider call, experiment, telemetry collection, security audit, database mutation or production deployment was performed. Existing sections and their catalogue references remain intact.
