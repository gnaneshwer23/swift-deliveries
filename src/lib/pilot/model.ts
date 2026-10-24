/**
 * Pilot enquiry rules. Pure functions so validation, abuse limits and
 * continuity can be tested without a database or a browser.
 */
import type { ProductBrief } from "@/lib/marketing/product-resources";

export const PILOT_PLANS = ["builder", "founder", "studio"] as const;
export type PilotPlan = (typeof PILOT_PLANS)[number];

export const PILOT_PLAN_LABELS: Record<PilotPlan, string> = {
  builder: "Builder · £29/month",
  founder: "Founder · £99/month",
  studio: "Studio · £299/month",
};

export const FOLLOW_UP_STATUSES = [
  "received",
  "reviewing",
  "awaiting_customer",
  "scope_agreed",
  "declined",
  "closed",
] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  received: "Received",
  reviewing: "Reviewing",
  awaiting_customer: "Awaiting customer",
  scope_agreed: "Scope agreed",
  declined: "Declined",
  closed: "Closed",
};

export const CONSENT_STATEMENT =
  "I agree that DeliverX may store this enquiry, including my name, email, organisation and product brief, so an authorised person can review it. Submitting does not create an account, take payment, or activate a paid pilot.";

export const FIELD_MAX = 2000;
const EMAIL_MAX = 200;
const NAME_MAX = 80;
const ORG_MAX = 120;
const NOTE_MAX = 2000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REFERENCE_PATTERN = /^DX-[0-9A-HJKMNP-TV-Z]{8}$/;

export type EnquiryInput = {
  plan: string;
  contactName: string;
  contactEmail: string;
  organisation: string;
  brief: ProductBrief;
  consent: boolean;
  companyWebsite: string;
};

export type ValidEnquiry = {
  plan: PilotPlan;
  contactName: string;
  contactEmail: string;
  organisation: string;
  brief: ProductBrief;
  consent: true;
};

export type StoredPilotRequest = {
  id: string;
  reference: string;
  plan: PilotPlan;
  contactName: string;
  contactEmail: string;
  organisation: string;
  brief: ProductBrief;
  consentAt: string;
  status: FollowUpStatus;
  followUpNote: string;
  ownerUserId: string | null;
  claimTokenHash: string;
  briefFingerprint: string;
  createdAt: string;
};

export type PilotRepository = {
  recentByEmail(email: string): Promise<StoredPilotRequest[]>;
  insert(row: {
    reference: string;
    plan: PilotPlan;
    contactName: string;
    contactEmail: string;
    organisation: string;
    brief: ProductBrief;
    consentAt: string;
    claimTokenHash: string;
    briefFingerprint: string;
  }): Promise<StoredPilotRequest>;
  replaceClaimToken(id: string, claimTokenHash: string): Promise<void>;
  findByClaimHash(hash: string): Promise<StoredPilotRequest | null>;
  assignOwner(id: string, userId: string): Promise<boolean>;
  latestOwned(userId: string): Promise<StoredPilotRequest | null>;
  listRecent(limit: number): Promise<StoredPilotRequest[]>;
  updateFollowUp(
    id: string,
    patch: { status: FollowUpStatus; followUpNote: string },
  ): Promise<StoredPilotRequest | null>;
};

export function isPilotPlan(value: string): value is PilotPlan {
  return (PILOT_PLANS as readonly string[]).includes(value);
}

export function parsePilotPlan(value: unknown): PilotPlan {
  return typeof value === "string" && isPilotPlan(value) ? value : "founder";
}

/** Public plan ids are safe in a URL. Brief text is not. */
export function planSearch(plan: PilotPlan): { plan: PilotPlan } {
  return { plan };
}

export function hrefContainsPrivateBrief(href: string, brief: ProductBrief): boolean {
  const sensitive = [
    brief.product,
    brief.audience,
    brief.problem,
    brief.objective,
    brief.constraints,
    brief.evidence,
  ]
    .map((part) => part.trim())
    .filter((part) => part.length >= 12);
  const decoded = decodeURIComponent(href);
  return sensitive.some((part) => decoded.includes(part));
}

function clean(value: string, max: number): string {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function cleanMultiline(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function validateEnquiry(
  input: EnquiryInput,
): { ok: true; value: ValidEnquiry } | { ok: false; message: string } {
  if (input.companyWebsite.trim()) {
    return { ok: false, message: "This request could not be accepted." };
  }
  if (!isPilotPlan(input.plan)) {
    return { ok: false, message: "Choose a Builder, Founder or Studio pilot offer." };
  }
  const contactName = clean(input.contactName, NAME_MAX);
  if (contactName.length < 2) return { ok: false, message: "Enter the name we should use." };
  const contactEmail = input.contactEmail.trim().toLowerCase().slice(0, EMAIL_MAX);
  if (!EMAIL_PATTERN.test(contactEmail)) {
    return { ok: false, message: "Enter an email address we can reply to manually." };
  }
  const organisation = clean(input.organisation, ORG_MAX);
  const brief: ProductBrief = {
    product: clean(input.brief.product, 200),
    audience: cleanMultiline(input.brief.audience, FIELD_MAX),
    problem: cleanMultiline(input.brief.problem, FIELD_MAX),
    objective: cleanMultiline(input.brief.objective, FIELD_MAX),
    constraints: cleanMultiline(input.brief.constraints, FIELD_MAX),
    evidence: cleanMultiline(input.brief.evidence, FIELD_MAX),
  };
  if (brief.audience.length < 8) return { ok: false, message: "Describe who the product is for." };
  if (brief.problem.length < 12) {
    return { ok: false, message: "Describe the product question you want investigated." };
  }
  if (brief.objective.length < 8) {
    return { ok: false, message: "Describe the outcome you want to investigate." };
  }
  if (input.consent !== true) {
    return { ok: false, message: "Consent is required before this enquiry can be stored." };
  }
  return {
    ok: true,
    value: { plan: input.plan, contactName, contactEmail, organisation, brief, consent: true },
  };
}

export function canonicalBrief(brief: ProductBrief): string {
  return JSON.stringify({
    product: brief.product,
    audience: brief.audience,
    problem: brief.problem,
    objective: brief.objective,
    constraints: brief.constraints,
    evidence: brief.evidence,
  });
}

const REFERENCE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function createReference(bytes: Uint8Array): string {
  let body = "";
  for (let i = 0; i < 8; i++) body += REFERENCE_ALPHABET[bytes[i]! % REFERENCE_ALPHABET.length];
  const reference = `DX-${body}`;
  if (!REFERENCE_PATTERN.test(reference)) throw new Error("Reference generator failed.");
  return reference;
}

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function randomReference(): string {
  return createReference(randomBytes(8));
}

export function randomClaimToken(): string {
  return [...randomBytes(32)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function consumeRateLimit(
  buckets: Map<string, { count: number; resetAt: number }>,
  key: string,
  now: number,
  windowMs: number,
  max: number,
): boolean {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

const HOUR_MS = 60 * 60 * 1000;
const REUSE_MS = 15 * 60 * 1000;
export const EMAIL_LIMIT_PER_HOUR = 4;

export function countRecent(rows: StoredPilotRequest[], now: number, windowMs: number): number {
  return rows.filter((row) => now - Date.parse(row.createdAt) < windowMs).length;
}

export type SubmitDeps = {
  repo: PilotRepository;
  now: () => number;
  ipKey: string;
  ipBuckets: Map<string, { count: number; resetAt: number }>;
  reference?: () => string;
  token?: () => string;
};

export async function submitEnquiry(
  input: EnquiryInput,
  deps: SubmitDeps,
): Promise<
  | { ok: true; reference: string; plan: PilotPlan; claimToken: string | null; reused: boolean }
  | { ok: false; message: string }
> {
  const parsed = validateEnquiry(input);
  if (!parsed.ok) return parsed;
  if (consumeRateLimit(deps.ipBuckets, deps.ipKey || "unknown", deps.now(), HOUR_MS, 8)) {
    return {
      ok: false,
      message: "Too many requests were sent from this network. Wait before trying again.",
    };
  }
  const value = parsed.value;
  const fingerprint = await sha256Hex(
    `${value.plan}|${value.contactEmail}|${canonicalBrief(value.brief)}`,
  );
  let recent: StoredPilotRequest[];
  try {
    recent = await deps.repo.recentByEmail(value.contactEmail);
  } catch {
    return {
      ok: false,
      message: "We could not save your request. Nothing was confirmed. Try again later.",
    };
  }
  const now = deps.now();
  const reusable = recent.find(
    (row) =>
      row.briefFingerprint === fingerprint &&
      now - Date.parse(row.createdAt) < REUSE_MS &&
      !row.ownerUserId,
  );
  if (reusable) {
    const claimToken = (deps.token ?? randomClaimToken)();
    try {
      await deps.repo.replaceClaimToken(reusable.id, await sha256Hex(claimToken));
    } catch {
      return {
        ok: false,
        message: "We could not save your request. Nothing was confirmed. Try again later.",
      };
    }
    return {
      ok: true,
      reference: reusable.reference,
      plan: reusable.plan,
      claimToken,
      reused: true,
    };
  }
  if (countRecent(recent, now, HOUR_MS) >= EMAIL_LIMIT_PER_HOUR) {
    return {
      ok: false,
      message: "Too many requests were sent for this email. Wait before trying again.",
    };
  }
  const claimToken = (deps.token ?? randomClaimToken)();
  try {
    const stored = await deps.repo.insert({
      reference: (deps.reference ?? randomReference)(),
      plan: value.plan,
      contactName: value.contactName,
      contactEmail: value.contactEmail,
      organisation: value.organisation,
      brief: value.brief,
      consentAt: new Date(now).toISOString(),
      claimTokenHash: await sha256Hex(claimToken),
      briefFingerprint: fingerprint,
    });
    return { ok: true, reference: stored.reference, plan: stored.plan, claimToken, reused: false };
  } catch {
    return {
      ok: false,
      message: "We could not save your request. Nothing was confirmed. Try again later.",
    };
  }
}

export async function claimEnquiry(
  repo: PilotRepository,
  token: string,
  user: { id: string; email: string | null },
): Promise<
  | { ok: true; reference: string }
  | { ok: false; reason: "not_found" | "email_mismatch" | "claimed_by_other" }
> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { ok: false, reason: "not_found" };
  const row = await repo.findByClaimHash(await sha256Hex(token));
  if (!row) return { ok: false, reason: "not_found" };
  if (row.ownerUserId && row.ownerUserId !== user.id)
    return { ok: false, reason: "claimed_by_other" };
  const email = user.email?.trim().toLowerCase() ?? "";
  if (!email || email !== row.contactEmail) return { ok: false, reason: "email_mismatch" };
  if (!row.ownerUserId) {
    const assigned = await repo.assignOwner(row.id, user.id);
    if (!assigned) return { ok: false, reason: "not_found" };
  }
  return { ok: true, reference: row.reference };
}

export function validateFollowUp(input: {
  status: string;
  followUpNote: string;
}): { ok: true; status: FollowUpStatus; followUpNote: string } | { ok: false; message: string } {
  if (!(FOLLOW_UP_STATUSES as readonly string[]).includes(input.status)) {
    return { ok: false, message: "Choose a follow-up status." };
  }
  return {
    ok: true,
    status: input.status as FollowUpStatus,
    followUpNote: input.followUpNote.trim().slice(0, NOTE_MAX),
  };
}
