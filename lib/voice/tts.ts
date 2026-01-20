import { VOICE_SETTINGS } from './types';

interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  speakerBoost?: boolean;
}

/**
 * Generate speech audio from text using ElevenLabs API
 * Returns base64 encoded audio data
 */
export async function generateSpeech(
  text: string,
  config?: Partial<ElevenLabsConfig>
): Promise<string | null> {
  const apiKey = config?.apiKey || process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.warn('ElevenLabs API key not configured - TTS disabled');
    return null;
  }

  const voiceId = config?.voiceId || process.env.ELEVENLABS_VOICE_ID || VOICE_SETTINGS.voiceId;
  const model = config?.model || VOICE_SETTINGS.model;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability: config?.stability ?? VOICE_SETTINGS.stability,
            similarity_boost: config?.similarityBoost ?? VOICE_SETTINGS.similarity_boost,
            use_speaker_boost: config?.speakerBoost ?? VOICE_SETTINGS.speaker_boost,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      return null;
    }

    // Convert response to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return base64;
  } catch (error) {
    console.error('Failed to generate speech:', error);
    return null;
  }
}

/**
 * Clean text for TTS - remove command tags and format for natural speech
 */
export function prepareTextForSpeech(text: string): string {
  // Remove command tags
  let cleaned = text.replace(/\[COMMAND:[^\]]+\]/g, '');

  // Convert currency symbols to words
  cleaned = cleaned.replace(/£(\d+)/g, '$1 pounds');
  cleaned = cleaned.replace(/\$(\d+)/g, '$1 dollars');

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Estimate speech duration based on text length
 * Useful for UI feedback timing
 */
export function estimateSpeechDuration(text: string): number {
  // Average speaking rate is about 150 words per minute
  const words = text.split(/\s+/).length;
  const minutes = words / 150;
  const seconds = minutes * 60;

  // Add a small buffer
  return Math.ceil(seconds * 1000) + 500;
}

/**
 * Split long text into chunks suitable for TTS
 * ElevenLabs has a character limit per request
 */
export function splitTextForTTS(text: string, maxLength: number = 2500): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
