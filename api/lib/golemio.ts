const GOLEMIO_BASE_URL = "https://api.golemio.cz";

const FIXED_ADDRESS = {
  lat: 50.088739,
  lng: 14.471956,
};

interface TrashType {
  id: number;
  description: string;
}

interface WasteContainer {
  container_id: number;
  trash_type: TrashType;
  last_measurement?: {
    percent_calculated: number;
  };
}

interface WasteStationFeature {
  properties: {
    containers: WasteContainer[];
  };
}

interface GolemioResponse {
  features: WasteStationFeature[];
}

export interface ServerBinReading {
  containerId: number;
  trashType: string;
  percent: number;
}

export async function fetchBinReadings(): Promise<ServerBinReading[]> {
  const token = process.env.VITE_GOLEMIO_TOKEN ?? process.env.GOLEMIO_TOKEN;
  const range = process.env.VITE_GOLEMIO_RANGE ?? process.env.GOLEMIO_RANGE ?? "2000";

  if (!token) {
    throw new Error("Missing GOLEMIO token for server-side fetch");
  }

  const params = new URLSearchParams({
    latlng: `${FIXED_ADDRESS.lat},${FIXED_ADDRESS.lng}`,
    range: String(range),
    accessibility: "1",
  });

  const response = await fetch(
    `${GOLEMIO_BASE_URL}/v2/sortedwastestations/?${params}`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Golemio API error: ${response.status}`);
  }

  const data = (await response.json()) as GolemioResponse;
  const nearest = data.features?.[0];
  if (!nearest) return [];

  return (nearest.properties.containers ?? [])
    .filter((container) => typeof container.last_measurement?.percent_calculated === "number")
    .map((container) => ({
      containerId: container.container_id,
      trashType: container.trash_type.description,
      percent: container.last_measurement!.percent_calculated,
    }));
}
