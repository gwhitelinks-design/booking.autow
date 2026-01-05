import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface OCRResponse {
  success: boolean;
  text: string;
  confidence: number;
  processingTime?: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<OCRResponse>> {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json({
        success: false,
        text: '',
        confidence: 0,
        error: 'No image data provided'
      }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        text: '',
        confidence: 0,
        error: 'Add OPENAI_API_KEY to .env.local file'
      }, { status: 503 });
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Read the handwritten text in this image. Extract: customer name, phone, vehicle, year, registration, issue. Return ONLY as comma-separated text. No explanation.'
            },
            {
              type: 'image_url',
              image_url: { url: imageData, detail: 'high' }
            }
          ]
        }
      ],
      max_tokens: 300
    });

    const extractedText = response.choices[0]?.message?.content || '';

    if (!extractedText.trim()) {
      return NextResponse.json({
        success: false,
        text: '',
        confidence: 0,
        error: 'Could not read text. Write more clearly or use Type Text mode.'
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      text: extractedText.trim(),
      confidence: 0.85,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({
      success: false,
      text: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Failed to process image',
      processingTime: Date.now() - startTime
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'OCR (OpenAI Vision)',
    configured: !!process.env.OPENAI_API_KEY
  });
}
