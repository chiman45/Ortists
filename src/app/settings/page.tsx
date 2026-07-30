"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import {
  BarChart2, Bell, HelpCircle, MessageSquare, FileText,
  Shield, Sliders, Users, Heart, TrendingUp, Eye,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { id: "privacy",       label: "Privacy",       icon: Shield    },
  { id: "notifications", label: "Notifications", icon: Bell      },
  { id: "preferences",   label: "Preferences",   icon: Sliders   },
  { id: "analytics",     label: "Analytics",     icon: BarChart2 },
  { id: "support",       label: "Support",       icon: HelpCircle},
] as const;
type Section = typeof NAV[number]["id"];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative shrink-0 transition-all"
      style={{ width: 44, height: 24 }}
    >
      <div
        className="absolute inset-0 rounded-full transition-all duration-200"
        style={{ background: on ? "#7C5BF5" : "rgba(255,255,255,0.1)", border: "1px solid", borderColor: on ? "#7C5BF5" : "rgba(255,255,255,0.15)" }}
      />
      <div
        className="absolute top-0.5 transition-all duration-200 rounded-full"
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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold tracking-[0.14em] uppercase mb-4" style={{ color: "var(--text-5)" }}>{children}</p>;
}

function StatBox({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-5)" }}>{label}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<Section>("privacy");

  const [privacy, setPrivacy] = useState({
    publicProfile:   true,
    showContact:     false,
    activityStatus:  true,
    dataSharing:     false,
  });

  const [notifs, setNotifs] = useState({
    likes:          true,
    comments:       true,
    follows:        true,
    messages:       true,
    projectUpdates: true,
    emailDigest:    false,
    marketing:      false,
  });

  const [prefs, setPrefs] = useState({
    darkMode:       true,
    compactView:    false,
    autoplay:       true,
  });

  function setP<T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T, val: boolean) {
    setter(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
        <MainHeader />

        <main className="flex-1 flex gap-0 pb-24 lg:pb-0 min-w-0">

          {/* Left nav — desktop */}
          <div className="hidden md:flex flex-col gap-1 px-4 py-6 shrink-0" style={{ width: 200, borderRight: "1px solid var(--border)" }}>
            <p className="text-xs font-bold tracking-[0.14em] uppercase mb-3 px-2" style={{ color: "var(--text-5)" }}>Settings</p>
            {NAV.map(({ id, label, icon: Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full"
                  style={{
                    background: isActive ? "rgba(124,91,245,0.14)" : "transparent",
                    color: isActive ? "#9B7CF5" : "var(--text-4)",
                    border: isActive ? "1px solid rgba(124,91,245,0.3)" : "1px solid transparent",
                  }}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Mobile nav — horizontal scroll pills */}
          <div className="md:hidden flex gap-2 px-4 pt-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {NAV.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: active === id ? "#7C5BF5" : "var(--bg-subtle)",
                  color: active === id ? "#fff" : "var(--text-4)",
                }}
              >{label}</button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 px-4 md:px-8 py-6 overflow-y-auto">

            {/* ── Privacy ── */}
            {active === "privacy" && (
              <div className="max-w-xl flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-1)" }}>Privacy</h2>
                  <p className="text-sm" style={{ color: "var(--text-5)" }}>Control who can see your profile and activity.</p>
                </div>

                <Card>
                  <SectionTitle>Profile</SectionTitle>
                  <Row label="Public Profile" desc="Anyone can discover and view your profile">
                    <Toggle on={privacy.publicProfile} onChange={v => setP(setPrivacy, "publicProfile", v)} />
                  </Row>
                  <Row label="Show Contact Info" desc="Display your email or social links on profile">
                    <Toggle on={privacy.showContact} onChange={v => setP(setPrivacy, "showContact", v)} />
                  </Row>
                  <Row label="Activity Status" desc="Show others when you were last active">
                    <Toggle on={privacy.activityStatus} onChange={v => setP(setPrivacy, "activityStatus", v)} />
                  </Row>
                  <Row label="Data Sharing" desc="Allow anonymised usage analytics to improve Ortist">
                    <Toggle on={privacy.dataSharing} onChange={v => setP(setPrivacy, "dataSharing", v)} />
                  </Row>
                </Card>

                <Card>
                  <SectionTitle>Danger Zone</SectionTitle>
                  <Row label="Delete Account" desc="Permanently remove your profile and all content">
                    <button
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                      Delete
                    </button>
                  </Row>
                </Card>
              </div>
            )}

            {/* ── Notifications ── */}
            {active === "notifications" && (
              <div className="max-w-xl flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-1)" }}>Notifications</h2>
                  <p className="text-sm" style={{ color: "var(--text-5)" }}>Choose what you want to be notified about.</p>
                </div>

                <Card>
                  <SectionTitle>In-App</SectionTitle>
                  <Row label="Likes" desc="When someone likes your post">
                    <Toggle on={notifs.likes} onChange={v => setP(setNotifs, "likes", v)} />
                  </Row>
                  <Row label="Comments" desc="When someone comments on your post">
                    <Toggle on={notifs.comments} onChange={v => setP(setNotifs, "comments", v)} />
                  </Row>
                  <Row label="New Followers" desc="When someone follows you">
                    <Toggle on={notifs.follows} onChange={v => setP(setNotifs, "follows", v)} />
                  </Row>
                  <Row label="Messages" desc="When you receive a new message">
                    <Toggle on={notifs.messages} onChange={v => setP(setNotifs, "messages", v)} />
                  </Row>
                  <Row label="Project Updates" desc="Status changes on your hire requests">
                    <Toggle on={notifs.projectUpdates} onChange={v => setP(setNotifs, "projectUpdates", v)} />
                  </Row>
                </Card>

                <Card>
                  <SectionTitle>Email</SectionTitle>
                  <Row label="Weekly Digest" desc="A summary of your activity every week">
                    <Toggle on={notifs.emailDigest} onChange={v => setP(setNotifs, "emailDigest", v)} />
                  </Row>
                  <Row label="Marketing & Updates" desc="News about Ortist features and offers">
                    <Toggle on={notifs.marketing} onChange={v => setP(setNotifs, "marketing", v)} />
                  </Row>
                </Card>
              </div>
            )}

            {/* ── Preferences ── */}
            {active === "preferences" && (
              <div className="max-w-xl flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-1)" }}>Preferences</h2>
                  <p className="text-sm" style={{ color: "var(--text-5)" }}>Customise your Ortist experience.</p>
                </div>

                <Card>
                  <SectionTitle>Appearance</SectionTitle>
                  <Row label="Dark Mode" desc="Use dark theme across the app">
                    <Toggle on={prefs.darkMode} onChange={v => setP(setPrefs, "darkMode", v)} />
                  </Row>
                  <Row label="Compact View" desc="Show more content with reduced spacing">
                    <Toggle on={prefs.compactView} onChange={v => setP(setPrefs, "compactView", v)} />
                  </Row>
                </Card>

                <Card>
                  <SectionTitle>Language & Content</SectionTitle>
                  <Row label="Language" desc="App display language">
                    <select
                      className="text-xs rounded-xl px-3 py-2 outline-none"
                      style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </Row>
                  <Row label="Autoplay Videos" desc="Automatically play motion design previews">
                    <Toggle on={prefs.autoplay} onChange={v => setP(setPrefs, "autoplay", v)} />
                  </Row>
                </Card>
              </div>
            )}

            {/* ── Analytics ── */}
            {active === "analytics" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-1)" }}>Analytics</h2>
                  <p className="text-sm" style={{ color: "var(--text-5)" }}>Overview of your profile and content performance.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatBox icon={Users}     label="Followers"     value="—" color="#7C5BF5" />
                  <StatBox icon={Heart}     label="Total Likes"   value="—" color="#f43f5e" />
                  <StatBox icon={TrendingUp}label="Posts"         value="—" color="#10B981" />
                  <StatBox icon={Eye}       label="Profile Views" value="—" color="#F59E0B" />
                </div>

                <Card>
                  <SectionTitle>Coming Soon</SectionTitle>
                  <div className="flex flex-col items-center py-10 gap-3">
                    <BarChart2 size={36} style={{ color: "rgba(124,91,245,0.4)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>Detailed Analytics</p>
                    <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-5)" }}>
                      Engagement charts, reach metrics, and audience insights are on the way.
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* ── Support ── */}
            {active === "support" && (
              <div className="max-w-xl flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-1)" }}>Support</h2>
                  <p className="text-sm" style={{ color: "var(--text-5)" }}>Frequently asked questions and contact.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    {
                      icon: MessageSquare,
                      color: "#9B7CF5",
                      q: "How do I post artwork?",
                      a: "Click the purple + Create Post button in the sidebar. You can upload an image and add a title, description, and category.",
                    },
                    {
                      icon: FileText,
                      color: "#10B981",
                      q: "How do I get hired on Ortist?",
                      a: "Keep your profile up to date, mark yourself as available, and post high-quality work. Clients can send you a Hire request directly from your posts or profile.",
                    },
                    {
                      icon: Shield,
                      color: "#F59E0B",
                      q: "How do I delete my account?",
                      a: "Go to Privacy in these settings and click Delete Account, or manage your account via the Clerk account button in the sidebar.",
                    },
                    {
                      icon: HelpCircle,
                      color: "#f43f5e",
                      q: "Why can't I see my story views?",
                      a: "Story views are only visible to you as the owner. Tap the eye icon at the bottom of your story to see who has viewed it.",
                    },
                    {
                      icon: MessageSquare,
                      color: "#60A5FA",
                      q: "How do commissions work?",
                      a: "Clients can hire you from your profile or any of your posts. You will receive their brief in the Hiring section and can accept or decline from there.",
                    },
                  ].map(({ icon: Icon, color, q, a }, i) => (
                    <Card key={i}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={14} style={{ color }} />
                        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{q}</p>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>{a}</p>
                    </Card>
                  ))}

                  <div className="rounded-2xl p-5" style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.25)" }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#9B7CF5" }}>Still need help?</p>
                    <p className="text-xs" style={{ color: "var(--text-4)" }}>
                      Reach out at{" "}
                      <a href="mailto:support@ortist.art" className="underline" style={{ color: "#9B7CF5" }}>
                        support@ortist.art
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
