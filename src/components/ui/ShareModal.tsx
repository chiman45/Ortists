"use client";

import { Check, Copy, X } from "lucide-react";
import { useState } from "react";

interface ShareModalProps {
  url: string;
  title?: string;
  onClose: () => void;
}

interface Channel {
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  href: (url: string, title: string) => string;
}

// SVG icons inline so we have zero extra deps
function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 3C8.83 3 3 8.83 3 16c0 2.38.65 4.6 1.77 6.53L3 29l6.67-1.74A13 13 0 0 0 16 29c7.17 0 13-5.83 13-13S23.17 3 16 3zm6.36 17.64c-.27.76-1.59 1.47-2.19 1.56-.57.09-1.29.13-2.08-.13-.48-.16-1.1-.37-1.9-.73-3.34-1.44-5.51-4.83-5.68-5.06-.17-.23-1.37-1.83-1.37-3.48s.86-2.47 1.16-2.81c.3-.34.66-.42.88-.42l.63.01c.2 0 .47-.08.73.56.27.67.93 2.27.1 2.46-.83.18-1 .13-1.23.5s.53 1.5 1.27 2.21c.75.71 1.36 1 1.71 1.11.35.11.55.09.75-.05.2-.14.85-.98 1.08-1.32.22-.34.45-.28.76-.17.3.11 1.93.91 2.26 1.07.33.16.55.24.63.38.09.13.09.76-.18 1.51z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function RedditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );
}

const CHANNELS: Channel[] = [
  {
    label: "WhatsApp",
    color: "#fff",
    bg: "#25D366",
    icon: <WhatsAppIcon />,
    href: (url, title) => `https://wa.me/?text=${encodeURIComponent(title + "\n" + url)}`,
  },
  {
    label: "X / Twitter",
    color: "#fff",
    bg: "#000",
    icon: <TwitterIcon />,
    href: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    label: "Facebook",
    color: "#fff",
    bg: "#1877F2",
    icon: <FacebookIcon />,
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    label: "LinkedIn",
    color: "#fff",
    bg: "#0A66C2",
    icon: <LinkedInIcon />,
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    label: "Telegram",
    color: "#fff",
    bg: "#26A5E4",
    icon: <TelegramIcon />,
    href: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    label: "Reddit",
    color: "#fff",
    bg: "#FF4500",
    icon: <RedditIcon />,
    href: (url, title) => `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
];

export default function ShareModal({ url, title = "Check this out on Ortist!", onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function openChannel(href: string) {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Sheet */}
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "rgba(18,12,40,0.95)",
          backdropFilter: "blur(32px)",
          border: "1px solid rgba(124,91,245,0.2)",
          boxShadow: "0 -4px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid rgba(124,91,245,0.12)" }}>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>Share</p>
            <p className="text-xs mt-0.5 truncate max-w-60" style={{ color: "var(--text-5)" }}>
              {title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-4)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* URL pill */}
        <div className="px-5 py-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span className="flex-1 text-xs truncate" style={{ color: "var(--text-5)" }}>{url}</span>
          </div>
        </div>

        {/* Channel grid */}
        <div className="px-5 pb-2 grid grid-cols-3 gap-3">
          {CHANNELS.map(ch => (
            <button
              key={ch.label}
              onClick={() => openChannel(ch.href(url, title))}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl transition-all hover:scale-[1.04] active:scale-95"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: ch.bg, color: ch.color }}
              >
                {ch.icon}
              </div>
              <span className="text-[10px] font-medium" style={{ color: "var(--text-4)" }}>
                {ch.label}
              </span>
            </button>
          ))}
        </div>

        {/* Copy link button */}
        <div className="px-5 pb-6 pt-3">
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: copied
                ? "rgba(16,185,129,0.15)"
                : "linear-gradient(135deg,#361E7B,#7C5BF5)",
              color: copied ? "#34D399" : "#fff",
              border: copied ? "1px solid rgba(16,185,129,0.3)" : "none",
              boxShadow: copied ? "none" : "0 4px 20px rgba(124,91,245,0.35)",
            }}
          >
            {copied
              ? <><Check size={15} /> Link copied!</>
              : <><Copy size={15} /> Copy link</>}
          </button>
        </div>
      </div>
    </div>
  );
}
