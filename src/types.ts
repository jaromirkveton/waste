export interface TrashType {
  id: number;
  description: string;
}

export interface CleaningFrequency {
  duration: string | null;
  frequency: number | null;
  id: number | null;
  pick_days: string;
  next_pick: string;
}

export interface LastMeasurement {
  measured_at_utc: string;
  percent_calculated: number;
  prediction_utc?: string;
}

export interface WasteContainer {
  container_id: number;
  container_type: string;
  trash_type: TrashType;
  cleaning_frequency?: CleaningFrequency;
  last_measurement?: LastMeasurement;
  last_pick?: string;
  is_monitored: boolean;
  ksnko_id?: number;
}

export interface StationProperties {
  id: number;
  name: string;
  station_number: string;
  district: string;
  is_monitored: boolean;
  updated_at: string;
  containers: WasteContainer[];
  accessibility?: {
    id: number;
    description: string;
  };
}

export interface WasteStationFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: StationProperties;
  distance?: number;
}

export interface GolemioResponse {
  type: string;
  features: WasteStationFeature[];
}

export interface SavedAddress {
  formattedAddress: string;
  placeId: string;
  lat: number;
  lng: number;
}

export type CollectionUrgency = "today" | "tomorrow" | "soon" | null;

export interface BinDisplayItem extends WasteContainer {
  stationName: string;
  stationDistance: number;
  urgency: CollectionUrgency;
}
