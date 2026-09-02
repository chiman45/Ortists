"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTheme, THEMES, type Theme } from "@/contexts/ThemeContext";
import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import {
  AlertTriangle, BarChart2, Bell, Bookmark, Check, ChevronDown, FileText,
  Heart, HelpCircle, Loader2, MessageSquare, Shield, Sliders,
  TrendingUp, Users,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

type Section = "privacy" | "notifications" | "preferences" | "analytics" | "support";

const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "privacy",       label: "Privacy",       icon: Shield    },
  { id: "notifications", label: "Notifications", icon: Bell      },
  { id: "preferences",   label: "Preferences",   icon: Sliders   },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "support",       label: "Support",       icon: HelpCircle },
];

type Settings = {
  privacy: {
    publicProfile:  boolean;
    showContact:    boolean;
    activityStatus: boolean;
    dataSharing:    boolean;
  };
  notifs: {
    likes:          boolean;
    comments:       boolean;
    follows:        boolean;
    messages:       boolean;
    projectUpdates: boolean;
    emailDigest:    boolean;
    marketing:      boolean;
  };
  prefs: {
    compactView: boolean;
    autoplay:    boolean;
    language:    string;
  };
};

const DEFAULTS: Settings = {
  privacy: { publicProfile: true, showContact: false, activityStatus: true, dataSharing: false },
  notifs:  { likes: true, comments: true, follows: true, messages: true, projectUpdates: true, emailDigest: false, marketing: false },
  prefs:   { compactView: false, autoplay: true, language: "en" },
};

type Stats = { followers: number; following: number; posts: number; totalLikes: number; totalSaves: number };

// ── Sub-components ─────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="relative shrink-0" style={{ width: 44, height: 24 }}>
      <div
        className="absolute inset-0 rounded-full transition-all duration-200"
        style={{ background: on ? "#7C5BF5" : "rgba(255,255,255,0.1)", border: "1px solid", borderColor: on ? "#7C5BF5" : "rgba(255,255,255,0.15)" }}
      />
      <div
        className="absolute top-0.5 rounded-full transition-all duration-200"
        style={{ width: 20, height: 20, background: "#fff", left: on ? 22 : 2, boxShadow: "0 1px 4px rgba(0,0,0,0.35)" }}
      />
    </button>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "var(--text-5)" }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold tracking-[0.14em] uppercase mb-4" style={{ color: "var(--text-5)" }}>{children}</p>;
}

function StatBox({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-1)" }}>{value.toLocaleString()}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-5)" }}>{label}</p>
      </div>
    </div>
  );
}

// ── Shared section content (used by both desktop panel and mobile accordion) ──

interface SectionContentProps {
  id: Section;
  s: Settings;
  stats: Stats | null;
  statsLoading: boolean;
  theme: string;
  setTheme: (theme: Theme, e?: React.MouseEvent) => void;
  updatePrivacy: (k: keyof Settings["privacy"], v: boolean) => void;
  updateNotifs:  (k: keyof Settings["notifs"],  v: boolean) => void;
  updatePrefs:   (k: keyof Settings["prefs"],   v: boolean | string) => void;
  setDeleteOpen:  (v: boolean) => void;
  setDeleteInput: (v: string)  => void;
}

function MobileSectionContent({ id, s, stats, statsLoading, theme, setTheme, updatePrivacy, updateNotifs, updatePrefs, setDeleteOpen, setDeleteInput }: SectionContentProps) {
  return <SectionPanel id={id} s={s} stats={stats} statsLoading={statsLoading} theme={theme} setTheme={setTheme} updatePrivacy={updatePrivacy} updateNotifs={updateNotifs} updatePrefs={updatePrefs} setDeleteOpen={setDeleteOpen} setDeleteInput={setDeleteInput} />;
}

function SectionPanel({ id, s, stats, statsLoading, theme, setTheme, updatePrivacy, updateNotifs, updatePrefs, setDeleteOpen, setDeleteInput }: SectionContentProps) {
  if (id === "privacy") return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionTitle>Profile visibility</SectionTitle>
        <Row label="Public Profile" desc="Anyone can discover and view your profile">
          <Toggle on={s.privacy.publicProfile} onChange={v => updatePrivacy("publicProfile", v)} />
        </Row>
        <Row label="Show Contact Info" desc="Display your email or social links on your profile">
          <Toggle on={s.privacy.showContact} onChange={v => updatePrivacy("showContact", v)} />
        </Row>
        <Row label="Activity Status" desc="Show others when you were last active">
          <Toggle on={s.privacy.activityStatus} onChange={v => updatePrivacy("activityStatus", v)} />
        </Row>
        <Row label="Data Sharing" desc="Allow anonymised usage analytics to improve Ortist">
          <Toggle on={s.privacy.dataSharing} onChange={v => updatePrivacy("dataSharing", v)} />
        </Row>
      </Card>
      <Card>
        <SectionTitle>Danger Zone</SectionTitle>
        <Row label="Delete Account" desc="Permanently remove your profile and all content">
          <button onClick={() => { setDeleteOpen(true); setDeleteInput(""); }}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
            Delete
          </button>
        </Row>
      </Card>
    </div>
  );

  if (id === "notifications") return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionTitle>In-App</SectionTitle>
        <Row label="Likes" desc="When someone likes your post"><Toggle on={s.notifs.likes} onChange={v => updateNotifs("likes", v)} /></Row>
        <Row label="Comments" desc="When someone comments on your post"><Toggle on={s.notifs.comments} onChange={v => updateNotifs("comments", v)} /></Row>
        <Row label="New Followers" desc="When someone follows you"><Toggle on={s.notifs.follows} onChange={v => updateNotifs("follows", v)} /></Row>
        <Row label="Messages" desc="When you receive a new message"><Toggle on={s.notifs.messages} onChange={v => updateNotifs("messages", v)} /></Row>
        <Row label="Project Updates" desc="Status changes on your commission requests"><Toggle on={s.notifs.projectUpdates} onChange={v => updateNotifs("projectUpdates", v)} /></Row>
      </Card>
      <Card>
        <SectionTitle>Email</SectionTitle>
        <Row label="Weekly Digest" desc="A summary of your activity every week"><Toggle on={s.notifs.emailDigest} onChange={v => updateNotifs("emailDigest", v)} /></Row>
        <Row label="Marketing & Updates" desc="News about Ortist features and offers"><Toggle on={s.notifs.marketing} onChange={v => updateNotifs("marketing", v)} /></Row>
      </Card>
    </div>
  );

  if (id === "preferences") return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionTitle>Appearance</SectionTitle>
        <Row label="Theme" desc={`Currently: ${THEMES.find(t => t.id === theme)?.label ?? theme}`}>
          <div className="flex items-center gap-2">
            {THEMES.map(t => (
              <button key={t.id} title={t.label} onClick={(e) => setTheme(t.id, e)}
                className="relative rounded-full transition-transform hover:scale-110 focus:outline-none"
                style={{ width: 22, height: 22, background: t.swatch, boxShadow: theme === t.id ? `0 0 0 2px var(--bg-card), 0 0 0 4px #7C5BF5` : "none" }}>
                {theme === t.id && <span className="absolute inset-0 flex items-center justify-center"><Check size={10} color="#fff" strokeWidth={3} /></span>}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Compact View" desc="Show more content with reduced spacing">
          <Toggle on={s.prefs.compactView} onChange={v => updatePrefs("compactView", v)} />
        </Row>
      </Card>
      <Card>
        <SectionTitle>Language & Content</SectionTitle>
        <Row label="Language" desc="App display language">
          <select value={s.prefs.language} onChange={e => updatePrefs("language", e.target.value)}
            className="text-xs rounded-xl px-3 py-2 outline-none"
            style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="ja">Japanese</option>
          </select>
        </Row>
        <Row label="Autoplay Videos" desc="Automatically play motion design previews">
          <Toggle on={s.prefs.autoplay} onChange={v => updatePrefs("autoplay", v)} />
        </Row>
      </Card>
    </div>
  );

  if (id === "analytics") return (
    <div className="flex flex-col gap-6">
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: "#7C5BF5" }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <StatBox icon={Users}      label="Followers"   value={stats?.followers  ?? 0} color="#7C5BF5" />
          <StatBox icon={Heart}      label="Total Likes" value={stats?.totalLikes ?? 0} color="#f43f5e" />
          <StatBox icon={TrendingUp} label="Posts"       value={stats?.posts      ?? 0} color="#10B981" />
          <StatBox icon={Bookmark}   label="Total Saves" value={stats?.totalSaves ?? 0} color="#F59E0B" />
        </div>
      )}
      <Card>
        <SectionTitle>Coming Soon</SectionTitle>
        <div className="flex flex-col items-center py-10 gap-3">
          <BarChart2 size={36} style={{ color: "rgba(124,91,245,0.4)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>Detailed Analytics</p>
          <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-5)" }}>Engagement charts, reach metrics, and audience insights are on the way.</p>
        </div>
      </Card>
    </div>
  );

  // support
  return (
    <div className="flex flex-col gap-3">
      {[
        { icon: MessageSquare, color: "#9B7CF5", q: "How do I post artwork?", a: "Click the purple + Create Post button in the sidebar. You can upload an image and add a title, description, and category." },
        { icon: FileText, color: "#10B981", q: "How do I get hired on Ortist?", a: "Keep your profile up to date, mark yourself as available, and post high-quality work. Clients can send you a Hire request directly from your posts or profile." },
        { icon: Shield, color: "#F59E0B", q: "How do I delete my account?", a: "Go to Privacy in these settings and click Delete Account. Type DELETE to confirm. This action permanently removes all your data." },
        { icon: HelpCircle, color: "#f43f5e", q: "Why can't I see my story views?", a: "Story views are only visible to you as the owner. Tap the eye icon at the bottom of your story to see who has viewed it." },
        { icon: MessageSquare, color: "#60A5FA", q: "How do commissions work?", a: "Clients can hire you from your profile or any of your posts. You will receive their brief in the Hiring section and can accept or decline from there." },
      ].map(({ icon: Icon, color, q, a }, i) => (
        <div key={i} className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-2"><Icon size={14} style={{ color }} /><p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{q}</p></div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>{a}</p>
        </div>
      ))}
      <div className="rounded-2xl p-5" style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.25)" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: "#9B7CF5" }}>Still need help?</p>
        <p className="text-xs" style={{ color: "var(--text-4)" }}>Reach out at <a href="mailto:support@ortist.art" className="underline" style={{ color: "#9B7CF5" }}>support@ortist.art</a></p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useUser();
  const router   = useRouter();
  const { theme, setTheme } = useTheme();

  const [active,      setActive]      = useState<Section>("privacy");
  const [mobileOpen,  setMobileOpen]  = useState<Section | null>(null);
  const [s,       setS]       = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  // Analytics
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Delete account modal
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting,    setDeleting]    = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/settings?userId=${user.id}`)
      .then(r => r.json())
      .then(({ settings: remote }) => {
        if (remote && Object.keys(remote).length > 0) {
          setS(prev => ({
            privacy: { ...prev.privacy, ...(remote.privacy ?? {}) },
            notifs:  { ...prev.notifs,  ...(remote.notifs  ?? {}) },
            prefs:   { ...prev.prefs,   ...(remote.prefs   ?? {}) },
          }));
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Load analytics when tab is opened
  useEffect(() => {
    if (!user?.id || active !== "analytics" || stats) return;
    setStatsLoading(true);
    fetch(`/api/stats?userId=${user.id}`)
      .then(r => r.json())
      .then(setStats)
      .finally(() => setStatsLoading(false));
  }, [user?.id, active, stats]);

  // Persist settings to DB
  const save = useCallback(async (next: Settings) => {
    if (!user?.id) return;
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, settings: next }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [user?.id]);

  function updatePrivacy(key: keyof Settings["privacy"], val: boolean) {
    const next = { ...s, privacy: { ...s.privacy, [key]: val } };
    setS(next); save(next);
  }
  function updateNotifs(key: keyof Settings["notifs"], val: boolean) {
    const next = { ...s, notifs: { ...s.notifs, [key]: val } };
    setS(next); save(next);
  }
  function updatePrefs(key: keyof Settings["prefs"], val: boolean | string) {
    const next = { ...s, prefs: { ...s.prefs, [key]: val } };
    setS(next); save(next);
  }

  async function handleDelete() {
    if (!user?.id || deleteInput !== "DELETE") return;
    setDeleting(true);
    // 1. Wipe Supabase data
    await fetch("/api/settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    // 2. Delete Clerk account and sign out
    await user.delete();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#7C5BF5" }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
        <MainHeader />

        <main className="flex-1 flex flex-col md:flex-row gap-0 pb-24 lg:pb-0 min-w-0">

          {/* Left nav — desktop */}
          <div className="hidden md:flex flex-col gap-1 px-4 py-6 shrink-0" style={{ width: 200, borderRight: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3 px-2">
              <p className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: "var(--text-5)" }}>Settings</p>
              {saving  && <Loader2 size={12} className="animate-spin" style={{ color: "#7C5BF5" }} />}
              {saved && !saving && <Check size={12} style={{ color: "#10B981" }} />}
            </div>
            {NAV.map(({ id, label, icon: Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full"
                  style={{
                    background:   isActive ? "rgba(124,91,245,0.14)" : "transparent",
                    color:        isActive ? "#9B7CF5" : "var(--text-4)",
                    border:       isActive ? "1px solid rgba(124,91,245,0.3)" : "1px solid transparent",
                  }}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Mobile accordion (vertical) ── */}
          <div className="md:hidden flex-1 overflow-y-auto px-4 py-4 flex flex-col">
            {NAV.map(({ id, label, icon: Icon }) => {
              const open = mobileOpen === id;
              return (
                <div key={id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setMobileOpen(open ? null : id)}
                    className="flex items-center gap-3 w-full py-4 text-left"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: open ? "rgba(124,91,245,0.15)" : "var(--bg-subtle)" }}>
                      <Icon size={15} style={{ color: open ? "#9B7CF5" : "var(--text-4)" }} />
                    </div>
                    <span className="flex-1 text-sm font-semibold"
                      style={{ color: open ? "#9B7CF5" : "var(--text-2)" }}>{label}</span>
                    <ChevronDown size={16} style={{
                      color: "var(--text-5)",
                      transform: open ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }} />
                  </button>
                  {open && (
                    <div className="pb-5">
                      <MobileSectionContent
                        id={id} s={s} stats={stats} statsLoading={statsLoading}
                        theme={theme} setTheme={setTheme}
                        updatePrivacy={updatePrivacy} updateNotifs={updateNotifs} updatePrefs={updatePrefs}
                        setDeleteOpen={setDeleteOpen} setDeleteInput={setDeleteInput}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Desktop content ── */}
          <div className="hidden md:block flex-1 min-w-0 px-8 py-6 overflow-y-auto">
            <div className="max-w-xl flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-1)" }}>
                  {NAV.find(n => n.id === active)?.label}
                </h2>
              </div>
              <SectionPanel
                id={active} s={s} stats={stats} statsLoading={statsLoading}
                theme={theme} setTheme={setTheme}
                updatePrivacy={updatePrivacy} updateNotifs={updateNotifs} updatePrefs={updatePrefs}
                setDeleteOpen={setDeleteOpen} setDeleteInput={setDeleteInput}
              />
            </div>
          </div>
        </main>
      </div>

      <BottomNav />

      {/* ── Delete Account Modal ── */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteOpen(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4" style={{ background: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.35)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                <AlertTriangle size={20} style={{ color: "#EF4444" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>Delete Account</p>
                <p className="text-xs" style={{ color: "var(--text-5)" }}>This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
              Deleting your account will permanently remove your profile, all posts, and commission history.
              Type <strong style={{ color: "#EF4444" }}>DELETE</strong> below to confirm.
            </p>
            <input
              autoFocus
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--bg-subtle)", color: "var(--text-1)", border: "1px solid var(--border)" }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: "var(--bg-subtle)", color: "var(--text-2)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteInput !== "DELETE" || deleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-opacity"
                style={{
                  background:  deleteInput === "DELETE" ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.05)",
                  color:       deleteInput === "DELETE" ? "#EF4444" : "rgba(239,68,68,0.3)",
                  border:      "1px solid rgba(239,68,68,0.3)",
                  cursor:      deleteInput !== "DELETE" ? "not-allowed" : "pointer",
                  opacity:     deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
