import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "USD-Intelligence/1.0",
  },
});

/*
|--------------------------------------------------------------------------
| NEWS SOURCES
|--------------------------------------------------------------------------
|
| We start with RSS/public feeds.
| Later we can add more sources.
|
|--------------------------------------------------------------------------
*/

const SOURCES = [
  {
    name: "Federal Reserve",
    url:
      "https://www.federalreserve.gov/feeds/press_all.xml",
    category:
      "monetary-policy",
    usdWeight: 5,
  },

  {
    name: "Federal Reserve Speeches",
    url:
      "https://www.federalreserve.gov/feeds/speeches.xml",
    category:
      "fed-speech",
    usdWeight: 5,
  },
];

/*
|--------------------------------------------------------------------------
| USD KEYWORDS
|--------------------------------------------------------------------------
*/

const USD_KEYWORDS = [
  "usd",
  "dollar",
  "us dollar",
  "federal reserve",
  "fed",
  "fomc",
  "interest rate",
  "interest rates",
  "inflation",
  "cpi",
  "pce",
  "employment",
  "jobs",
  "payroll",
  "unemployment",
  "treasury",
  "yield",
  "bond",
  "gdp",
  "recession",
  "economy",
  "economic growth",
];

/*
|--------------------------------------------------------------------------
| GEOPOLITICAL KEYWORDS
|--------------------------------------------------------------------------
*/

const GEOPOLITICAL_KEYWORDS = [
  "war",
  "military",
  "missile",
  "conflict",
  "invasion",
  "sanctions",
  "tariff",
  "tariffs",
  "trade war",
  "trade",
  "china",
  "russia",
  "ukraine",
  "iran",
  "israel",
  "gaza",
  "middle east",
  "taiwan",
  "north korea",
  "south korea",
  "europe",
  "nato",
  "brics",
];

/*
|--------------------------------------------------------------------------
| BULLISH USD TERMS
|--------------------------------------------------------------------------
*/

const BULLISH_TERMS = [
  "rate hike",
  "rate hikes",
  "higher rates",
  "higher interest rates",
  "hawkish",
  "strong jobs",
  "strong employment",
  "strong growth",
  "hot inflation",
  "inflation rises",
  "inflation increased",
  "safe haven",
  "risk aversion",
  "economic strength",
];

/*
|--------------------------------------------------------------------------
| BEARISH USD TERMS
|--------------------------------------------------------------------------
*/

const BEARISH_TERMS = [
  "rate cut",
  "rate cuts",
  "lower rates",
  "lower interest rates",
  "dovish",
  "weak jobs",
  "weak employment",
  "weak growth",
  "recession",
  "inflation falls",
  "inflation decreased",
  "economic slowdown",
];

/*
|--------------------------------------------------------------------------
| TEXT SCORING
|--------------------------------------------------------------------------
*/

function calculateTextScore(text) {
  const lower =
    text.toLowerCase();

  let score = 0;

  for (
    const term
    of BULLISH_TERMS
  ) {
    if (
      lower.includes(term)
    ) {
      score += 2;
    }
  }

  for (
    const term
    of BEARISH_TERMS
  ) {
    if (
      lower.includes(term)
    ) {
      score -= 2;
    }
  }

  return score;
}

/*
|--------------------------------------------------------------------------
| RELEVANCE
|--------------------------------------------------------------------------
*/

function calculateRelevance(text) {
  const lower =
    text.toLowerCase();

  let usdMatches = 0;

  let geopoliticalMatches = 0;

  for (
    const keyword
    of USD_KEYWORDS
  ) {
    if (
      lower.includes(keyword)
    ) {
      usdMatches++;
    }
  }

  for (
    const keyword
    of GEOPOLITICAL_KEYWORDS
  ) {
    if (
      lower.includes(keyword)
    ) {
      geopoliticalMatches++;
    }
  }

  return {
    usdMatches,

    geopoliticalMatches,

    relevance:
      Math.min(
        100,
        usdMatches * 10 +
          geopoliticalMatches * 5
      ),
  };
}

/*
|--------------------------------------------------------------------------
| ANALYZE ARTICLE
|--------------------------------------------------------------------------
*/

function analyzeArticle(
  article,
  source
) {
  const title =
    article.title || "";

  const content =
    article.contentSnippet ||
    article.content ||
    "";

  const text =
    `${title} ${content}`;

  const relevance =
    calculateRelevance(text);

  const rawScore =
    calculateTextScore(text);

  const score =
    rawScore *
    (source.usdWeight || 1);

  let bias =
    "NEUTRAL";

  if (score > 0) {
    bias =
      "BULLISH";
  } else if (score < 0) {
    bias =
      "BEARISH";
  }

  return {
    source:
      source.name,

    category:
      source.category,

    title,

    link:
      article.link || null,

    publishedAt:
      article.pubDate ||
      article.isoDate ||
      null,

    relevance:
      relevance.relevance,

    usdMatches:
      relevance.usdMatches,

    geopoliticalMatches:
      relevance.geopoliticalMatches,

    score,

    bias,
  };
}

/*
|--------------------------------------------------------------------------
| FETCH ONE SOURCE
|--------------------------------------------------------------------------
*/

async function fetchSource(
  source
) {
  try {
    console.log(
      `NEWS: ${source.name}`
    );

    const feed =
      await parser.parseURL(
        source.url
      );

    const articles =
      feed.items || [];

    return articles
      .slice(0, 20)
      .map(
        (article) =>
          analyzeArticle(
            article,
            source
          )
      )
      .filter(
        (article) =>
          article.relevance > 0
      );
  } catch (error) {
    console.error(
      `NEWS ${source.name} failed:`,
      error.message
    );

    return [];
  }
}

/*
|--------------------------------------------------------------------------
| COLLECT ALL NEWS
|--------------------------------------------------------------------------
*/

export async function collectNews() {
  const results = [];

  for (
    const source
    of SOURCES
  ) {
    const articles =
      await fetchSource(
        source
      );

    results.push(
      ...articles
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SORT BY RELEVANCE
  |--------------------------------------------------------------------------
  */

  results.sort(
    (a, b) =>
      b.relevance -
      a.relevance
  );

  /*
  |--------------------------------------------------------------------------
  | LIMIT
  |--------------------------------------------------------------------------
  */

  return results.slice(
    0,
    50
  );
}

/*
|--------------------------------------------------------------------------
| ANALYZE NEWS
|--------------------------------------------------------------------------
*/

export function analyzeNews(
  articles
) {
  if (
    !articles ||
    articles.length === 0
  ) {
    return {
      score: 50,

      bias:
        "NEUTRAL",

      confidence:
        0,

      articleCount:
        0,

      articles: [],
    };
  }

  let totalScore = 0;

  let totalWeight = 0;

  for (
    const article
    of articles
  ) {
    /*
    |--------------------------------------------------------------------------
    | Relevance determines how much the article matters.
    |--------------------------------------------------------------------------
    */

    const weight =
      Math.max(
        1,
        article.relevance / 10
      );

    totalScore +=
      article.score *
      weight;

    totalWeight +=
      weight;
  }

  const average =
    totalWeight > 0
      ? totalScore /
        totalWeight
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Convert to 0-100 USD score.
  |--------------------------------------------------------------------------
  */

  const score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          50 + average
        )
      )
    );

  let bias =
    "NEUTRAL";

  if (score >= 60) {
    bias =
      "BULLISH";
  } else if (score <= 40) {
    bias =
      "BEARISH";
  }

  const confidence =
    Math.min(
      100,
      Math.round(
        Math.abs(
          score - 50
        ) * 2
      )
    );

  return {
    score,

    bias,

    confidence,

    articleCount:
      articles.length,

    articles,
  };
}