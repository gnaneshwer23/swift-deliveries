import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/profile/profile-page";
import type { AppUser } from "@/lib/auth/client";
import type { DxProfile } from "@/lib/dx-profile";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "Your profile — DeliverX" }, { name: "robots", content: "noindex" }],
  }),
  component: Profile,
});

function Profile() {
  // The parent route sends anyone without a profile to onboarding first.
  const { user, profile } = Route.useRouteContext() as { user: AppUser; profile: DxProfile };
  return <ProfilePage key={user.id} user={user} profile={profile} />;
}
