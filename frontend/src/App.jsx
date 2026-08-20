import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe2,
  Newspaper,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

import "./index.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:3001"
    : "");

const REFRESH_INTERVAL = 60000;

/* ============================================================
   HELPERS
============================================================ */

function scoreClass(score) {
  if (score >= 65) return "positive";
  if (score <= 35) return "negative";
  return "neutral";
}

function biasClass(bias) {
  if (!bias) return "neutral";

  const value = String(bias).toUpperCase();

  if (
    value.includes("BULLISH") ||
    value.includes("BUY")
  ) {
    return "positive";
  }

  if (
    value.includes("BEARISH") ||
    value.includes("SELL")
  ) {
    return "negative";
  }

  return "neutral";
}

function formatTime(value) {
  if (!value) return "--";

  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "--";
  }
}

function formatDate(value) {
  if (!value) return "--";

  try {
    return new Date(value).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
}

/* ============================================================
   SCORE BAR
============================================================ */

function ScoreBar({ score = 50 }) {
  const safeScore = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  return (
    <div className="score-bar">
      <div
        className={`score-fill ${scoreClass(
          safeScore
        )}`}
        style={{
          width: `${safeScore}%`,
        }}
      />
    </div>
  );
}

/* ============================================================
   SCORE CARD
============================================================ */

function ScoreCard({
  title,
  icon,
  score,
  bias,
  confidence,
  onClick,
  selected,
}) {
  return (
    <button
      type="button"
      className={`intelligence-card ${
        selected ? "selected-card" : ""
      }`}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-title">
          {icon}
          <span>{title}</span>
        </div>

        <div className="card-header-right">
          <span
            className={`status-dot ${scoreClass(
              score
            )}`}
          />

          <ChevronRight size={15} />
        </div>
      </div>

      <div className="card-score">
        {score ?? "--"}
      </div>

      <ScoreBar score={score ?? 50} />

      <div className="card-footer">
        <span
          className={`badge ${biasClass(
            bias
          )}`}
        >
          {bias || "NEUTRAL"}
        </span>

        {confidence !== undefined && (
          <span className="confidence">
            {confidence}% confidence
          </span>
        )}
      </div>
    </button>
  );
}

/* ============================================================
   MARKET ROW
============================================================ */

function MarketRow({
  symbol,
  bias,
  score,
  reason,
  onClick,
  selected,
}) {
  const positive =
    biasClass(bias) === "positive";

  const negative =
    biasClass(bias) === "negative";

  return (
    <button
      type="button"
      className={`market-row ${
        selected ? "selected-market" : ""
      }`}
      onClick={onClick}
    >
      <div className="market-symbol">
        <strong>{symbol}</strong>

        <span>
          {reason || "Fundamental analysis"}
        </span>
      </div>

      <div
        className={`market-score ${scoreClass(
          score
        )}`}
      >
        {score ?? "--"}
      </div>

      <div
        className={`market-bias ${
          positive
            ? "positive"
            : negative
            ? "negative"
            : "neutral"
        }`}
      >
        {positive && <ArrowUp size={16} />}

        {negative && (
          <ArrowDown size={16} />
        )}

        {!positive && !negative && (
          <Activity size={16} />
        )}

        {bias || "NEUTRAL"}
      </div>
    </button>
  );
}

/* ============================================================
   DETAIL DRAWER
============================================================ */

function DetailDrawer({
  item,
  type,
  onClose,
}) {
  if (!item) return null;

  return (
    <div
      className="drawer-overlay"
      onClick={onClose}
    >
      <aside
        className="detail-drawer"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="drawer-header">
          <div>
            <span className="eyebrow">
              {type}
            </span>

            <h2>
              {item.title ||
                item.symbol ||
                "Details"}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {type === "ASSET" && (
          <>
            <div className="drawer-score">
              <span>Fundamental Score</span>

              <strong
                className={scoreClass(
                  item.score
                )}
              >
                {item.score}
              </strong>
            </div>

            <div
              className={`drawer-bias ${biasClass(
                item.bias
              )}`}
            >
              {item.bias}
            </div>

            <ScoreBar score={item.score} />

            <div className="detail-block">
              <span>Asset</span>
              <strong>
                {item.symbol}
              </strong>
            </div>

            <div className="detail-block">
              <span>Relationship</span>
              <strong>
                {item.reason}
              </strong>
            </div>

            <div className="info-box">
              This is a fundamental USD-derived
              market bias. It is not a direct
              technical trading signal.
            </div>
          </>
        )}

        {type === "INTELLIGENCE" && (
          <>
            <div className="drawer-score">
              <span>Intelligence Score</span>

              <strong
                className={scoreClass(
                  item.score
                )}
              >
                {item.score ?? "--"}
              </strong>
            </div>

            <div
              className={`drawer-bias ${biasClass(
                item.bias
              )}`}
            >
              {item.bias || "NEUTRAL"}
            </div>

            <ScoreBar
              score={item.score ?? 50}
            />

            {item.confidence !==
              undefined && (
              <div className="detail-block">
                <span>
                  Confidence
                </span>

                <strong>
                  {item.confidence}%
                </strong>
              </div>
            )}

            <div className="detail-block">
              <span>Factors</span>

              <div className="factor-list">
                {Array.isArray(
                  item.factors
                ) &&
                item.factors.length > 0 ? (
                  item.factors.map(
                    (factor, index) => (
                      <div
                        className="factor-item"
                        key={index}
                      >
                        <span>
                          {typeof factor ===
                          "string"
                            ? factor
                            : factor.name ||
                              factor.title ||
                              `Factor ${
                                index + 1
                              }`}
                        </span>

                        {typeof factor ===
                          "object" &&
                          factor.score !==
                            undefined && (
                            <strong>
                              {factor.score}
                            </strong>
                          )}
                      </div>
                    )
                  )
                ) : (
                  <div className="empty-state">
                    No detailed factors
                    returned by the API.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {type === "NEWS" && (
          <>
            <div className="detail-block">
              <span>Headline</span>

              <strong>
                {item.title ||
                  "Untitled article"}
              </strong>
            </div>

            <div className="detail-block">
              <span>Source</span>

              <strong>
                {item.source ||
                  "Unknown source"}
              </strong>
            </div>

            <div className="detail-block">
              <span>Published</span>

              <strong>
                {formatDate(
                  item.publishedAt ||
                    item.date
                )}
              </strong>
            </div>

            <div
              className={`drawer-bias ${biasClass(
                item.bias
              )}`}
            >
              {item.bias || "NEUTRAL"}
            </div>

            {item.description && (
              <div className="info-box">
                {item.description}
              </div>
            )}

            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="article-button"
              >
                Open article
                <ExternalLink size={15} />
              </a>
            )}
          </>
        )}

        {type === "GEOPOLITICAL" && (
          <>
            <div className="detail-block">
              <span>Event</span>

              <strong>
                {item.title ||
                  "Geopolitical event"}
              </strong>
            </div>

            <div className="detail-block">
              <span>Category</span>

              <strong>
                {item.category ||
                  "Other"}
              </strong>
            </div>

            <div className="detail-block">
              <span>Regions</span>

              <strong>
                {item.regions?.join(
                  ", "
                ) || "Global"}
              </strong>
            </div>

            {item.description && (
              <div className="info-box">
                {item.description}
              </div>
            )}

            {item.impact?.usd !==
              undefined && (
              <div className="detail-block">
                <span>USD Impact</span>

                <strong
                  className={scoreClass(
                    50 +
                      item.impact.usd *
                        2
                  )}
                >
                  {item.impact.usd > 0
                    ? "+"
                    : ""}
                  {item.impact.usd}
                </strong>
              </div>
            )}

            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="article-button"
              >
                Open source
                <ExternalLink size={15} />
              </a>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

/* ============================================================
   MAIN APP
============================================================ */

function App() {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [selected, setSelected] =
    useState(null);

  const [expandedSections, setExpandedSections] =
    useState({
      intelligence: true,
      markets: true,
      geopolitical: true,
      news: true,
      model: false,
    });

  /* ==========================================================
     FETCH API
  ========================================================== */

  const fetchIntelligence = async (
    manual = false
  ) => {
    try {
      if (manual) {
        setRefreshing(true);
      }

      setError("");

      if (!API_BASE) {
        throw new Error(
          "VITE_API_URL is not configured for this deployment."
        );
      }

      const response = await fetch(
        `${API_BASE.replace(/\/$/, "")}/api/usd-intelligence`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            events: [],
            geopoliticalEvents: [],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}`
        );
      }

      const result =
        await response.json();

      setData(result);

      setLastUpdated(
        new Date()
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to the USD Intelligence API."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ==========================================================
     AUTO REFRESH
  ========================================================== */

  useEffect(() => {
    fetchIntelligence();

    const interval =
      setInterval(
        () => fetchIntelligence(),
        REFRESH_INTERVAL
      );

    return () =>
      clearInterval(interval);
  }, []);

  /* ==========================================================
     API DATA
  ========================================================== */

  const decision =
    data?.decision || {};

  const macro =
    data?.macro || {};

  const employment =
    data?.employmentAndInflation ||
    {};

  const events =
    data?.events || {};

  const news =
    data?.news || {};

  const geopolitical =
    data?.geopolitical || {};

  /* ==========================================================
     MARKET DATA
  ========================================================== */

  const marketData =
    useMemo(() => {
      const usdScore =
        decision.score ?? 50;

      const usdBias =
        decision.bias ||
        "NEUTRAL";

      let inverseBias =
        "NEUTRAL";

      if (
        usdBias === "BULLISH"
      ) {
        inverseBias =
          "BEARISH";
      } else if (
        usdBias === "BEARISH"
      ) {
        inverseBias =
          "BULLISH";
      }

      return [
        {
          symbol: "EURUSD",
          bias: inverseBias,
          score: usdScore,
          reason:
            "Inverse USD relationship",
        },

        {
          symbol: "GBPUSD",
          bias: inverseBias,
          score: usdScore,
          reason:
            "Inverse USD relationship",
        },

        {
          symbol: "USDJPY",
          bias: usdBias,
          score: usdScore,
          reason:
            "Direct USD relationship",
        },

        {
          symbol: "XAUUSD",
          bias: inverseBias,
          score: usdScore,
          reason:
            "USD / safe-haven relationship",
        },

        {
          symbol: "BTCUSD",
          bias:
            usdBias ===
            "BULLISH"
              ? "BEARISH"
              : usdBias ===
                "BEARISH"
              ? "BULLISH"
              : "NEUTRAL",
          score: usdScore,
          reason:
            "USD / risk-sensitive relationship",
        },
      ];
    }, [decision]);

  /* ==========================================================
     SECTION TOGGLE
  ========================================================== */

  const toggleSection = (
    section
  ) => {
    setExpandedSections(
      (previous) => ({
        ...previous,

        [section]:
          !previous[section],
      })
    );
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />

        <h2>
          USD Intelligence
        </h2>

        <p>
          Loading market intelligence...
        </p>
      </div>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="app">
      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <BarChart3 size={22} />
          </div>

          <div>
            <h1>
              USD Intelligence
            </h1>

            <span>
              Fundamental Market
              Intelligence
            </span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="live-status">
            <span className="live-dot" />
            LIVE
          </div>

          <span className="updated">
            Updated{" "}
            {formatTime(
              lastUpdated
            )}
          </span>

          <button
            type="button"
            className="refresh-button"
            onClick={() =>
              fetchIntelligence(
                true
              )
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "spinning"
                  : ""
              }
            />

            Refresh
          </button>
        </div>
      </header>

      <main className="dashboard">
        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="error-banner">
            <AlertTriangle size={20} />

            <div>
              <strong>
                API Connection Error
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="hero-grid">
          <div className="hero-card main-decision">
            <div className="hero-label">
              OVERALL USD FUNDAMENTAL
              SCORE
            </div>

            <div
              className={`hero-score ${scoreClass(
                decision.score
              )}`}
            >
              {decision.score ??
                "--"}
            </div>

            <div
              className={`hero-bias ${biasClass(
                decision.bias
              )}`}
            >
              {decision.bias ===
                "BULLISH" && (
                <TrendingUp
                  size={24}
                />
              )}

              {decision.bias ===
                "BEARISH" && (
                <TrendingDown
                  size={24}
                />
              )}

              {decision.bias !==
                "BULLISH" &&
                decision.bias !==
                  "BEARISH" && (
                  <Activity
                    size={24}
                  />
                )}

              {decision.bias ||
                "NEUTRAL"}
            </div>

            <p className="interpretation">
              {decision.interpretation ||
                "Waiting for intelligence..."}
            </p>
          </div>

          <div className="hero-card">
            <div className="hero-label">
              CONFIDENCE
            </div>

            <div className="confidence-number">
              {decision.confidence ??
                0}
              %
            </div>

            <ScoreBar
              score={
                decision.confidence ??
                0
              }
            />

            <p className="small-description">
              Confidence is based on
              the strength of the
              combined intelligence
              signal.
            </p>
          </div>

          <div className="hero-card">
            <div className="hero-label">
              USD ACTION
            </div>

            <div
              className={`action-display ${biasClass(
                decision.action
              )}`}
            >
              <Zap size={25} />

              {decision.action ||
                "WAIT"}
            </div>

            <p className="small-description">
              Fundamental direction
              only. This does not
              execute trades.
            </p>
          </div>
        </section>

        {/* ====================================================
            INTELLIGENCE
        ==================================================== */}

        <section>
          <button
            type="button"
            className="section-toggle"
            onClick={() =>
              toggleSection(
                "intelligence"
              )
            }
          >
            <div>
              <span className="eyebrow">
                INTELLIGENCE
              </span>

              <h2>
                Fundamental Layers
              </h2>
            </div>

            {expandedSections
              .intelligence ? (
              <ChevronDown size={19} />
            ) : (
              <ChevronRight size={19} />
            )}
          </button>

          {expandedSections
            .intelligence && (
            <div className="intelligence-grid">
              <ScoreCard
                title="Macro"
                icon={
                  <BarChart3
                    size={18}
                  />
                }
                score={
                  macro.score
                }
                bias={
                  macro.bias
                }
                confidence={
                  macro.confidence
                }
                selected={
                  selected?.type ===
                    "INTELLIGENCE" &&
                  selected?.item
                    ?.title ===
                    "Macro"
                }
                onClick={() =>
                  setSelected({
                    type:
                      "INTELLIGENCE",
                    item: {
                      title:
                        "Macro",
                      score:
                        macro.score,
                      bias:
                        macro.bias,
                      confidence:
                        macro.confidence,
                      factors:
                        macro.factors,
                    },
                  })
                }
              />

              <ScoreCard
                title="BLS"
                icon={
                  <Activity
                    size={18}
                  />
                }
                score={
                  employment.score
                }
                bias={
                  employment.bias
                }
                selected={
                  selected?.item
                    ?.title ===
                    "BLS"
                }
                onClick={() =>
                  setSelected({
                    type:
                      "INTELLIGENCE",
                    item: {
                      title:
                        "BLS",
                      score:
                        employment.score,
                      bias:
                        employment.bias,
                      factors:
                        employment.factors,
                    },
                  })
                }
              />

              <ScoreCard
                title="Federal Reserve"
                icon={
                  <ShieldAlert
                    size={18}
                  />
                }
                score={
                  macro.factors
                    ?.federalReserve ??
                  macro.score
                }
                bias={
                  macro.bias
                }
                selected={
                  selected?.item
                    ?.title ===
                    "Federal Reserve"
                }
                onClick={() =>
                  setSelected({
                    type:
                      "INTELLIGENCE",
                    item: {
                      title:
                        "Federal Reserve",
                      score:
                        macro.factors
                          ?.federalReserve ??
                        macro.score,
                      bias:
                        macro.bias,
                      factors:
                        data
                          ?.federalReserve
                          ?.data,
                    },
                  })
                }
              />

              <ScoreCard
                title="Economic Events"
                icon={
                  <Zap size={18} />
                }
                score={
                  events.normalizedScore ??
                  50
                }
                bias={
                  events.bias
                }
                selected={
                  selected?.item
                    ?.title ===
                    "Economic Events"
                }
                onClick={() =>
                  setSelected({
                    type:
                      "INTELLIGENCE",
                    item: {
                      title:
                        "Economic Events",
                      score:
                        events.normalizedScore ??
                        50,
                      bias:
                        events.bias,
                      factors:
                        events.factors,
                    },
                  })
                }
              />

              <ScoreCard
                title="News"
                icon={
                  <Newspaper
                    size={18}
                  />
                }
                score={
                  news.score
                }
                bias={
                  news.bias
                }
                confidence={
                  news.confidence
                }
                selected={
                  selected?.item
                    ?.title ===
                    "News"
                }
                onClick={() =>
                  setSelected({
                    type:
                      "INTELLIGENCE",
                    item: {
                      title:
                        "News",
                      score:
                        news.score,
                      bias:
                        news.bias,
                      confidence:
                        news.confidence,
                      factors:
                        news.articles,
                    },
                  })
                }
              />

              <ScoreCard
                title="Geopolitics"
                icon={
                  <Globe2
                    size={18}
                  />
                }
                score={
                  geopolitical.score
                }
                bias={
                  geopolitical.bias
                }
                confidence={
                  geopolitical.confidence
                }
                selected={
                  selected?.item
                    ?.title ===
                    "Geopolitics"
                }
                onClick={() =>
                  setSelected({
                    type:
                      "INTELLIGENCE",
                    item: {
                      title:
                        "Geopolitics",
                      score:
                        geopolitical.score,
                      bias:
                        geopolitical.bias,
                      confidence:
                        geopolitical.confidence,
                      factors:
                        geopolitical.events,
                    },
                  })
                }
              />
            </div>
          )}
        </section>

        {/* ====================================================
            MARKET + GEOPOLITICAL
        ==================================================== */}

        <section className="two-column">
          {/* MARKET */}

          <div className="panel">
            <button
              type="button"
              className="panel-toggle"
              onClick={() =>
                toggleSection(
                  "markets"
                )
              }
            >
              <div>
                <span className="eyebrow">
                  MARKET IMPACT
                </span>

                <h2>
                  Asset Bias
                </h2>
              </div>

              {expandedSections
                .markets ? (
                <ChevronDown
                  size={18}
                />
              ) : (
                <ChevronRight
                  size={18}
                />
              )}
            </button>

            {expandedSections
              .markets && (
              <div className="market-table">
                <div className="market-header">
                  <span>
                    ASSET
                  </span>

                  <span>
                    SCORE
                  </span>

                  <span>
                    BIAS
                  </span>
                </div>

                {marketData.map(
                  (market) => (
                    <MarketRow
                      key={
                        market.symbol
                      }
                      {...market}
                      selected={
                        selected
                          ?.item
                          ?.symbol ===
                        market.symbol
                      }
                      onClick={() =>
                        setSelected({
                          type:
                            "ASSET",
                          item: market,
                        })
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>

          {/* GEOPOLITICAL */}

          <div className="panel">
            <button
              type="button"
              className="panel-toggle"
              onClick={() =>
                toggleSection(
                  "geopolitical"
                )
              }
            >
              <div>
                <span className="eyebrow">
                  GEOPOLITICAL
                </span>

                <h2>
                  Global Risk
                </h2>
              </div>

              {expandedSections
                .geopolitical ? (
                <ChevronDown
                  size={18}
                />
              ) : (
                <ChevronRight
                  size={18}
                />
              )}
            </button>

            {expandedSections
              .geopolitical && (
              <>
                <div className="geo-summary">
                  <div>
                    <span>
                      Score
                    </span>

                    <strong
                      className={scoreClass(
                        geopolitical.score
                      )}
                    >
                      {geopolitical.score ??
                        "--"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Bias
                    </span>

                    <strong
                      className={biasClass(
                        geopolitical.bias
                      )}
                    >
                      {geopolitical.bias ||
                        "NEUTRAL"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Events
                    </span>

                    <strong>
                      {geopolitical.eventCount ??
                        0}
                    </strong>
                  </div>
                </div>

                <div className="event-list">
                  {(
                    geopolitical.events ||
                    []
                  )
                    .slice(0, 5)
                    .map(
                      (
                        event,
                        index
                      ) => (
                        <button
                          type="button"
                          className="event-item"
                          key={
                            event.title ||
                            index
                          }
                          onClick={() =>
                            setSelected({
                              type:
                                "GEOPOLITICAL",
                              item: event,
                            })
                          }
                        >
                          <div className="event-icon">
                            <AlertTriangle
                              size={16}
                            />
                          </div>

                          <div className="event-content">
                            <strong>
                              {event.title ||
                                "Geopolitical event"}
                            </strong>

                            <span>
                              {event.category ||
                                "other"}{" "}
                              •{" "}
                              {event.regions?.join(
                                ", "
                              ) ||
                                "global"}
                            </span>
                          </div>

                          <div
                            className={`event-impact ${scoreClass(
                              50 +
                                (event
                                  .impact
                                  ?.usd ||
                                  0) *
                                  2
                            )}`}
                          >
                            {event
                              .impact
                              ?.usd >
                            0
                              ? "+"
                              : ""}
                            {event
                              .impact
                              ?.usd ??
                              0}
                          </div>
                        </button>
                      )
                    )}

                  {(!geopolitical.events ||
                    geopolitical
                      .events
                      .length ===
                      0) && (
                    <div className="empty-state">
                      No geopolitical
                      events
                      available.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ====================================================
            NEWS
        ==================================================== */}

        <section className="panel">
          <button
            type="button"
            className="panel-toggle"
            onClick={() =>
              toggleSection("news")
            }
          >
            <div>
              <span className="eyebrow">
                NEWS INTELLIGENCE
              </span>

              <h2>
                Latest USD News
              </h2>
            </div>

            {expandedSections
              .news ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>

          {expandedSections
            .news && (
            <div className="news-list">
              {(
                news.articles ||
                []
              )
                .slice(0, 8)
                .map(
                  (
                    article,
                    index
                  ) => (
                    <button
                      type="button"
                      className="news-item"
                      key={
                        article.link ||
                        article.title ||
                        index
                      }
                      onClick={() =>
                        setSelected({
                          type:
                            "NEWS",
                          item: article,
                        })
                      }
                    >
                      <div className="news-time">
                        {formatTime(
                          article.publishedAt ||
                            article.date
                        )}
                      </div>

                      <div className="news-content">
                        <strong>
                          {article.title ||
                            "Untitled article"}
                        </strong>

                        <span>
                          {article.source ||
                            "Unknown source"}
                        </span>
                      </div>

                      <div
                        className={`news-bias ${biasClass(
                          article.bias
                        )}`}
                      >
                        {article.bias ||
                          "NEUTRAL"}
                      </div>

                      <ChevronRight
                        size={15}
                      />
                    </button>
                  )
                )}

              {(!news.articles ||
                news.articles
                  .length ===
                  0) && (
                <div className="empty-state">
                  No news articles
                  available.
                </div>
              )}
            </div>
          )}
        </section>

        {/* ====================================================
            MODEL
        ==================================================== */}

        <section className="panel">
          <button
            type="button"
            className="panel-toggle"
            onClick={() =>
              toggleSection(
                "model"
              )
            }
          >
            <div>
              <span className="eyebrow">
                MODEL
              </span>

              <h2>
                Intelligence Weighting
              </h2>
            </div>

            {expandedSections
              .model ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight
                size={18}
              />
            )}
          </button>

          {expandedSections
            .model && (
            <div className="weights-grid">
              <div>
                <span>
                  Macro
                </span>

                <strong>
                  {data?.model
                    ?.macroWeight ??
                    35}
                  %
                </strong>
              </div>

              <div>
                <span>
                  BLS
                </span>

                <strong>
                  {data?.model
                    ?.blsWeight ??
                    20}
                  %
                </strong>
              </div>

              <div>
                <span>
                  Events
                </span>

                <strong>
                  {data?.model
                    ?.eventWeight ??
                    15}
                  %
                </strong>
              </div>

              <div>
                <span>
                  News
                </span>

                <strong>
                  {data?.model
                    ?.newsWeight ??
                    20}
                  %
                </strong>
              </div>

              <div>
                <span>
                  Geopolitics
                </span>

                <strong>
                  {data?.model
                    ?.geopoliticalWeight ??
                    10}
                  %
                </strong>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ======================================================
          DETAIL DRAWER
      ====================================================== */}

      <DetailDrawer
        item={selected?.item}
        type={selected?.type}
        onClose={() =>
          setSelected(null)
        }
      />

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="footer">
        <span>
          USD Intelligence Engine
        </span>

        <span>
          Fundamental analysis only •
          No automatic trade execution
        </span>
      </footer>
    </div>
  );
}

export default App;