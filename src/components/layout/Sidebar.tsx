"use client";

import { THEMES, useTheme } from "@/contexts/ThemeContext";
import { useClerk, useUser } from "@clerk/nextjs";
import CreatePostModal from "@/components/create/CreatePostModal";
import { LogOut, Plus, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS: { icon: string | null; lucideIcon: React.ElementType | null; label: string; href: string }[] = [
  { icon: "/icons/1.png", lucideIcon: null,       label: "Feed",        href: "/feed" },
  { icon: "/icons/3.png", lucideIcon: null,       label: "Messages",    href: "/messages" },
  { icon: "/icons/7.png", lucideIcon: null,       label: "Marketplace", href: "/marketplace" },
  { icon: "/icons/6.png", lucideIcon: null,       label: "Hiring",      href: "/hiring" },
  { icon: "/icons/4.png",           lucideIcon: UserCircle, label: "Profile",     href: "/profile" },
];

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none"
          style={{
            background: "rgba(30,20,60,0.95)",
            color: "#fff",
            border: "1px solid rgba(124,91,245,0.25)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          {label}
          {/* Arrow */}
          <span
            className="absolute right-full top-1/2 -translate-y-1/2"
            style={{
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: "6px solid rgba(30,20,60,0.95)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [expanded, setExpanded]     = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    function fetchUnread() {
      fetch(`/api/messages?action=unread_count&userId=${user!.id}`)
        .then(r => r.ok ? r.json() : Promise.resolve({ count: 0 }))
        .then(({ count }) => setUnreadCount(count ?? 0))
        .catch(() => {}); // silently ignore if API is unreachable
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  function handleLogout() {
    signOut(() => router.push("/"));
  }

  const w = expanded ? 220 : 72;

  return (
    <>
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300"
      style={{
        width: w,
        background: "var(--bg-sidebar)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Toggle row */}
      <div
        className="flex items-center px-4 py-5 shrink-0"
        style={{ justifyContent: expanded ? "space-between" : "center" }}
      >
        {expanded && (
          <span className="text-[16px] font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
            Ortist
          </span>
        )}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex flex-col gap-1.5 p-1.5 rounded-lg transition-opacity hover:opacity-60 shrink-0"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <span className="block w-5 h-0.5 rounded-full" style={{ background: "var(--text-4)" }} />
          <span className="block w-5 h-0.5 rounded-full" style={{ background: "var(--text-4)" }} />
          <span className="block w-5 h-0.5 rounded-full" style={{ background: "var(--text-4)" }} />
        </button>
      </div>

      {/* Create button */}
      <div className="px-2 pb-2 shrink-0">
        {!expanded ? (
          <Tooltip label="Create Post">
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center justify-center w-full rounded-xl transition-all hover:opacity-85"
              style={{ padding: "11px 0", background: "rgba(124,91,245,0.15)", border: "1px solid rgba(124,91,245,0.3)" }}
            >
              <Plus size={22} style={{ color: "#9B7CF5" }} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 w-full rounded-xl transition-all hover:opacity-85"
            style={{ padding: "11px 12px", background: "#7C5BF5" }}
          >
            <Plus size={18} style={{ color: "#fff" }} />
            <span className="text-sm font-semibold text-white whitespace-nowrap">Create Post</span>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0 px-1.5 py-1">
        {NAV_ITEMS.map(({ icon, lucideIcon: LucideIcon, label, href }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));

          const linkEl = (
            <Link
              key={href}
              href={href}
              className="relative flex items-center rounded-xl transition-all duration-150 w-full"
              style={{
                gap: expanded ? 12 : 0,
                padding: expanded ? "7px 10px" : "4px 0",
                justifyContent: expanded ? "flex-start" : "center",
                color:      active ? "#9B7CF5" : "var(--text-4)",
                background: active ? "rgba(124,91,245,0.14)" : "transparent",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.75 rounded-r-full"
                  style={{ background: "linear-gradient(to bottom, #361E7B, #7C5BF5)" }}
                />
              )}

              {/* Icon */}
              <div className="relative shrink-0 flex items-center justify-center" style={{ width: 60, height: 60 }}>
                {icon ? (
                  <img
                    src={icon}
                    alt={label}
                    width={60}
                    height={60}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: "contain",
                      display: "block",
                      filter: active
                        ? "brightness(1) saturate(1.2) drop-shadow(0 0 4px rgba(124,91,245,0.6))"
                        : "opacity(0.5)",
                    }}
                  />
                ) : LucideIcon ? (
                  <LucideIcon
                    size={28}
                    strokeWidth={1.8}
                    style={{ color: active ? "#9B7CF5" : "var(--text-4)", opacity: active ? 1 : 0.5 }}
                  />
                ) : null}
                {label === "Messages" && unreadCount > 0 && !expanded && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{ background: "#7C5BF5" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              {/* Label + badge */}
              {expanded && (
                <>
                  <span className={`text-sm flex-1 whitespace-nowrap ${active ? "font-semibold" : "font-medium"}`}>
                    {label}
                  </span>
                  {label === "Messages" && unreadCount > 0 && (
                    <span
                      className="text-[11px] font-semibold rounded-full px-1.5 py-0.5 leading-none min-w-4.5 text-center"
                      style={{ background: "rgba(124,91,245,0.20)", color: "#9B7CF5" }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );

          return !expanded ? (
            <Tooltip key={href} label={label}>{linkEl}</Tooltip>
          ) : (
            <div key={href}>{linkEl}</div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3" style={{ borderTop: "1px solid var(--border)" }} />

      {/* Theme picker */}
      <div className="px-2 pt-2 pb-1">
        {!expanded ? (
          <Tooltip label="Theme">
            <div className="flex flex-col items-center gap-1.5 py-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={e => setTheme(t.id, e)}
                  aria-label={t.label}
                  style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: t.swatch,
                    border: theme === t.id ? "2px solid #9B7CF5" : "2px solid rgba(255,255,255,0.15)",
                    transition: "border-color 0.2s, transform 0.15s",
                    transform: theme === t.id ? "scale(1.25)" : "scale(1)",
                    cursor: "pointer", padding: 0, flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </Tooltip>
        ) : (
          <div className="px-2 pb-1">
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--text-6)" }}>Theme</p>
            <div className="flex flex-wrap gap-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={e => setTheme(t.id, e)}
                  aria-label={t.label}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: theme === t.id ? "rgba(124,91,245,0.15)" : "transparent",
                    border: theme === t.id ? "1px solid rgba(124,91,245,0.4)" : "1px solid transparent",
                    color: theme === t.id ? "#9B7CF5" : "var(--text-4)",
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.swatch, border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0, display: "inline-block" }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="px-2 pb-5">
        {!expanded ? (
          <Tooltip label="Logout">
            <button
              onClick={handleLogout}
              className="flex items-center rounded-xl transition-colors w-full"
              style={{ padding: "11px 0", justifyContent: "center", color: "var(--text-5)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-5)"; e.currentTarget.style.background = "transparent"; }}
            >
              <LogOut size={22} strokeWidth={1.8} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl transition-colors w-full"
            style={{ padding: "11px 12px", color: "var(--text-5)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-5)"; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={22} strokeWidth={1.8} className="shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">Logout</span>
          </button>
        )}
      </div>
    </aside>

    {createOpen && <CreatePostModal onClose={() => setCreateOpen(false)} />}
    </>
  );
}
