import LegalPage from "@/components/layout/LegalPage";

const sections = [
  {
    title: "1. Agreement Overview",
    content: `This Artists Agreement governs the relationship between Ortists and artists who register and offer services or artwork through the platform. By joining as an artist, you agree to these terms.`,
  },
  {
    title: "2. Eligibility",
    content: `• You must be at least 18 years old (or have parental consent)\n• You must have genuine artistic skills and original work to offer\n• You agree to represent yourself and your work honestly`,
  },
  {
    title: "3. Artist Obligations",
    content: `Artists agree to:\n• Provide only original, authentic artwork and services\n• Accurately represent their skills, style, and offerings\n• Deliver work within agreed timelines and quality standards\n• Maintain professional and respectful communication with clients\n• Not infringe on any third party's intellectual property rights`,
  },
  {
    title: "4. Portfolio & Listings",
    content: `• You may upload portfolio images, artwork, and service listings\n• All content must be your own original work or properly licensed\n• Ortists reserves the right to remove content that violates these terms`,
  },
  {
    title: "5. Payments & Commission",
    content: `• All payments must be processed through the Ortists platform\n• Ortists charges a commission fee on completed transactions\n• Payouts are processed after order completion and client approval\n• Attempting to conduct transactions outside the platform may result in suspension`,
  },
  {
    title: "6. Intellectual Property",
    content: `• You retain ownership of all artwork you create\n• By listing work on Ortists, you grant Ortists a non-exclusive, royalty-free licence to display and promote your work\n• Custom commissioned work: ownership terms should be agreed upon with the client before work begins`,
  },
  {
    title: "7. Conduct & Professionalism",
    content: `• Treat all clients with respect and professionalism\n• Do not engage in discriminatory, abusive, or fraudulent behaviour\n• Respond to client enquiries in a timely manner`,
  },
  {
    title: "8. Termination",
    content: `Ortists may suspend or terminate artist accounts for:\n• Violation of this agreement\n• Fraudulent activity\n• Repeated negative client feedback\n• Uploading content that infringes third-party rights`,
  },
  {
    title: "9. Dispute Resolution",
    content: `Ortists may mediate disputes between artists and clients. The platform's decision in such matters is final and binding.`,
  },
  {
    title: "10. Contact",
    content: `Email: info@ortists.com\nCompany: ORTISTS`,
  },
];

export default function ArtistsAgreementPage() {
  return (
    <LegalPage
      title="Artists Agreement"
      subtitle="Terms governing how artists participate, list work, and get paid on the Ortists platform."
      lastUpdated="August 2026"
      sections={sections}
    />
  );
}
  