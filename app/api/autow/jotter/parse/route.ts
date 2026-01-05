import { NextRequest, NextResponse } from 'next/server';

function parseText(text: string) {
  const t = text.trim();

  // Log the incoming text for debugging
  console.log('Parsing text:', t);

  // Phone - UK mobile (anywhere in text)
  const pm = t.match(/\b(07\d{9})\b/) || t.match(/\b(07\d{3}\s\d{3}\s\d{3})\b/) || t.match(/\b(07\d{3}[-.\s]?\d{3}[-.\s]?\d{3})\b/);
  const phone = pm ? pm[1].replace(/[\s\-\.]/g, '') : null;

  // Registration - UK format (anywhere in text)
  const rm = t.toUpperCase().match(/\b([A-Z]{2}\d{2}\s?[A-Z]{3})\b/) || t.toUpperCase().match(/\b([A-Z]{2}\s?\d{2}\s?[A-Z]{3})\b/);
  let registration = rm ? rm[1].replace(/\s/g, '') : null;
  if (registration && registration.length === 7) {
    registration = registration.slice(0,4) + ' ' + registration.slice(4);
  }

  // Vehicle - common makes with model (anywhere in text)
  const vm = t.match(/\b(Ford|BMW|Audi|Mercedes|Toyota|Honda|Nissan|Volkswagen|Vauxhall|Peugeot|Renault|Volvo|Skoda|Mini|Jaguar|Tesla|VW|Porsche|Lexus|Kia|Hyundai|Mazda|Fiat|Citroen|Seat|Land Rover|Range Rover|Jeep|Chevrolet|Mitsubishi|Subaru|Suzuki)\s+([A-Za-z0-9]+)/i);
  const vehicle = vm ? vm[1] + ' ' + vm[2] : null;

  // Year (1980-2029)
  const ym = t.match(/\b(19[89]\d|20[0-2]\d)\b/);
  const year = ym ? ym[1] : null;

  // Name - look for labeled format first, then try patterns
  let customer_name: string | null = null;

  // Helper: check if text looks like a UK registration
  const looksLikeReg = (s: string) => /^[A-Z]{2}\d{2}[A-Z]{3}$/i.test(s.replace(/\s/g, ''));

  // Try labeled formats: "Name: John Smith", "Customer: John", etc.
  const labeledName = t.match(/(?:name|customer|client)[:\s]+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  if (labeledName && !looksLikeReg(labeledName[1])) {
    customer_name = labeledName[1];
  } else if (!labeledName) {
    // Try finding two capitalized words that look like a name (not a vehicle make, not a registration)
    const vehicleMakes = /ford|bmw|audi|mercedes|toyota|honda|nissan|volkswagen|vauxhall|peugeot|renault|volvo|skoda|mini|jaguar|tesla|vw|porsche|lexus|kia|hyundai|mazda|fiat/i;
    const words = t.split(/[\s,]+/);
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i].replace(/[^A-Za-z]/g, '');
      const w2 = words[i + 1].replace(/[^A-Za-z]/g, '');
      // Skip if combined looks like a registration
      if (looksLikeReg(words[i]) || looksLikeReg(words[i] + words[i + 1])) continue;
      if (w1.length >= 2 && w2.length >= 2 &&
          /^[A-Z][a-z]+$/.test(w1) && /^[A-Z][a-z]+$/.test(w2) &&
          !vehicleMakes.test(w1) && !vehicleMakes.test(w2)) {
        customer_name = w1 + ' ' + w2;
        break;
      }
    }
    // Fallback: try first two alpha words (only if they don't look like a registration)
    if (!customer_name) {
      const nm = t.match(/^([A-Za-z]+\s+[A-Za-z]+)/);
      if (nm && !vehicleMakes.test(nm[1]) && !looksLikeReg(nm[1].replace(/\s/g, ''))) {
        customer_name = nm[1];
      }
    }
  }

  // Capitalize name properly (only if it's actually a name, not just letters)
  if (customer_name && customer_name.length > 3) {
    customer_name = customer_name.split(' ').map((w: string) =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');
  } else {
    customer_name = null; // Reset if too short to be a real name
  }

  // Issue - find part with keywords (more flexible)
  const parts = t.split(/[,\n;]+/).map((p: string) => p.trim());
  const kw = ['warning','light','brake','engine','service','mot','repair','oil','noise','problem','check','issue','fault','error','broken','leak','squeak','rattle','vibration','smoke','smell','battery','starter','clutch','gearbox','transmission'];
  let issue = parts.find((p: string) => kw.some(k => p.toLowerCase().includes(k))) || null;

  // Also check for labeled issue
  if (!issue) {
    const labeledIssue = t.match(/(?:issue|problem|fault|description)[:\s]+([^,\n]+)/i);
    if (labeledIssue) issue = labeledIssue[1].trim();
  }

  if (!issue && parts.length > 2) issue = parts[parts.length-1];

  const found = [customer_name, phone, vehicle, year, registration, issue].filter(Boolean).length;
  console.log('Parsed result:', { customer_name, phone, vehicle, year, registration, issue, found });

  return { customer_name, phone, vehicle, year, registration, issue, notes: t, confidence_score: Math.min(0.95, 0.3 + found * 0.12) };
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });
    return NextResponse.json({ success: true, data: parseText(text), mock: false });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', success: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST' }, { status: 405 });
}
