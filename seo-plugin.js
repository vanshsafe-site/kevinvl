import fs from "node:fs";

const NAME = "K.E.V.I.N";
const DESCRIPTION =
  "A free, private emotional-support AI chat that runs entirely in your browser. No account, no API key, and your messages never leave your device.";

const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

/** Build the JSON-LD graph. Exported for testing. */
export function buildJsonLd(site, faq) {
  const app = {
    "@type": "WebApplication",
    name: NAME,
    alternateName: "Keeping Every Voice in Need",
    description: DESCRIPTION,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any modern web browser",
    browserRequirements: "Requires JavaScript. WebGPU recommended for speed.",
    inLanguage: "en",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  if (site) {
    app.url = `${site}/`;
    app.image = `${site}/og-image.png`;
  }
  const page = {
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return { "@context": "https://schema.org", "@graph": [app, page] };
}

/** Apply site URL + JSON-LD to index.html. Exported for testing. */
export function transformHtml(html, site, faq) {
  const ld = `<script type="application/ld+json">${JSON.stringify(buildJsonLd(site, faq)).replace(/</g, "\\u003c")}</script>`;
  let out = html.replace("<!--JSON_LD-->", ld);
  if (site) {
    out = out.replaceAll("__SITE_URL__", site);
  } else {
    // Absolute URLs are required for canonical / og:image, so drop them until a site URL is set.
    out = out
      .split("\n")
      .filter((line) => !line.includes("__SITE_URL__"))
      .join("\n");
  }
  return out;
}

export function robotsTxt(site) {
  return ["User-agent: *", "Allow: /", site ? `Sitemap: ${site}/sitemap.xml` : ""].filter(Boolean).join("\n") + "\n";
}

export function sitemapXml(site, date = new Date()) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(site)}/</loc>
    <lastmod>${date.toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}

/**
 * Set your public URL with SITE_URL (or VITE_SITE_URL) when building, e.g.
 *   SITE_URL=https://kevin.example.com npm run build
 * On Vercel, VERCEL_PROJECT_PRODUCTION_URL is picked up automatically.
 */
export default function seo() {
  let site = "";
  const faq = JSON.parse(fs.readFileSync(new URL("./src/faq.json", import.meta.url), "utf8"));

  return {
    name: "kevin-seo",
    configResolved(config) {
      const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "";
      site = (process.env.SITE_URL || config.env?.VITE_SITE_URL || vercel || "").trim().replace(/\/+$/, "");
      if (config.command === "build") {
        console.log(site ? `[seo] canonical site: ${site}` : "[seo] SITE_URL not set — canonical, og:image and sitemap are omitted");
      }
    },
    transformIndexHtml: { order: "pre", handler: (html) => transformHtml(html, site, faq) },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robotsTxt(site) });
      if (site) this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml(site) });
    },
  };
}
