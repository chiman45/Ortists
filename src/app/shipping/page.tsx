import LegalPage from "@/components/layout/LegalPage";

const sections = [
  {
    title: "1. Scope",
    content: `This Shipping & Delivery Policy applies to physical artwork and art products sold through the Ortists platform.`,
  },
  {
    title: "2. Shipping Timelines",
    content: `• Processing time: 2–5 business days after order confirmation\n• Standard delivery: 5–10 business days (domestic)\n• International delivery: 10–21 business days\n• Exact timelines depend on the artist's location and the courier service used`,
  },
  {
    title: "3. Shipping Partners",
    content: `Ortists works with trusted courier partners. The shipping provider may vary based on the artist's location and the size/weight of the artwork.`,
  },
  {
    title: "4. Shipping Charges",
    content: `• Shipping charges are calculated at checkout based on destination and package weight\n• Some artists may offer free shipping — this will be indicated on the product listing`,
  },
  {
    title: "5. Packaging",
    content: `Artists are responsible for safe and secure packaging of all physical artwork. Ortists recommends acid-free materials and rigid protective casing for fragile pieces.`,
  },
  {
    title: "6. Tracking",
    content: `A tracking number will be shared with the buyer once the order is dispatched. You can track your order through the courier partner's website.`,
  },
  {
    title: "7. Damaged or Lost Shipments",
    content: `• If an item arrives damaged, please contact us within 48 hours of delivery with photos\n• Ortists will coordinate with the artist and courier to resolve the issue\n• Replacement or refund eligibility depends on the specific circumstances`,
  },
  {
    title: "8. International Orders",
    content: `• Buyers are responsible for any applicable customs duties, taxes, or import fees\n• Ortists is not responsible for delays caused by customs authorities`,
  },
  {
    title: "9. Contact",
    content: `Email: info@ortists.com\nCompany: ORTISTS`,
  },
];

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping & Delivery"
      subtitle="How we handle the shipment and delivery of physical artworks and products."
      lastUpdated="August 2026"
      sections={sections}
    />
  );
}
