import { describe, expect, it } from "vitest";
import { EMPTY_BRIEF, type ProductBrief } from "@/lib/marketing/product-resources";
import { firstActionFor } from "@/lib/product-journey";
import {
  CONSENT_STATEMENT,
  claimEnquiry,
  consumeRateLimit,
  createReference,
  hrefContainsPrivateBrief,
  planSearch,
  submitEnquiry,
  validateEnquiry,
  validateFollowUp,
  type PilotRepository,
  type StoredPilotRequest,
} from "./model";

const brief: ProductBrief = {
  ...EMPTY_BRIEF,
  product: "Northwind setup",
  audience: "Founders setting up a new workspace",
  problem: "Which onboarding change should we investigate first?",
  objective: "A decision pack and an experiment brief.",
  constraints: "No customer contact and no deployment.",
  evidence: "No observations supplied yet.",
};

const valid = {
  plan: "founder",
  contactName: "Ada Lovelace",
  contactEmail: "Ada@Example.com",
  organisation: "Analytical Engines",
  brief,
  consent: true,
  companyWebsite: "",
};

function memoryRepo(
  seed: StoredPilotRequest[] = [],
): PilotRepository & { rows: StoredPilotRequest[] } {
  const rows = [...seed];
  return {
    rows,
    async recentByEmail(email) {
      return rows.filter((row) => row.contactEmail === email);
    },
    async insert(row) {
      const stored: StoredPilotRequest = {
        id: `id-${rows.length + 1}`,
        reference: row.reference,
        plan: row.plan,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        organisation: row.organisation,
        brief: row.brief,
        consentAt: row.consentAt,
        status: "received",
        followUpNote: "",
        ownerUserId: null,
        claimTokenHash: row.claimTokenHash,
        briefFingerprint: row.briefFingerprint,
        createdAt: row.consentAt,
      };
      rows.push(stored);
      return stored;
    },
    async replaceClaimToken(id, claimTokenHash) {
      const row = rows.find((item) => item.id === id);
      if (row) row.claimTokenHash = claimTokenHash;
    },
    async findByClaimHash(hash) {
      return rows.find((row) => row.claimTokenHash === hash) ?? null;
    },
    async assignOwner(id, userId) {
      const row = rows.find((item) => item.id === id && !item.ownerUserId);
      if (!row) return false;
      row.ownerUserId = userId;
      return true;
    },
    async latestOwned(userId) {
      return rows.find((row) => row.ownerUserId === userId) ?? null;
    },
    async listRecent() {
      return rows;
    },
    async updateFollowUp(id, patch) {
      const row = rows.find((item) => item.id === id);
      if (!row) return null;
      row.status = patch.status;
      row.followUpNote = patch.followUpNote;
      return row;
    },
  };
}

describe("pilot enquiry validation", () => {
  it("requires an explicit consent choice and a usable question", () => {
    expect(validateEnquiry({ ...valid, consent: false }).ok).toBe(false);
    expect(validateEnquiry({ ...valid, brief: { ...brief, problem: "short" } }).ok).toBe(false);
    expect(validateEnquiry({ ...valid, contactEmail: "not-an-email" }).ok).toBe(false);
    const accepted = validateEnquiry(valid);
    expect(accepted.ok).toBe(true);
    if (accepted.ok) expect(accepted.value.contactEmail).toBe("ada@example.com");
  });

  it("rejects the hidden field without storing a reason that helps abuse", () => {
    const result = validateEnquiry({ ...valid, companyWebsite: "https://spam.example" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("This request could not be accepted.");
  });

  it("stores the canonical consent statement rather than a response-time promise", () => {
    expect(CONSENT_STATEMENT.toLowerCase()).not.toContain("within");
    expect(CONSENT_STATEMENT.toLowerCase()).not.toContain("business day");
    expect(CONSENT_STATEMENT).toContain("does not");
  });
});

describe("pilot enquiry persistence rules", () => {
  it("returns a reference and keeps the brief out of any plan URL", async () => {
    const repo = memoryRepo();
    const result = await submitEnquiry(valid, {
      repo,
      now: () => Date.parse("2026-10-24T10:00:00Z"),
      ipKey: "203.0.113.8",
      ipBuckets: new Map(),
      reference: () => createReference(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])),
      token: () => "ab".repeat(32),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reference).toMatch(/^DX-[0-9A-HJKMNP-TV-Z]{8}$/);
    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0]?.contactEmail).toBe("ada@example.com");
    const href = `/pilot?plan=${planSearch(result.plan).plan}`;
    expect(hrefContainsPrivateBrief(href, brief)).toBe(false);
    expect(href).not.toContain(brief.problem);
  });

  it("limits repeated emails and reuses an unclaimed request inside the window", async () => {
    const repo = memoryRepo();
    const now = Date.parse("2026-10-24T10:00:00Z");
    const deps = {
      repo,
      now: () => now,
      ipKey: "198.51.100.4",
      ipBuckets: new Map<string, { count: number; resetAt: number }>(),
      token: () => "cd".repeat(32),
    };
    const first = await submitEnquiry(valid, deps);
    const second = await submitEnquiry(valid, deps);
    expect(first.ok && second.ok && second.reused && second.reference === first.reference).toBe(
      true,
    );
    expect(repo.rows).toHaveLength(1);

    repo.rows[0]!.createdAt = new Date(now - 16 * 60 * 1000).toISOString();
    repo.rows.push(
      {
        ...repo.rows[0]!,
        id: "older-1",
        createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
        briefFingerprint: "a",
      },
      {
        ...repo.rows[0]!,
        id: "older-2",
        createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
        briefFingerprint: "b",
      },
      {
        ...repo.rows[0]!,
        id: "older-3",
        createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
        briefFingerprint: "c",
      },
    );
    const blocked = await submitEnquiry(
      {
        ...valid,
        brief: { ...brief, problem: "Which pricing change should we investigate first?" },
      },
      deps,
    );
    expect(blocked.ok).toBe(false);
  });

  it("stops a network that exceeds the in-memory allowance", () => {
    const buckets = new Map<string, { count: number; resetAt: number }>();
    const now = 1_000;
    for (let i = 0; i < 8; i++)
      expect(consumeRateLimit(buckets, "net", now, 60_000, 8)).toBe(false);
    expect(consumeRateLimit(buckets, "net", now, 60_000, 8)).toBe(true);
  });

  it("links a request only when the account email matches", async () => {
    const repo = memoryRepo();
    const submitted = await submitEnquiry(valid, {
      repo,
      now: () => Date.parse("2026-10-24T10:00:00Z"),
      ipKey: "192.0.2.10",
      ipBuckets: new Map(),
      token: () => "ef".repeat(32),
    });
    if (!submitted.ok || !submitted.claimToken) throw new Error("expected token");
    expect(
      await claimEnquiry(repo, submitted.claimToken, { id: "user-1", email: "other@example.com" }),
    ).toEqual({ ok: false, reason: "email_mismatch" });
    expect(
      await claimEnquiry(repo, submitted.claimToken, { id: "user-1", email: "ada@example.com" }),
    ).toEqual({
      ok: true,
      reference: submitted.reference,
    });
    expect(repo.rows[0]?.ownerUserId).toBe("user-1");
  });

  it("accepts only known follow-up statuses", () => {
    expect(
      validateFollowUp({ status: "reviewing", followUpNote: "Called back by phone." }).ok,
    ).toBe(true);
    expect(validateFollowUp({ status: "emailed", followUpNote: "" }).ok).toBe(false);
  });
});

describe("chosen plan and brief continuity", () => {
  it("does not place the private brief in the next workspace address", () => {
    const action = firstActionFor({
      goal: "Validate a new idea",
      firstIdea: brief.problem,
    });
    expect(action.href).toBe("/command?intent=investigate#mission-composer");
    expect(hrefContainsPrivateBrief(action.href, brief)).toBe(false);
    expect(action.reason.toLowerCase()).toContain("evidence");
  });
});
