import LegalPage from "@/components/layout/LegalPage";

const sections = [
  {
    title: "1. Overview",
    content: `Ortists is a marketplace that facilitates:\n• Hiring of artists\n• Purchase of physical and digital artwork\n• Commission-based custom artwork\n\nAll payments are processed through the Ortists platform.`,
  },
  {
    title: "2. Order Types",
    content: `This policy applies to:\n1. Custom Artwork / Commission Orders\n2. Ready Artwork (Physical Products)\n3. Digital Products (if applicable in future)`,
  },
  {
    title: "3. Cancellation Policy",
    content: `Before Order Confirmation\n• Users may cancel an order before the artist accepts or confirms the order.\n• Full refund will be processed.\n\nAfter Order Confirmation (Custom Work)\n• Once an artist has started work, cancellation may not be allowed.\n• Partial refund may be considered if work has not significantly progressed and the artist agrees.\n\nReady Artwork (Physical Products)\n• Orders can be cancelled before shipping.\n• Once shipped, cancellation is not allowed.\n\nDigital Products\n• No cancellation allowed after purchase or download.`,
  },
  {
    title: "4. Refund Policy",
    content: `Eligible Refund Cases\nRefunds may be considered in the following situations:\n• Artist fails to deliver within agreed timeline\n• Delivered work is significantly different from agreed requirements\n• Order not fulfilled due to artist unavailability\n\nNon-Eligible Refund Cases\nRefunds will not be provided for:\n• Change of mind after order confirmation\n• Minor differences in artistic style\n• Delays caused by client (e.g., late response, unclear instructions)\n• Completed and approved work`,
  },
  {
    title: "5. Dispute Resolution",
    content: `• Ortists may act as a mediator between artist and client\n• Users must provide proof of communication and order details\n• Final decision may be taken by Ortists based on fairness and platform policies`,
  },
  {
    title: "6. Refund Process",
    content: `• Approved refunds will be processed through the original payment method\n• Refund timeline: 5–10 business days (depending on payment provider)`,
  },
  {
    title: "7. Artist Obligations",
    content: `Artists must:\n• Deliver work as per agreed requirements\n• Maintain quality and timelines\n• Communicate delays in advance\n\nFailure to comply may result in refund enforcement or account suspension.`,
  },
  {
    title: "8. Client Obligations",
    content: `Clients must:\n• Provide clear requirements\n• Respond promptly during the process\n• Review work fairly`,
  },
  {
    title: "9. Platform Rights",
    content: `Ortists reserves the right to:\n• Approve or reject refund requests\n• Deduct applicable platform fees (if necessary)\n• Take action against misuse of refund system`,
  },
  {
    title: "10. Policy Updates",
    content: `Ortists may update this policy at any time. Users are advised to review periodically.`,
  },
  {
    title: "11. Contact",
    content: `Email: info@ortists.com\nCompany: ORTISTS`,
  },
];

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund & Cancellation"
      subtitle="Our terms for refunds, cancellations, and dispute resolution on the Ortists platform."
      lastUpdated="August 2026"
      sections={sections}
    />
  );
}
