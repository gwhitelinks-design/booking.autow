'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ParsedBookingData, OCRResponse, ProcessingStep } from '@/types/smart-jotter';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { useVoice } from '@/components/voice-assistant';

interface SmartJotterProps {
  onBookingCreate?: (data: ParsedBookingData) => void;
  onEstimateCreate?: (data: ParsedBookingData) => void;
}

const SmartJotter: React.FC<SmartJotterProps> = ({
  onBookingCreate,
  onEstimateCreate,
}) => {
  const router = useRouter();
  const { sendMessage, toggleExpanded, isExpanded, status } = useVoice();
  const canvasRef = useRef<SignatureCanvas>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [inputType, setInputType] = useState<'canvas' | 'text'>('text');
  const [inputData, setInputData] = useState<string>('');
  const [canvasData, setCanvasData] = useState<string>('');
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('input');
  const [error, setError] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedBookingData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useAiAgent, setUseAiAgent] = useState(true); // Enable AI agent by default

  // Responsive canvas sizing - BIGGER canvas
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.offsetWidth;
        const isMobile = containerWidth < 768;
        const width = isMobile ? containerWidth - 10 : Math.min(containerWidth - 4, 900);
        const height = isMobile ? Math.max(width * 0.6, 300) : Math.max(width * 0.5, 400);
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [inputType]);

  // Prevent page scrolling while drawing on canvas
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      const target = e.target as Element;
      if (target && target.closest('.signature-canvas')) {
        e.preventDefault();
      }
    };

    if (inputType === 'canvas') {
      document.addEventListener('touchmove', preventScroll, { passive: false });
    }

    return () => {
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [inputType]);

  // Process via AI Agent - conversational flow
  const processViaAgent = useCallback(async (textToProcess: string) => {
    try {
      // Open the voice widget if not expanded
      if (!isExpanded) {
        toggleExpanded();
      }

      // Send the jotter notes to the AI agent with a special context
      const jotterMessage = `[JOTTER_INPUT] I've written these notes in the Smart Jotter: "${textToProcess}". Please help me process this information. Ask me any clarifying questions about the customer, vehicle, or issue details, then ask where I want to send this - to a new booking, estimate, invoice, or save as a note.`;

      await sendMessage(jotterMessage);

      // Reset the form after sending to agent
      setCurrentStep('input');
      setIsProcessing(false);
    } catch (err) {
      console.error('Agent processing error:', err);
      setError('Failed to send to AI agent. Please try again.');
      setIsProcessing(false);
    }
  }, [sendMessage, toggleExpanded, isExpanded]);

  const processInput = useCallback(async (data: string, type: 'canvas' | 'text') => {
    try {
      setIsProcessing(true);
      setError('');
      setCurrentStep('processing');

      let textToProcess = data;

      if (type === 'canvas') {
        setCurrentStep('ocr');

        const ocrResponse = await fetch('/api/autow/jotter/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: data, inputType: 'image' }),
        });

        if (!ocrResponse.ok) {
          if (ocrResponse.status === 503) { throw new Error('Handwriting mode not available. Use Type Text mode.'); } throw new Error('OCR processing failed');
        }

        const ocrResult: OCRResponse = await ocrResponse.json();
        console.log('OCR Result:', ocrResult);
        textToProcess = ocrResult.text;

        if (!textToProcess.trim()) {
          throw new Error('No text could be extracted from the handwriting. OCR returned: ' + JSON.stringify(ocrResult));
        }
      }

      // If AI Agent mode is enabled, send to voice assistant
      if (useAiAgent) {
        await processViaAgent(textToProcess);
        return;
      }

      // Legacy flow: parse and show preview
      setCurrentStep('parsing');

      const parseResponse = await fetch('/api/autow/jotter/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToProcess }),
      });

      if (!parseResponse.ok) {
        throw new Error('Text parsing failed');
      }

      const parseResult = await parseResponse.json();

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse booking data');
      }

      setParsedData(parseResult.data);
      setCurrentStep('preview');

    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  }, [useAiAgent, processViaAgent]);

  // Canvas handlers
  const handleCanvasEnd = useCallback(() => {
    if (canvasRef.current) {
      const isEmpty = canvasRef.current.isEmpty();
      setIsCanvasEmpty(isEmpty);
      if (!isEmpty) {
        const dataURL = canvasRef.current.toDataURL('image/png');
        setCanvasData(dataURL);
      } else {
        setCanvasData('');
      }
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      setIsCanvasEmpty(true);
      setCanvasData('');
    }
  }, []);

  const undoLastStroke = useCallback(() => {
    if (canvasRef.current) {
      const data = canvasRef.current.toData();
      if (data.length > 0) {
        data.pop();
        canvasRef.current.fromData(data);
        handleCanvasEnd();
      }
    }
  }, [handleCanvasEnd]);

  const handleSubmit = useCallback(() => {
    if (inputType === 'text') {
      if (!inputData.trim()) {
        setError('Please provide some input before processing');
        return;
      }
      processInput(inputData, 'text');
    } else {
      if (isCanvasEmpty || !canvasData) {
        setError('Please draw something on the canvas before processing');
        return;
      }
      processInput(canvasData, 'canvas');
    }
  }, [inputData, inputType, processInput, isCanvasEmpty, canvasData]);

  const handleCreateBooking = useCallback(() => {
    if (!parsedData) return;

    try {
      const params = new URLSearchParams({
        customer_name: parsedData.customer_name || '',
        phone: parsedData.phone || '',
        vehicle: parsedData.vehicle || '',
        year: parsedData.year || '',
        registration: parsedData.registration || '',
        issue: parsedData.issue || '',
        from_jotter: 'true'
      });

      router.push(`/autow/booking?${params.toString()}`);
      onBookingCreate?.(parsedData);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    }
  }, [parsedData, router, onBookingCreate]);

  const handleCreateEstimate = useCallback(() => {
    if (!parsedData) return;
    setError('Estimate creation feature is coming soon!');
    onEstimateCreate?.(parsedData);
  }, [parsedData, onEstimateCreate]);


  const handleSaveNote = useCallback(async () => {
    if (!parsedData) return;
    
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('autow_token');
      
      // Split vehicle into make and model
      let vehicle_make = '';
      let vehicle_model = '';
      if (parsedData.vehicle) {
        const parts = parsedData.vehicle.split(' ');
        vehicle_make = parts[0] || '';
        vehicle_model = parts.slice(1).join(' ') || '';
      }
      
      const response = await fetch('/api/autow/note/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: parsedData.customer_name,
          customer_phone: parsedData.phone,
          vehicle_make,
          vehicle_model,
          vehicle_reg: parsedData.registration,
          vehicle_year: parsedData.year,
          issue_description: parsedData.issue,
          notes: parsedData.notes,
          raw_input: inputData || canvasData,
          confidence_score: parsedData.confidence_score
        })
      });

      if (response.ok) {
        router.push('/autow/notes');
      } else {
        const error = await response.json();
        setError(`Failed to save note: ${error.error}`);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [parsedData, inputData, canvasData, router]);


  const resetForm = useCallback(() => {
    setInputData('');
    setCanvasData('');
    setIsCanvasEmpty(true);
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    setParsedData(null);
    setCurrentStep('input');
    setError('');
    setIsProcessing(false);
  }, []);

  return (
    <div>
      {/* Mode Toggle */}
      {(currentStep === 'input' || currentStep === 'error') && (
        <div style={styles.modeToggle}>
          <button
            onClick={() => setInputType('text')}
            style={{
              ...styles.modeBtn,
              ...(inputType === 'text' ? styles.modeBtnActive : styles.modeBtnInactive),
            }}
          >
            Type Text
          </button>
          <button
            onClick={() => setInputType('canvas')}
            style={{
              ...styles.modeBtn,
              ...(inputType === 'canvas' ? styles.modeBtnActive : styles.modeBtnInactive),
            }}
          >
            Handwrite
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* Input Section */}
      {(currentStep === 'input' || currentStep === 'error') && (
        <div style={styles.inputSection}>
          {inputType === 'text' ? (
            <div>
              <label style={styles.label}>Enter booking details:</label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="Example: John Smith, 07712345678, Ford Focus 2018, YA19 ABC, Engine warning light on dashboard"
                style={styles.textarea}
                disabled={isProcessing}
              />
              <p style={styles.hint}>
                Include: Customer name, phone, vehicle make/model, year, registration, and issue description
              </p>
            </div>
          ) : (
            <div ref={canvasContainerRef}>
              <label style={styles.label}>Write your booking details below:</label>
              <div style={styles.canvasContainer}>
                <div
                  style={{
                    ...styles.canvasWrapper,
                    width: canvasSize.width,
                    height: canvasSize.height,
                  }}
                >
                  <SignatureCanvas
                    ref={canvasRef}
                    penColor="#ffffff"
                    canvasProps={{
                      width: canvasSize.width,
                      height: canvasSize.height,
                      className: 'signature-canvas',
                      style: {
                        display: 'block',
                        borderRadius: '16px',
                        border: '2px solid rgba(48, 255, 55, 0.3)',
                        touchAction: 'none',
                        cursor: 'crosshair',
                      },
                    }}
                    backgroundColor="#0a0a0a"
                    dotSize={1}
                    minWidth={0.5}
                    maxWidth={1.5}
                    velocityFilterWeight={0.7}
                    onEnd={handleCanvasEnd}
                  />
                  {isCanvasEmpty && !isProcessing && (
                    <div style={styles.canvasOverlay}>
                      <span style={{ fontSize: '48px', marginBottom: '12px', display: 'block' }}>&#9998;</span>
                      <p style={{ margin: 0, fontSize: '16px' }}>Start writing here...</p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.7 }}>Write clearly with customer name, phone, vehicle details</p>
                    </div>
                  )}
                </div>
              </div>
              <div style={styles.canvasControls}>
                <button
                  onClick={undoLastStroke}
                  disabled={isCanvasEmpty || isProcessing}
                  style={{
                    ...styles.canvasBtn,
                    ...(isCanvasEmpty || isProcessing ? styles.canvasBtnDisabled : {}),
                  }}
                >
                  Undo
                </button>
                <button
                  onClick={clearCanvas}
                  disabled={isCanvasEmpty || isProcessing}
                  style={{
                    ...styles.canvasBtn,
                    ...styles.clearBtn,
                    ...(isCanvasEmpty || isProcessing ? styles.canvasBtnDisabled : {}),
                  }}
                >
                  Clear All
                </button>
                <span style={styles.canvasStatus}>
                  {isCanvasEmpty ? 'Canvas empty' : 'Ready to parse'}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isProcessing || (inputType === 'text' ? !inputData.trim() : isCanvasEmpty)}
            style={{
              ...styles.submitBtn,
              ...(isProcessing || (inputType === 'text' ? !inputData.trim() : isCanvasEmpty) ? styles.submitBtnDisabled : {}),
            }}
          >
            {isProcessing ? 'Processing...' : 'Parse Data'}
          </button>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div style={styles.processingCard}>
          <div style={styles.processingSpinner}></div>
          <p style={styles.processingText}>
            {currentStep === 'ocr' && 'Recognizing handwriting...'}
            {currentStep === 'parsing' && 'Extracting booking data...'}
            {currentStep === 'processing' && 'Processing...'}
          </p>
        </div>
      )}

      {/* Parsed Data Preview */}
      {currentStep === 'preview' && parsedData && (
        <div style={styles.previewCard}>
          <div style={styles.previewHeader}>
            <span style={styles.previewTitle}>Data Extracted Successfully</span>
            <button onClick={() => setCurrentStep('input')} style={styles.editBtn}>
              Edit Input
            </button>
          </div>

          <div style={styles.dataGrid}>
            {parsedData.customer_name && (
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Customer</span>
                <span style={styles.dataValue}>{parsedData.customer_name}</span>
              </div>
            )}
            {parsedData.phone && (
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Phone</span>
                <span style={styles.dataValue}>{parsedData.phone}</span>
              </div>
            )}
            {parsedData.vehicle && (
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Vehicle</span>
                <span style={styles.dataValue}>{parsedData.vehicle}</span>
              </div>
            )}
            {parsedData.year && (
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Year</span>
                <span style={styles.dataValue}>{parsedData.year}</span>
              </div>
            )}
            {parsedData.registration && (
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Registration</span>
                <span style={styles.dataValue}>{parsedData.registration}</span>
              </div>
            )}
            {parsedData.issue && (
              <div style={{ ...styles.dataItem, gridColumn: '1 / -1' }}>
                <span style={styles.dataLabel}>Issue</span>
                <span style={styles.dataValue}>{parsedData.issue}</span>
              </div>
            )}
          </div>

          {parsedData.confidence_score && (
            <div style={styles.confidence}>
              Confidence: {Math.round(parsedData.confidence_score * 100)}%
            </div>
          )}

          {/* Debug: Show raw extracted text */}
          {parsedData.notes && (
            <div style={styles.debugSection}>
              <span style={styles.debugLabel}>Raw OCR Text:</span>
              <span style={styles.debugValue}>{parsedData.notes}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            <button onClick={handleCreateBooking} style={styles.bookingBtn}>
              Create Booking
            </button>
            <button onClick={handleSaveNote} style={styles.noteBtn} disabled={isProcessing}>
              {isProcessing ? 'Saving...' : 'Save as Note'}
            </button>
            <button onClick={resetForm} style={styles.resetBtn}>
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Error State Reset */}
      {currentStep === 'error' && (
        <div style={styles.errorActions}>
          <button onClick={resetForm} style={styles.resetBtn}>
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  modeToggle: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  modeBtn: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: 'none',
    minHeight: '44px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  modeBtnActive: {
    background: 'linear-gradient(135deg, #30ff37 0%, #28cc2f 100%)',
    color: '#000',
    boxShadow: '0 4px 16px rgba(48, 255, 55, 0.4)',
  },
  modeBtnInactive: {
    background: 'rgba(48, 255, 55, 0.1)',
    color: '#30ff37',
    border: '2px solid rgba(48, 255, 55, 0.2)',
  },
  error: {
    background: 'rgba(244, 67, 54, 0.1)',
    border: '2px solid rgba(244, 67, 54, 0.3)',
    color: '#f44336',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  inputSection: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    color: '#30ff37',
    fontSize: '14px',
    fontWeight: '600' as const,
    marginBottom: '12px',
    letterSpacing: '0.5px',
  },
  textarea: {
    width: '100%',
    padding: '20px',
    borderRadius: '16px',
    border: '2px solid rgba(48, 255, 55, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '16px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    minHeight: '280px',
    boxSizing: 'border-box' as const,
    lineHeight: '1.6',
  },
  hint: {
    color: '#aaa',
    fontSize: '13px',
    marginTop: '12px',
    margin: '12px 0 0 0',
  },
  canvasContainer: {
    marginBottom: '16px',
    maxWidth: '100%',
    overflowX: 'hidden' as const,
  },
  canvasWrapper: {
    position: 'relative' as const,
    display: 'block',
    margin: '0 auto',
    background: '#0a0a0a',
    borderRadius: '16px',
    maxWidth: '100%',
    overflow: 'hidden' as const,
  },
  canvasOverlay: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center' as const,
    color: 'rgba(48, 255, 55, 0.5)',
    pointerEvents: 'none' as const,
  },
  canvasControls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginTop: '16px',
    flexWrap: 'wrap' as const,
  },
  canvasBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: '2px solid rgba(48, 255, 55, 0.3)',
    background: 'rgba(48, 255, 55, 0.1)',
    color: '#30ff37',
    fontSize: '13px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '40px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  canvasBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  clearBtn: {
    borderColor: 'rgba(244, 67, 54, 0.3)',
    background: 'rgba(244, 67, 54, 0.1)',
    color: '#f44336',
  },
  canvasStatus: {
    color: '#aaa',
    fontSize: '14px',
    marginLeft: 'auto',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    marginTop: '20px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #30ff37 0%, #28cc2f 100%)',
    color: '#000',
    boxShadow: '0 4px 16px rgba(48, 255, 55, 0.4)',
    transition: 'all 0.3s',
    letterSpacing: '0.5px',
    minHeight: '48px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  processingCard: {
    background: 'rgba(48, 255, 55, 0.05)',
    border: '2px solid rgba(48, 255, 55, 0.2)',
    borderRadius: '20px',
    padding: '60px 40px',
    textAlign: 'center' as const,
  },
  processingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(48, 255, 55, 0.2)',
    borderTop: '4px solid #30ff37',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  processingText: {
    color: '#30ff37',
    fontSize: '18px',
    fontWeight: '600' as const,
    margin: '0',
  },
  previewCard: {
    background: 'rgba(48, 255, 55, 0.05)',
    border: '2px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '20px',
    padding: '30px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '2px solid rgba(48, 255, 55, 0.1)',
  },
  previewTitle: {
    color: '#30ff37',
    fontSize: '22px',
    fontWeight: '700' as const,
  },
  editBtn: {
    background: 'rgba(48, 255, 55, 0.1)',
    border: '2px solid rgba(48, 255, 55, 0.2)',
    color: '#30ff37',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
    minHeight: '36px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  dataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  dataItem: {
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '16px',
    padding: '20px',
    borderLeft: '4px solid #30ff37',
  },
  dataLabel: {
    display: 'block',
    color: '#aaa',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  dataValue: {
    display: 'block',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '600' as const,
  },
  confidence: {
    color: '#aaa',
    fontSize: '14px',
    textAlign: 'right' as const,
    marginBottom: '24px',
  },
  debugSection: {
    background: 'rgba(255, 165, 0, 0.1)',
    border: '1px solid rgba(255, 165, 0, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
  },
  debugLabel: {
    color: '#ffa500',
    fontSize: '12px',
    fontWeight: '600' as const,
    display: 'block',
    marginBottom: '4px',
  },
  debugValue: {
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
    paddingTop: '20px',
    borderTop: '2px solid rgba(48, 255, 55, 0.1)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  bookingBtn: {
    flex: 1,
    minWidth: '100px',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #30ff37 0%, #28cc2f 100%)',
    color: '#000',
    boxShadow: '0 4px 12px rgba(48, 255, 55, 0.3)',
    minHeight: '44px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  noteBtn: {
    flex: 1,
    minWidth: '100px',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
    minHeight: '44px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  resetBtn: {
    flex: 1,
    minWidth: '100px',
    padding: '12px 16px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#aaa',
    minHeight: '44px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  errorActions: {
    textAlign: 'center' as const,
    marginTop: '24px',
  },
};

export default SmartJotter;
