"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";

const CATEGORIES = [
  { icon: "/icons/8.svg",  label: "UI/UX Design",       count: 142 },
  { icon: "/icons/9.svg",  label: "Brand Identity",      count: 89  },
  { icon: "/icons/10.svg", label: "Motion Design",       count: 67  },
  { icon: "/icons/11.svg", label: "Illustration",        count: 54  },
  { icon: "/icons/12.svg", label: "3D & Animation",      count: 38  },
  { icon: "/icons/13.svg", label: "Photography",         count: 201 },
];

const JOBS = [
  { id: 1, role: "Senior Product Designer",  company: "Airbnb",   location: "Remote",       type: "Full-time", icon: "/icons/14.svg" },
  { id: 2, role: "Brand Designer",           company: "Spotify",  location: "New York, US", type: "Full-time", icon: "/icons/15.svg" },
  { id: 3, role: "Motion Designer",          company: "Netflix",  location: "Remote",       type: "Contract",  icon: "/icons/16.svg" },
  { id: 4, role: "UI Designer",              company: "Figma",    location: "San Francisco",type: "Full-time", icon: "/icons/17.svg" },
  { id: 5, role: "Illustrator",              company: "Adobe",    location: "Remote",       type: "Part-time", icon: "/icons/18.svg" },
  { id: 6, role: "Creative Director",        company: "Meta",     location: "London, UK",   type: "Full-time", icon: "/icons/19.svg" },
];

export default function HiringPage() {
  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.16) 0%, transparent 55%)," +
          "radial-gradient(ellipse 50% 40% at 92% 20%, rgba(124,91,245,0.08) 0%, transparent 50%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        <MainHeader />

        <main className="flex-1 px-4 md:px-8 py-7 pb-24 lg:pb-7">

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-1)" }}>Hiring Mode</h2>
            <p className="text-sm" style={{ color: "var(--text-5)" }}>
              Find creative talent or discover your next opportunity
            </p>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-3 mb-10">
            {CATEGORIES.map(({ icon, label, count }) => (
              <button
                key={label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-[1.02]"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#7C5BF5"; e.currentTarget.style.color = "#9B7CF5"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; }}
              >
                <img src={icon} alt={label} className="w-4 h-4 object-contain" style={{ filter: "var(--icon-filter)", opacity: 0.7 }} />
                <span>{label}</span>
                <span
                  className="text-xs rounded-full px-1.5 py-0.5"
                  style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5" }}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Job listings */}
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-1)" }}>Open Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {JOBS.map(({ id, role, company, location, type, icon }) => (
              <div
                key={id}
                className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,91,245,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
              >
                {/* Company icon + type badge */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(124,91,245,0.12)", border: "1px solid rgba(124,91,245,0.2)" }}
                  >
                    <img src={icon} alt={company} className="w-5 h-5 object-contain" style={{ filter: "var(--icon-filter)", opacity: 0.8 }} />
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: type === "Full-time" ? "rgba(54,30,123,0.2)" : type === "Contract" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                      color:      type === "Full-time" ? "#9B7CF5"              : type === "Contract" ? "#F59E0B"               : "#10B981",
                    }}
                  >
                    {type}
                  </span>
                </div>

                {/* Role info */}
                <div>
                  <p className="font-semibold text-[15px] mb-0.5" style={{ color: "var(--text-1)" }}>{role}</p>
                  <p className="text-sm" style={{ color: "var(--text-4)" }}>{company}</p>
                </div>

                {/* Location + Apply */}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs" style={{ color: "var(--text-5)" }}>{location}</span>
                  <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
                    style={{ background: "#361E7B" }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
