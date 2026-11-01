/** The share card shown when a page link is posted (1200×630, in `public/`). */
export const SHARE_IMAGE = {
  url: "https://www.deliverx.dev/og-image.png",
  width: "1200",
  height: "630",
  alt: "DeliverX — Build products with an AI team. You make every decision.",
};

/** Consistent SEO head for marketing pages. */
export function pageHead(path: string, title: string, description: string) {
  const url = `https://www.deliverx.dev${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:site_name", content: "DeliverX" },
      { property: "og:image", content: SHARE_IMAGE.url },
      { property: "og:image:width", content: SHARE_IMAGE.width },
      { property: "og:image:height", content: SHARE_IMAGE.height },
      { property: "og:image:alt", content: SHARE_IMAGE.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: SHARE_IMAGE.url },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
