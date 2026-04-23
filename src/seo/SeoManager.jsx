import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSeoConfigForPath, seoDefaults } from "./seoConfig";

const upsertMetaTag = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

const upsertCanonical = (url) => {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", url);
};

const setStructuredData = (items) => {
  document.querySelectorAll('script[data-seo-jsonld="1"]').forEach((element) => element.remove());
  items.forEach((payload) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "1");
    script.text = JSON.stringify(payload);
    document.head.appendChild(script);
  });
};

const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    const { title, description, keywords, canonicalUrl, indexable, jsonLd } = getSeoConfigForPath(
      location.pathname,
    );
    const robotsValue = indexable
      ? "index, follow, max-image-preview:large"
      : "noindex, nofollow, noarchive";

    document.title = title;
    upsertCanonical(canonicalUrl);

    upsertMetaTag('meta[name="description"]', { name: "description", content: description });
    upsertMetaTag('meta[name="keywords"]', { name: "keywords", content: keywords });
    upsertMetaTag('meta[name="robots"]', { name: "robots", content: robotsValue });
    upsertMetaTag('meta[name="googlebot"]', { name: "googlebot", content: robotsValue });

    upsertMetaTag('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMetaTag('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: seoDefaults.siteName,
    });
    upsertMetaTag('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMetaTag('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    upsertMetaTag('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMetaTag('meta[property="og:image"]', {
      property: "og:image",
      content: seoDefaults.defaultImage,
    });

    upsertMetaTag('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMetaTag('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMetaTag('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });
    upsertMetaTag('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: seoDefaults.defaultImage,
    });

    setStructuredData(jsonLd || []);
  }, [location.pathname]);

  return null;
};

export default SeoManager;
