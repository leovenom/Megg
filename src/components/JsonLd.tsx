import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  alternateName: `${SITE_NAME}: ${SITE_TAGLINE}`,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  image: `${SITE_URL}/opengraph-image`,
  applicationCategory: "LifestyleApplication",
  applicationSubCategory: "Kitchen timer",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  inLanguage: ["pt-BR", "en", "de"],
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
