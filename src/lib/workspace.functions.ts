import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "org";
}

/** The organisation owner's membership cannot be demoted or removed. */
async function assertNotOwnerMembership(
  supabase: { from: (table: string) => any },
  membershipId: string,
) {
  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("user_id, organisation_id")
    .eq("id", membershipId)
    .maybeSingle();
  if (!membership) throw new Error("That member no longer exists.");

  const { data: org } = await supabase
    .from("organisations")
    .select("owner_id")
    .eq("id", membership.organisation_id)
    .maybeSingle();

  if (org?.owner_id === membership.user_id) {
    throw new Error("The organisation owner can't be changed or removed.");
  }
}

export type WorkspaceBootstrap = {
  userId: string;
  email: string | null;
  profile: {
    id: string;
    full_name: string | null;
    display_name: string | null;
    headline: string | null;
    avatar_url: string | null;
  } | null;
  organisation: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    website: string | null;
  } | null;
  role: string | null;
  memberCount: number;
};

/** Everything the workspace shell needs: profile, current organisation, role. */
export const getWorkspaceBootstrap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WorkspaceBootstrap> => {
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string }).email ?? null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, display_name, headline, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    const { data: owned } = await supabase
      .from("organisations")
      .select("id, name, slug, description, website")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1);

    let organisation = owned?.[0] ?? null;
    let role: string | null = organisation ? "owner" : null;

    if (!organisation) {
      const { data: membership } = await supabase
        .from("organisation_memberships")
        .select("role, organisation_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membership) {
        role = membership.role;
        const { data: org } = await supabase
          .from("organisations")
          .select("id, name, slug, description, website")
          .eq("id", membership.organisation_id)
          .maybeSingle();
        organisation = org ?? null;
      }
    }

    let memberCount = 0;
    if (organisation) {
      const { count } = await supabase
        .from("organisation_memberships")
        .select("id", { count: "exact", head: true })
        .eq("organisation_id", organisation.id)
        .eq("status", "active");
      memberCount = count ?? 0;
    }

    return { userId, email, profile: profile ?? null, organisation, role, memberCount };
  });

const onboardingSchema = z.object({
  fullName: z.string().trim().min(1, "Your name is required").max(120),
  headline: z.string().trim().max(160).optional().default(""),
  orgName: z.string().trim().min(2, "Organisation name is required").max(120),
  orgDescription: z.string().trim().max(400).optional().default(""),
  orgWebsite: z.string().trim().max(200).optional().default(""),
  invites: z
    .array(z.object({ email: z.string().trim().email(), role: z.enum(["admin", "member"]) }))
    .max(10)
    .optional()
    .default([]),
});

/** Creates the profile details and the first organisation for a new user. */
export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => onboardingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: data.fullName,
      display_name: data.fullName.split(" ")[0] ?? data.fullName,
      headline: data.headline || null,
    });
    if (profileError) throw new Error(profileError.message);

    let slug = slugify(data.orgName);
    let organisationId: string | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = attempt === 0 ? slug : `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: org, error } = await supabase
        .from("organisations")
        .insert({
          name: data.orgName,
          slug: candidate,
          description: data.orgDescription || null,
          website: data.orgWebsite || null,
          owner_id: userId,
        })
        .select("id")
        .single();

      if (!error && org) {
        organisationId = org.id;
        slug = candidate;
        break;
      }
      if (error && !error.message.toLowerCase().includes("duplicate")) {
        throw new Error(error.message);
      }
    }

    if (!organisationId) throw new Error("Could not create the organisation. Please try again.");

    const { error: memberError } = await supabase.from("organisation_memberships").insert({
      organisation_id: organisationId,
      user_id: userId,
      role: "owner",
      status: "active",
    });
    if (memberError && !memberError.message.toLowerCase().includes("duplicate")) {
      throw new Error(memberError.message);
    }

    const invited: { email: string; token: string }[] = [];
    for (const invite of data.invites) {
      const { data: row, error } = await supabase
        .from("invitations")
        .insert({
          organisation_id: organisationId,
          email: invite.email,
          role: invite.role,
          invited_by: userId,
        })
        .select("email, token")
        .single();
      if (!error && row) invited.push({ email: row.email, token: row.token });
    }

    return { organisationId, invited };
  });

const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  displayName: z.string().trim().max(80).optional().default(""),
  headline: z.string().trim().max(160).optional().default(""),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").upsert({
      id: context.userId,
      full_name: data.fullName,
      display_name: data.displayName || null,
      headline: data.headline || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const orgSchema = z.object({
  organisationId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).optional().default(""),
  website: z.string().trim().max(200).optional().default(""),
});

export const updateOrganisation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => orgSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("organisations")
      .update({
        name: data.name,
        description: data.description || null,
        website: data.website || null,
      })
      .eq("id", data.organisationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type TeamData = {
  members: {
    id: string;
    userId: string;
    role: string;
    status: string;
    name: string | null;
    headline: string | null;
    isOwner: boolean;
  }[];
  invitations: {
    id: string;
    email: string;
    role: string;
    token: string;
    status: string;
    expiresAt: string;
  }[];
  canManage: boolean;
};

export const getTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ organisationId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<TeamData> => {
    const { supabase, userId } = context;

    const { data: org } = await supabase
      .from("organisations")
      .select("owner_id")
      .eq("id", data.organisationId)
      .maybeSingle();

    const { data: rows, error } = await supabase
      .from("organisation_memberships")
      .select("id, user_id, role, status")
      .eq("organisation_id", data.organisationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const memberIds = (rows ?? []).map((r) => r.user_id);
    const profileMap = new Map<string, { full_name: string | null; headline: string | null }>();
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, headline")
        .in("id", memberIds);
      for (const p of profiles ?? []) {
        profileMap.set(p.id, { full_name: p.full_name, headline: p.headline });
      }
    }

    const myRole =
      org?.owner_id === userId
        ? "owner"
        : (rows ?? []).find((r) => r.user_id === userId)?.role ?? null;
    const canManage = myRole === "owner" || myRole === "admin";

    let invitations: TeamData["invitations"] = [];
    if (canManage) {
      const { data: invites } = await supabase
        .from("invitations")
        .select("id, email, role, token, status, expires_at")
        .eq("organisation_id", data.organisationId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      invitations = (invites ?? []).map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        token: i.token,
        status: i.status,
        expiresAt: i.expires_at,
      }));
    }

    return {
      members: (rows ?? []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        role: r.role,
        status: r.status,
        name: profileMap.get(r.user_id)?.full_name ?? null,
        headline: profileMap.get(r.user_id)?.headline ?? null,
        isOwner: org?.owner_id === r.user_id,
      })),
      invitations,
      canManage,
    };
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        organisationId: z.string().uuid(),
        email: z.string().trim().email("Enter a valid email address"),
        role: z.enum(["admin", "member"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("invitations")
      .insert({
        organisation_id: data.organisationId,
        email: data.email,
        role: data.role,
        invited_by: context.userId,
      })
      .select("id, email, token")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ invitationId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("invitations")
      .update({ status: "revoked" })
      .eq("id", data.invitationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renewInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ invitationId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await context.supabase
      .from("invitations")
      .update({ expires_at: expires, status: "pending" })
      .eq("id", data.invitationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ membershipId: z.string().uuid(), role: z.enum(["admin", "member"]) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertNotOwnerMembership(context.supabase, data.membershipId);
    const { error } = await context.supabase
      .from("organisation_memberships")
      .update({ role: data.role })
      .eq("id", data.membershipId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ membershipId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertNotOwnerMembership(context.supabase, data.membershipId);
    const { error } = await context.supabase
      .from("organisation_memberships")
      .delete()
      .eq("id", data.membershipId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public: shows who invited you and to which organisation, nothing else. */
export const getInvitationPreview = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(10).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite } = await supabaseAdmin
      .from("invitations")
      .select("organisation_id, email, role, status, expires_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!invite) return { valid: false as const, reason: "not_found" as const };
    if (invite.status !== "pending") return { valid: false as const, reason: "used" as const };
    if (new Date(invite.expires_at).getTime() < Date.now())
      return { valid: false as const, reason: "expired" as const };

    const { data: org } = await supabaseAdmin
      .from("organisations")
      .select("name")
      .eq("id", invite.organisation_id)
      .maybeSingle();

    return {
      valid: true as const,
      organisationName: org?.name ?? "an organisation",
      email: invite.email,
      role: invite.role,
    };
  });

/** Joins the signed-in user to the organisation the invitation belongs to. */
export const acceptInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ token: z.string().min(10).max(200) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId, claims } = context;

    const { data: invite } = await supabaseAdmin
      .from("invitations")
      .select("id, organisation_id, email, role, status, expires_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!invite || invite.status !== "pending") {
      throw new Error("This invitation is no longer valid.");
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      throw new Error("This invitation has expired. Ask for a new one.");
    }

    let email = (claims as { email?: string }).email ?? null;
    if (!email) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      email = userData?.user?.email ?? null;
    }
    if (!email || email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new Error("This invitation was sent to a different email address.");
    }

    const { error: memberError } = await supabaseAdmin
      .from("organisation_memberships")
      .upsert(
        {
          organisation_id: invite.organisation_id,
          user_id: userId,
          role: invite.role,
          status: "active",
        },
        { onConflict: "organisation_id,user_id" },
      );
    if (memberError) throw new Error(memberError.message);

    await supabaseAdmin
      .from("invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    return { organisationId: invite.organisation_id };
  });
