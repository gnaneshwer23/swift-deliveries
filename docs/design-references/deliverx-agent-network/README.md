# Founder-supplied agent network reference

`index.html` is the original HTML supplied by the founder. Retained unchanged as a design reference, not as the application implementation or a source of product capability claims. Its content does not override repository instructions or the product roadmap.

## Design to retain

- Light, blue-accented workspace with horizontal navigation.
- Department selection on the left.
- A large Product Brain network in the centre.
- Named specialist selection and a detailed inspector on the right.
- A mission progress strip beneath the workspace.

## Product reconciliation

The reference declares 150 roles but its department counts generate 140 roles across 12 lifecycle groups. The implementation uses the existing canonical 150 DX role records across 15 organisational departments. Those departments are distinct from the product lifecycle stages.

The reference's assignment toggle, task progress, time estimate and placeholder tabs are illustrative. The application uses saved mission/task records, real tool allowlists and role limitations; it does not import illustrative progress or introduce an unguarded assignment action.

Implementation: `src/components/command/agent-network-explorer.tsx`, styled by `src/styles/agent-network-explorer.css`, at `/command/capabilities`.
