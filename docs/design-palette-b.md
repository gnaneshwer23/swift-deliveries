# Palette B: "Ink & Oatmeal"

Chosen by the owner on 1 November 2026 from three options rendered against the previous indigo palette (`docs/design-references/palette-options.png`). It replaces the indigo-on-cool-white palette everywhere: public pages, onboarding and the signed-in workspace.

## Why this palette

- **Anchor kept, accent modernised.** Near-black ink keeps the seriousness of the old navy; the accent moves from generic SaaS indigo to a bronze taken from the amber mark in the DeliverX logo, so the brand colour and the interface accent finally belong together.
- **Warm neutrals.** Warm paper backgrounds read as crafted and calm rather than default, and set DeliverX apart from blue-and-white SaaS sites.
- **One accent, separate states.** Bronze is for actions and selection only. Attention ("Waiting on you") is mustard, success is green, failure is red, and every state also has a written label.

## Tokens (`src/styles/psi-foundation.css`)

| Role                         | Token                                        | Value                             |
| ---------------------------- | -------------------------------------------- | --------------------------------- |
| Canvas                       | `--psi-canvas`                               | `#f6f3ee`                         |
| Surface                      | `--psi-surface`                              | `#fffdf9`                         |
| Heading ink / primary action | `--psi-ink`, `--psi-action`                  | `#1c1b19`                         |
| Body text                    | `--psi-text`                                 | `#55514a`                         |
| Supporting text              | `--psi-muted`                                | `#6f6961`                         |
| Borders                      | `--psi-border`                               | `#e6dfd4`                         |
| Accent (bronze)              | `--psi-indigo` (name kept for compatibility) | `#985808`                         |
| Accent hover                 | `--psi-indigo-hover`                         | `#7e4806`                         |
| Accent tint                  | `--psi-indigo-soft`                          | `#f6ebdc`                         |
| Illustration tint            | `--psi-lavender` (name kept)                 | `#f3ece2`                         |
| Success                      | `--psi-success` / soft                       | `#376e4c` / `#ecf5ef`             |
| Attention (mustard)          | `--psi-warning` / soft                       | `#665503` / `#fcf6df`             |
| Failure                      | `--psi-danger` / soft                        | `#b42318` / `#fff0ee` (unchanged) |

Contrast (WCAG): ink on canvas 15.6:1, body text 7.1:1, supporting text 4.9:1, accent on surface 5.5:1, accent on its tint 4.8:1, white on primary action 17.2:1.

## How the rest of the code was recoloured

Most screens used hard-coded colours rather than tokens (about 3,500 values across 45 files). `scripts/palette-remap.py` moved them all in one pass. It keeps each colour's OKLCH lightness, so contrast and hierarchy are unchanged, and moves its hue into the palette-B family:

- neutrals become warm oatmeal greys;
- blues and violets become the bronze accent, and navies and blue-greys become warm ink;
- teals become a muted slate-teal and greens a calmer green;
- oranges and yellows become mustard, darkened slightly for text so it stays above 4.5:1;
- reds and the logo's amber mark are unchanged.

Raster illustrations in `public/illustrations` were not recoloured; they are neutral enough to sit on the warm canvas. Generated downloads (`src/lib`, for example `company/record.html`) keep their own neutral styling.
