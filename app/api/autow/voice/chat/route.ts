import { NextRequest, NextResponse } from 'next/server';
import { VoiceChatRequest, VoiceChatResponse, VoiceCommand, PageContext } from '@/lib/voice/types';
import { buildSystemPrompt, getPageConfig } from '@/lib/voice/system-prompt';
import { parseCommands } from '@/lib/voice/command-parser';
import { generateSpeech, prepareTextForSpeech } from '@/lib/voice/tts';

export const dynamic = 'force-dynamic';

// Verify authentication
function verifyToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7);
  return token === process.env.AUTOW_STAFF_TOKEN;
}

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, pageContext, currentPath, lastNavigatedTo, conversationHistory } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check for Anthropic API key
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Determine the best path to use for context
    // Priority: currentPath > lastNavigatedTo
    const effectivePath = currentPath || lastNavigatedTo;

    // Debug logging
    console.log('Voice API received:', {
      currentPath,
      lastNavigatedTo,
      effectivePath,
      hasPageContext: !!pageContext,
      pageContextPage: pageContext?.page,
    });

    // Build effective page context - use provided context or infer from path
    let effectiveContext: PageContext | null = pageContext;
    if (!effectiveContext && effectivePath) {
      const pageConfig = getPageConfig(effectivePath);
      console.log('getPageConfig result:', { effectivePath, hasConfig: !!pageConfig });
      if (pageConfig) {
        effectiveContext = {
          page: effectivePath,
          title: pageConfig.title || 'Unknown Page',
          description: pageConfig.description || '',
          fields: [],
          formState: {},
          availableActions: pageConfig.availableActions || [],
        };
      }
    }

    console.log('Final context:', effectiveContext ? { page: effectiveContext.page, title: effectiveContext.title } : 'null');

    // Build system prompt with page context
    const systemPrompt = buildSystemPrompt(effectiveContext);

    // Build messages for Claude
    const claudeMessages = [
      // Include conversation history (last 10 exchanges)
      ...(conversationHistory || []).slice(-20).map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      // Current message
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      return NextResponse.json(
        { error: 'AI service error' },
        { status: 500 }
      );
    }

    const claudeData = await claudeResponse.json();
    const assistantMessage = claudeData.content?.[0]?.text || 'I apologize, I could not generate a response.';

    // Parse commands from response
    const { cleanText, commands } = parseCommands(assistantMessage);

    // Generate TTS audio (if ElevenLabs is configured)
    let audioBase64: string | undefined;
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (elevenLabsApiKey && cleanText.length > 0 && cleanText.length < 3000) {
      const speechText = prepareTextForSpeech(cleanText);
      const audio = await generateSpeech(speechText, { apiKey: elevenLabsApiKey });
      if (audio) {
        audioBase64 = audio;
      }
    }

    const response: VoiceChatResponse = {
      text: cleanText,
      commands,
      audioBase64,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Voice chat error:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
