import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN =
  process.env.MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon') || searchParams.get('lng');

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  // 1. Try Mapbox Geocoding v5 reverse
  if (MAPBOX_TOKEN) {
    try {
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=vi&limit=1`;
      const mRes = await fetch(mapboxUrl, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      });

      if (mRes.ok) {
        const mData = await mRes.json();
        const f = mData.features?.[0];
        if (f) {
          const name = f.text || f.place_name?.split(',')?.[0] || `Vị trí (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
          const address = f.place_name || name;
          return NextResponse.json({
            name,
            address,
            lat,
            lng,
          });
        }
      }
    } catch (err) {
      console.warn('[Locations Reverse] Mapbox API error, falling back:', err);
    }
  }

  try {
    // 2. Try Photon reverse fallback
    const pUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const pRes = await fetch(pUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    });

    if (pRes.ok) {
      const pData = await pRes.json();
      const f = pData.features?.[0];
      if (f && f.properties) {
        const p = f.properties;
        const name = p.name || p.street || `Vị trí (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        const parts = [
          p.name,
          p.housenumber ? `Số ${p.housenumber}` : '',
          p.street,
          p.locality || p.district,
          p.city,
          p.country,
        ].filter(Boolean);

        const address = Array.from(new Set(parts)).join(', ');

        return NextResponse.json({
          name,
          address: address || name,
          lat,
          lng,
        });
      }
    }
  } catch (err) {
    console.warn('[Locations Reverse] Photon error:', err);
  }

  // 2. Fallback to Nominatim reverse
  try {
    const nUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const nRes = await fetch(nUrl, {
      headers: {
        'User-Agent': 'CircleApp/1.0 (dev@circle.local)',
        'Accept-Language': 'vi,en;q=0.9',
      },
    });

    if (nRes.ok) {
      const data = await nRes.json();
      const displayName = data.display_name || '';
      const name = data.name || displayName.split(',')[0] || `Vị trí (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
      return NextResponse.json({
        name,
        address: displayName,
        lat,
        lng,
      });
    }
  } catch (err) {
    console.warn('[Locations Reverse] Nominatim error:', err);
  }

  return NextResponse.json({
    name: `Vị trí (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    address: '',
    lat,
    lng,
  });
}
