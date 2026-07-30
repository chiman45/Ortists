"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const LIKES_KEY = "ortist_last_seen_likes";

export function useNotifications() {
  const { user } = useUser();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newLikes, setNewLikes]             = useState(0);

  // Track previous values to detect increases after first load
  const prevMessages  = useRef(-1);
  const prevLikeDelta = useRef(-1);
  const totalLikesRef = useRef(0);

  useEffect(() => {
    if (!user) return;

    async function fetchAll() {
      // Unread messages
      const msgRes = await fetch(`/api/notifications?userId=${user!.id}`).catch(() => null);
      if (msgRes?.ok) {
        const { unreadMessages: um } = await msgRes.json();
        const count = um ?? 0;
        if (prevMessages.current !== -1 && count > prevMessages.current) {
          const diff = count - prevMessages.current;
          toast.message(`${diff} new message${diff > 1 ? "s" : ""}`, {
            description: "You have unread messages in your projects",
            action: { label: "View", onClick: () => { window.location.href = "/hiring"; } },
          });
        }
        prevMessages.current = count;
        setUnreadMessages(count);
      }

      // New likes — compare current total to last-seen stored in localStorage
      const statsRes = await fetch(`/api/stats?userId=${user!.id}`).catch(() => null);
      if (statsRes?.ok) {
        const { totalLikes } = await statsRes.json();
        totalLikesRef.current = totalLikes ?? 0;
        const lastSeen = parseInt(localStorage.getItem(LIKES_KEY) ?? String(totalLikes), 10);
        const delta = Math.max(0, (totalLikes ?? 0) - lastSeen);
        if (prevLikeDelta.current !== -1 && delta > prevLikeDelta.current) {
          const diff = delta - prevLikeDelta.current;
          toast.message(`${diff} new like${diff > 1 ? "s" : ""}`, {
            description: "People are loving your work!",
            action: { label: "View", onClick: () => { window.location.href = "/feed"; } },
          });
        }
        prevLikeDelta.current = delta;
        setNewLikes(delta);
      }
    }

    fetchAll();
    const interval = setInterval(fetchAll, 10_000);
    return () => clearInterval(interval);
  }, [user]);

  function markLikesSeen() {
    localStorage.setItem(LIKES_KEY, String(totalLikesRef.current));
    setNewLikes(0);
    prevLikeDelta.current = 0;
  }

  function markMessagesSeen() {
    setUnreadMessages(0);
    prevMessages.current = 0;
  }

  return { unreadMessages, newLikes, markLikesSeen, markMessagesSeen };
}
