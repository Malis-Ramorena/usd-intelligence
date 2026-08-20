/*
|--------------------------------------------------------------------------
| FEDERAL RESERVE INTELLIGENCE ENGINE
|--------------------------------------------------------------------------
|
| Collects publicly available Federal Reserve releases.
|
|--------------------------------------------------------------------------
*/

const FED_FOMC_URL =
  "https://www.federalreserve.gov/newsevents/pressreleases/2026-press-fomc.htm";

const FED_SPEECHES_URL =
  "https://www.federalreserve.gov/newsevents/2026-speeches.htm";

/*
|--------------------------------------------------------------------------
| FETCH FED PAGE
|--------------------------------------------------------------------------
*/

async function fetchFedPage(url) {
  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Federal Reserve request failed: ${response.status}`
    );
  }

  return await response.text();
}

/*
|--------------------------------------------------------------------------
| EXTRACT TEXT
|--------------------------------------------------------------------------
*/

function cleanHTML(html) {
  return html
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      ""
    )
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      ""
    )
    .replace(
      /<[^>]+>/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/*
|--------------------------------------------------------------------------
| COLLECT FED DATA
|--------------------------------------------------------------------------
*/

export async function collectFedData() {
  const result = {
    fomc: [],
    speeches: [],
    collectedAt:
      new Date().toISOString(),
  };

  /*
  |--------------------------------------------------------------------------
  | FOMC
  |--------------------------------------------------------------------------
  */

  try {
    console.log(
      "FED: collecting FOMC releases..."
    );

    const html =
      await fetchFedPage(
        FED_FOMC_URL
      );

    const text =
      cleanHTML(html);

    result.fomc.push({
      source:
        "Federal Reserve",

      type:
        "FOMC",

      url:
        FED_FOMC_URL,

      text:
        text.slice(0, 10000),
    });
  } catch (error) {
    console.error(
      "FED FOMC failed:",
      error.message
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SPEECHES
  |--------------------------------------------------------------------------
  */

  try {
    console.log(
      "FED: collecting speeches..."
    );

    const html =
      await fetchFedPage(
        FED_SPEECHES_URL
      );

    const text =
      cleanHTML(html);

    result.speeches.push({
      source:
        "Federal Reserve",

      type:
        "Speech",

      url:
        FED_SPEECHES_URL,

      text:
        text.slice(0, 10000),
    });
  } catch (error) {
    console.error(
      "FED speeches failed:",
      error.message
    );
  }

  return result;
}