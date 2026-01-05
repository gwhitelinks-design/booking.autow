import { NextRequest, NextResponse } from 'next/server';

function parseText(text: string) {
  const t = text.trim();
  
  // Phone - UK mobile
  const pm = t.match(/\b(07\d{9})\b/) || t.match(/\b(07\d{3}\s\d{3}\s\d{3})\b/);
  const phone = pm ? pm[1].replace(/\s/g, '') : null;
  
  // Registration
  const rm = t.toUpperCase().match(/\b([A-Z]{2}\d{2}\s?[A-Z]{3})\b/);
  let registration = rm ? rm[1] : null;
  if (registration && registration.length === 7) {
    registration = registration.slice(0,4) + ' ' + registration.slice(4);
  }
  
  // Vehicle - inline regex
  const vm = t.match(/\b(Ford|BMW|Audi|Mercedes|Toyota|Honda|Nissan|Volkswagen|Vauxhall|Peugeot|Renault|Volvo|Skoda|Mini|Jaguar|Tesla|VW|Porsche|Lexus|Kia|Hyundai|Mazda|Fiat)\s+(\w+)/i);
  const vehicle = vm ? vm[1] + ' ' + vm[2] : null;
  
  // Year
  const ym = t.match(/\b(19[89]\d|20[0-2]\d)\b/);
  const year = ym ? ym[1] : null;
  
  // Name - first two words
  const nm = t.match(/^([A-Za-z]+\s+[A-Za-z]+)/);
  const customer_name = nm ? nm[1].split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : null;
  
  // Issue - find part with keywords
  const parts = t.split(/[,\n]+/).map((p: string) => p.trim());
  const kw = ['warning','light','brake','engine','service','mot','repair','oil','noise','problem','check'];
  let issue = parts.find((p: string) => kw.some(k => p.toLowerCase().includes(k))) || null;
  if (!issue && parts.length > 2) issue = parts[parts.length-1];
  
  const found = [customer_name, phone, vehicle, year, registration, issue].filter(Boolean).length;
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
