"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getJSON } from "@/lib/clientCache";

const LIKES_KEY       = "ortist_last_seen_likes";
const TOAST_LIKES_KEY = "ortist_last_toast_likes";

export function useNotifications() {
  const { user } = useUser();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newLikes, setNewLikes]             = useState(0);

  const prevMessages  = useRef(-1);
  const prevLikeDelta = useRef(-1);
  const totalLikesRef = useRef(0);

  useEffect(() => {
    if (!user) return;

    async function fetchAll() {
      // Unread messages
      // Answers are shared with other pages and reused for 20s
      const msg = await getJSON<{ unreadMessages?: number }>(`/api/notifications?userId=${user!.id}`, 20_000).catch(() => null);
      if (msg) {
        const { unreadMessages: um } = msg;
        const count = um ?? 0;
        prevMessages.current = count;
        setUnreadMessages(count);
      }

      // New likes — compare current total to last-seen stored in localStorage
      const stats = await getJSON<{ totalLikes?: number }>(`/api/stats?userId=${user!.id}`, 20_000).catch(() => null);
      if (stats) {
        const { totalLikes } = stats;
        totalLikesRef.current = totalLikes ?? 0;
        const lastSeen = parseInt(localStorage.getItem(LIKES_KEY) ?? String(totalLikes), 10);
        const delta = Math.max(0, (totalLikes ?? 0) - lastSeen);
        // Same localStorage singleton pattern to prevent duplicate toasts
        const lastToastedLikes = parseInt(localStorage.getItem(TOAST_LIKES_KEY) ?? "-1", 10);
        if (lastToastedLikes !== -1 && delta > lastToastedLikes) {
          const diff = delta - lastToastedLikes;
          localStorage.setItem(TOAST_LIKES_KEY, String(delta));
          toast.message(`${diff} new like${diff > 1 ? "s" : ""}`, {
            description: "People are loving your work!",
            action: { label: "View", onClick: () => { window.location.href = "/feed"; } },
          });
        } else if (lastToastedLikes === -1) {
          localStorage.setItem(TOAST_LIKES_KEY, String(delta));
        }
        prevLikeDelta.current = delta;
        setNewLikes(delta);
      }
    }

    fetchAll();
    // Every 30s, and only while the tab is actually being looked at
    const interval = setInterval(() => { if (document.visibilityState === "visible") fetchAll(); }, 30_000);
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
