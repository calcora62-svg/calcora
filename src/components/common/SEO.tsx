import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  keywords?: string[];
  faq?: { q: string; a: string }[];
  breadcrumb?: { name: string; item: string }[];
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  path = '',
  ogImage = '/og-image.png',
  keywords = [],
  faq,
  breadcrumb
}) => {
  // Build canonical URL
  const canonicalUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${path || window.location.pathname}`
    : `https://calcora.com${path}`;

  const siteVerification = (import.meta as any).env.VITE_GOOGLE_SITE_VERIFICATION;

  // Render schema.org JSON-LD structured data (SoftwareApplication)
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": title,
    "url": canonicalUrl,
    "operatingSystem": "All",
    "applicationCategory": "ProductivityApplication",
    "description": description,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const faqSchema = faq && faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  } : null;

  const breadcrumbSchema = breadcrumb && breadcrumb.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumb.map((b, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": b.name,
      "item": b.item.startsWith('http') ? b.item : `https://calcora.com${b.item}`
    }))
  } : null;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Google Site Verification */}
      {siteVerification && (
        <meta name="google-site-verification" content={siteVerification} />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Calcora" />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(softwareAppSchema)}
      </script>

      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}

      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
};
