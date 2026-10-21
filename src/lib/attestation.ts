/**
 * Prove attestation rules.
 *
 * Verified has exactly one path in (a confirmed external attestation) and one
 * path out (revocation, which also revokes the Open Badges credential).
 * These helpers are pure so the rules are testable without a database.
 */

/** The three fixed statements an attester picks from. Nothing free-form. */
export const ATTESTATION_STATEMENTS = [
  {
    key: "witnessed_work",
    text: "I have personally witnessed work of this kind and quality from this person.",
  },
  {
    key: "reviewed_artefact",
    text: "I have reviewed this artefact and confirm it reflects the capability described.",
  },
  {
    key: "supervised_outcome",
    text: "I supervised or worked alongside this person and confirm this outcome is theirs.",
  },
] as const;

export type AttestationStatementKey = (typeof ATTESTATION_STATEMENTS)[number]["key"];

export const ATTESTATION_LEVELS = [
  "associate_pm",
  "product_manager",
  "senior_pm",
  "lead_pm",
] as const;

export type AttestationLevel = (typeof ATTESTATION_LEVELS)[number];

export function isValidStatementKey(key: string): key is AttestationStatementKey {
  return ATTESTATION_STATEMENTS.some((s) => s.key === key);
}

export function isValidAttestationLevel(level: string): level is AttestationLevel {
  return (ATTESTATION_LEVELS as readonly string[]).includes(level);
}

export function statementTextFor(key: string): string | null {
  return ATTESTATION_STATEMENTS.find((s) => s.key === key)?.text ?? null;
}

/** Attestations expire: renewal prompt two years after confirmation. */
export const ATTESTATION_RENEWAL_YEARS = 2;

export function renewalDueAt(from: Date = new Date()): Date {
  const d = new Date(from.getTime());
  d.setFullYear(d.getFullYear() + ATTESTATION_RENEWAL_YEARS);
  return d;
}

export type AttesterEligibility =
  | { eligible: true }
  | { eligible: false; reason: "own_domain" | "staff_domain" | "staff_or_coach" | "invalid_email" };

const STAFF_DOMAINS = ["deliverx.dev"];

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

/**
 * Eligibility: the attester must not share the candidate's email domain, must
 * not be on a DeliverX staff domain, and must not be a known DeliverX staff
 * member or coach (checked by email against platform roles).
 */
export function checkAttesterEligibility(input: {
  attesterEmail: string;
  candidateEmail: string | null;
  staffOrCoachEmails: readonly string[];
}): AttesterEligibility {
  const domain = emailDomain(input.attesterEmail);
  if (!domain) return { eligible: false, reason: "invalid_email" };

  if (STAFF_DOMAINS.includes(domain)) return { eligible: false, reason: "staff_domain" };

  const candidateDomain = input.candidateEmail ? emailDomain(input.candidateEmail) : null;
  if (candidateDomain && domain === candidateDomain) {
    return { eligible: false, reason: "own_domain" };
  }

  const blocked = new Set(input.staffOrCoachEmails.map((e) => e.toLowerCase()));
  if (blocked.has(input.attesterEmail.toLowerCase())) {
    return { eligible: false, reason: "staff_or_coach" };
  }

  return { eligible: true };
}

/** Minimal Open Badges 3.0 verifiable credential payload. */
export function buildOpenBadgeCredential(input: {
  credentialId: string;
  issuerDid: string;
  ownerName: string;
  attesterName: string;
  relationship: string | null;
  statementKey: AttestationStatementKey;
  level: AttestationLevel;
  artefactChecksum: string | null;
  issuedAt: Date;
}): Record<string, unknown> {
  return {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    id: input.credentialId,
    issuer: { type: "Profile", id: input.issuerDid, name: "DeliverX" },
    validFrom: input.issuedAt.toISOString(),
    credentialSubject: {
      type: "AchievementSubject",
      name: input.ownerName,
      achievement: {
        type: "Achievement",
        name: `DeliverX Verified — ${input.level.replace(/_/g, " ")}`,
        description: statementTextFor(input.statementKey),
      },
    },
    evidence: [
      {
        type: "Evidence",
        name: "External attestation",
        description: `Attested by ${input.attesterName}${input.relationship ? ` (${input.relationship})` : ""}.`,
        ...(input.artefactChecksum ? { digestSRI: `sha256-${input.artefactChecksum}` } : {}),
      },
    ],
  };
}
