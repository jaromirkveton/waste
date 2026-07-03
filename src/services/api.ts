import type {
  BinDisplayItem,
  CollectionUrgency,
  GolemioResponse,
  SavedAddress,
  WasteContainer,
  WasteStationFeature,
} from "../types";

const GOLEMIO_BASE_URL = "https://api.golemio.cz";
const GOLEMIO_TOKEN = import.meta.env.VITE_GOLEMIO_TOKEN;
const GOLEMIO_RANGE = Number(import.meta.env.VITE_GOLEMIO_RANGE || 2000);

export const FIXED_ADDRESS: SavedAddress = {
  formattedAddress: "Jeseniova 2593/98, Praha",
  placeId: "jeseniova-2593-98",
  lat: 50.088739,
  lng: 14.471956,
};

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

export function sortStationsByDistance(
  features: WasteStationFeature[],
  lat: number,
  lng: number,
): WasteStationFeature[] {
  return features
    .map((feature) => ({
      ...feature,
      distance: haversineMeters(
        lat,
        lng,
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0],
      ),
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

export async function fetchNearbyStations(
  address: SavedAddress,
): Promise<WasteStationFeature[]> {
  if (!GOLEMIO_TOKEN) {
    throw new Error(
      "Chybí VITE_GOLEMIO_TOKEN. Zkopírujte hodnotu z odpady.mojepraha.eu/env-config.js do souboru .env",
    );
  }

  const params = new URLSearchParams({
    latlng: `${address.lat},${address.lng}`,
    range: String(GOLEMIO_RANGE),
    accessibility: "1",
  });

  const response = await fetch(
    `${GOLEMIO_BASE_URL}/v2/sortedwastestations/?${params}`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": GOLEMIO_TOKEN,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Golemio API error: ${response.status}`);
  }

  const data = (await response.json()) as GolemioResponse;
  return sortStationsByDistance(data.features ?? [], address.lat, address.lng);
}

export function formatDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeCheck(iso: string | undefined): string | null {
  if (!iso) return null;
  const measured = new Date(iso);
  if (Number.isNaN(measured.getTime())) return null;

  const diffMs = Date.now() - measured.getTime();
  if (diffMs < 0) return "Kontrolováno právě teď";

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) {
    return minutes <= 1
      ? "Kontrolováno právě teď"
      : `Kontrolováno před ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1
      ? "Kontrolováno před 1 h"
      : `Kontrolováno před ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return days === 1
    ? "Kontrolováno včera"
    : `Kontrolováno před ${days} dny`;
}

export function getNextCollectionLabel(
  urgency: CollectionUrgency,
): string | null {
  switch (urgency) {
    case "today":
      return "Dnes";
    case "tomorrow":
      return "Zítra";
    case "soon":
      return "Pozítří";
    default:
      return null;
  }
}

export function getCollectionUrgency(
  nextPick: string | undefined,
): CollectionUrgency {
  if (!nextPick) return null;
  const target = new Date(nextPick);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === 2) return "soon";
  return null;
}

export function stationsToBins(
  stations: WasteStationFeature[],
): BinDisplayItem[] {
  if (stations.length === 0) return [];

  const nearest = stations[0];
  const stationName = nearest.properties.name;
  const stationDistance = nearest.distance ?? 0;

  return (nearest.properties.containers ?? []).map((container: WasteContainer) => ({
    ...container,
    stationName,
    stationDistance,
    urgency: getCollectionUrgency(container.cleaning_frequency?.next_pick),
  }));
}
