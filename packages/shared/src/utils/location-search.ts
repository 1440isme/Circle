/**
 * CIRCLE — Unified Location Search Utility (SSOT)
 * Shared across Web & Mobile platforms.
 */

export interface UnifiedLocationItem {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
}

export interface UnifiedLocationSearchOptions {
  mapboxToken?: string;
  limit?: number;
  apiProxyUrl?: string;
}

/**
 * Clean user-facing place query
 */
export function sanitizeLocationQuery(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/https?:\/\/[^\s]+/g, '')
    .trim()
    .replace(/\s*[-–—:]+\s*$/g, '')
    .trim();
}

/**
 * Universal Location Search
 * Fallback pipeline: apiProxyUrl -> Mapbox Geocoding -> Photon OSM -> Nominatim OSM
 */
export async function searchLocationsUnified(
  query: string,
  options?: UnifiedLocationSearchOptions
): Promise<UnifiedLocationItem[]> {
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length < 2) return [];

  // Ignore raw URLs or meeting links
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.includes('meet.google.com') ||
    trimmed.includes('google.com/maps')
  ) {
    return [];
  }

  const limit = options?.limit || 6;

  // 1. If internal API Proxy is provided, try that first
  if (options?.apiProxyUrl) {
    try {
      const res = await fetch(`${options.apiProxyUrl}?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((d: any) => ({
            name: d.name || d.display_name?.split(',')?.[0] || trimmed,
            display_name: d.display_name || d.name || trimmed,
            lat: typeof d.lat === 'string' ? parseFloat(d.lat) : Number(d.lat ?? 0),
            lon: typeof (d.lon ?? d.lng) === 'string' ? parseFloat(d.lon ?? d.lng) : Number(d.lon ?? d.lng ?? 0),
          }));
        }
      }
    } catch {
      // Fall through to public APIs
    }
  }

  // 2. Mapbox Geocoding v5 if token is available
  const token = options?.mapboxToken;
  if (token) {
    try {
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        trimmed
      )}.json?access_token=${token}&country=vn&language=vi&limit=${limit}`;
      const mRes = await fetch(mapboxUrl, { headers: { Accept: 'application/json' } });
      if (mRes.ok) {
        const mData = (await mRes.json()) as any;
        const features = mData.features || [];
        if (features.length > 0) {
          return features.map((f: any) => ({
            name: f.text || f.place_name?.split(',')?.[0] || trimmed,
            display_name: f.place_name || f.text || trimmed,
            lat: f.center?.[1] ?? 0,
            lon: f.center?.[0] ?? 0,
          }));
        }
      }
    } catch (err) {
      console.warn('[searchLocationsUnified] Mapbox error, falling back:', err);
    }
  }

  // 3. Photon OSM API with VN bias (fast, high availability)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      trimmed
    )}&lat=10.7769&lon=106.7009&limit=${limit}`;
    const pRes = await fetch(photonUrl, { headers: { Accept: 'application/json' } });
    if (pRes.ok) {
      const pData = (await pRes.json()) as any;
      const features = pData.features || [];
      if (features.length > 0) {
        return features.map((f: any) => {
          const p = f.properties || {};
          const name = p.name || p.street || trimmed;
          const parts = [
            p.name,
            p.housenumber ? `Số ${p.housenumber}` : '',
            p.street,
            p.locality || p.district,
            p.city,
            p.country,
          ].filter(Boolean);
          const display_name = Array.from(new Set(parts)).join(', ') || name;
          return {
            name,
            display_name,
            lat: f.geometry?.coordinates?.[1] ?? 0,
            lon: f.geometry?.coordinates?.[0] ?? 0,
          };
        });
      }
    }
  } catch (err) {
    console.warn('[searchLocationsUnified] Photon error, falling back:', err);
  }

  // 4. Nominatim OpenStreetMap fallback
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&countrycodes=vn&limit=${limit}&addressdetails=1`;
    const nRes = await fetch(nomUrl, {
      headers: {
        'User-Agent': 'CircleApp/1.0 (dev@circle.local)',
        Accept: 'application/json',
      },
    });
    if (nRes.ok) {
      const nData = await nRes.json();
      if (Array.isArray(nData) && nData.length > 0) {
        return nData.map((item: any) => ({
          name: item.name || item.display_name?.split(',')?.[0] || trimmed,
          display_name: item.display_name || trimmed,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));
      }
    }
  } catch (err) {
    console.warn('[searchLocationsUnified] Nominatim error:', err);
  }

  return [];
}
