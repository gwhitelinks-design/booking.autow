import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

    // Use OpenAI Vision to extract invoice/expense data
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an invoice and expense data extraction assistant for an automotive services business. Extract the following information from invoice/receipt images:

- supplier: The business/supplier name issuing the invoice
- reference_number: The invoice number, receipt number, or reference (e.g., "INV-001", "REC-12345")
- expense_date: The invoice/receipt date in YYYY-MM-DD format
- description: A brief summary of what was purchased/billed
- parts_amount: Total cost for parts/materials (just the number, e.g., 145.99)
- labour_amount: Total cost for labour, services, and work hours combined (just the number). This includes MOT, servicing, diagnostics, repairs, workshop time, etc.
- total_amount: The grand total amount (just the number)
- category: One of: parts, labour, mixed (if both parts and labour), general

For automotive invoices, look for:
- Parts: oil filters, brake pads, batteries, spark plugs, fluids, physical components, etc.
- Labour (includes services): hourly rates, workshop time, diagnostic time, MOT fees, servicing charges, repair labour, any work performed

Return ONLY valid JSON in this exact format:
{
  "supplier": "string or null",
  "reference_number": "string or null",
  "expense_date": "YYYY-MM-DD or null",
  "description": "string or null",
  "parts_amount": number or 0,
  "labour_amount": number or 0,
  "total_amount": number or 0,
  "category": "parts|labour|mixed|general",
  "confidence": 0.0 to 1.0
}

If you cannot read a field clearly, set string fields to null and number fields to 0. The confidence score should reflect how certain you are about the overall extraction.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the invoice/expense data from this image. Return only JSON, no other text.'
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
      max_tokens: 800,
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
        error: 'Failed to parse expense data',
        raw: content,
      }, { status: 422 });
    }

    // Validate and clean the extracted data
    const result = {
      supplier: typeof extractedData.supplier === 'string' ? extractedData.supplier.trim() : null,
      reference_number: typeof extractedData.reference_number === 'string' ? extractedData.reference_number.trim() : null,
      expense_date: extractedData.expense_date && /^\d{4}-\d{2}-\d{2}$/.test(extractedData.expense_date)
        ? extractedData.expense_date : null,
      description: typeof extractedData.description === 'string' ? extractedData.description.trim() : null,
      parts_amount: typeof extractedData.parts_amount === 'number' ? extractedData.parts_amount :
                    typeof extractedData.parts_amount === 'string' ? parseFloat(extractedData.parts_amount) || 0 : 0,
      labour_amount: typeof extractedData.labour_amount === 'number' ? extractedData.labour_amount :
                     typeof extractedData.labour_amount === 'string' ? parseFloat(extractedData.labour_amount) || 0 : 0,
      total_amount: typeof extractedData.total_amount === 'number' ? extractedData.total_amount :
                    typeof extractedData.total_amount === 'string' ? parseFloat(extractedData.total_amount) || 0 : 0,
      category: ['parts', 'labour', 'mixed', 'general'].includes(extractedData.category)
                ? extractedData.category : 'general',
      confidence: typeof extractedData.confidence === 'number' ? extractedData.confidence : 0.5,
      raw_ocr_text: content,
    };

    // Auto-calculate total if not provided but we have component amounts
    if (result.total_amount === 0) {
      result.total_amount = result.parts_amount + result.labour_amount;
    }

    return NextResponse.json({
      success: true,
      data: result,
      processingTime,
    });

  } catch (error: any) {
    console.error('Error parsing expense:', error);
    return NextResponse.json(
      { error: 'Failed to parse expense', details: error.message },
      { status: 500 }
    );
  }
}
