import { NextRequest, NextResponse } from 'next/server';

interface PostcodeResult {
  status: number;
  result: {
    postcode: string;
    latitude: number;
    longitude: number;
  } | null;
}

// Haversine formula to calculate distance between two coordinates
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Clean and format UK postcode
function cleanPostcode(postcode: string): string {
  return postcode.replace(/\s+/g, '').toUpperCase();
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

    // Calculate distance
    const distance = haversineDistance(
      fromData.result.latitude,
      fromData.result.longitude,
      toData.result.latitude,
      toData.result.longitude
    );

    // Apply a factor to approximate road distance (straight line * 1.3)
    // This is a rough approximation as actual road distance varies
    const roadDistance = distance * 1.3;

    return NextResponse.json({
      from: fromData.result.postcode,
      to: toData.result.postcode,
      straightLine: Math.round(distance * 10) / 10,
      miles: Math.round(roadDistance * 10) / 10,
      note: 'Distance is approximate (straight-line × 1.3)',
    });

  } catch (error: any) {
    console.error('Error calculating distance:', error);
    return NextResponse.json(
      { error: 'Failed to calculate distance', details: error.message },
      { status: 500 }
    );
  }
}
