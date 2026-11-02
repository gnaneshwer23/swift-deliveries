/**
 * schema.org structured data for public pages, built from the same content the page shows.
 * Search engines read it to understand the page; it must never say more than the page does.
 */
import type { Lesson } from "@/lib/learn/lessons";

export const SITE = "https://www.deliverx.dev";
const ORG = { "@id": `${SITE}/#organization` };

type Json = Record<string, unknown>;

/** Breadcrumb trail, home first. Each crumb is [name, path]. */
export function breadcrumbs(trail: [string, string][]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"] as [string, string], ...trail].map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${SITE}${path}`,
    })),
  };
}

/** FAQ from question/answer pairs that are shown on the page as written. */
export function faqPage(items: readonly { q: string; a: string }[]): Json {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** The product with its published monthly prices. No availability or rating is claimed. */
export function productOffers(
  plans: readonly { id: string; name: string; price: number; focus: string }[],
): Json {
  return {
    "@type": "SoftwareApplication",
    "@id": `${SITE}/#software`,
    name: "DeliverX",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${SITE}/`,
    publisher: ORG,
    offers: plans.map((p) => ({
      "@type": "Offer",
      name: `DeliverX ${p.name}`,
      description: p.focus,
      price: p.price.toFixed(2),
      priceCurrency: "GBP",
      url: `${SITE}/pricing`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: p.price.toFixed(2),
        priceCurrency: "GBP",
        unitCode: "MON",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    })),
  };
}

const COURSE_ID = `${SITE}/learn#course`;

/** /learn as a free, self-paced course whose parts are the lessons. */
export function learnCourse(lessons: readonly Lesson[], description: string): Json {
  return {
    "@type": "Course",
    "@id": COURSE_ID,
    name: "Learn by building: product craft, one real step at a time",
    description,
    url: `${SITE}/learn`,
    inLanguage: "en-GB",
    provider: ORG,
    isAccessibleForFree: true,
    teaches: lessons.map((l) => l.title),
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP", category: "Free" },
    hasPart: lessons.map((l) => ({ "@id": `${SITE}/learn/${l.id}#lesson` })),
  };
}

/** One lesson as a learning resource that is part of the course. */
export function learnLesson(lesson: Lesson): Json {
  return {
    "@type": "LearningResource",
    "@id": `${SITE}/learn/${lesson.id}#lesson`,
    name: lesson.title,
    description: lesson.summary,
    url: `${SITE}/learn/${lesson.id}`,
    inLanguage: "en-GB",
    learningResourceType: "Lesson",
    isAccessibleForFree: true,
    position: lesson.n,
    teaches: lesson.what,
    isPartOf: { "@id": COURSE_ID },
    provider: ORG,
  };
}

/** A head `scripts` entry holding one schema.org graph. */
export function jsonLdScript(nodes: Json[]) {
  return {
    type: "application/ld+json",
    // Escape "<" so text inside the data can never close the script tag.
    children: JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(
      /</g,
      "\\u003c",
    ),
  };
}
