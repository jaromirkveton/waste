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
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    name: string;
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

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pickNearestStation(
  features: WasteStationFeature[],
): WasteStationFeature | undefined {
  if (features.length === 0) return undefined;

  return features
    .map((feature) => ({
      feature,
      distance: haversineMeters(
        FIXED_ADDRESS.lat,
        FIXED_ADDRESS.lng,
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0],
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.feature;
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
  const nearest = pickNearestStation(data.features ?? []);
  if (!nearest) return [];

  return (nearest.properties.containers ?? [])
    .filter((container) => typeof container.last_measurement?.percent_calculated === "number")
    .map((container) => ({
      containerId: container.container_id,
      trashType: container.trash_type.description,
      percent: container.last_measurement!.percent_calculated,
    }));
}
