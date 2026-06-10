"use client";

import { LayoutGrid, Mail, Plus, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LEFT_NAV = [
  { icon: LayoutGrid, label: "Feed",     href: "/feed"      },
  { icon: Mail,       label: "Messages", href: "/messages"  },
];

const RIGHT_NAV = [
  { icon: UserCircle, label: "Profile", href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-3 py-2"
      style={{
        background: "var(--bg-nav)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {LEFT_NAV.map(({ icon: Icon, label, href }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors"
            style={{ color: active ? "#9B7CF5" : "var(--text-4)" }}
          >
            <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
            <span className="text-[9px] font-semibold">{label}</span>
          </Link>
        );
      })}

      {/* Centre add button */}
      <Link
        href="/upload"
        className="flex items-center justify-center w-12 h-12 rounded-2xl -mt-4 transition-all hover:scale-[1.06] active:scale-95"
        style={{
          background: "linear-gradient(135deg, #361E7B, #7C5BF5)",
          boxShadow: "0 0 22px rgba(54,30,123,0.60)",
          color: "white",
        }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </Link>

      {RIGHT_NAV.map(({ icon: Icon, label, href }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors"
            style={{ color: active ? "#9B7CF5" : "var(--text-4)" }}
          >
            <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
            <span className="text-[9px] font-semibold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
