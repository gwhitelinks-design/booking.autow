import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const startTime = Date.now();

    // Use OpenAI Vision to extract receipt data
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a receipt data extraction assistant. Extract the following information from receipt images:
- supplier: The store/business name (e.g., "Shell", "Screwfix", "Tesco")
- amount: The total amount paid (just the number, e.g., 45.99)
- date: The receipt date in YYYY-MM-DD format
- description: A brief description of what was purchased (e.g., "Diesel fuel", "Brake pads and oil filter")
- category: One of: fuel, parts, tools, supplies, misc

Return ONLY valid JSON in this exact format:
{
  "supplier": "string or null",
  "amount": number or null,
  "date": "YYYY-MM-DD or null",
  "description": "string or null",
  "category": "fuel|parts|tools|supplies|misc or null",
  "confidence": 0.0 to 1.0
}

If you cannot read a field clearly, set it to null. The confidence score should reflect how certain you are about the overall extraction.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the receipt data from this image. Return only JSON, no other text.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageData,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const processingTime = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '';

    // Parse the JSON response
    let extractedData;
    try {
      // Remove any markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse receipt data',
        raw: content,
      }, { status: 422 });
    }

    // Validate and clean the extracted data
    const result = {
      supplier: typeof extractedData.supplier === 'string' ? extractedData.supplier.trim() : null,
      amount: typeof extractedData.amount === 'number' ? extractedData.amount :
              typeof extractedData.amount === 'string' ? parseFloat(extractedData.amount) || null : null,
      date: extractedData.date && /^\d{4}-\d{2}-\d{2}$/.test(extractedData.date) ? extractedData.date : null,
      description: typeof extractedData.description === 'string' ? extractedData.description.trim() : null,
      category: ['fuel', 'parts', 'tools', 'supplies', 'misc'].includes(extractedData.category)
                ? extractedData.category : null,
      confidence: typeof extractedData.confidence === 'number' ? extractedData.confidence : 0.5,
    };

    return NextResponse.json({
      success: true,
      data: result,
      processingTime,
    });

  } catch (error: any) {
    console.error('Error parsing receipt:', error);
    return NextResponse.json(
      { error: 'Failed to parse receipt', details: error.message },
      { status: 500 }
    );
  }
}
