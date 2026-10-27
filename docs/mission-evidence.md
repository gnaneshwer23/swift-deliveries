# Founder evidence (Phase 3a)

The founder can give a mission their own research: typed notes and uploaded text files. Roles can then cite that research as sourced facts instead of labelling everything an assumption.

## What is accepted

- **Notes:** up to 20,000 characters.
- **Files:** `.txt`, `.md`, `.csv`, `.tsv` and `.json` files (or any `text/*` type), up to 256 KB, in UTF-8.
- **Limit:** up to 20 items per mission. Each item needs a title of 3–120 characters, unique within the mission. Roles cite an item by its title: `(Source: <title>)`.

Anything else is still recorded, as **unreadable**, with the reason:

- a PDF or Word document;
- a file over the size limit;
- binary data;
- text that is not UTF-8;
- an incomplete upload;
- an empty file.

The mission page lists unreadable items and the event log reports them. Nothing is skipped silently. Only the extracted text is stored; files are not kept.

## Provenance

Each item records who supplied it and when. Readable items also store a SHA-256 hash of their stored text. Uploaded files also record the original file name, type and size. Notes have no file details, and unreadable uploads have no text or hash.

Removing an item takes it out of the mission but keeps the record. Additions and removals are logged as `evidence.added` and `evidence.removed` events.

When a model writes a stage, the artefact's evidence items list each piece of founder evidence it was given, as `evidence:<id>@sha256:<hash>`. The `task.completed` event lists the id and title of each item, without the hash. The artefact's hash is what shows which version of the evidence a claim could have come from.

## What reaches a model

- Only readable text reaches a model. Titles and text are checked for likely personal identifiers at intake and again at use. An item that matches is kept but **never sent**. The prompt says only how many items were withheld, never their titles, and roles cannot cite them.
- Evidence is given to the model as data, inside `<evidence>` tags that its own text cannot close. The system prompt tells the model to ignore any instructions inside it.
- Each step gets up to 40,000 characters of evidence, oldest first, counted after escaping. An item that is cut short is marked `truncated`. Items left out for lack of room are named in the prompt as not included, so they cannot be cited.
- A role may cite an item only if the step was actually given it.
- Interview, survey or call claims are accepted only when the step was given evidence that records such research. An unrelated note does not count.
- A step reads the mission's evidence when it builds its prompt, just after it claims its task. A change made before then applies to that step; a later change applies from the next step.

## Product memory

Readable evidence that is safe to show a model also becomes a **source** in the product's memory (`docs/product-memory.md`), so later missions on the same product can carry a sourced fact forward with its original source. Removing the last copy of that evidence from the product retires the source, and facts citing it are marked possibly stale.
