import LegalPage from "@/components/layout/LegalPage";

const sections = [
  {
    title: "1. Agreement Overview",
    content: `This Client Agreement governs the relationship between Ortists and clients (buyers) who use the platform to hire artists or purchase artwork. By using Ortists as a client, you agree to these terms.`,
  },
  {
    title: "2. Eligibility",
    content: `• You must be at least 18 years old (or have parental consent)\n• You agree to provide accurate information when placing orders\n• You agree to use the platform only for lawful purposes`,
  },
  {
    title: "3. Ordering & Hiring",
    content: `• Browse artist profiles and portfolios to find the right match\n• Discuss requirements clearly with the artist before confirming an order\n• All orders must be placed and confirmed through the Ortists platform`,
  },
  {
    title: "4. Client Obligations",
    content: `Clients agree to:\n• Provide clear, complete, and accurate project requirements\n• Respond promptly to artist queries during the project\n• Make payments through Ortists-approved payment methods only\n• Treat artists with respect and professionalism`,
  },
  {
    title: "5. Payments",
    content: `• All payments must be made through the Ortists platform\n• Attempting to pay artists directly outside the platform violates this agreement and may result in account suspension\n• Ortists uses secure third-party payment gateways for all transactions`,
  },
  {
    title: "6. Reviews & Approvals",
    content: `• You will have an opportunity to review delivered work before final approval\n• Once you approve and accept the work, the order is considered complete\n• Raise any concerns during the review phase — post-approval disputes may not be eligible for refunds`,
  },
  {
    title: "7. Intellectual Property",
    content: `• Ownership of commissioned artwork depends on the agreement between you and the artist\n• Clarify usage rights (personal, commercial, etc.) before placing the order\n• Ortists is not responsible for IP disputes arising from agreements between clients and artists`,
  },
  {
    title: "8. Refunds & Disputes",
    content: `• Refund eligibility is governed by the Refund & Cancellation Policy\n• Raise disputes through the Ortists platform within the specified timeframe\n• Ortists may mediate disputes but cannot guarantee specific outcomes`,
  },
  {
    title: "9. Prohibited Use",
    content: `Clients must not:\n• Use the platform to request illegal or unethical artwork/services\n• Harass, abuse, or threaten artists\n• Share artist contact details obtained through the platform for purposes outside the transaction`,
  },
  {
    title: "10. Termination",
    content: `Ortists may suspend or terminate client accounts for violation of this agreement, fraudulent activity, or misuse of the platform.`,
  },
  {
    title: "11. Contact",
    content: `Email: info@ortists.com\nCompany: ORTISTS`,
  },
];

export default function ClientAgreementPage() {
  return (
    <LegalPage
      title="Client Agreement"
      subtitle="Terms governing how clients hire artists and purchase artwork on the Ortists platform."
      lastUpdated="August 2026"
      sections={sections}
    />
  );
}
