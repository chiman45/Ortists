"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useClerk } from "@clerk/nextjs";
import { LogOut, Moon, ShoppingBag, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { icon: "/icons/1.png",  label: "Feed",          href: "/feed" },
  { icon: "/icons/4.png",  label: "Dashboard",     href: "/dashboard" },
  { icon: "/icons/2.png",  label: "Explore",       href: "/explore" },
  { icon: "/icons/3.png",  label: "Messages",      href: "/messages",      badge: 8 },
  { icon: "/icons/7.png",            label: "Marketplace",   href: "/marketplace" },
  { icon: "/icons/6.png",  label: "Hiring",        href: "/hiring" },
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
  const { theme, toggle } = useTheme();
  const { signOut } = useClerk();
  const [expanded, setExpanded] = useState(false);

  function handleLogout() {
    signOut(() => router.push("/"));
  }

  const w = expanded ? 220 : 72;

  return (
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

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 py-2">
        {NAV_ITEMS.map(({ icon, label, href, badge }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));

          const linkEl = (
            <Link
              key={href}
              href={href}
              className="relative flex items-center rounded-xl transition-all duration-150 w-full"
              style={{
                gap: expanded ? 12 : 0,
                padding: expanded ? "11px 12px" : "11px 0",
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
              <div className="relative shrink-0 flex items-center justify-center" style={{ width: 64, height: 64 }}>
                {icon ? (
                  <img
                    src={icon}
                    alt={label}
                    width={64}
                    height={64}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: "contain",
                      display: "block",
                      filter: active
                        ? "brightness(1) saturate(1.2) drop-shadow(0 0 4px rgba(124,91,245,0.6))"
                        : "opacity(0.5)",
                    }}
                  />
                ) : (
                  <ShoppingBag
                    size={28}
                    strokeWidth={1.8}
                    style={{ color: active ? "#9B7CF5" : "var(--text-4)", opacity: active ? 1 : 0.5 }}
                  />
                )}
                {badge !== undefined && !expanded && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{ background: "#7C5BF5" }}
                  >
                    {badge}
                  </span>
                )}
              </div>

              {/* Label + badge */}
              {expanded && (
                <>
                  <span className={`text-sm flex-1 whitespace-nowrap ${active ? "font-semibold" : "font-medium"}`}>
                    {label}
                  </span>
                  {badge !== undefined && (
                    <span
                      className="text-[11px] font-semibold rounded-full px-1.5 py-0.5 leading-none min-w-4.5 text-center"
                      style={{ background: "rgba(124,91,245,0.20)", color: "#9B7CF5" }}
                    >
                      {badge}
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

      {/* Theme toggle */}
      <div className="px-2 pt-2 pb-1">
        {!expanded ? (
          <Tooltip label={theme === "dark" ? "Light Mode" : "Dark Mode"}>
            <button
              onClick={e => toggle(e)}
              className="flex items-center rounded-xl transition-colors w-full"
              style={{ padding: "11px 0", justifyContent: "center", color: "var(--text-4)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              {theme === "dark" ? <Sun size={22} strokeWidth={1.8} /> : <Moon size={22} strokeWidth={1.8} />}
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={e => toggle(e)}
            className="flex items-center gap-3 rounded-xl transition-colors w-full"
            style={{ padding: "11px 12px", color: "var(--text-4)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            {theme === "dark" ? <Sun size={22} strokeWidth={1.8} /> : <Moon size={22} strokeWidth={1.8} />}
            <span className="text-sm font-medium whitespace-nowrap">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
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
  );
}
