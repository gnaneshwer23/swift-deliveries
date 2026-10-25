# Resources and brief workspace

Restructure Resources around brief preparation, reusable planning templates and a scoped pilot conversation. The brief builder now groups its six existing fields into Context, Question and Boundaries with a live structured preview. Stage navigation never discards entered values. Audience, problem and outcome remain required to enable Markdown download; boundaries and evidence can be explicitly unknown.

Preserve browser-local continuity and plan selection. An existing saved brief takes priority over an initial starter. Loading the selected starter is explicit and labelled; no stored draft is silently replaced by choosing a use-case link. The preview and download use the same ProductBrief state. The enquiry receives the browser draft for review, with no brief text in the URL and no automatic submission or paid activation. Storage failure messaging remains visible.

Planning templates use the existing evidence, human-direction and learning illustrations. Downloads have unique accessible names. The shared marketing identity and navigation remain intact.

Validation: TypeScript and production build; lint with nine existing warnings; five resource/preset helper tests. Browser QA used separate localhost origin 43129 to avoid overwriting the user's draft at 43128. Checks cover blank-state download gating, edited fields across stages, preview, Markdown download, reload restoration, saved-draft priority, explicit starter replacement, enquiry transfer without submission, mobile layout and a template download. No backend, database, auth or billing changes.
