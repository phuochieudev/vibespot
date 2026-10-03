import { isInServiceArea, toSearchText, type CafeAttributes } from '@vibespot/shared';

export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface PlaceSeed {
  osmId: string;
  name: string;
  searchName: string;
  address: string;
  district: string | null;
  lat: number;
  lng: number;
  attributes: CafeAttributes;
  openingHours: { raw: string } | null;
}

const FALLBACK_ADDRESS = 'Thành phố Hồ Chí Minh';

export function buildAddress(tags: Record<string, string>): string {
  if (tags['addr:full']) return tags['addr:full'];
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const parts = [street, tags['addr:suburb'], tags['addr:district'], tags['addr:city']].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : FALLBACK_ADDRESS;
}

export function buildAttributes(tags: Record<string, string>): CafeAttributes {
  const attrs: CafeAttributes = {};
  const internet = tags['internet_access'];
  if (internet === 'wlan' || internet === 'yes') attrs.hasWifi = true;
  if (internet === 'no') attrs.hasWifi = false;
  const ac = tags['air_conditioning'];
  if (ac === 'yes') attrs.airConditioned = true;
  if (ac === 'no') attrs.airConditioned = false;
  return attrs;
}

// Trả về null nếu phần tử không dùng được (không tên, không toạ độ, ngoài khu vực phục vụ).
export function toPlaceSeed(el: OsmElement): PlaceSeed | null {
  const tags = el.tags ?? {};
  const name = (tags['name:vi'] ?? tags['name'])?.trim();
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!name || name.length < 2 || lat === undefined || lng === undefined) return null;
  if (!isInServiceArea(lat, lng)) return null;

  return {
    osmId: `${el.type}/${el.id}`,
    name: name.slice(0, 120),
    searchName: toSearchText(name.slice(0, 120)),
    address: buildAddress(tags).slice(0, 240),
    district: (tags['addr:district'] ?? tags['addr:suburb'])?.slice(0, 80) ?? null,
    lat,
    lng,
    attributes: buildAttributes(tags),
    openingHours: tags['opening_hours'] ? { raw: tags['opening_hours'] } : null,
  };
}

export function toPlaceSeeds(elements: OsmElement[]): PlaceSeed[] {
  const byId = new Map<string, PlaceSeed>();
  for (const el of elements) {
    const seed = toPlaceSeed(el);
    if (seed) byId.set(seed.osmId, seed);
  }
  return [...byId.values()];
}
