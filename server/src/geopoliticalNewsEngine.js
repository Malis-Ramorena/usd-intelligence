/*
|--------------------------------------------------------------------------
| USD GEOPOLITICAL NEWS COLLECTION ENGINE
|--------------------------------------------------------------------------
|
| Collects geopolitical headlines and prepares them for:
|
| geopoliticalEngine.js
|
|--------------------------------------------------------------------------
*/

import {
  analyzeGeopoliticalEvents,
} from "./geopoliticalEngine.js";

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const NEWS_URL =
  process.env.GEOPOLITICAL_NEWS_URL ||
  "https://feeds.bbci.co.uk/news/world/rss.xml";

/*
|--------------------------------------------------------------------------
| FETCH RSS
|--------------------------------------------------------------------------
*/

async function fetchRSS(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Geopolitical news request failed: ${response.status}`
    );
  }

  return await response.text();
}

/*
|--------------------------------------------------------------------------
| XML HELPERS
|--------------------------------------------------------------------------
*/

function decodeXML(value = "") {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function getTag(xml, tag) {
  const regex = new RegExp(
    `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );

  const match = xml.match(regex);

  if (!match) {
    return "";
  }

  return decodeXML(match[1]);
}

/*
|--------------------------------------------------------------------------
| PARSE RSS ITEMS
|--------------------------------------------------------------------------
*/

function parseRSS(xml) {
  const items =
    xml.match(
      /<item[\s\S]*?<\/item>/gi
    ) || [];

  return items.map((item) => ({
    title:
      getTag(item, "title"),

    description:
      getTag(item, "description"),

    publishedAt:
      getTag(item, "pubDate"),

    link:
      getTag(item, "link"),

    source:
      "BBC World",
  }));
}

/*
|--------------------------------------------------------------------------
| GEOPOLITICAL FILTER
|--------------------------------------------------------------------------
*/

const GEOPOLITICAL_TERMS = [
  "war",
  "military",
  "missile",
  "attack",
  "conflict",
  "iran",
  "israel",
  "gaza",
  "russia",
  "ukraine",
  "china",
  "taiwan",
  "tariff",
  "sanction",
  "sanctions",
  "oil",
  "opec",
  "shipping",
  "strait",
  "trade",
  "nato",
  "ceasefire",
  "peace",
  "diplomatic",
  "election",
  "president",
  "government",
  "crisis",
  "energy",
  "supply",
];

/*
|--------------------------------------------------------------------------
| FILTER ARTICLE
|--------------------------------------------------------------------------
*/

function isGeopolitical(article) {
  const text =
    `${article.title} ${article.description}`
      .toLowerCase();

  return GEOPOLITICAL_TERMS.some(
    (term) =>
      text.includes(term)
  );
}

/*
|--------------------------------------------------------------------------
| COLLECT GEOPOLITICAL NEWS
|--------------------------------------------------------------------------
*/

export async function collectGeopoliticalNews() {
  console.log(
    "Collecting geopolitical news..."
  );

  const xml =
    await fetchRSS(
      NEWS_URL
    );

  const articles =
    parseRSS(xml);

  const geopoliticalArticles =
    articles
      .filter(isGeopolitical)
      .slice(0, 30);

  console.log(
    `Collected ${articles.length} world articles.`
  );

  console.log(
    `Geopolitical articles: ${geopoliticalArticles.length}`
  );

  return geopoliticalArticles;
}

/*
|--------------------------------------------------------------------------
| ANALYZE GEOPOLITICAL NEWS
|--------------------------------------------------------------------------
*/

export async function analyzeGeopoliticalNews() {
  const articles =
    await collectGeopoliticalNews();

  const analysis =
    analyzeGeopoliticalEvents(
      articles
    );

  return {
    ...analysis,

    articles,
  };
}