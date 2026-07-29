"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const LIKES_KEY = "ortist_last_seen_likes";

export function useNotifications() {
  const { user } = useUser();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newLikes, setNewLikes]             = useState(0);

  useEffect(() => {
    if (!user) return;

    async function fetchAll() {
      // Unread messages
      const msgRes = await fetch(`/api/notifications?userId=${user!.id}`).catch(() => null);
      if (msgRes?.ok) {
        const { unreadMessages: um } = await msgRes.json();
        setUnreadMessages(um ?? 0);
      }

      // New likes — compare current total to last-seen stored in localStorage
      const statsRes = await fetch(`/api/stats?userId=${user!.id}`).catch(() => null);
      if (statsRes?.ok) {
        const { totalLikes } = await statsRes.json();
        const lastSeen = parseInt(localStorage.getItem(LIKES_KEY) ?? String(totalLikes), 10);
        setNewLikes(Math.max(0, (totalLikes ?? 0) - lastSeen));
      }
    }

    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  // Call this when the user views their likes/notifications to mark them as seen
  function markLikesSeen(currentTotal: number) {
    localStorage.setItem(LIKES_KEY, String(currentTotal));
    setNewLikes(0);
  }

  function markMessagesSeen() {
    setUnreadMessages(0);
  }

  return { unreadMessages, newLikes, markLikesSeen, markMessagesSeen };
}
