"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function ProfileSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/profile/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerk_id:     user.id,
        display_name: user.fullName ?? user.firstName ?? "Artist",
        username:     user.username ?? user.id.slice(0, 12),
        avatar_url:   user.imageUrl,
        // Entered on our sign-up form (stored in Clerk unsafeMetadata), then
        // kept on profiles.phone — unique per account. PhoneGate asks anyone
        // who still has none (e.g. Google sign-ups). Login stays email-only.
        phone:        (user.unsafeMetadata as { phone?: string } | undefined)?.phone ?? null,
        // Role + agreement acceptance captured on the sign-up form
        role:                   (user.unsafeMetadata as { role?: string })?.role ?? null,
        agreement_version:      (user.unsafeMetadata as { agreementVersion?: string })?.agreementVersion ?? null,
        agreements_accepted_at: (user.unsafeMetadata as { agreementsAcceptedAt?: string })?.agreementsAcceptedAt ?? null,
      }),
    });
  }, [user, isLoaded]);

  return null;
}
