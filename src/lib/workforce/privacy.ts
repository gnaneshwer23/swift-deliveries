/**
 * Conservative screen for personal identifiers before any text leaves for an
 * external model. False positives only cost a fallback to simulated mode;
 * false negatives could leak special-category data, so err towards blocking.
 */

/** NHS numbers use a mod-11 check digit. */
export function isValidNhsNumber(digits: string): boolean {
  if (!/^\d{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) return false;
  return check === Number(digits[9]);
}

const PATTERNS: RegExp[] = [
  // UK National Insurance number
  /\b[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/i,
  // US SSN
  /\b\d{3}-\d{2}-\d{4}\b/,
  // Date of birth stated explicitly
  /\b(?:dob|date of birth|born on)\b[^.\n]{0,20}\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}/i,
  // MRN / hospital number labels followed by an identifier
  /\b(?:mrn|hospital (?:no|number)|patient id)\b\s*[:#]?\s*[A-Z0-9-]{5,}/i,
];

export function containsLikelyPersonalIdentifiers(text: string): boolean {
  if (PATTERNS.some((p) => p.test(text))) return true;
  for (const m of text.matchAll(/\b(\d{3})[\s-]?(\d{3})[\s-]?(\d{4})\b/g)) {
    if (isValidNhsNumber(`${m[1]}${m[2]}${m[3]}`)) return true;
  }
  return false;
}
