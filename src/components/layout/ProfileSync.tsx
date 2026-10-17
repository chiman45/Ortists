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
        // Verified in Clerk via SMS OTP for phone signups; seeds profiles.phone
        // so checkout/delivery never has to ask for it again.
        phone:        user.primaryPhoneNumber?.phoneNumber ?? user.phoneNumbers[0]?.phoneNumber ?? null,
      }),
    });
  }, [user, isLoaded]);

  return null;
}
