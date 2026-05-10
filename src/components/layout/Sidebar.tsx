"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { BarChart2, Bell, Compass, LayoutGrid, LogOut, Mail, Moon, Send, Settings, Sun } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Feed",          href: "/feed" },
  { icon: BarChart2,  label: "Dashboard",     href: "/dashboard" },
  { icon: Compass,    label: "Explore",       href: "/explore" },
  { icon: Bell,       label: "Notifications", href: "/notifications", badge: 2 },
  { icon: Mail,       label: "Messages",      href: "/messages",      badge: 8 },
  { icon: Send,       label: "Direct",        href: "/direct" },
  { icon: Settings,   label: "Settings",      href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-56 z-40"
      style={{
        background: "var(--bg-sidebar)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.jpeg" alt="Ortist" width={38} height={38} className="rounded-full object-cover shrink-0" />
          <span className="text-[16px] font-bold tracking-tight" style={{ color: "var(--text-1)" }}>Ortist</span>
        </Link>
      </div>

      {/* Profile */}
      <div className="px-5 pb-5 flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full p-[2.5px]" style={{ background: "linear-gradient(135deg, #361E7B, #7C5BF5, #FF7EA0)" }}>
            <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "var(--ring-bg)" }}>
              <Avatar name="Kate Lingard" size={58} />
            </div>
          </div>
        </div>
        <p className="font-bold text-[15px] leading-tight" style={{ color: "var(--text-1)" }}>Kate Lingard</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-5)" }}>@katy69</p>

        <div className="flex items-center gap-0 mt-4 w-full">
          {[["46","Posts"],["2.8k","Followers"],["526","Following"]].map(([val,lbl], i) => (
            <div key={lbl} className="flex items-center flex-1">
              {i > 0 && <div className="w-px h-8 shrink-0" style={{ background: "var(--border)" }} />}
              <div className="flex-1 text-center">
                <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{val}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-6)" }}>{lbl}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5" style={{ borderTop: "1px solid var(--border)" }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, href, badge }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative"
              style={{
                color:      active ? "#9B7CF5" : "var(--text-4)",
                background: active ? "rgba(124,91,245,0.14)" : "transparent",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full"
                  style={{ background: "linear-gradient(to bottom, #361E7B, #7C5BF5)" }}
                />
              )}
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              <span className={`text-sm flex-1 ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
              {badge !== undefined && (
                <span
                  className="text-[11px] font-semibold rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center"
                  style={{ background: "rgba(124,91,245,0.20)", color: "#9B7CF5" }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-5" style={{ borderTop: "1px solid var(--border)" }} />

      {/* Theme toggle */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full"
          style={{ color: "var(--text-4)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          {theme === "dark"
            ? <Sun size={18} strokeWidth={1.8} />
            : <Moon size={18} strokeWidth={1.8} />
          }
          <span className="text-sm font-medium">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
          style={{ color: "var(--text-5)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-5)"; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span className="text-sm font-medium">Logout</span>
        </Link>
      </div>
    </aside>
  );
}
