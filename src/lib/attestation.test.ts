import { describe, expect, it } from "vitest";
import {
  ATTESTATION_LEVELS,
  ATTESTATION_STATEMENTS,
  buildOpenBadgeCredential,
  checkAttesterEligibility,
  emailDomain,
  isValidAttestationLevel,
  isValidStatementKey,
  renewalDueAt,
  statementTextFor,
} from "./attestation";

describe("fixed statements", () => {
  it("offers exactly three fixed statements", () => {
    expect(ATTESTATION_STATEMENTS).toHaveLength(3);
  });

  it("accepts only known statement keys", () => {
    for (const s of ATTESTATION_STATEMENTS) {
      expect(isValidStatementKey(s.key)).toBe(true);
      expect(statementTextFor(s.key)).toBe(s.text);
    }
    expect(isValidStatementKey("free_form_praise")).toBe(false);
    expect(statementTextFor("free_form_praise")).toBeNull();
  });

  it("accepts only the four framework levels", () => {
    expect(ATTESTATION_LEVELS).toEqual([
      "associate_pm",
      "product_manager",
      "senior_pm",
      "lead_pm",
    ]);
    expect(isValidAttestationLevel("senior_pm")).toBe(true);
    expect(isValidAttestationLevel("wizard")).toBe(false);
  });
});

describe("attester eligibility", () => {
  const base = {
    attesterEmail: "jane@acme.com",
    candidateEmail: "sam@candidate.org",
    staffOrCoachEmails: ["coach@deliverx.dev", "tutor@amdari.com"],
  };

  it("allows an independent attester", () => {
    expect(checkAttesterEligibility(base)).toEqual({ eligible: true });
  });

  it("rejects an attester on the candidate's own email domain", () => {
    expect(
      checkAttesterEligibility({ ...base, attesterEmail: "boss@candidate.org" }),
    ).toEqual({ eligible: false, reason: "own_domain" });
  });

  it("rejects DeliverX staff domains", () => {
    expect(
      checkAttesterEligibility({ ...base, attesterEmail: "team@deliverx.dev" }),
    ).toEqual({ eligible: false, reason: "staff_domain" });
  });

  it("rejects known staff and coach emails regardless of domain", () => {
    expect(
      checkAttesterEligibility({ ...base, attesterEmail: "tutor@amdari.com" }),
    ).toEqual({ eligible: false, reason: "staff_or_coach" });
  });

  it("rejects malformed emails", () => {
    expect(
      checkAttesterEligibility({ ...base, attesterEmail: "not-an-email" }),
    ).toEqual({ eligible: false, reason: "invalid_email" });
    expect(emailDomain("not-an-email")).toBeNull();
  });
});

describe("renewal", () => {
  it("sets renewal two years after confirmation", () => {
    const from = new Date("2026-10-08T00:00:00Z");
    expect(renewalDueAt(from).toISOString()).toBe("2028-10-08T00:00:00.000Z");
  });
});

describe("Open Badges credential", () => {
  it("builds a 3.0 credential naming the attester, statement and checksum", () => {
    const cred = buildOpenBadgeCredential({
      credentialId: "https://deliverx.dev/credentials/abc",
      issuerDid: "did:web:deliverx.dev",
      ownerName: "Sam Candidate",
      attesterName: "Jane Attester",
      relationship: "Former manager",
      statementKey: "witnessed_work",
      level: "senior_pm",
      artefactChecksum: "deadbeef",
      issuedAt: new Date("2026-10-08T00:00:00Z"),
    }) as Record<string, any>;

    expect(cred.type).toContain("OpenBadgeCredential");
    expect(cred.issuer.id).toBe("did:web:deliverx.dev");
    expect(cred.credentialSubject.achievement.name).toContain("senior pm");
    expect(cred.evidence[0].description).toContain("Jane Attester");
    expect(cred.evidence[0].digestSRI).toBe("sha256-deadbeef");
  });
});
