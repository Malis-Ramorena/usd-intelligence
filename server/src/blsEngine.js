/*
|--------------------------------------------------------------------------
| BLS DATA ENGINE
|--------------------------------------------------------------------------
|
| Free official US Bureau of Labor Statistics data.
|
| No paid API required.
|
|--------------------------------------------------------------------------
*/

const BLS_BASE =
  "https://api.bls.gov/publicAPI/v2/timeseries/data";

/*
|--------------------------------------------------------------------------
| IMPORTANT BLS SERIES
|--------------------------------------------------------------------------
*/

const BLS_SERIES = {
  nfp: {
    id: "CES0000000001",
    name: "Nonfarm Payrolls",
    unit: "thousands",
  },

  unemployment: {
    id: "LNS14000000",
    name: "Unemployment Rate",
    unit: "percent",
  },

  laborForceParticipation: {
    id: "LNS11300000",
    name: "Labor Force Participation Rate",
    unit: "percent",
  },

  cpi: {
    id: "CUUR0000SA0",
    name: "Consumer Price Index",
    unit: "index",
  },

  coreCpi: {
    id: "CUSR0000SA0L1E",
    name: "Core CPI",
    unit: "index",
  },

  averageHourlyEarnings: {
    id: "CES0500000003",
    name: "Average Hourly Earnings",
    unit: "dollars",
  },

  totalEmployment: {
    id: "CES0000000001",
    name: "Total Nonfarm Employment",
    unit: "thousands",
  },
};

/*
|--------------------------------------------------------------------------
| GET BLS SERIES
|--------------------------------------------------------------------------
*/

export async function getBLSData(
  seriesId,
  startYear,
  endYear
) {
  const response = await fetch(
    BLS_BASE,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        seriesid: [seriesId],

        startyear:
          String(startYear),

        endyear:
          String(endYear),
      }),
    }
  );

  if (!response.ok) {
    const error =
      await response.text();

    throw new Error(
      `BLS request failed: ${response.status} - ${error}`
    );
  }

  const data =
    await response.json();

  if (
    data.status !==
    "REQUEST_SUCCEEDED"
  ) {
    throw new Error(
      `BLS API error: ${
        data.message?.join(" ") ||
        "Unknown error"
      }`
    );
  }

  const series =
    data.Results?.series?.[0];

  return series?.data || [];
}

/*
|--------------------------------------------------------------------------
| GET LATEST OBSERVATIONS
|--------------------------------------------------------------------------
*/

export async function getLatestBLS(
  seriesId,
  count = 12
) {
  const currentYear =
    new Date().getFullYear();

  const data =
    await getBLSData(
      seriesId,
      currentYear - 2,
      currentYear
    );

  return data
    .filter(
      (item) =>
        item.value !== undefined
    )
    .slice(0, count)
    .map((item) => ({
      year: item.year,

      period: item.period,

      periodName:
        item.periodName,

      value:
        Number(item.value),

      footnotes:
        item.footnotes || [],
    }));
}

/*
|--------------------------------------------------------------------------
| COLLECT ALL BLS DATA
|--------------------------------------------------------------------------
*/

export async function collectBLSData() {
  const results = {};

  for (
    const [
      name,
      config
    ] of Object.entries(
      BLS_SERIES
    )
  ) {
    try {
      console.log(
        `BLS: collecting ${config.name}...`
      );

      const observations =
        await getLatestBLS(
          config.id,
          12
        );

      results[name] = {
        seriesId:
          config.id,

        name:
          config.name,

        unit:
          config.unit,

        observations,
      };
    } catch (error) {
      console.error(
        `BLS ${name} failed:`,
        error.message
      );

      results[name] = {
        seriesId:
          config.id,

        name:
          config.name,

        unit:
          config.unit,

        observations: [],

        error:
          error.message,
      };
    }
  }

  return results;
}

/*
|--------------------------------------------------------------------------
| ANALYZE BLS DATA
|--------------------------------------------------------------------------
*/

export function analyzeBLS(data) {
  const factors = {};

  /*
  |--------------------------------------------------------------------------
  | NFP
  |--------------------------------------------------------------------------
  */

  if (
    data.nfp?.observations
      ?.length >= 2
  ) {
    const current =
      data.nfp.observations[0];

    const previous =
      data.nfp.observations[1];

    const change =
      current.value -
      previous.value;

    factors.nfp = {
      name:
        "Nonfarm Payrolls",

      current:
        current.value,

      previous:
        previous.value,

      change,

      direction:
        change > 0
          ? "bullish"
          : change < 0
          ? "bearish"
          : "neutral",

      score:
        change > 0
          ? 8
          : change < 0
          ? -8
          : 0,

      message:
        change > 0
          ? "Employment increased."
          : change < 0
          ? "Employment decreased."
          : "Employment was unchanged.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | UNEMPLOYMENT
  |--------------------------------------------------------------------------
  */

  if (
    data.unemployment
      ?.observations
      ?.length >= 2
  ) {
    const current =
      data.unemployment
        .observations[0];

    const previous =
      data.unemployment
        .observations[1];

    const change =
      current.value -
      previous.value;

    factors.unemployment = {
      name:
        "Unemployment Rate",

      current:
        current.value,

      previous:
        previous.value,

      change,

      direction:
        change < 0
          ? "bullish"
          : change > 0
          ? "bearish"
          : "neutral",

      score:
        change < 0
          ? 7
          : change > 0
          ? -7
          : 0,

      message:
        change < 0
          ? "Unemployment is falling."
          : change > 0
          ? "Unemployment is rising."
          : "Unemployment is unchanged.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CPI
  |--------------------------------------------------------------------------
  */

  if (
    data.cpi?.observations
      ?.length >= 2
  ) {
    const current =
      data.cpi.observations[0];

    const previous =
      data.cpi.observations[1];

    const change =
      current.value -
      previous.value;

    factors.cpi = {
      name:
        "Consumer Price Index",

      current:
        current.value,

      previous:
        previous.value,

      change,

      direction:
        change > 0
          ? "bullish"
          : change < 0
          ? "bearish"
          : "neutral",

      score:
        change > 0
          ? 5
          : change < 0
          ? -5
          : 0,

      message:
        change > 0
          ? "Consumer prices increased."
          : change < 0
          ? "Consumer prices decreased."
          : "Consumer prices were stable.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | WAGES
  |--------------------------------------------------------------------------
  */

  if (
    data.averageHourlyEarnings
      ?.observations
      ?.length >= 2
  ) {
    const current =
      data.averageHourlyEarnings
        .observations[0];

    const previous =
      data.averageHourlyEarnings
        .observations[1];

    const change =
      current.value -
      previous.value;

    factors.wages = {
      name:
        "Average Hourly Earnings",

      current:
        current.value,

      previous:
        previous.value,

      change,

      direction:
        change > 0
          ? "bullish"
          : change < 0
          ? "bearish"
          : "neutral",

      score:
        change > 0
          ? 4
          : change < 0
          ? -4
          : 0,

      message:
        change > 0
          ? "Average wages increased."
          : change < 0
          ? "Average wages decreased."
          : "Average wages were stable.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | TOTAL SCORE
  |--------------------------------------------------------------------------
  */

  let score = 50;

  for (
    const factor
    of Object.values(factors)
  ) {
    score +=
      factor.score || 0;
  }

  score = Math.max(
    0,
    Math.min(100, score)
  );

  let bias =
    "NEUTRAL";

  if (score >= 65) {
    bias =
      "BULLISH";
  } else if (score <= 35) {
    bias =
      "BEARISH";
  }

  return {
    score,

    bias,

    factors,

    timestamp:
      new Date().toISOString(),
  };
}