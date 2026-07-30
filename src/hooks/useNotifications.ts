"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const LIKES_KEY       = "ortist_last_seen_likes";
const TOAST_MSG_KEY   = "ortist_last_toast_msg";
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
      const msgRes = await fetch(`/api/notifications?userId=${user!.id}`).catch(() => null);
      if (msgRes?.ok) {
        const { unreadMessages: um } = await msgRes.json();
        const count = um ?? 0;
        // Use localStorage as a cross-instance singleton so only ONE toast fires
        const lastToastedMsg = parseInt(localStorage.getItem(TOAST_MSG_KEY) ?? "-1", 10);
        if (lastToastedMsg !== -1 && count > lastToastedMsg) {
          const diff = count - lastToastedMsg;
          localStorage.setItem(TOAST_MSG_KEY, String(count));
          toast.message(`${diff} new message${diff > 1 ? "s" : ""}`, {
            description: "You have unread messages in your projects",
            action: { label: "View", onClick: () => { window.location.href = "/hiring"; } },
          });
        } else if (lastToastedMsg === -1) {
          localStorage.setItem(TOAST_MSG_KEY, String(count));
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
