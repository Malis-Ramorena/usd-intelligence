const API_URL = "http://localhost:3001";

export async function getFredIndicator(
  indicator: string
) {
  const response = await fetch(
    `${API_URL}/api/fred/${indicator}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load ${indicator}`
    );
  }

  return response.json();
}

export async function getAllFredData() {
  const response = await fetch(
    `${API_URL}/api/fred`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load FRED data"
    );
  }

  return response.json();
}