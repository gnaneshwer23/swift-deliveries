/**
 * Handoff contracts (deterministic quality gate — not an agent).
 *
 * Each stage declares the `## ` sections its artefact must contain. The next
 * stage only consumes an artefact that passes, so a malformed or truncated
 * output fails loudly at its own stage instead of cascading downstream.
 */

export type ContractResult = {
  ok: boolean;
  missing: string[];
  /** Sections present but with no substantive body. */
  empty: string[];
};

function normalise(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Splits markdown into `## ` sections keyed by normalised heading. */
export function markdownSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  let current: string | null = null;
  let body: string[] = [];
  const flush = () => {
    if (current !== null) sections.set(current, body.join("\n").trim());
  };
  for (const line of markdown.split(/\r?\n/)) {
    const m = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (m && !line.startsWith("###")) {
      flush();
      current = normalise(m[1]!);
      body = [];
    } else if (current !== null) {
      body.push(line);
    }
  }
  flush();
  return sections;
}

export function checkMarkdownContract(
  markdown: string,
  requiredSections: string[],
): ContractResult {
  const sections = markdownSections(markdown);
  const missing: string[] = [];
  const empty: string[] = [];
  for (const required of requiredSections) {
    const key = normalise(required);
    const hit = [...sections.keys()].find((k) => k === key || k.startsWith(`${key} `));
    if (!hit) missing.push(required);
    else if (sections.get(hit)!.replace(/[-*|\s]/g, "").length < 12) empty.push(required);
  }
  return { ok: missing.length === 0 && empty.length === 0, missing, empty };
}

export type HtmlCheck = { id: string; label: string; passed: boolean };

/**
 * Static checks for a sandboxed HTML prototype. These are real, reproducible
 * checks — the basis for the "Automatically tested" label.
 */
export function checkPrototypeHtml(html: string): HtmlCheck[] {
  const lower = html.toLowerCase();
  return [
    {
      id: "doctype",
      label: "Declares <!DOCTYPE html>",
      passed: lower.trimStart().startsWith("<!doctype html"),
    },
    {
      id: "lang",
      label: "Root element declares a language",
      passed: /<html[^>]*\blang=/.test(lower),
    },
    {
      id: "viewport",
      label: "Responsive viewport meta present",
      passed: lower.includes('name="viewport"'),
    },
    { id: "title", label: "Document has a <title>", passed: /<title>[^<]+<\/title>/.test(lower) },
    { id: "main", label: "Has a <main> landmark", passed: lower.includes("<main") },
    {
      id: "action",
      label: "Has at least one primary action (button or link)",
      passed: /<button\b|<a\s[^>]*href=/.test(lower),
    },
    {
      id: "no_remote_script",
      label: "Loads no remote scripts (sandbox-safe)",
      passed: !/<script[^>]+src=["']?https?:/.test(lower),
    },
    {
      id: "no_network",
      label: "Makes no network calls (fetch/XMLHttpRequest)",
      passed: !/\bfetch\s*\(|xmlhttprequest/.test(lower),
    },
  ];
}

/** Extracts a fenced ```html block, or returns the input if it already looks like a document. */
export function extractHtmlDocument(text: string): string | null {
  const fenced = /```html\s*([\s\S]*?)```/i.exec(text);
  const candidate = (fenced ? fenced[1]! : text).trim();
  return /<html[\s>]/i.test(candidate) ? candidate : null;
}
