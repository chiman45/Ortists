import LegalPage from "@/components/layout/LegalPage";

const faqs = [
  {
    q: "How do I hire an artist?",
    a: "Browse the platform, visit an artist's profile, and click the Hire button. You can discuss your requirements and confirm the order through the platform.",
  },
  {
    q: "How are payments handled?",
    a: "All payments are processed securely through Ortists-approved payment gateways. Never pay an artist directly outside the platform.",
  },
  {
    q: "Can I request a refund?",
    a: "Refunds are handled per our Refund & Cancellation Policy. Eligible cases include non-delivery or work significantly different from agreed requirements.",
  },
  {
    q: "How do I become an artist on Ortists?",
    a: "Register on the platform, complete your artist profile with portfolio images, and start accepting commissions. Review the Artists Agreement before registering.",
  },
  {
    q: "What if I have a dispute?",
    a: "Contact our support team with the details. Ortists can mediate disputes between artists and clients.",
  },
  {
    q: "Is my payment information safe?",
    a: "Yes. Ortists does not store sensitive payment details like card numbers. All transactions are handled by secure third-party payment providers.",
  },
];

export default function HelpPage() {
  return (
    <LegalPage
      title="Help & Support"
      subtitle="Find answers to common questions or reach out to our team."
      lastUpdated=""
    >
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-start gap-4">
              <span
                className="shrink-0 text-[11px] font-mono font-bold mt-0.5 rounded-lg px-2 py-1"
                style={{ background: "rgba(155,124,245,0.12)", color: "#9B7CF5" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-[14px] font-bold text-white mb-2">{faq.q}</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "#8B8B95" }}>{faq.a}</p>
              </div>
            </div>
          </div>
        ))}

        <div
          className="rounded-2xl p-6 mt-4"
          style={{
            background: "linear-gradient(135deg, rgba(54,30,123,0.25), rgba(124,91,245,0.12))",
            border: "1px solid rgba(155,124,245,0.28)",
          }}
        >
          <p className="text-[14px] font-bold text-white mb-1">Still need help?</p>
          <p className="text-[13px]" style={{ color: "#8B8B95" }}>
            Email us at{" "}
            <span style={{ color: "#9B7CF5" }}>support@ortists.com</span> — we respond within 1–2 business days.
          </p>
        </div>
      </div>
    </LegalPage>
  );
}
