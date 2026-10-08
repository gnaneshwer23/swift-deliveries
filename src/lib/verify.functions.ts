import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/**
 * Public verification surface. Anyone holding a credential link can check its
 * live status — this is the point of Prove. Reads use the publishable key and
 * the public SELECT policy on credentials; nothing private is returned beyond
 * what the credential document itself already contains.
 */
export const getPublicCredential = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ credentialId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    // Opaque sb_ keys are not JWTs — strip the bearer and send apikey instead.
    const fetchShim: typeof fetch = (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_")) {
        headers.delete("Authorization");
        headers.set("apikey", key);
      }
      return fetch(input, { ...init, headers });
    };
    const supabase = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchShim },
    });

    const { data: row } = await supabase
      .from("credentials")
      .select("id, status, credential_json, issued_at")
      .eq("id", data.credentialId)
      .maybeSingle();

    if (!row) return { found: false as const };

    const json = row.credential_json as Record<string, unknown>;
    const subject = (json["credentialSubject"] ?? {}) as Record<string, unknown>;
    const achievement = (subject["achievement"] ?? {}) as Record<string, unknown>;
    const evidence = Array.isArray(json["evidence"])
      ? (json["evidence"] as Array<Record<string, unknown>>)
      : [];

    return {
      found: true as const,
      id: row.id,
      status: row.status,
      issuedAt: row.issued_at,
      ownerName: typeof subject["name"] === "string" ? subject["name"] : "the holder",
      achievementName: typeof achievement["name"] === "string" ? achievement["name"] : "",
      achievementDescription:
        typeof achievement["description"] === "string" ? achievement["description"] : "",
      evidenceDescription:
        typeof evidence[0]?.["description"] === "string" ? evidence[0]["description"] : "",
      artefactDigest:
        typeof evidence[0]?.["digestSRI"] === "string" ? evidence[0]["digestSRI"] : null,
      validFrom: typeof json["validFrom"] === "string" ? json["validFrom"] : null,
      validUntil: typeof json["validUntil"] === "string" ? json["validUntil"] : null,
    };
  });
