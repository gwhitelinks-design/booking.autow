import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech, prepareTextForSpeech } from '@/lib/voice/tts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 500 });
    }

    const speechText = prepareTextForSpeech(text);
    const audioBase64 = await generateSpeech(speechText, { apiKey: elevenLabsApiKey });

    if (!audioBase64) {
      return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
    }

    return NextResponse.json({ audioBase64 });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
  }
}
