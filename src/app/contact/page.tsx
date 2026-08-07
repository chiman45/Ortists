import LegalPage from "@/components/layout/LegalPage";

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us" subtitle="We'd love to hear from you." lastUpdated="">
      <div className="space-y-4">
        {[
          { label: "General Enquiries", value: "info@ortists.com", desc: "Questions about the platform, partnerships, or media" },
          { label: "Support", value: "support@ortists.com", desc: "Help with your orders, account, or disputes" },
        ].map(({ label, value, desc }) => (
          <div
            key={label}
            className="rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              {label}
            </p>
            <p className="text-base font-bold mb-1" style={{ color: "#9B7CF5" }}>{value}</p>
            <p className="text-[12px]" style={{ color: "#8B8B95" }}>{desc}</p>
          </div>
        ))}

        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Company
          </p>
          <p className="text-base font-black tracking-widest" style={{ color: "#fff" }}>ORTISTS</p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, rgba(54,30,123,0.25), rgba(124,91,245,0.12))",
            border: "1px solid rgba(155,124,245,0.28)",
          }}
        >
          <p className="text-[13px] font-semibold text-white mb-1">Response Time</p>
          <p className="text-[13px]" style={{ color: "#8B8B95" }}>
            We aim to respond to all enquiries within <span className="text-white font-semibold">1–2 business days</span>. For urgent matters, include &quot;URGENT&quot; in your subject line.
          </p>
        </div>
      </div>
    </LegalPage>
  );
}
