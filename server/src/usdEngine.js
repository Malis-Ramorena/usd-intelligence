/*
|--------------------------------------------------------------------------
| USD FUNDAMENTAL ENGINE
|--------------------------------------------------------------------------
|
| Multi-factor USD fundamental scoring engine.
|
| Score:
|   0   = strongly bearish USD
|   50  = neutral
|   100 = strongly bullish USD
|
| IMPORTANT:
| This is a quantitative research model, not a guaranteed trading signal.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getValidObservations(observations = []) {
  return observations.filter(
    (item) =>
      item &&
      item.value !== undefined &&
      item.value !== null &&
      item.value !== "."
  );
}

function getLatest(observations = []) {
  const valid = getValidObservations(observations);

  if (valid.length === 0) {
    return null;
  }

  return {
    date: valid[0].date,
    value: Number(valid[0].value),
  };
}

function getPrevious(observations = []) {
  const valid = getValidObservations(observations);

  if (valid.length < 2) {
    return null;
  }

  return {
    date: valid[1].date,
    value: Number(valid[1].value),
  };
}

function getChange(observations = []) {
  const latest = getLatest(observations);
  const previous = getPrevious(observations);

  if (!latest || !previous) {
    return null;
  }

  return latest.value - previous.value;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/*
|--------------------------------------------------------------------------
| GENERIC FACTOR
|--------------------------------------------------------------------------
*/

function createFactor({
  name,
  observations,
  bullishThreshold,
  bearishThreshold,
  bullishScore,
  bearishScore,
  bullishMessage,
  bearishMessage,
  neutralMessage,
}) {
  const latest = getLatest(observations);
  const previous = getPrevious(observations);

  if (!latest || !previous) {
    return {
      name,
      available: false,
      score: 0,
      direction: "neutral",
      latest: null,
      previous: null,
      change: null,
      message: "Insufficient data.",
    };
  }

  const change = latest.value - previous.value;

  let score = 0;
  let direction = "neutral";
  let message = neutralMessage;

  if (change >= bullishThreshold) {
    score = bullishScore;
    direction = "bullish";
    message = bullishMessage;
  } else if (change <= bearishThreshold) {
    score = bearishScore;
    direction = "bearish";
    message = bearishMessage;
  }

  return {
    name,
    available: true,

    latest: latest.value,
    previous: previous.value,

    change: Number(change.toFixed(4)),

    score,

    direction,

    message,
  };
}

/*
|--------------------------------------------------------------------------
| TREASURY YIELDS
|--------------------------------------------------------------------------
*/

function analyzeTreasury(observations, name) {
  const latest = getLatest(observations);
  const previous = getPrevious(observations);

  if (!latest || !previous) {
    return {
      name,
      available: false,
      score: 0,
      direction: "neutral",
      message: "Insufficient Treasury data.",
    };
  }

  const change = latest.value - previous.value;

  let score = 0;
  let direction = "neutral";
  let message = "Treasury yield is relatively stable.";

  if (change >= 0.03) {
    score = 6;
    direction = "bullish";
    message =
      "Treasury yield is rising, which can support USD through higher yield expectations.";
  } else if (change >= 0.01) {
    score = 3;
    direction = "bullish";
    message =
      "Treasury yield is moderately higher.";
  } else if (change <= -0.03) {
    score = -6;
    direction = "bearish";
    message =
      "Treasury yield is falling, reducing yield support for USD.";
  } else if (change <= -0.01) {
    score = -3;
    direction = "bearish";
    message =
      "Treasury yield is moderately lower.";
  }

  return {
    name,
    available: true,

    latest: latest.value,
    previous: previous.value,

    change: Number(change.toFixed(4)),

    score,

    direction,

    message,
  };
}

/*
|--------------------------------------------------------------------------
| INFLATION
|--------------------------------------------------------------------------
|
| Higher inflation can be USD-positive when it increases expectations
| that the Federal Reserve will maintain restrictive policy.
|
|--------------------------------------------------------------------------
*/

function analyzeInflation(observations, name) {
  const latest = getLatest(observations);
  const previous = getPrevious(observations);

  if (!latest || !previous) {
    return {
      name,
      available: false,
      score: 0,
      direction: "neutral",
      message: "Insufficient inflation data.",
    };
  }

  const change = latest.value - previous.value;

  let score = 0;
  let direction = "neutral";
  let message =
    "Inflation reading is relatively stable.";

  /*
  |--------------------------------------------------------------------------
  | Important:
  | This is a preliminary model.
  | Later we will compare ACTUAL vs FORECAST vs PREVIOUS.
  |--------------------------------------------------------------------------
  */

  if (change > 0) {
    score = 5;
    direction = "bullish";

    message =
      "Inflation is increasing, potentially keeping US monetary policy restrictive.";
  } else if (change < 0) {
    score = -5;
    direction = "bearish";

    message =
      "Inflation is declining, potentially reducing pressure for restrictive US monetary policy.";
  }

  return {
    name,
    available: true,

    latest: latest.value,
    previous: previous.value,

    change: Number(change.toFixed(6)),

    score,

    direction,

    message,
  };
}

/*
|--------------------------------------------------------------------------
| EMPLOYMENT
|--------------------------------------------------------------------------
*/

function analyzeEmployment(observations) {
  const latest = getLatest(observations);
  const previous = getPrevious(observations);

  if (!latest || !previous) {
    return {
      name: "Unemployment",
      available: false,
      score: 0,
      direction: "neutral",
      message: "Insufficient employment data.",
    };
  }

  const change = latest.value - previous.value;

  let score = 0;
  let direction = "neutral";
  let message =
    "Unemployment is relatively stable.";

  /*
  |--------------------------------------------------------------------------
  | Lower unemployment = stronger labour market
  |--------------------------------------------------------------------------
  */

  if (change <= -0.1) {
    score = 7;
    direction = "bullish";

    message =
      "Unemployment is falling, indicating stronger labour-market conditions.";
  } else if (change >= 0.1) {
    score = -7;
    direction = "bearish";

    message =
      "Unemployment is rising, indicating weaker labour-market conditions.";
  }

  return {
    name: "Unemployment",

    available: true,

    latest: latest.value,
    previous: previous.value,

    change: Number(change.toFixed(3)),

    score,

    direction,

    message,
  };
}

/*
|--------------------------------------------------------------------------
| GROWTH
|--------------------------------------------------------------------------
*/

function analyzeGrowth(observations, name) {
  const latest = getLatest(observations);
  const previous = getPrevious(observations);

  if (!latest || !previous) {
    return {
      name,
      available: false,
      score: 0,
      direction: "neutral",
      message: "Insufficient growth data.",
    };
  }

  const change = latest.value - previous.value;

  let score = 0;
  let direction = "neutral";
  let message =
    "Growth data is relatively stable.";

  if (change > 0) {
    score = 5;
    direction = "bullish";

    message =
      "Economic growth is increasing, supporting USD fundamentals.";
  } else if (change < 0) {
    score = -5;
    direction = "bearish";

    message =
      "Economic growth is weakening, creating negative USD pressure.";
  }

  return {
    name,

    available: true,

    latest: latest.value,
    previous: previous.value,

    change: Number(change.toFixed(4)),

    score,

    direction,

    message,
  };
}

/*
|--------------------------------------------------------------------------
| RETAIL SALES
|--------------------------------------------------------------------------
*/

function analyzeRetailSales(observations) {
  const latest = getLatest(observations);
  const previous = getPrevious(observations);

  if (!latest || !previous) {
    return {
      name: "Retail Sales",
      available: false,
      score: 0,
      direction: "neutral",
      message: "Insufficient retail-sales data.",
    };
  }

  const change = latest.value - previous.value;

  let score = 0;
  let direction = "neutral";

  if (change > 0) {
    score = 4;
    direction = "bullish";
  } else if (change < 0) {
    score = -4;
    direction = "bearish";
  }

  return {
    name: "Retail Sales",

    available: true,

    latest: latest.value,
    previous: previous.value,

    change: Number(change.toFixed(4)),

    score,

    direction,

    message:
      direction === "bullish"
        ? "Retail activity is strengthening."
        : direction === "bearish"
        ? "Retail activity is weakening."
        : "Retail activity is stable.",
  };
}

/*
|--------------------------------------------------------------------------
| INDUSTRIAL PRODUCTION
|--------------------------------------------------------------------------
*/

function analyzeIndustrialProduction(observations) {
  const latest = getLatest(observations);
  const previous = getPrevious(observations);

  if (!latest || !previous) {
    return {
      name: "Industrial Production",
      available: false,
      score: 0,
      direction: "neutral",
      message: "Insufficient industrial-production data.",
    };
  }

  const change = latest.value - previous.value;

  let score = 0;
  let direction = "neutral";

  if (change > 0) {
    score = 4;
    direction = "bullish";
  } else if (change < 0) {
    score = -4;
    direction = "bearish";
  }

  return {
    name: "Industrial Production",

    available: true,

    latest: latest.value,
    previous: previous.value,

    change: Number(change.toFixed(4)),

    score,

    direction,

    message:
      direction === "bullish"
        ? "Industrial activity is improving."
        : direction === "bearish"
        ? "Industrial activity is weakening."
        : "Industrial activity is stable.",
  };
}

/*
|--------------------------------------------------------------------------
| VIX / RISK SENTIMENT
|--------------------------------------------------------------------------
|
| Higher VIX can create demand for safe-haven USD.
|
|--------------------------------------------------------------------------
*/

function analyzeVIX(observations) {
  const latest = getLatest(observations);
  const previous = getPrevious(observations);

  if (!latest || !previous) {
    return {
      name: "VIX",
      available: false,
      score: 0,
      direction: "neutral",
      message: "Insufficient VIX data.",
    };
  }

  const change = latest.value - previous.value;

  let score = 0;
  let direction = "neutral";
  let message = "Risk sentiment is relatively stable.";

  if (change >= 1) {
    score = 4;
    direction = "bullish";

    message =
      "Risk aversion is increasing, potentially supporting safe-haven USD demand.";
  } else if (change <= -1) {
    score = -3;
    direction = "bearish";

    message =
      "Risk appetite is increasing, potentially reducing safe-haven USD demand.";
  }

  return {
    name: "VIX",

    available: true,

    latest: latest.value,
    previous: previous.value,

    change: Number(change.toFixed(4)),

    score,

    direction,

    message,
  };
}

/*
|--------------------------------------------------------------------------
| FED POLICY
|--------------------------------------------------------------------------
*/

function analyzeFedFunds(observations) {
  const latest = getLatest(observations);
  const previous = getPrevious(observations);

  if (!latest || !previous) {
    return {
      name: "Federal Funds Rate",
      available: false,
      score: 0,
      direction: "neutral",
      message: "Insufficient Fed Funds data.",
    };
  }

  const change = latest.value - previous.value;

  let score = 0;
  let direction = "neutral";
  let message =
    "Federal Funds Rate is unchanged.";

  if (change > 0) {
    score = 8;
    direction = "bullish";

    message =
      "Federal Funds Rate increased, indicating tighter monetary policy.";
  } else if (change < 0) {
    score = -8;
    direction = "bearish";

    message =
      "Federal Funds Rate decreased, indicating easier monetary policy.";
  }

  return {
    name: "Federal Funds Rate",

    available: true,

    latest: latest.value,
    previous: previous.value,

    change: Number(change.toFixed(4)),

    score,

    direction,

    message,
  };
}

/*
|--------------------------------------------------------------------------
| MAIN USD ANALYSIS
|--------------------------------------------------------------------------
*/

export function analyzeUSD(data) {
  /*
  |--------------------------------------------------------------------------
  | INDIVIDUAL FACTORS
  |--------------------------------------------------------------------------
  */

  const factors = {};

  factors.fedFunds = analyzeFedFunds(
    data.fedFunds || []
  );

  factors.treasury2Y = analyzeTreasury(
    data.treasury2Y || [],
    "2-Year Treasury"
  );

  factors.treasury5Y = analyzeTreasury(
    data.treasury5Y || [],
    "5-Year Treasury"
  );

  factors.treasury10Y = analyzeTreasury(
    data.treasury10Y || [],
    "10-Year Treasury"
  );

  factors.treasury30Y = analyzeTreasury(
    data.treasury30Y || [],
    "30-Year Treasury"
  );

  factors.cpi = analyzeInflation(
    data.cpi || [],
    "CPI"
  );

  factors.coreCpi = analyzeInflation(
    data.coreCpi || [],
    "Core CPI"
  );

  factors.pce = analyzeInflation(
    data.pce || [],
    "PCE"
  );

  factors.corePce = analyzeInflation(
    data.corePce || [],
    "Core PCE"
  );

  factors.unemployment = analyzeEmployment(
    data.unemployment || []
  );

  factors.gdp = analyzeGrowth(
    data.gdp || [],
    "GDP"
  );

  factors.retailSales = analyzeRetailSales(
    data.retailSales || []
  );

  factors.industrialProduction =
    analyzeIndustrialProduction(
      data.industrialProduction || []
    );

  factors.vix = analyzeVIX(
    data.vix || []
  );

  /*
  |--------------------------------------------------------------------------
  | TOTAL SCORE
  |--------------------------------------------------------------------------
  |
  | Start from neutral = 50.
  |
  |--------------------------------------------------------------------------
  */

  let totalScore = 50;

  for (const factor of Object.values(factors)) {
    totalScore += factor.score;
  }

  /*
  |--------------------------------------------------------------------------
  | CLAMP
  |--------------------------------------------------------------------------
  */

  totalScore = clamp(
    totalScore,
    0,
    100
  );

  /*
  |--------------------------------------------------------------------------
  | BIAS
  |--------------------------------------------------------------------------
  */

  let bias = "NEUTRAL";

  if (totalScore >= 65) {
    bias = "BULLISH";
  } else if (totalScore <= 35) {
    bias = "BEARISH";
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIDENCE
  |--------------------------------------------------------------------------
  */

  const distanceFromNeutral =
    Math.abs(totalScore - 50);

  const confidence = clamp(
    Math.round(distanceFromNeutral * 2),
    0,
    100
  );

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE FACTORS
  |--------------------------------------------------------------------------
  */

  const availableFactors = Object.values(
    factors
  ).filter(
    (factor) => factor.available
  ).length;

  /*
  |--------------------------------------------------------------------------
  | TOTAL FACTORS
  |--------------------------------------------------------------------------
  */

  const totalFactors =
    Object.keys(factors).length;

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  let summary =
    "USD fundamentals are currently balanced.";

  if (bias === "BULLISH") {
    summary =
      "The current combination of US macroeconomic factors is creating a bullish USD environment.";
  }

  if (bias === "BEARISH") {
    summary =
      "The current combination of US macroeconomic factors is creating a bearish USD environment.";
  }

  /*
  |--------------------------------------------------------------------------
  | FINAL RESULT
  |--------------------------------------------------------------------------
  */

  return {
    score: totalScore,

    bias,

    confidence,

    summary,

    dataQuality: {
      availableFactors,
      totalFactors,

      percentage:
        totalFactors === 0
          ? 0
          : Math.round(
              (availableFactors /
                totalFactors) *
                100
            ),
    },

    factors,

    timestamp:
      new Date().toISOString(),
  };
}