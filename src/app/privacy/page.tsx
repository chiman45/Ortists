import LegalPage from "@/components/layout/LegalPage";

const sections = [
  {
    title: "1. Information We Collect",
    content: `Personal Information\nWe may collect: Name, Phone number, Email address, Profile details (for artists), Payment-related information.\n\nUsage Information\nWe may collect: Device information, IP address, App usage data, Pages visited and interactions.\n\nArtist Content\nPortfolio images, Artwork details, Descriptions and pricing.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use your information to:\n• Create and manage user accounts\n• Enable artist discovery and hiring\n• Process payments and transactions\n• Facilitate communication between users\n• Improve platform functionality\n• Provide customer support\n• Send updates and notifications`,
  },
  {
    title: "3. Payment Information",
    content: `• Payments are processed through secure third-party payment gateways\n• Ortists does not store sensitive payment details such as card numbers\n• Payment providers handle transactions as per their security standards`,
  },
  {
    title: "4. Communication & Third-Party Services",
    content: `• Users may communicate via third-party platforms such as WhatsApp\n• Ortists is not responsible for data shared outside the platform`,
  },
  {
    title: "5. AI Language Translation",
    content: `• Ortists may use AI tools to translate messages or content\n• Data processed for translation may be handled by third-party services\n• Translations are for convenience and may not be fully accurate`,
  },
  {
    title: "6. Sharing of Information",
    content: `We may share information with payment gateway providers, service providers (hosting, analytics, etc.), and legal authorities (if required by law).\n\nWe do NOT sell your personal data.`,
  },
  {
    title: "7. Data Storage & Security",
    content: `• We take reasonable measures to protect your data\n• Data is stored securely using industry-standard practices\n• However, no system is completely secure`,
  },
  {
    title: "8. User Rights",
    content: `You may:\n• Access your data\n• Request correction of inaccurate data\n• Request deletion of your account`,
  },
  {
    title: "9. Cookies & Tracking",
    content: `• We may use cookies or similar technologies to improve user experience\n• You can manage cookie preferences through your device/browser`,
  },
  {
    title: "10. Children's Privacy",
    content: `Ortists is not intended for users under the age of 18 without parental consent.`,
  },
  {
    title: "11. Policy Updates",
    content: `We may update this Privacy Policy from time to time. Continued use of the platform means you accept the updated policy.`,
  },
  {
    title: "12. Governing Law",
    content: `This Privacy Policy is governed by applicable Indian laws.`,
  },
  {
    title: "13. Contact",
    content: `Email: info@ortists.com\nCompany: ORTISTS`,
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="We are committed to protecting your privacy. Here's how we collect, use, and protect your information."
      lastUpdated="August 2026"
      sections={sections}
    />
  );
}
