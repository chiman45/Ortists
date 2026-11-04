import LegalPage from "@/components/layout/LegalPage";
import { AGREEMENTS, AGREEMENT_VERSION } from "@/lib/agreements";

const doc = AGREEMENTS.artistPlatformTerms;

export default function ArtistPlatformTermsPage() {
  return (
    <LegalPage
      title={doc.title}
      subtitle={doc.subtitle}
      lastUpdated={AGREEMENT_VERSION}
      sections={doc.sections}
    />
  );
}
