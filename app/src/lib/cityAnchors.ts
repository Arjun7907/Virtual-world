// Rough city anchors for privacy-conscious presence: a device's precise
// GPS reading is snapped to the nearest of these before it's ever broadcast,
// plus a small jitter so multiple people near the same city don't stack on
// an identical point. Nothing more precise than "which city, roughly" ever
// leaves the browser.
export interface CityAnchor {
  name: string;
  lat: number;
  lng: number;
}

export const CITY_ANCHORS: CityAnchor[] = [
  { name: "Dubai", lat: 25.2, lng: 55.3 },
  { name: "London", lat: 51.5, lng: -0.1 },
  { name: "New York", lat: 40.7, lng: -74.0 },
  { name: "São Paulo", lat: -23.6, lng: -46.6 },
  { name: "Lagos", lat: 6.5, lng: 3.4 },
  { name: "Mumbai", lat: 19.1, lng: 72.9 },
  { name: "Singapore", lat: 1.35, lng: 103.8 },
  { name: "Tokyo", lat: 35.7, lng: 139.7 },
  { name: "Sydney", lat: -33.9, lng: 151.2 },
  { name: "Cairo", lat: 30.0, lng: 31.2 },
  { name: "Nairobi", lat: -1.3, lng: 36.8 },
  { name: "Toronto", lat: 43.7, lng: -79.4 },
  { name: "Berlin", lat: 52.5, lng: 13.4 },
  { name: "Jakarta", lat: -6.2, lng: 106.8 },
  { name: "Seoul", lat: 37.6, lng: 127.0 },
  { name: "Los Angeles", lat: 34.1, lng: -118.2 },
  { name: "Mexico City", lat: 19.4, lng: -99.1 },
  { name: "Paris", lat: 48.9, lng: 2.3 },
  { name: "Moscow", lat: 55.8, lng: 37.6 },
  { name: "Shanghai", lat: 31.2, lng: 121.5 },
];

function squaredDistance(a: { lat: number; lng: number }, b: CityAnchor) {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return dLat * dLat + dLng * dLng;
}

/** Snaps a precise coordinate to the nearest anchor city, with small jitter. */
export function nearestCity(lat: number, lng: number): CityAnchor {
  let best = CITY_ANCHORS[0];
  let bestDist = Infinity;
  for (const anchor of CITY_ANCHORS) {
    const d = squaredDistance({ lat, lng }, anchor);
    if (d < bestDist) {
      bestDist = d;
      best = anchor;
    }
  }
  const jitter = () => (Math.random() - 0.5) * 3;
  return { name: best.name, lat: best.lat + jitter(), lng: best.lng + jitter() };
}
