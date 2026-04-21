const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://bondroom.org").replace(/\/+$/, "");
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

const INDEXABLE_ROUTES = new Set(["/", "/about", "/volunteer", "/donate"]);

const PAGE_CONFIG = {
  "/": {
    title: "Bond Room | Safe Teen Mentorship Platform",
    description:
      "Bond Room connects teens with trusted mentors for safe, guided one-on-one support in academics, wellbeing, and life decisions.",
    keywords: "teen mentorship, student mentoring, youth guidance, safe online mentoring, Bond Room",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Bond Room",
        url: SITE_URL,
        logo: DEFAULT_IMAGE,
        sameAs: [
          "https://www.instagram.com/bondroomfoundation/",
          "https://www.linkedin.com/in/bond-room-374aaa393/",
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Bond Room",
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  },
  "/about": {
    title: "About Bond Room | Mentorship Mission and Team",
    description:
      "Learn about Bond Room's mission, founders, and leadership building a safe, student-first mentoring platform.",
    keywords: "about Bond Room, mentorship mission, student support platform, youth mentoring team",
  },
  "/volunteer": {
    title: "Volunteer Events | Bond Room Community Impact",
    description:
      "Explore upcoming and completed Bond Room volunteer events and join community initiatives that support teen growth.",
    keywords: "volunteer events, student volunteering, community events, Bond Room volunteer",
  },
  "/donate": {
    title: "Donate to Bond Room | Support Safe Student Mentorship",
    description:
      "Support Bond Room's safe mentorship platform. Donations help strengthen student support, mentor quality, and safety operations.",
    keywords: "donate to mentoring, support student wellbeing, youth mentorship donation, Bond Room donate",
  },
};

const FALLBACK_CONFIG = {
  title: "Bond Room",
  description:
    "Bond Room is a mentorship platform connecting teens with trusted mentors for safe and meaningful guidance.",
  keywords: "Bond Room, teen mentorship, student support",
};

export const getSeoConfigForPath = (pathname) => {
  const normalizedPath = pathname === "/" ? "/" : String(pathname || "").replace(/\/+$/, "");

  const baseConfig = PAGE_CONFIG[normalizedPath] || FALLBACK_CONFIG;
  const canonicalPath = normalizedPath || "/";
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  const isCompletedEventStory = normalizedPath.startsWith("/volunteer/completed/");
  const isVolunteerEventRegister = normalizedPath.startsWith("/volunteer-events/");
  const isAdmin = normalizedPath === "/admin" || normalizedPath.startsWith("/admin/");
  const isAuthOrPrivate =
    normalizedPath.startsWith("/dashboard") ||
    normalizedPath.startsWith("/mentor-") ||
    normalizedPath.startsWith("/my-") ||
    normalizedPath.startsWith("/session-") ||
    normalizedPath.startsWith("/book-session") ||
    normalizedPath.startsWith("/registered-events") ||
    normalizedPath.startsWith("/event-") ||
    normalizedPath.startsWith("/profile") ||
    normalizedPath.startsWith("/needs-assessment") ||
    normalizedPath === "/login" ||
    normalizedPath === "/register";

  if (isCompletedEventStory) {
    return {
      title: "Volunteer Impact Story | Bond Room",
      description:
        "Read the completion story and impact summary for this Bond Room volunteer event.",
      keywords: "volunteer impact story, community impact, Bond Room",
      canonicalUrl,
      indexable: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Volunteer Impact Story",
          mainEntityOfPage: canonicalUrl,
          publisher: {
            "@type": "Organization",
            name: "Bond Room",
            logo: {
              "@type": "ImageObject",
              url: DEFAULT_IMAGE,
            },
          },
        },
      ],
    };
  }

  const indexable =
    INDEXABLE_ROUTES.has(normalizedPath) && !isAdmin && !isAuthOrPrivate && !isVolunteerEventRegister;

  return {
    ...baseConfig,
    canonicalUrl,
    indexable,
    jsonLd: baseConfig.jsonLd || [],
  };
};

export const seoDefaults = {
  siteUrl: SITE_URL,
  defaultImage: DEFAULT_IMAGE,
  siteName: "Bond Room",
};
