import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { analyzeUSD } from "./usdEngine.js";

import {
  analyzeCommonEvents,
  calculateEventScore,
} from "./eventEngine.js";

import {
  collectBLSData,
  analyzeBLS,
} from "./blsEngine.js";

import {
  collectFedData,
} from "./fedEngine.js";

import {
  collectNews,
  analyzeNews,
} from "./newsEngine.js";

import {
  analyzeGeopoliticalEvents,
} from "./geopoliticalEngine.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://Malis-Ramorena.github.io",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an origin
      // such as Postman/server-side requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const PORT =
  process.env.PORT || 3001;

const FRED_API_KEY =
  process.env.FRED_API_KEY;

console.log(
  "Checking FRED API configuration..."
);

if (!FRED_API_KEY) {
  console.error(
    "ERROR: FRED_API_KEY is missing."
  );

  process.exit(1);
}

console.log(
  `FRED API key loaded (${FRED_API_KEY.length} characters)`
);

const FRED_BASE =
  "https://api.stlouisfed.org/fred/series/observations";

/*
|--------------------------------------------------------------------------
| FRED SERIES
|--------------------------------------------------------------------------
*/

const SERIES = {

  fedFunds:
    "FEDFUNDS",

  treasury2Y:
    "DGS2",

  treasury5Y:
    "DGS5",

  treasury10Y:
    "DGS10",

  treasury30Y:
    "DGS30",

  unemployment:
    "UNRATE",

  cpi:
    "CPIAUCSL",

  coreCpi:
    "CPILFESL",

  pce:
    "PCEPI",

  corePce:
    "PCEPILFE",

  gdp:
    "GDP",

  retailSales:
    "RSAFS",

  industrialProduction:
    "INDPRO",

  consumerSentiment:
    "UMCSENT",

  vix:
    "VIXCLS",
};

/*
|--------------------------------------------------------------------------
| GET FRED SERIES
|--------------------------------------------------------------------------
*/

async function getFredSeries(
  seriesId,
  limit = 5
) {

  const url =
    new URL(FRED_BASE);

  url.searchParams.set(
    "series_id",
    seriesId
  );

  url.searchParams.set(
    "api_key",
    FRED_API_KEY
  );

  url.searchParams.set(
    "file_type",
    "json"
  );

  url.searchParams.set(
    "sort_order",
    "desc"
  );

  url.searchParams.set(
    "limit",
    String(limit)
  );

  console.log(
    `Requesting FRED series: ${seriesId}`
  );

  const response =
    await fetch(url);

  if (!response.ok) {

    const errorText =
      await response.text();

    console.error(
      "FRED ERROR:"
    );

    console.error(
      errorText
    );

    throw new Error(
      `FRED request failed: ${response.status} - ${errorText}`
    );
  }

  const data =
    await response.json();

  return (
    data.observations || []
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE GEOPOLITICAL INPUT
|--------------------------------------------------------------------------
|
| Supports:
|
| [
|   {...}
| ]
|
| OR:
|
| {
|   "events": [...]
| }
|
| OR:
|
| {
|   "geopoliticalEvents": [...]
| }
|
|--------------------------------------------------------------------------
*/

function normalizeGeopoliticalEvents(
  input
) {

  if (
    Array.isArray(input)
  ) {
    return input;
  }

  if (
    input &&
    Array.isArray(
      input.events
    )
  ) {
    return input.events;
  }

  if (
    input &&
    Array.isArray(
      input.geopoliticalEvents
    )
  ) {
    return input.geopoliticalEvents;
  }

  return [];
}

/*
|--------------------------------------------------------------------------
| NORMALIZE ECONOMIC EVENTS
|--------------------------------------------------------------------------
*/

function normalizeEconomicEvents(
  input
) {

  if (
    Array.isArray(input)
  ) {
    return input;
  }

  if (
    input &&
    Array.isArray(input.events)
  ) {
    return input.events;
  }

  return input || {};
}

/*
|--------------------------------------------------------------------------
| ROOT ROUTE
|--------------------------------------------------------------------------
*/

app.get(
  "/",
  (req, res) => {

    res.json({

      service:
        "USD Intelligence API",

      status:
        "online",

      version:
        "2.0.0",

      intelligenceLayers: [

        "FRED",

        "BLS",

        "Federal Reserve",

        "Economic Events",

        "News",

        "Geopolitical Intelligence",

      ],

      endpoints: {

        health:
          "/api/health",

        allFredData:
          "/api/fred",

        singleFredIndicator:
          "/api/fred/:indicator",

        usdAnalysis:
          "/api/usd-analysis",

        eventAnalysis:
          "/api/event-analysis",

        news:
          "/api/news",

        geopoliticalAnalysis:
          "/api/geopolitical-analysis",

        fullIntelligence:
          "/api/usd-intelligence",

        bls:
          "/api/bls",

        federalReserve:
          "/api/federal-reserve",

      },

    });

  }
);

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      status:
        "online",

      service:
        "USD Intelligence API",

      version:
        "2.0.0",

      fredConfigured:
        Boolean(
          FRED_API_KEY
        ),

      modules: {

        fred:
          true,

        bls:
          true,

        federalReserve:
          true,

        events:
          true,

        news:
          true,

        geopolitical:
          true,

      },

      timestamp:
        new Date().toISOString(),

    });

  }
);

/*
|--------------------------------------------------------------------------
| SINGLE FRED INDICATOR
|--------------------------------------------------------------------------
*/

app.get(
  "/api/fred/:indicator",
  async (req, res) => {

    try {

      const indicator =
        req.params.indicator;

      const seriesId =
        SERIES[indicator];

      if (!seriesId) {

        return res
          .status(404)
          .json({

            error:
              "Unknown indicator",

            requested:
              indicator,

            available:
              Object.keys(SERIES),

          });

      }

      const observations =
        await getFredSeries(
          seriesId,
          10
        );

      res.json({

        source:
          "FRED",

        indicator,

        seriesId,

        observations,

      });

    } catch (error) {

      console.error(
        error
      );

      res
        .status(500)
        .json({

          error:
            "Unable to retrieve FRED data",

          message:
            error.message,

        });

    }

  }
);

/*
|--------------------------------------------------------------------------
| ALL FRED DATA
|--------------------------------------------------------------------------
*/

app.get(
  "/api/fred",
  async (req, res) => {

    try {

      const results = {};

      for (
        const [
          name,
          seriesId
        ]
        of Object.entries(SERIES)
      ) {

        try {

          results[name] =
            await getFredSeries(
              seriesId,
              5
            );

        } catch (error) {

          console.error(
            `Failed to retrieve ${name}:`,
            error.message
          );

          results[name] = {

            error:
              error.message,

          };

        }

      }

      res.json({

        source:
          "FRED",

        updatedAt:
          new Date().toISOString(),

        indicators:
          Object.keys(SERIES),

        data:
          results,

      });

    } catch (error) {

      console.error(
        error
      );

      res
        .status(500)
        .json({

          error:
            "Unable to retrieve FRED data",

          message:
            error.message,

        });

    }

  }
);

/*
|--------------------------------------------------------------------------
| USD FUNDAMENTAL ANALYSIS
|--------------------------------------------------------------------------
*/

app.get(
  "/api/usd-analysis",
  async (req, res) => {

    try {

      console.log("");

      console.log(
        "========================================"
      );

      console.log(
        "      RUNNING USD FUNDAMENTAL ANALYSIS"
      );

      console.log(
        "========================================"
      );

      const data = {};

      for (
        const [
          name,
          seriesId
        ]
        of Object.entries(SERIES)
      ) {

        try {

          console.log(
            `Collecting ${name} (${seriesId})...`
          );

          data[name] =
            await getFredSeries(
              seriesId,
              10
            );

        } catch (error) {

          console.error(
            `Failed to retrieve ${name}:`,
            error.message
          );

          data[name] = [];

        }

      }

      const analysis =
        analyzeUSD(
          data
        );

      res.json({

        source:
          "USD Intelligence Engine",

        generatedAt:
          new Date().toISOString(),

        analysis,

      });

      console.log("");

      console.log(
        `USD Score: ${analysis.score}`
      );

      console.log(
        `USD Bias: ${analysis.bias}`
      );

      console.log(
        `Confidence: ${analysis.confidence}%`
      );

      console.log("");

    } catch (error) {

      console.error("");

      console.error(
        "USD ANALYSIS ERROR:"
      );

      console.error(
        error
      );

      res
        .status(500)
        .json({

          error:
            "USD analysis failed",

          message:
            error.message,

        });

    }

  }
);

/*
|--------------------------------------------------------------------------
| ECONOMIC EVENT ANALYSIS
|--------------------------------------------------------------------------
*/

app.post(
  "/api/event-analysis",
  (req, res) => {

    try {

      console.log("");

      console.log(
        "========================================"
      );

      console.log(
        "       USD EVENT ANALYSIS"
      );

      console.log(
        "========================================"
      );

      const events =
        normalizeEconomicEvents(
          req.body
        );

      const results =
        analyzeCommonEvents(
          events
        );

      const score =
        calculateEventScore(
          results
        );

      let bias =
        "NEUTRAL";

      if (
        score >= 10
      ) {

        bias =
          "BULLISH";

      } else if (
        score <= -10
      ) {

        bias =
          "BEARISH";

      }

      const confidence =
        Math.min(
          100,
          Math.abs(score) * 5
        );

      const response = {

        source:
          "USD Event Intelligence Engine",

        generatedAt:
          new Date().toISOString(),

        score,

        bias,

        confidence,

        events:
          results,

      };

      console.log(
        `Event Score: ${score}`
      );

      console.log(
        `Event Bias: ${bias}`
      );

      console.log(
        `Confidence: ${confidence}%`
      );

      console.log("");

      res.json(
        response
      );

    } catch (error) {

      console.error(
        "EVENT ANALYSIS ERROR:",
        error
      );

      res
        .status(500)
        .json({

          error:
            "Event analysis failed",

          message:
            error.message,

        });

    }

  }
);

/*
|--------------------------------------------------------------------------
| BLS DATA
|--------------------------------------------------------------------------
*/

app.get(
  "/api/bls",
  async (req, res) => {

    try {

      console.log("");

      console.log(
        "Collecting BLS data..."
      );

      const data =
        await collectBLSData();

      const analysis =
        analyzeBLS(
          data
        );

      res.json({

        source:
          "US Bureau of Labor Statistics",

        collectedAt:
          new Date().toISOString(),

        data,

        analysis,

      });

    } catch (error) {

      console.error(
        "BLS ERROR:",
        error
      );

      res
        .status(500)
        .json({

          error:
            "Unable to retrieve BLS data",

          message:
            error.message,

        });

    }

  }
);

/*
|--------------------------------------------------------------------------
| FEDERAL RESERVE INTELLIGENCE
|--------------------------------------------------------------------------
*/

app.get(
  "/api/federal-reserve",
  async (req, res) => {

    try {

      console.log("");

      console.log(
        "Collecting Federal Reserve data..."
      );

      const data =
        await collectFedData();

      res.json({

        source:
          "Federal Reserve",

        collectedAt:
          new Date().toISOString(),

        data,

      });

    } catch (error) {

      console.error(
        "FED ERROR:",
        error
      );

      res
        .status(500)
        .json({

          error:
            "Unable to retrieve Federal Reserve data",

          message:
            error.message,

        });

    }

  }
);

/*
|--------------------------------------------------------------------------
| NEWS INTELLIGENCE
|--------------------------------------------------------------------------
*/

app.get(
  "/api/news",
  async (req, res) => {

    try {

      console.log("");

      console.log(
        "========================================"
      );

      console.log(
        "       USD NEWS INTELLIGENCE"
      );

      console.log(
        "========================================"
      );

      const articles =
        await collectNews();

      const analysis =
        analyzeNews(
          articles
        );

      res.json({

        source:
          "USD News Intelligence",

        collectedAt:
          new Date().toISOString(),

        analysis,

      });

      console.log("");

      console.log(
        `News Score: ${analysis.score}`
      );

      console.log(
        `News Bias: ${analysis.bias}`
      );

      console.log(
        `News Confidence: ${analysis.confidence}%`
      );

      console.log(
        `Articles: ${analysis.articleCount}`
      );

      console.log("");

    } catch (error) {

      console.error(
        "NEWS ERROR:",
        error
      );

      res
        .status(500)
        .json({

          error:
            "Unable to retrieve news",

          message:
            error.message,

        });

    }

  }
);

/*
|--------------------------------------------------------------------------
| GEOPOLITICAL INTELLIGENCE
|--------------------------------------------------------------------------
*/

app.post(
  "/api/geopolitical-analysis",
  (req, res) => {

    try {

      console.log("");

      console.log(
        "========================================"
      );

      console.log(
        "   USD GEOPOLITICAL INTELLIGENCE"
      );

      console.log(
        "========================================"
      );

      const events =
        normalizeGeopoliticalEvents(
          req.body
        );

      console.log(
        `Geopolitical events received: ${events.length}`
      );

      const analysis =
        analyzeGeopoliticalEvents(
          events
        );

      console.log(
        `Geopolitical Score: ${analysis.score}`
      );

      console.log(
        `Geopolitical Bias: ${analysis.bias}`
      );

      console.log(
        `Geopolitical Confidence: ${analysis.confidence}%`
      );

      console.log("");

      res.json({

        source:
          "USD Geopolitical Intelligence Engine",

        generatedAt:
          new Date().toISOString(),

        analysis,

      });

    } catch (error) {

      console.error(
        "GEOPOLITICAL ERROR:",
        error
      );

      res
        .status(500)
        .json({

          error:
            "Geopolitical analysis failed",

          message:
            error.message,

        });

    }

  }
);

/*
|--------------------------------------------------------------------------
| FULL USD INTELLIGENCE
|--------------------------------------------------------------------------
|
| MAIN ENGINE
|
| FRED              35%
| BLS               20%
| EVENTS            15%
| NEWS              20%
| GEOPOLITICAL      10%
|
| TOTAL             100%
|
|--------------------------------------------------------------------------
*/

app.post(
  "/api/usd-intelligence",
  async (req, res) => {

    try {

      console.log("");

      console.log(
        "========================================"
      );

      console.log(
        "       USD INTELLIGENCE ENGINE"
      );

      console.log(
        "========================================"
      );

      /*
      |--------------------------------------------------------------------------
      | 1. FRED
      |--------------------------------------------------------------------------
      */

      console.log(
        "STEP 1: Collecting FRED..."
      );

      const fredData = {};

      for (
        const [
          name,
          seriesId
        ]
        of Object.entries(SERIES)
      ) {

        try {

          fredData[name] =
            await getFredSeries(
              seriesId,
              10
            );

        } catch (error) {

          console.error(
            `FRED ${name} failed:`,
            error.message
          );

          fredData[name] = [];

        }

      }

      /*
      |--------------------------------------------------------------------------
      | 2. MACRO
      |--------------------------------------------------------------------------
      */

      console.log(
        "STEP 2: Analyzing macroeconomics..."
      );

      const macroAnalysis =
        analyzeUSD(
          fredData
        );

      /*
      |--------------------------------------------------------------------------
      | 3. BLS
      |--------------------------------------------------------------------------
      */

      console.log(
        "STEP 3: Collecting BLS..."
      );

      const blsData =
        await collectBLSData();

      const blsAnalysis =
        analyzeBLS(
          blsData
        );

      /*
      |--------------------------------------------------------------------------
      | 4. FEDERAL RESERVE
      |--------------------------------------------------------------------------
      */

      console.log(
        "STEP 4: Collecting Federal Reserve..."
      );

      const fedData =
        await collectFedData();

      /*
      |--------------------------------------------------------------------------
      | 5. ECONOMIC EVENTS
      |--------------------------------------------------------------------------
      */

      console.log(
        "STEP 5: Analyzing economic events..."
      );

      const economicEvents =
        normalizeEconomicEvents(
          req.body?.events
        );

      const eventResults =
        analyzeCommonEvents(
          economicEvents
        );

      const eventScore =
        calculateEventScore(
          eventResults
        );

      const normalizedEventScore =
        Math.max(
          0,
          Math.min(
            100,
            50 +
              eventScore * 2
          )
        );

      /*
      |--------------------------------------------------------------------------
      | 6. NEWS
      |--------------------------------------------------------------------------
      */

      console.log(
        "STEP 6: Collecting news..."
      );

      const newsArticles =
        await collectNews();

      const newsAnalysis =
        analyzeNews(
          newsArticles
        );

      /*
      |--------------------------------------------------------------------------
      | 7. GEOPOLITICAL INTELLIGENCE
      |--------------------------------------------------------------------------
      */

      console.log(
        "STEP 7: Analyzing geopolitical intelligence..."
      );

      const geopoliticalEvents =
        normalizeGeopoliticalEvents(
          req.body?.geopoliticalEvents ||
          req.body?.geopolitical ||
          []
        );

      const geopoliticalAnalysis =
        analyzeGeopoliticalEvents(
          geopoliticalEvents
        );

      console.log(
        `Geopolitical events: ${geopoliticalEvents.length}`
      );

      console.log(
        `Geopolitical score: ${geopoliticalAnalysis.score}`
      );

      /*
      |--------------------------------------------------------------------------
      | 8. COMPONENT SCORES
      |--------------------------------------------------------------------------
      */

      const componentScores = {

        macro:
          Number(
            macroAnalysis.score || 50
          ),

        bls:
          Number(
            blsAnalysis.score || 50
          ),

        events:
          Number(
            normalizedEventScore || 50
          ),

        news:
          Number(
            newsAnalysis.score || 50
          ),

        geopolitical:
          Number(
            geopoliticalAnalysis.score || 50
          ),

      };

      /*
      |--------------------------------------------------------------------------
      | 9. WEIGHTED USD SCORE
      |--------------------------------------------------------------------------
      */

      const combinedScore =
        Math.round(

          componentScores.macro *
            0.35

          +

          componentScores.bls *
            0.20

          +

          componentScores.events *
            0.15

          +

          componentScores.news *
            0.20

          +

          componentScores.geopolitical *
            0.10

        );

      /*
      |--------------------------------------------------------------------------
      | 10. FINAL USD BIAS
      |--------------------------------------------------------------------------
      */

      let finalBias =
        "NEUTRAL";

      if (
        combinedScore >= 65
      ) {

        finalBias =
          "BULLISH";

      } else if (
        combinedScore <= 35
      ) {

        finalBias =
          "BEARISH";

      }

      /*
      |--------------------------------------------------------------------------
      | 11. CONFIDENCE
      |--------------------------------------------------------------------------
      */

      const finalConfidence =
        Math.min(
          100,
          Math.round(
            Math.abs(
              combinedScore - 50
            ) * 2
          )
        );

      /*
      |--------------------------------------------------------------------------
      | 12. USD ACTION
      |--------------------------------------------------------------------------
      */

      let dollarAction =
        "WAIT";

      if (
        combinedScore >= 65
      ) {

        dollarAction =
          "BUY USD";

      } else if (
        combinedScore <= 35
      ) {

        dollarAction =
          "SELL USD";

      }

      /*
      |--------------------------------------------------------------------------
      | 13. MARKET INTERPRETATION
      |--------------------------------------------------------------------------
      */

      let interpretation =
        "Mixed fundamental conditions. Wait for stronger confirmation.";

      if (
        combinedScore >= 85
      ) {

        interpretation =
          "Extremely strong USD fundamental conditions.";

      } else if (
        combinedScore >= 80
      ) {

        interpretation =
          "Very strong USD fundamental conditions.";

      } else if (
        combinedScore >= 65
      ) {

        interpretation =
          "USD fundamentals are generally supportive.";

      } else if (
        combinedScore <= 15
      ) {

        interpretation =
          "Extremely weak USD fundamental conditions.";

      } else if (
        combinedScore <= 20
      ) {

        interpretation =
          "Very weak USD fundamental conditions.";

      } else if (
        combinedScore <= 35
      ) {

        interpretation =
          "USD fundamentals are generally negative.";

      }

      /*
      |--------------------------------------------------------------------------
      | 14. ASSET INTERPRETATION
      |--------------------------------------------------------------------------
      |
      | USD direction can affect other USD-denominated assets.
      |
      |--------------------------------------------------------------------------
      */

      let eurUsdBias =
        "NEUTRAL";

      let goldBias =
        "NEUTRAL";

      let btcUsdBias =
        "NEUTRAL";

      if (
        finalBias ===
        "BULLISH"
      ) {

        eurUsdBias =
          "BEARISH";

        goldBias =
          "BEARISH";

        btcUsdBias =
          "BEARISH";

      } else if (
        finalBias ===
        "BEARISH"
      ) {

        eurUsdBias =
          "BULLISH";

        goldBias =
          "BULLISH";

        btcUsdBias =
          "BULLISH";

      }

      /*
      |--------------------------------------------------------------------------
      | 15. SIGNAL STRENGTH
      |--------------------------------------------------------------------------
      */

      let signalStrength =
        "WEAK";

      if (
        finalConfidence >= 70
      ) {

        signalStrength =
          "VERY STRONG";

      } else if (
        finalConfidence >= 50
      ) {

        signalStrength =
          "STRONG";

      } else if (
        finalConfidence >= 30
      ) {

        signalStrength =
          "MODERATE";

      }

      /*
      |--------------------------------------------------------------------------
      | 16. FINAL RESPONSE
      |--------------------------------------------------------------------------
      */

      const response = {

        source:
          "USD Intelligence Engine",

        version:
          "2.0.0",

        generatedAt:
          new Date().toISOString(),

        /*
        |--------------------------------------------------------------------------
        | DECISION
        |--------------------------------------------------------------------------
        */

        decision: {

          score:
            combinedScore,

          bias:
            finalBias,

          action:
            dollarAction,

          confidence:
            finalConfidence,

          signalStrength,

          interpretation,

        },

        /*
        |--------------------------------------------------------------------------
        | ASSET BIASES
        |--------------------------------------------------------------------------
        */

        market:

          {

            USD:
              finalBias,

            EURUSD:
              eurUsdBias,

            XAUUSD:
              goldBias,

            BTCUSD:
              btcUsdBias,

          },

        /*
        |--------------------------------------------------------------------------
        | MACRO
        |--------------------------------------------------------------------------
        */

        macro: {

          score:
            macroAnalysis.score,

          bias:
            macroAnalysis.bias,

          confidence:
            macroAnalysis.confidence,

          factors:
            macroAnalysis.factors,

        },

        /*
        |--------------------------------------------------------------------------
        | BLS
        |--------------------------------------------------------------------------
        */

        employmentAndInflation: {

          score:
            blsAnalysis.score,

          bias:
            blsAnalysis.bias,

          factors:
            blsAnalysis.factors,

        },

        /*
        |--------------------------------------------------------------------------
        | FED
        |--------------------------------------------------------------------------
        */

        federalReserve: {

          data:
            fedData,

        },

        /*
        |--------------------------------------------------------------------------
        | ECONOMIC EVENTS
        |--------------------------------------------------------------------------
        */

        events: {

          score:
            eventScore,

          normalizedScore:
            normalizedEventScore,

          bias:

            eventScore >= 10
              ? "BULLISH"

              : eventScore <= -10
              ? "BEARISH"

              : "NEUTRAL",

          factors:
            eventResults,

        },

        /*
        |--------------------------------------------------------------------------
        | NEWS
        |--------------------------------------------------------------------------
        */

        news: {

          score:
            newsAnalysis.score,

          bias:
            newsAnalysis.bias,

          confidence:
            newsAnalysis.confidence,

          articleCount:
            newsAnalysis.articleCount,

          articles:
            newsAnalysis.articles,

        },

        /*
        |--------------------------------------------------------------------------
        | GEOPOLITICAL
        |--------------------------------------------------------------------------
        */

        geopolitical: {

          score:
            geopoliticalAnalysis.score,

          bias:
            geopoliticalAnalysis.bias,

          confidence:
            geopoliticalAnalysis.confidence,

          eventCount:
            geopoliticalAnalysis.eventCount,

          events:
            geopoliticalAnalysis.events,

        },

        /*
        |--------------------------------------------------------------------------
        | COMPONENT SCORES
        |--------------------------------------------------------------------------
        */

        components:
          componentScores,

        /*
        |--------------------------------------------------------------------------
        | MODEL
        |--------------------------------------------------------------------------
        */

        model: {

          macroWeight:
            35,

          blsWeight:
            20,

          eventWeight:
            15,

          newsWeight:
            20,

          geopoliticalWeight:
            10,

          totalWeight:
            100,

          status:
            "preliminary",

          note:
            "Weights will later be optimized through historical backtesting.",

        },

        /*
        |--------------------------------------------------------------------------
        | DATA SOURCES
        |--------------------------------------------------------------------------
        */

        sources: {

          fred:
            "Federal Reserve Economic Data",

          bls:
            "US Bureau of Labor Statistics",

          federalReserve:
            "Federal Reserve",

          events:
            "Economic Event Engine",

          news:
            "News Intelligence Engine",

          geopolitical:
            "USD Geopolitical Intelligence Engine",

        },

      };

      /*
      |--------------------------------------------------------------------------
      | LOG FINAL RESULT
      |--------------------------------------------------------------------------
      */

      console.log("");

      console.log(
        "========================================"
      );

      console.log(
        "        FINAL USD DECISION"
      );

      console.log(
        "========================================"
      );

      console.log(
        `USD SCORE: ${combinedScore}/100`
      );

      console.log(
        `USD BIAS: ${finalBias}`
      );

      console.log(
        `ACTION: ${dollarAction}`
      );

      console.log(
        `CONFIDENCE: ${finalConfidence}%`
      );

      console.log(
        `SIGNAL STRENGTH: ${signalStrength}`
      );

      console.log("");

      console.log(
        "COMPONENT SCORES"
      );

      console.log(
        `Macro: ${componentScores.macro}/100`
      );

      console.log(
        `BLS: ${componentScores.bls}/100`
      );

      console.log(
        `Events: ${componentScores.events}/100`
      );

      console.log(
        `News: ${componentScores.news}/100`
      );

      console.log(
        `Geopolitical: ${componentScores.geopolitical}/100`
      );

      console.log("");

      console.log(
        "MARKET BIASES"
      );

      console.log(
        `EURUSD: ${eurUsdBias}`
      );

      console.log(
        `XAUUSD: ${goldBias}`
      );

      console.log(
        `BTCUSD: ${btcUsdBias}`
      );

      console.log("");

      console.log(
        "========================================"
      );

      console.log("");

      res.json(
        response
      );

    } catch (error) {

      console.error("");

      console.error(
        "USD INTELLIGENCE ERROR:"
      );

      console.error(
        error
      );

      res
        .status(500)
        .json({

          error:
            "USD intelligence analysis failed",

          message:
            error.message,

        });

    }

  }
);

app.post(
  "/api/geopolitical",
  (req, res) => {
    try {
      console.log("");

      console.log(
        "========================================"
      );

      console.log(
        "   USD GEOPOLITICAL INTELLIGENCE"
      );

      console.log(
        "========================================"
      );

      const events =
        normalizeGeopoliticalEvents(
          req.body
        );

      console.log(
        `Geopolitical events received: ${events.length}`
      );

      const analysis =
        analyzeGeopoliticalEvents(
          events
        );

      console.log(
        `Geopolitical Score: ${analysis.score}`
      );

      console.log(
        `Geopolitical Bias: ${analysis.bias}`
      );

      console.log(
        `Geopolitical Confidence: ${analysis.confidence}%`
      );

      console.log("");

      res.json({
        source:
          "USD Geopolitical Intelligence Engine",

        generatedAt:
          new Date().toISOString(),

        analysis,
      });

    } catch (error) {

      console.error(
        "GEOPOLITICAL ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Geopolitical analysis failed",

        message:
          error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| 404 HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  (req, res) => {

    res
      .status(404)
      .json({

        error:
          "Route not found",

        path:
          req.originalUrl,

      });

  }
);

/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  (error, req, res, next) => {

    console.error(
      "GLOBAL SERVER ERROR:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    res
      .status(500)
      .json({

        error:
          "Internal server error",

        message:
          error.message,

      });

  }
);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(
  PORT,
  () => {

    console.log("");

    console.log(
      "========================================"
    );

    console.log(
      "      USD INTELLIGENCE API"
    );

    console.log(
      "========================================"
    );

    console.log("");

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      `FRED: http://localhost:${PORT}/api/fred`
    );

    console.log(
      `USD Analysis: http://localhost:${PORT}/api/usd-analysis`
    );

    console.log(
      `Event Analysis: POST /api/event-analysis`
    );

    console.log(
      `News: http://localhost:${PORT}/api/news`
    );

    console.log(
      `BLS: http://localhost:${PORT}/api/bls`
    );

    console.log(
      `Federal Reserve: http://localhost:${PORT}/api/federal-reserve`
    );

    console.log(
      `Geopolitical: POST /api/geopolitical-analysis`
    );

    console.log(
      `Full Intelligence: POST /api/usd-intelligence`
    );

    console.log("");

    console.log(
      "Intelligence modules:"
    );

    console.log(
      "✓ FRED"
    );

    console.log(
      "✓ BLS"
    );

    console.log(
      "✓ Federal Reserve"
    );

    console.log(
      "✓ Economic Events"
    );

    console.log(
      "✓ News"
    );

    console.log(
      "✓ Geopolitical Intelligence"
    );

    console.log("");

    console.log(
      "Model weights:"
    );

    console.log(
      "Macro:          35%"
    );

    console.log(
      "BLS:            20%"
    );

    console.log(
      "Events:         15%"
    );

    console.log(
      "News:           20%"
    );

    console.log(
      "Geopolitical:   10%"
    );

    console.log("");

    console.log(
      "Server is ready."
    );

    console.log(
      "========================================"
    );

    console.log("");

  }
);