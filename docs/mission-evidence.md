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

Each item records:

- who supplied it and when;
- the original file name, type and size;
- a SHA-256 hash of the stored text.

Removing an item takes it out of the mission but keeps the record. Additions and removals are logged as `evidence.added` and `evidence.removed` events.

When a model writes a stage, the artefact's evidence items list each piece of founder evidence it was given, as `evidence:<id>@sha256:<hash>`. The `task.completed` event lists the same items. That shows which version of which evidence a claim could have come from.

## What reaches a model

- Only readable text reaches a model. Text that looks like it holds personal identifiers is checked at intake and again at use. It is kept but **never sent**: the prompt names it as withheld, and roles cannot cite it.
- Evidence is given to the model as data, inside `<evidence>` tags that its own text cannot close. The system prompt tells the model to ignore any instructions inside it.
- Each step gets up to 40,000 characters of evidence, oldest first. An item that is cut short is marked `truncated`.
- A role may cite an item only if the step was actually given it.
- Interview or survey claims are accepted only when the founder has supplied evidence.
- Evidence added or removed during a mission applies from the next step.

## Not in 3a

The rest of Phase 3 is still to come:

- product-level memory that lasts across missions;
- conflicting-evidence and stale-context flags;
- per-role context limits;
- a rule that PRD claims must be sourced or labelled;
- approved web research.
