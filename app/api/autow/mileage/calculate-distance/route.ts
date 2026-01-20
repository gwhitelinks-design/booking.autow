import { NextRequest, NextResponse } from 'next/server';

interface PostcodeResult {
  status: number;
  result: {
    postcode: string;
    latitude: number;
    longitude: number;
  } | null;
}

interface OSRMResponse {
  code: string;
  routes?: Array<{
    distance: number; // meters
    duration: number; // seconds
  }>;
}

// Clean and format UK postcode
function cleanPostcode(postcode: string): string {
  return postcode.replace(/\s+/g, '').toUpperCase();
}

// Convert meters to miles
function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

// Haversine formula as fallback
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { from, to } = body;

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Both postcodes are required' },
        { status: 400 }
      );
    }

    const fromClean = cleanPostcode(from);
    const toClean = cleanPostcode(to);

    // Fetch coordinates for both postcodes from postcodes.io
    const [fromResponse, toResponse] = await Promise.all([
      fetch(`https://api.postcodes.io/postcodes/${fromClean}`),
      fetch(`https://api.postcodes.io/postcodes/${toClean}`),
    ]);

    const fromData: PostcodeResult = await fromResponse.json();
    const toData: PostcodeResult = await toResponse.json();

    if (fromData.status !== 200 || !fromData.result) {
      return NextResponse.json(
        { error: `Invalid or unknown postcode: ${from}` },
        { status: 400 }
      );
    }

    if (toData.status !== 200 || !toData.result) {
      return NextResponse.json(
        { error: `Invalid or unknown postcode: ${to}` },
        { status: 400 }
      );
    }

    const fromLat = fromData.result.latitude;
    const fromLon = fromData.result.longitude;
    const toLat = toData.result.latitude;
    const toLon = toData.result.longitude;

    // Calculate straight-line distance for reference
    const straightLine = haversineDistance(fromLat, fromLon, toLat, toLon);

    // Use OSRM (Open Source Routing Machine) for actual road distance
    // OSRM uses OpenStreetMap data for accurate routing
    let roadDistance: number;
    let durationMinutes: number | null = null;
    let routeMethod = 'road';

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;

      const osrmResponse = await fetch(osrmUrl, {
        headers: {
          'User-Agent': 'AUTOW-Booking-App/1.0'
        }
      });

      if (osrmResponse.ok) {
        const osrmData: OSRMResponse = await osrmResponse.json();

        if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
          roadDistance = metersToMiles(osrmData.routes[0].distance);
          durationMinutes = Math.round(osrmData.routes[0].duration / 60);
        } else {
          // OSRM couldn't find a route, use fallback
          roadDistance = straightLine * 1.3;
          routeMethod = 'estimated';
        }
      } else {
        // OSRM API error, use fallback
        roadDistance = straightLine * 1.3;
        routeMethod = 'estimated';
      }
    } catch (osrmError) {
      // OSRM request failed, use fallback calculation
      console.warn('OSRM routing failed, using fallback:', osrmError);
      roadDistance = straightLine * 1.3;
      routeMethod = 'estimated';
    }

    return NextResponse.json({
      from: fromData.result.postcode,
      to: toData.result.postcode,
      straightLine: Math.round(straightLine * 10) / 10,
      miles: Math.round(roadDistance * 10) / 10,
      ...(durationMinutes && { durationMinutes }),
      routeMethod,
      note: routeMethod === 'road'
        ? 'Distance calculated via road route (OpenStreetMap)'
        : 'Distance is approximate (straight-line × 1.3)',
    });

  } catch (error: any) {
    console.error('Error calculating distance:', error);
    return NextResponse.json(
      { error: 'Failed to calculate distance', details: error.message },
      { status: 500 }
    );
  }
}
