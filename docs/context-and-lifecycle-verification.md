# Homepage context comparison and lifecycle exploration

PR #8 was merged into main at f0343c4c9e4c21f7fd48717ac4cf6728749e92cf before this work. This increment changes homepage sections 01 and 04.

Section 01 replaces the explanatory paragraph and three text cards with a code-native illustrated comparison. Scattered/Connected controls alter the visual relationship between research, decision and delivery workspaces. Selecting a document inspects the missing or retained rationale. The connected view uses explicitly illustrative E-01 → D-01 → A-01 references, with moving context and a Product Brain link. The comparison is local component state, not a database graph or real customer record.

Section 04 retains the existing branching lifecycle geometry and catalogue role counts. SVG nodes now support click and keyboard inspection. The inspector explains contributors, outputs and human responsibility. Text stage controls provide another selection path and the existing mobile flow remains usable. Optional playback pauses at every human gate; Continue example past this gate advances the public demonstration only. Reduced-motion preference suppresses path motion while permitting interactive stage selection and the example sequence. Existing non-interactive use of LiveProgrammeFlow remains supported.

Validation: TypeScript and ESLint passed with 10 existing warnings; 152 tests passed, 16 skipped; production build passed; git diff --check passed. Browser checks covered Connected/Scattered presentation, source trace explanation, Architecture selection, corresponding inspector content, playback stopping at the design gate and explicit continuation. At 390px both features had no horizontal overflow; Scope gate selection displayed the correct approval inspector. Desktop screenshots are retained in the task outputs directory.

No provider request, workspace mutation or production deployment is performed by these visuals. Static validation, runtime tests, prototype delivery and automatic deployment remain distinct in the lifecycle copy.
