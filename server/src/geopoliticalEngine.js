/*
|--------------------------------------------------------------------------
| USD GEOPOLITICAL INTELLIGENCE ENGINE
|--------------------------------------------------------------------------
|
| Evaluates geopolitical events through multiple USD channels:
|
| 1. Safe-haven demand
| 2. US inflation
| 3. US economic growth
| 4. Federal Reserve policy expectations
| 5. Treasury yields
| 6. Global risk sentiment
| 7. Energy / oil
| 8. Trade / tariffs
| 9. Sanctions
| 10. Supply chains
| 11. Global financial system
| 12. Diplomacy / de-escalation
| 13. US political risk
| 14. Strategic regions
|
|--------------------------------------------------------------------------
*/

const CATEGORIES = {
  WAR: "war",
  TRADE: "trade",
  SANCTIONS: "sanctions",
  ENERGY: "energy",
  POLITICS: "politics",
  CENTRAL_BANK: "central-bank",
  RISK: "risk",
  DIPLOMACY: "diplomacy",
  SUPPLY_CHAIN: "supply-chain",
  FINANCIAL: "financial",
  OTHER: "other",
};

/*
|--------------------------------------------------------------------------
| KEYWORDS
|--------------------------------------------------------------------------
*/

const KEYWORDS = {
  war: [
    "war",
    "military",
    "invasion",
    "missile",
    "missiles",
    "airstrike",
    "air strikes",
    "attack",
    "attacks",
    "conflict",
    "troops",
    "bombing",
    "bomb",
    "ceasefire",
    "escalation",
    "escalate",
    "escalating",
    "armed conflict",
    "military operation",
    "offensive",
    "battle",
    "combat",
    "drone strike",
    "drone attack",
  ],

  trade: [
    "tariff",
    "tariffs",
    "trade war",
    "trade dispute",
    "trade restriction",
    "export restriction",
    "import restriction",
    "export controls",
    "import controls",
    "trade agreement",
    "trade deal",
    "trade negotiations",
    "trade negotiations",
    "trade sanctions",
    "customs duty",
    "duties",
    "retaliatory tariffs",
    "tariff increase",
    "tariff reduction",
  ],

  sanctions: [
    "sanction",
    "sanctions",
    "sanctioned",
    "embargo",
    "asset freeze",
    "financial restrictions",
    "export controls",
    "capital controls",
    "bank restrictions",
    "payment restrictions",
    "blocked assets",
    "frozen assets",
    "economic sanctions",
  ],

  energy: [
    "oil",
    "crude",
    "brent",
    "wti",
    "energy",
    "gas",
    "natural gas",
    "lng",
    "opec",
    "opec+",
    "supply disruption",
    "oil supply",
    "energy crisis",
    "oil production",
    "oil exports",
    "fuel prices",
    "energy prices",
    "pipeline",
    "refinery",
  ],

  politics: [
    "president",
    "presidential",
    "election",
    "elections",
    "congress",
    "senate",
    "house of representatives",
    "government shutdown",
    "white house",
    "administration",
    "political crisis",
    "political uncertainty",
    "impeachment",
    "government crisis",
    "fiscal policy",
    "debt ceiling",
    "government funding",
  ],

  centralBank: [
    "federal reserve",
    "fed",
    "fomc",
    "ecb",
    "bank of england",
    "bank of japan",
    "pboc",
    "central bank",
    "interest rate",
    "interest rates",
    "rate cut",
    "rate cuts",
    "rate hike",
    "rate hikes",
    "monetary policy",
    "hawkish",
    "dovish",
    "quantitative easing",
    "quantitative tightening",
  ],

  supplyChain: [
    "supply chain",
    "shipping",
    "shipping disruption",
    "strait",
    "strait of hormuz",
    "red sea",
    "suez canal",
    "panama canal",
    "canal disruption",
    "port closure",
    "port closures",
    "production disruption",
    "shortage",
    "shortages",
    "shipping delays",
    "transport disruption",
    "factory shutdown",
    "production halt",
  ],

  risk: [
    "risk-off",
    "risk off",
    "risk aversion",
    "market panic",
    "financial stress",
    "market stress",
    "volatility",
    "global uncertainty",
    "investor concern",
    "safe haven",
    "safe-haven",
    "market turmoil",
    "financial turmoil",
    "crisis",
    "global crisis",
    "uncertainty",
    "fear",
    "panic",
  ],

  financial: [
    "banking crisis",
    "bank failure",
    "bank failures",
    "financial crisis",
    "credit crisis",
    "credit stress",
    "liquidity crisis",
    "liquidity stress",
    "default",
    "sovereign default",
    "debt crisis",
    "capital flight",
    "market selloff",
    "stock market crash",
  ],

  positiveDiplomacy: [
    "peace agreement",
    "peace deal",
    "ceasefire",
    "truce",
    "de-escalation",
    "deescalation",
    "diplomatic agreement",
    "agreement reached",
    "tensions ease",
    "tensions eased",
    "tensions reduce",
    "tensions reduced",
    "peace talks",
    "diplomatic breakthrough",
    "deal reached",
    "negotiated settlement",
  ],

  negativeDiplomacy: [
    "talks collapse",
    "talks failed",
    "negotiations collapse",
    "negotiations failed",
    "diplomatic failure",
    "diplomatic tensions",
    "relations deteriorate",
    "relations worsened",
    "tensions rise",
    "tensions increase",
    "tensions escalate",
  ],
};

/*
|--------------------------------------------------------------------------
| POSITIVE / NEGATIVE USD LANGUAGE
|--------------------------------------------------------------------------
*/

const USD_LANGUAGE = {
  positive: [
    "strong dollar",
    "dollar strength",
    "usd strength",
    "dollar rises",
    "dollar rose",
    "dollar gains",
    "dollar gained",
    "dollar rally",
    "usd gains",
    "higher yields",
    "hawkish fed",
    "hawkish federal reserve",
    "higher interest rates",
    "rate hike",
  ],

  negative: [
    "weak dollar",
    "dollar weakness",
    "usd weakness",
    "dollar falls",
    "dollar fell",
    "dollar declines",
    "dollar losses",
    "usd falls",
    "lower yields",
    "dovish fed",
    "dovish federal reserve",
    "rate cut",
    "lower interest rates",
  ],
};

/*
|--------------------------------------------------------------------------
| COUNTRY / REGION DETECTION
|--------------------------------------------------------------------------
*/

const REGIONS = {
  unitedStates: [
    "united states",
    "u.s.",
    "us ",
    "u.s ",
    "america",
    "american",
    "washington",
    "white house",
    "congress",
    "senate",
  ],

  china: [
    "china",
    "chinese",
    "beijing",
    "taiwan",
    "taiwanese",
    "south china sea",
  ],

  russia: [
    "russia",
    "russian",
    "moscow",
    "ukraine",
    "ukrainian",
    "crimea",
  ],

  middleEast: [
    "iran",
    "iranian",
    "israel",
    "israeli",
    "gaza",
    "palestine",
    "palestinian",
    "lebanon",
    "syria",
    "iraq",
    "yemen",
    "houthi",
    "saudi arabia",
    "qatar",
    "oman",
    "jordan",
    "iraq",
    "persian gulf",
    "gulf states",
  ],

  europe: [
    "europe",
    "european union",
    "eu ",
    "germany",
    "france",
    "italy",
    "spain",
    "eurozone",
    "euro area",
    "uk",
    "united kingdom",
    "britain",
  ],

  asia: [
    "japan",
    "korea",
    "south korea",
    "north korea",
    "india",
    "asia",
    "southeast asia",
  ],

  africa: [
    "africa",
    "south africa",
    "egypt",
    "nigeria",
    "libya",
    "sudan",
  ],

  latinAmerica: [
    "latin america",
    "brazil",
    "mexico",
    "argentina",
    "venezuela",
    "colombia",
  ],

  global: [
    "global",
    "worldwide",
    "international",
    "global markets",
    "world markets",
  ],
};

/*
|--------------------------------------------------------------------------
| TEXT HELPERS
|--------------------------------------------------------------------------
*/

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text, words) {
  return words.some((word) =>
    text.includes(
      word.toLowerCase()
    )
  );
}

function countMatches(text, words) {
  return words.filter((word) =>
    text.includes(
      word.toLowerCase()
    )
  ).length;
}

/*
|--------------------------------------------------------------------------
| DETECT CATEGORY
|--------------------------------------------------------------------------
*/

function detectCategory(text) {
  const scores = {
    [CATEGORIES.WAR]:
      countMatches(
        text,
        KEYWORDS.war
      ),

    [CATEGORIES.TRADE]:
      countMatches(
        text,
        KEYWORDS.trade
      ),

    [CATEGORIES.SANCTIONS]:
      countMatches(
        text,
        KEYWORDS.sanctions
      ),

    [CATEGORIES.ENERGY]:
      countMatches(
        text,
        KEYWORDS.energy
      ),

    [CATEGORIES.POLITICS]:
      countMatches(
        text,
        KEYWORDS.politics
      ),

    [CATEGORIES.CENTRAL_BANK]:
      countMatches(
        text,
        KEYWORDS.centralBank
      ),

    [CATEGORIES.SUPPLY_CHAIN]:
      countMatches(
        text,
        KEYWORDS.supplyChain
      ),

    [CATEGORIES.RISK]:
      countMatches(
        text,
        KEYWORDS.risk
      ),

    [CATEGORIES.FINANCIAL]:
      countMatches(
        text,
        KEYWORDS.financial
      ),
  };

  let category =
    CATEGORIES.OTHER;

  let highest = 0;

  for (
    const [name, score]
    of Object.entries(scores)
  ) {
    if (score > highest) {
      highest = score;
      category = name;
    }
  }

  return {
    category,
    scores,
  };
}

/*
|--------------------------------------------------------------------------
| DETECT REGION
|--------------------------------------------------------------------------
*/

function detectRegions(text) {
  const regions = [];

  for (
    const [region, words]
    of Object.entries(REGIONS)
  ) {
    if (
      containsAny(
        text,
        words
      )
    ) {
      regions.push(region);
    }
  }

  return regions;
}

/*
|--------------------------------------------------------------------------
| DETECT SENTIMENT
|--------------------------------------------------------------------------
*/

function detectEventSentiment(text) {
  const positive =
    countMatches(
      text,
      USD_LANGUAGE.positive
    );

  const negative =
    countMatches(
      text,
      USD_LANGUAGE.negative
    );

  if (positive > negative) {
    return {
      sentiment: "POSITIVE",
      score: Math.min(
        20,
        positive * 5
      ),
    };
  }

  if (negative > positive) {
    return {
      sentiment: "NEGATIVE",
      score: -Math.min(
        20,
        negative * 5
      ),
    };
  }

  return {
    sentiment: "NEUTRAL",
    score: 0,
  };
}

/*
|--------------------------------------------------------------------------
| SAFE-HAVEN EFFECT
|--------------------------------------------------------------------------
*/

function calculateSafeHavenImpact(
  text,
  category
) {
  let score = 0;

  if (
    category ===
    CATEGORIES.WAR
  ) {
    score += 15;
  }

  if (
    category ===
    CATEGORIES.FINANCIAL
  ) {
    score += 15;
  }

  if (
    category ===
    CATEGORIES.SANCTIONS
  ) {
    score += 8;
  }

  if (
    category ===
    CATEGORIES.RISK
  ) {
    score += 15;
  }

  if (
    containsAny(
      text,
      KEYWORDS.positiveDiplomacy
    )
  ) {
    score -= 10;
  }

  if (
    containsAny(
      text,
      KEYWORDS.negativeDiplomacy
    )
  ) {
    score += 8;
  }

  return score;
}

/*
|--------------------------------------------------------------------------
| INFLATION IMPACT
|--------------------------------------------------------------------------
*/

function calculateInflationImpact(text) {
  let score = 0;

  if (
    containsAny(
      text,
      KEYWORDS.energy
    )
  ) {
    score += 10;
  }

  if (
    containsAny(
      text,
      KEYWORDS.supplyChain
    )
  ) {
    score += 8;
  }

  if (
    containsAny(
      text,
      [
        "food prices",
        "commodity prices",
        "higher commodity prices",
        "higher oil prices",
        "higher energy prices",
      ]
    )
  ) {
    score += 8;
  }

  if (
    containsAny(
      text,
      KEYWORDS.positiveDiplomacy
    )
  ) {
    score -= 5;
  }

  return score;
}

/*
|--------------------------------------------------------------------------
| US GROWTH IMPACT
|--------------------------------------------------------------------------
*/

function calculateGrowthImpact(
  text,
  category
) {
  let score = 0;

  if (
    category ===
    CATEGORIES.TRADE
  ) {
    score -= 8;
  }

  if (
    category ===
    CATEGORIES.WAR
  ) {
    score -= 5;
  }

  if (
    category ===
    CATEGORIES.FINANCIAL
  ) {
    score -= 12;
  }

  if (
    containsAny(
      text,
      KEYWORDS.supplyChain
    )
  ) {
    score -= 8;
  }

  if (
    containsAny(
      text,
      [
        "economic growth",
        "strong growth",
        "economic expansion",
        "business confidence",
      ]
    )
  ) {
    score += 8;
  }

  if (
    containsAny(
      text,
      KEYWORDS.positiveDiplomacy
    )
  ) {
    score += 5;
  }

  return score;
}

/*
|--------------------------------------------------------------------------
| TRADE IMPACT
|--------------------------------------------------------------------------
*/

function calculateTradeImpact(text) {
  let score = 0;

  if (
    containsAny(
      text,
      [
        "tariff increase",
        "tariffs increase",
        "higher tariffs",
        "new tariffs",
        "retaliatory tariffs",
      ]
    )
  ) {
    score += 5;
  }

  if (
    containsAny(
      text,
      [
        "trade agreement",
        "trade deal",
        "trade agreement reached",
        "trade deal reached",
      ]
    )
  ) {
    score += 4;
  }

  if (
    containsAny(
      text,
      [
        "trade war",
        "trade dispute",
      ]
    )
  ) {
    score -= 4;
  }

  return score;
}

/*
|--------------------------------------------------------------------------
| FED POLICY IMPACT
|--------------------------------------------------------------------------
*/

function calculateFedImpact(
  inflationImpact,
  growthImpact
) {
  /*
  Higher inflation can increase expectations
  for tighter Fed policy.
  */

  let score =
    inflationImpact * 0.8;

  /*
  Weak growth can increase expectations
  for easier Fed policy.
  */

  score +=
    growthImpact * 0.8;

  return Math.round(
    score
  );
}

/*
|--------------------------------------------------------------------------
| TREASURY YIELD IMPACT
|--------------------------------------------------------------------------
*/

function calculateYieldImpact(
  safeHaven,
  inflation,
  fed
) {
  return Math.round(
    safeHaven * 0.25 +
    inflation * 0.45 +
    fed * 0.35
  );
}

/*
|--------------------------------------------------------------------------
| GLOBAL RISK IMPACT
|--------------------------------------------------------------------------
*/

function calculateRiskImpact(
  text,
  category
) {
  let score = 0;

  if (
    category ===
    CATEGORIES.WAR
  ) {
    score += 15;
  }

  if (
    category ===
    CATEGORIES.FINANCIAL
  ) {
    score += 15;
  }

  if (
    category ===
    CATEGORIES.RISK
  ) {
    score += 15;
  }

  if (
    containsAny(
      text,
      KEYWORDS.positiveDiplomacy
    )
  ) {
    score -= 10;
  }

  return score;
}

/*
|--------------------------------------------------------------------------
| SANCTIONS IMPACT
|--------------------------------------------------------------------------
*/

function calculateSanctionsImpact(
  text
) {
  let score = 0;

  if (
    containsAny(
      text,
      KEYWORDS.sanctions
    )
  ) {
    score += 8;
  }

  if (
    containsAny(
      text,
      [
        "secondary sanctions",
        "financial sanctions",
        "bank sanctions",
        "dollar sanctions",
        "usd sanctions",
      ]
    )
  ) {
    score += 8;
  }

  return score;
}

/*
|--------------------------------------------------------------------------
| FINAL USD IMPACT
|--------------------------------------------------------------------------
*/

function calculateUSDImpact({
  safeHaven,
  inflation,
  growth,
  fed,
  yields,
  risk,
  trade,
  sanctions,
  sentiment,
}) {
  /*
  IMPORTANT:
  This is a preliminary model.

  Positive values = supportive for USD.
  Negative values = negative for USD.
  */

  return Math.round(
    safeHaven * 0.22 +
    inflation * 0.14 +
    growth * 0.16 +
    fed * 0.18 +
    yields * 0.12 +
    risk * 0.08 +
    trade * 0.04 +
    sanctions * 0.04 +
    sentiment * 0.02
  );
}

/*
|--------------------------------------------------------------------------
| RECENCY WEIGHT
|--------------------------------------------------------------------------
*/

function calculateRecencyWeight(date) {
  if (!date) {
    return 1;
  }

  const timestamp =
    new Date(date).getTime();

  if (
    Number.isNaN(timestamp)
  ) {
    return 1;
  }

  const ageHours =
    (
      Date.now() -
      timestamp
    ) /
    (1000 * 60 * 60);

  if (ageHours <= 6) {
    return 1.5;
  }

  if (ageHours <= 24) {
    return 1.3;
  }

  if (ageHours <= 72) {
    return 1.1;
  }

  if (ageHours <= 168) {
    return 0.9;
  }

  return 0.7;
}

/*
|--------------------------------------------------------------------------
| SEVERITY
|--------------------------------------------------------------------------
*/

function calculateSeverity({
  category,
  text,
  usdImpact,
}) {
  let severity = 20;

  const categoryWeights = {
    [CATEGORIES.WAR]: 35,
    [CATEGORIES.FINANCIAL]: 35,
    [CATEGORIES.SANCTIONS]: 28,
    [CATEGORIES.ENERGY]: 25,
    [CATEGORIES.TRADE]: 22,
    [CATEGORIES.RISK]: 25,
    [CATEGORIES.POLITICS]: 20,
    [CATEGORIES.CENTRAL_BANK]: 25,
    [CATEGORIES.SUPPLY_CHAIN]: 22,
    [CATEGORIES.DIPLOMACY]: 15,
    [CATEGORIES.OTHER]: 10,
  };

  severity +=
    categoryWeights[
      category
    ] || 10;

  if (
    containsAny(
      text,
      [
        "breaking",
        "emergency",
        "major",
        "historic",
        "critical",
        "severe",
        "massive",
        "immediate",
      ]
    )
  ) {
    severity += 15;
  }

  severity +=
    Math.abs(
      usdImpact
    );

  return Math.min(
    100,
    severity
  );
}

/*
|--------------------------------------------------------------------------
| GENERATE FACTORS
|--------------------------------------------------------------------------
*/

function generateFactors({
  category,
  regions,
  safeHaven,
  inflation,
  growth,
  fed,
  yields,
  risk,
  trade,
  sanctions,
  sentiment,
}) {
  const factors = [];

  if (safeHaven > 0) {
    factors.push(
      "Geopolitical risk may increase safe-haven demand for USD."
    );
  }

  if (inflation > 0) {
    factors.push(
      "The event may increase US/global inflation pressure through energy or supply channels."
    );
  }

  if (growth < 0) {
    factors.push(
      "The event may negatively affect economic growth through trade, supply-chain or financial channels."
    );
  }

  if (fed > 0) {
    factors.push(
      "The event may increase expectations for tighter Federal Reserve policy."
    );
  }

  if (fed < 0) {
    factors.push(
      "The event may increase expectations for easier Federal Reserve policy."
    );
  }

  if (yields > 0) {
    factors.push(
      "The event has a potentially supportive effect on Treasury yields and USD."
    );
  }

  if (risk > 0) {
    factors.push(
      "Global risk conditions are potentially supportive of defensive USD demand."
    );
  }

  if (trade !== 0) {
    factors.push(
      `Trade channel impact detected: ${trade > 0 ? "USD supportive" : "USD negative"}.`
    );
  }

  if (sanctions > 0) {
    factors.push(
      "Sanctions may increase demand for dollar-based financial infrastructure and safe assets."
    );
  }

  if (
    sentiment > 0
  ) {
    factors.push(
      "Explicit USD-positive language was detected."
    );
  }

  if (
    sentiment < 0
  ) {
    factors.push(
      "Explicit USD-negative language was detected."
    );
  }

  if (
    regions.length > 0
  ) {
    factors.push(
      `Regions detected: ${regions.join(", ")}.`
    );
  }

  if (
    factors.length === 0
  ) {
    factors.push(
      "No strong direct USD geopolitical transmission channel was detected."
    );
  }

  return factors;
}

/*
|--------------------------------------------------------------------------
| ANALYZE ONE EVENT
|--------------------------------------------------------------------------
*/

export function analyzeGeopoliticalEvent(
  event = {}
) {
  const title =
    event.title ||
    "";

  const description =
    event.description ||
    event.summary ||
    event.content ||
    "";

  const publishedAt =
    event.publishedAt ||
    event.date ||
    event.published ||
    null;

  const text =
    normalizeText(
      `${title} ${description}`
    );

  const {
    category,
    scores,
  } =
    detectCategory(
      text
    );

  const regions =
    detectRegions(
      text
    );

  const eventSentiment =
    detectEventSentiment(
      text
    );

  const safeHaven =
    calculateSafeHavenImpact(
      text,
      category
    );

  const inflation =
    calculateInflationImpact(
      text
    );

  const growth =
    calculateGrowthImpact(
      text,
      category
    );

  const fed =
    calculateFedImpact(
      inflation,
      growth
    );

  const yields =
    calculateYieldImpact(
      safeHaven,
      inflation,
      fed
    );

  const risk =
    calculateRiskImpact(
      text,
      category
    );

  const trade =
    calculateTradeImpact(
      text
    );

  const sanctions =
    calculateSanctionsImpact(
      text
    );

  const usdImpact =
    calculateUSDImpact({
      safeHaven,
      inflation,
      growth,
      fed,
      yields,
      risk,
      trade,
      sanctions,
      sentiment:
        eventSentiment.score,
    });

  const severity =
    calculateSeverity({
      category,
      text,
      usdImpact,
    });

  let bias =
    "NEUTRAL";

  if (
    usdImpact >= 10
  ) {
    bias =
      "BULLISH";
  } else if (
    usdImpact <= -10
  ) {
    bias =
      "BEARISH";
  }

  const confidence =
    Math.min(
      100,
      Math.round(
        Math.abs(
          usdImpact
        ) * 4
      )
    );

  const factors =
    generateFactors({
      category,
      regions,
      safeHaven,
      inflation,
      growth,
      fed,
      yields,
      risk,
      trade,
      sanctions,
      sentiment:
        eventSentiment.score,
    });

  return {
    title,

    description,

    category,

    categoryScores:
      scores,

    regions,

    sentiment:
      eventSentiment.sentiment,

    impact: {
      safeHaven,

      inflation,

      growth,

      federalReserve:
        fed,

      treasuryYields:
        yields,

      globalRisk:
        risk,

      trade,

      sanctions,

      usd:
        usdImpact,
    },

    bias,

    confidence,

    severity,

    factors,

    recencyWeight:
      calculateRecencyWeight(
        publishedAt
      ),

    publishedAt,

    source:
      event.source ||
      null,

    link:
      event.link ||
      event.url ||
      null,
  };
}

/*
|--------------------------------------------------------------------------
| ANALYZE MULTIPLE EVENTS
|--------------------------------------------------------------------------
*/

export function analyzeGeopoliticalEvents(
  events = []
) {
  if (
    !Array.isArray(events)
  ) {
    events = [];
  }

  const results =
    events.map(
      (event) =>
        analyzeGeopoliticalEvent(
          event
        )
    );

  let total = 0;

  let weight = 0;

  for (
    const event
    of results
  ) {
    const severityWeight =
      Math.max(
        1,
        event.severity / 20
      );

    const recencyWeight =
      event.recencyWeight ||
      1;

    const eventWeight =
      severityWeight *
      recencyWeight;

    total +=
      event.impact.usd *
      eventWeight;

    weight +=
      eventWeight;
  }

  const average =
    weight > 0
      ? total / weight
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Convert geopolitical impact into 0-100 score
  |--------------------------------------------------------------------------
  */

  const score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          50 +
          average * 2
        )
      )
    );

  let bias =
    "NEUTRAL";

  if (
    score >= 65
  ) {
    bias =
      "BULLISH";
  } else if (
    score <= 35
  ) {
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

  /*
  |--------------------------------------------------------------------------
  | ACTION
  |--------------------------------------------------------------------------
  */

  let action =
    "WAIT";

  if (
    score >= 65
  ) {
    action =
      "BUY USD";
  } else if (
    score <= 35
  ) {
    action =
      "SELL USD";
  }

  /*
  |--------------------------------------------------------------------------
  | TOP EVENTS
  |--------------------------------------------------------------------------
  */

  const topEvents =
    [...results]
      .sort(
        (a, b) =>
          Math.abs(
            b.impact.usd
          ) -
          Math.abs(
            a.impact.usd
          )
      )
      .slice(0, 10);

  /*
  |--------------------------------------------------------------------------
  | AGGREGATE FACTORS
  |--------------------------------------------------------------------------
  */

  const factors = [];

  for (
    const event
    of topEvents
  ) {
    for (
      const factor
      of event.factors
    ) {
      if (
        !factors.includes(
          factor
        )
      ) {
        factors.push(
          factor
        );
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY SUMMARY
  |--------------------------------------------------------------------------
  */

  const categorySummary = {};

  for (
    const event
    of results
  ) {
    if (
      !categorySummary[
        event.category
      ]
    ) {
      categorySummary[
        event.category
      ] = {
        count: 0,
        totalImpact: 0,
      };
    }

    categorySummary[
      event.category
    ].count += 1;

    categorySummary[
      event.category
    ].totalImpact +=
      event.impact.usd;
  }

  /*
  |--------------------------------------------------------------------------
  | FINAL RESULT
  |--------------------------------------------------------------------------
  */

  return {
    score,

    bias,

    action,

    confidence,

    averageImpact:
      Math.round(
        average * 100
      ) / 100,

    eventCount:
      results.length,

    factors,

    categorySummary,

    topEvents,

    events:
      results,
  };
}

/*
|--------------------------------------------------------------------------
| EXPORT CATEGORIES
|--------------------------------------------------------------------------
*/

export {
  CATEGORIES,
};