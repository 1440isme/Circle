import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // 1. Try Photon (fast, free, OSM-powered)
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      q
    )}&lat=10.7769&lon=106.7009&limit=6`;

    const pRes = await fetch(photonUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (pRes.ok) {
      const pData = await pRes.json();
      const features = pData.features || [];
      if (features.length > 0) {
        const mapped = features.map((f: any) => {
          const p = f.properties || {};
          const name = p.name || p.street || q;
          const parts = [
            p.name,
            p.housenumber ? `Số ${p.housenumber}` : '',
            p.street,
            p.locality || p.district,
            p.city,
            p.state || p.country,
          ].filter(Boolean);

          const display_name = Array.from(new Set(parts)).join(', ');

          return {
            name,
            display_name: display_name || name,
            lat: f.geometry?.coordinates?.[1],
            lon: f.geometry?.coordinates?.[0],
          };
        });

        return NextResponse.json(mapped);
      }
    }
  } catch (err) {
    console.warn('[Locations Search] Photon error, falling back:', err);
  }

  // 2. Fallback to Nominatim if Photon returns empty or fails
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&countrycodes=vn&limit=6&addressdetails=1`;

    const nRes = await fetch(nomUrl, {
      headers: {
        'User-Agent': 'CircleApp/1.0 (dev@circle.local)',
        'Accept-Language': 'vi,en;q=0.9',
      },
    });

    if (nRes.ok) {
      const nData = await nRes.json();
      if (Array.isArray(nData) && nData.length > 0) {
        return NextResponse.json(
          nData.map((item: any) => ({
            name: item.name || item.display_name?.split(',')?.[0] || q,
            display_name: item.display_name || item.name || q,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
          }))
        );
      }
    }
  } catch (err) {
    console.warn('[Locations Search] Nominatim fallback error:', err);
  }

  return NextResponse.json([]);
}
