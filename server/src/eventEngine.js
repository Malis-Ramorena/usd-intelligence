/*
|--------------------------------------------------------------------------
| USD EVENT ENGINE
|--------------------------------------------------------------------------
|
| Converts economic releases into USD impact scores.
|
| Score:
|
|   -10 = strongly USD bearish
|   +10 = strongly USD bullish
|
|--------------------------------------------------------------------------
*/

function calculateSurprise(actual, forecast) {
  if (
    actual === null ||
    forecast === null ||
    actual === undefined ||
    forecast === undefined
  ) {
    return null;
  }

  return actual - forecast;
}

/*
|--------------------------------------------------------------------------
| GENERIC EVENT ANALYZER
|--------------------------------------------------------------------------
*/

export function analyzeEvent({
  name,
  actual,
  forecast,
  previous,
  bullishWhenHigher = true,
  importance = 1,
}) {
  const hasActual =
    actual !== null &&
    actual !== undefined &&
    !Number.isNaN(Number(actual));

  const hasForecast =
    forecast !== null &&
    forecast !== undefined &&
    !Number.isNaN(Number(forecast));

  const hasPrevious =
    previous !== null &&
    previous !== undefined &&
    !Number.isNaN(Number(previous));

  if (!hasActual) {
    return {
      name,
      status: "pending",
      score: 0,
      direction: "neutral",
      actual: null,
      forecast: hasForecast
        ? Number(forecast)
        : null,
      previous: hasPrevious
        ? Number(previous)
        : null,
      surprise: null,
      importance,
    };
  }

  let surprise = null;
  let score = 0;
  let direction = "neutral";

  /*
  |--------------------------------------------------------------------------
  | ACTUAL VS FORECAST
  |--------------------------------------------------------------------------
  */

  if (hasForecast) {
    surprise = calculateSurprise(
      Number(actual),
      Number(forecast)
    );

    /*
    |--------------------------------------------------------------------------
    | Positive surprise
    |--------------------------------------------------------------------------
    */

    if (surprise > 0) {
      if (bullishWhenHigher) {
        score = 5;
        direction = "bullish";
      } else {
        score = -5;
        direction = "bearish";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Negative surprise
    |--------------------------------------------------------------------------
    */

    else if (surprise < 0) {
      if (bullishWhenHigher) {
        score = -5;
        direction = "bearish";
      } else {
        score = 5;
        direction = "bullish";
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANCE WEIGHT
  |--------------------------------------------------------------------------
  */

  score *= importance;

  /*
  |--------------------------------------------------------------------------
  | RESULT
  |--------------------------------------------------------------------------
  */

  return {
    name,

    status: "released",

    actual: Number(actual),

    forecast: hasForecast
      ? Number(forecast)
      : null,

    previous: hasPrevious
      ? Number(previous)
      : null,

    surprise:
      surprise === null
        ? null
        : Number(surprise.toFixed(4)),

    score: Number(score.toFixed(2)),

    direction,

    importance,
  };
}

/*
|--------------------------------------------------------------------------
| COMMON USD EVENTS
|--------------------------------------------------------------------------
*/

export function analyzeCommonEvents(events) {
  const results = {};

  /*
  |--------------------------------------------------------------------------
  | NFP
  |--------------------------------------------------------------------------
  */

  if (events.nfp) {
    results.nfp = analyzeEvent({
      name: "Non-Farm Payrolls",

      actual: events.nfp.actual,

      forecast: events.nfp.forecast,

      previous: events.nfp.previous,

      bullishWhenHigher: true,

      importance: 2,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | UNEMPLOYMENT
  |--------------------------------------------------------------------------
  |
  | Lower unemployment = stronger USD.
  |
  |--------------------------------------------------------------------------
  */

  if (events.unemployment) {
    results.unemployment = analyzeEvent({
      name: "Unemployment Rate",

      actual: events.unemployment.actual,

      forecast: events.unemployment.forecast,

      previous: events.unemployment.previous,

      bullishWhenHigher: false,

      importance: 2,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | CPI
  |--------------------------------------------------------------------------
  */

  if (events.cpi) {
    results.cpi = analyzeEvent({
      name: "Consumer Price Index",

      actual: events.cpi.actual,

      forecast: events.cpi.forecast,

      previous: events.cpi.previous,

      bullishWhenHigher: true,

      importance: 2,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | CORE CPI
  |--------------------------------------------------------------------------
  */

  if (events.coreCpi) {
    results.coreCpi = analyzeEvent({
      name: "Core CPI",

      actual: events.coreCpi.actual,

      forecast: events.coreCpi.forecast,

      previous: events.coreCpi.previous,

      bullishWhenHigher: true,

      importance: 2,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | PCE
  |--------------------------------------------------------------------------
  */

  if (events.pce) {
    results.pce = analyzeEvent({
      name: "PCE Inflation",

      actual: events.pce.actual,

      forecast: events.pce.forecast,

      previous: events.pce.previous,

      bullishWhenHigher: true,

      importance: 2,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | GDP
  |--------------------------------------------------------------------------
  */

  if (events.gdp) {
    results.gdp = analyzeEvent({
      name: "GDP",

      actual: events.gdp.actual,

      forecast: events.gdp.forecast,

      previous: events.gdp.previous,

      bullishWhenHigher: true,

      importance: 2,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | RETAIL SALES
  |--------------------------------------------------------------------------
  */

  if (events.retailSales) {
    results.retailSales = analyzeEvent({
      name: "Retail Sales",

      actual: events.retailSales.actual,

      forecast: events.retailSales.forecast,

      previous: events.retailSales.previous,

      bullishWhenHigher: true,

      importance: 1,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | JOBLESS CLAIMS
  |--------------------------------------------------------------------------
  |
  | Lower claims = stronger employment.
  |
  |--------------------------------------------------------------------------
  */

  if (events.joblessClaims) {
    results.joblessClaims = analyzeEvent({
      name: "Initial Jobless Claims",

      actual: events.joblessClaims.actual,

      forecast: events.joblessClaims.forecast,

      previous: events.joblessClaims.previous,

      bullishWhenHigher: false,

      importance: 1,
    });
  }

  return results;
}

/*
|--------------------------------------------------------------------------
| TOTAL EVENT SCORE
|--------------------------------------------------------------------------
*/

export function calculateEventScore(results) {
  let total = 0;

  for (const result of Object.values(results)) {
    total += result.score || 0;
  }

  return total;
}