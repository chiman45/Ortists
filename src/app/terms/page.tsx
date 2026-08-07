import LegalPage from "@/components/layout/LegalPage";

const sections = [
  {
    title: "1. Platform Overview",
    content: `Ortists is a digital marketplace that enables:\n• Hiring of artists for various creative services\n• Buying and selling of physical and digital artwork\n• Discovery of artists across multiple creative categories\n\nOrtists acts as an intermediary platform, facilitating interactions and transactions between artists and clients.\n\nNote: Ortists may initially focus on specific categories (such as portrait artists) as part of its phased rollout. However, the platform is designed to support multiple categories and creative domains over time.`,
  },
  {
    title: "2. Platform Services",
    content: `Ortists provides a platform that may include, but is not limited to:\n• Artist hiring and freelance services\n• Commission-based custom artwork\n• Buying and selling of artwork\n• Digital products (e.g., tutorials, downloadable content)\n• Workshops, classes, and training sessions (online/offline)\n• Art-related products and materials\n• Artist promotion and portfolio showcasing\n\nOrtists reserves the right to introduce, modify, or discontinue services at any time.`,
  },
  {
    title: "3. User Roles",
    content: `Artists (Sellers)\n• Create profiles and portfolios\n• Offer services or artworks\n• Receive payments through the platform\n\nClients (Buyers)\n• Browse artists and artworks\n• Hire artists or purchase artwork`,
  },
  {
    title: "4. Account & Registration",
    content: `• Users must provide accurate and complete information\n• Accounts are personal and non-transferable\n• Ortists reserves the right to suspend or terminate accounts for misuse`,
  },
  {
    title: "5. Artist Responsibilities",
    content: `Artists agree to:\n• Provide original and authentic work\n• Accurately represent their skills and offerings\n• Deliver services/artwork within agreed timelines\n• Maintain professional communication\n• Avoid infringement of any intellectual property`,
  },
  {
    title: "6. Client Responsibilities",
    content: `Clients agree to:\n• Provide clear and accurate requirements\n• Make timely payments through the platform\n• Communicate respectfully with artists`,
  },
  {
    title: "7. Payments, Commission & Payouts",
    content: `• All payments must be made through Ortists-approved payment systems\n• Ortists may charge a commission fee on transactions\n• Artists will receive payouts after order confirmation and completion\n• Any attempt to bypass platform payments may result in account suspension`,
  },
  {
    title: "8. Refund & Cancellation",
    content: `• Refunds and cancellations are subject to the nature of the service or product\n• Specific terms may be defined separately in the Refund Policy\n• Ortists reserves the right to review and resolve disputes`,
  },
  {
    title: "9. Order & Delivery",
    content: `• Delivery timelines are defined by the artist\n• Ortists may assist in dispute resolution but is not responsible for delays caused by artists`,
  },
  {
    title: "10. Communication",
    content: `Communication may occur through platform features or third-party tools such as WhatsApp. Users are responsible for maintaining professionalism and clarity in communication.`,
  },
  {
    title: "11. AI Language Translation",
    content: `• Ortists may provide AI-based translation tools for user convenience\n• Translations may not be fully accurate\n• Users must verify details before finalizing agreements`,
  },
  {
    title: "12. Intellectual Property",
    content: `• Artists retain ownership of their work unless otherwise agreed\n• By uploading content, artists grant Ortists a non-exclusive, worldwide right to display, promote, and market their content`,
  },
  {
    title: "13. Prohibited Activities",
    content: `Users must not:\n• Upload plagiarised or unauthorised content\n• Misrepresent identity or services\n• Engage in fraud or illegal activities\n• Bypass platform payment systems\n• Use the platform for non-art-related purposes`,
  },
  {
    title: "14. Limitation of Liability",
    content: `Ortists is not liable for quality disputes between users, delays in delivery, or miscommunication between parties. However, Ortists may facilitate dispute resolution at its discretion.`,
  },
  {
    title: "15. Termination",
    content: `Ortists reserves the right to suspend or terminate accounts, remove content, and restrict access in case of violation of these Terms.`,
  },
  {
    title: "16. Modifications",
    content: `Ortists may update these Terms & Conditions at any time. Continued use of the platform constitutes acceptance of updated terms.`,
  },
  {
    title: "17. Governing Law",
    content: `These Terms shall be governed by the laws of India. All disputes shall be subject to the jurisdiction of Indian courts.`,
  },
  {
    title: "18. Contact",
    content: `Email: info@ortists.com\nCompany: ORTISTS`,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      subtitle="By accessing or using the platform, you agree to comply with and be bound by these terms."
      lastUpdated="August 2026"
      sections={sections}
    />
  );
}
