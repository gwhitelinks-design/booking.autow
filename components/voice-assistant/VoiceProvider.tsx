'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  VoiceStatus,
  VoiceMessage,
  VoiceCommand,
  PageContext,
  VoiceContextType,
  VoiceChatResponse,
  QUICK_COMMANDS,
} from '@/lib/voice/types';
import { matchQuickCommand, normalizeFieldValue } from '@/lib/voice/command-parser';

const VoiceContext = createContext<VoiceContextType | null>(null);

interface VoiceProviderProps {
  children: React.ReactNode;
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageContext | null>(null);
  const [lastNavigatedTo, setLastNavigatedTo] = useState<string | null>(null);

  // Refs for callbacks and audio
  const fieldFillCallbacksRef = useRef<Set<(fieldName: string, value: string) => void>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Ref to always get the latest sendMessage function (fixes closure issue with speech recognition)
  const sendMessageRef = useRef<(text: string) => Promise<void>>();

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.onended = () => {
        setStatus('idle');
      };
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-GB';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          handleTranscript(transcript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setStatus('idle');
          if (event.error === 'not-allowed') {
            setError('Microphone access denied. Please enable microphone permissions.');
          } else if (event.error !== 'aborted') {
            setError(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          if (status === 'listening') {
            setStatus('idle');
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;
    // Use ref to get the LATEST sendMessage, not the stale one from mount
    if (sendMessageRef.current) {
      await sendMessageRef.current(transcript);
    }
  };

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addMessage = (role: 'user' | 'assistant', content: string, audioUrl?: string) => {
    const message: VoiceMessage = {
      id: generateMessageId(),
      role,
      content,
      timestamp: new Date(),
      audioUrl,
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const executeCommands = useCallback((commands: VoiceCommand[]) => {
    for (const command of commands) {
      switch (command.type) {
        case 'FILL_FIELD':
          if (command.field && command.value !== undefined) {
            const normalizedValue = normalizeFieldValue(command.field, command.value);
            // Notify all registered callbacks
            fieldFillCallbacksRef.current.forEach(callback => {
              callback(command.field!, normalizedValue);
            });
          }
          break;

        case 'NAVIGATE':
          if (command.path) {
            setLastNavigatedTo(command.path);
            router.push(command.path);
          }
          break;

        case 'SUBMIT_FORM':
          // Dispatch a custom event that forms can listen to
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('voice-submit-form'));
          }
          break;

        case 'ADD_LINE_ITEM':
          if (command.value && typeof window !== 'undefined') {
            try {
              const lineItem = JSON.parse(command.value);
              window.dispatchEvent(new CustomEvent('voice-add-line-item', { detail: lineItem }));
            } catch (e) {
              console.error('Failed to parse line item:', e);
            }
          }
          break;

        default:
          console.log('Unhandled command:', command);
      }
    }
  }, [router]);

  const playAudio = useCallback(async (base64Audio: string) => {
    if (!audioRef.current || isMuted) return;

    try {
      const audioBlob = new Blob(
        [Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      audioRef.current.src = audioUrl;
      setStatus('speaking');
      await audioRef.current.play();

      // Clean up URL after playback
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setStatus('idle');
      };
    } catch (e) {
      console.error('Failed to play audio:', e);
      setStatus('idle');
    }
  }, [isMuted]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    addMessage('user', text);
    setStatus('processing');
    setError(null);

    // Check for quick commands first
    const quickCommand = matchQuickCommand(text, QUICK_COMMANDS);
    if (quickCommand) {
      const responseText = quickCommand.type === 'NAVIGATE'
        ? `Navigating to ${quickCommand.path?.replace('/autow/', '').replace('/', ' ').replace('-', ' ')}`
        : 'Got it!';
      addMessage('assistant', responseText);

      // Execute command FIRST (so navigation happens immediately)
      executeCommands([quickCommand]);

      // Then generate TTS for vocal feedback (plays while/after navigation)
      if (!isMuted) {
        try {
          const ttsResponse = await fetch('/api/autow/voice/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: responseText }),
          });
          if (ttsResponse.ok) {
            const { audioBase64 } = await ttsResponse.json();
            if (audioBase64) {
              // Don't await - let audio play in background during navigation
              playAudio(audioBase64);
            }
          }
        } catch (e) {
          console.log('TTS for quick command failed, continuing silently');
        }
      }

      setStatus('idle');
      return;
    }

    try {
      // Build conversation history (last 10 messages for context)
      const recentMessages = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/autow/voice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('autow_token')}`,
        },
        body: JSON.stringify({
          message: text,
          pageContext: currentPage,
          currentPath: pathname || lastNavigatedTo, // Fallback for context inference
          lastNavigatedTo: lastNavigatedTo, // Track where we just navigated
          conversationHistory: recentMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data: VoiceChatResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant message
      addMessage('assistant', data.text);

      // Execute any commands
      if (data.commands && data.commands.length > 0) {
        executeCommands(data.commands);
      }

      // Play audio if available
      if (data.audioBase64 && !isMuted) {
        await playAudio(data.audioBase64);
      } else {
        setStatus('idle');
      }
    } catch (e) {
      console.error('Voice chat error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to process message';
      setError(errorMessage);
      addMessage('assistant', 'Sorry, I had trouble processing that. Please try again.');
      setStatus('error');
    }
  }, [currentPage, pathname, lastNavigatedTo, messages, isMuted, executeCommands, playAudio]);

  // Keep ref updated with latest sendMessage (fixes speech recognition closure issue)
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && status === 'idle') {
      try {
        recognitionRef.current.start();
        setStatus('listening');
        setError(null);
      } catch (e) {
        console.error('Failed to start listening:', e);
        setError('Failed to start speech recognition');
      }
    }
  }, [status]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && status === 'listening') {
      recognitionRef.current.stop();
      setStatus('idle');
    }
  }, [status]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (audioRef.current && !isMuted) {
      audioRef.current.pause();
    }
  }, [isMuted]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  const registerPage = useCallback((context: PageContext) => {
    setCurrentPage(context);
  }, []);

  const unregisterPage = useCallback(() => {
    setCurrentPage(null);
  }, []);

  const updateFormState = useCallback((state: Record<string, string | number | boolean>) => {
    setCurrentPage(prev => prev ? { ...prev, formState: state } : null);
  }, []);

  const fillField = useCallback((fieldName: string, value: string) => {
    fieldFillCallbacksRef.current.forEach(callback => {
      callback(fieldName, value);
    });
  }, []);

  const onFieldFill = useCallback((callback: (fieldName: string, value: string) => void) => {
    fieldFillCallbacksRef.current.add(callback);
    return () => {
      fieldFillCallbacksRef.current.delete(callback);
    };
  }, []);

  const contextValue: VoiceContextType = {
    status,
    messages,
    isExpanded,
    isMuted,
    error,
    currentPage,
    startListening,
    stopListening,
    sendMessage,
    toggleExpanded,
    toggleMute,
    clearMessages,
    clearError,
    registerPage,
    unregisterPage,
    updateFormState,
    fillField,
    onFieldFill,
  };

  return (
    <VoiceContext.Provider value={contextValue}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextType {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
