# Studio Discussion with PM (Screen 7) Overrides

> **PROJECT:** DeliverX Studio

---

## Surface

- Supervised journey Step 4 (`PmDiscussionScreen`)

## Rules

- Main column: sample Aria exchange labelled **Sample**, then live `ConversationPanel`
- Side panel: Decision context from mission evidence/options/assumptions/gaps
- Evidence chips link only when `source` is an http(s) URL
- Quick actions save via `decideSupervisedMission`:
  - Approve direction → `authorise_bounded_test`
  - Request more research → `authorise_gather_evidence` (note required)
  - Change scope → `authorise_revise` (note required)
- Do not claim chat saves a decision; do not invent citations
