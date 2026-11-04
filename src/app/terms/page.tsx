import LegalPage from "@/components/layout/LegalPage";
import { AGREEMENTS, AGREEMENT_VERSION } from "@/lib/agreements";

const doc = AGREEMENTS.platformTerms;

export default function TermsPage() {
  return (
    <LegalPage
      title={doc.title}
      subtitle={doc.subtitle}
      lastUpdated={AGREEMENT_VERSION}
      sections={doc.sections}
    />
  );
}
