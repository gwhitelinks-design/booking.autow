'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface DamageMarker {
  id: string;
  x: number;
  y: number;
  number: number;
  note: string;
}

export default function CreateVehicleReportPage() {
  const router = useRouter();
  const diagramRef = useRef<HTMLDivElement>(null);

  // Form state
  const [serviceType, setServiceType] = useState<'repair' | 'recovery'>('recovery');
  const [vehicleReg, setVehicleReg] = useState('');
  const [vehicleTypeModel, setVehicleTypeModel] = useState('');
  const [vehicleWeight, setVehicleWeight] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeArrival, setTimeArrival] = useState('');
  const [timeDepart, setTimeDepart] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [knownIssues, setKnownIssues] = useState('');
  const [riskProcedure, setRiskProcedure] = useState('');
  const [riskSignature, setRiskSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [videoFileCode, setVideoFileCode] = useState('');
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [driverSignature, setDriverSignature] = useState<string | null>(null);

  // Damage markers
  const [damageMarkers, setDamageMarkers] = useState<DamageMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [markerNote, setMarkerNote] = useState('');

  // Signature modal state
  const [signatureModal, setSignatureModal] = useState<'risk' | 'customer' | 'driver' | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
    }
  }, [router]);

  // Handle diagram click to add marker
  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!diagramRef.current) return;

    const rect = diagramRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: DamageMarker = {
      id: Date.now().toString(),
      x,
      y,
      number: damageMarkers.length + 1,
      note: ''
    };

    setDamageMarkers([...damageMarkers, newMarker]);
    setSelectedMarker(newMarker.id);
    setMarkerNote('');
  };

  const handleMarkerClick = (e: React.MouseEvent, markerId: string) => {
    e.stopPropagation();
    const marker = damageMarkers.find(m => m.id === markerId);
    if (marker) {
      setSelectedMarker(markerId);
      setMarkerNote(marker.note);
    }
  };

  const updateMarkerNote = () => {
    if (!selectedMarker) return;
    setDamageMarkers(damageMarkers.map(m =>
      m.id === selectedMarker ? { ...m, note: markerNote } : m
    ));
    setSelectedMarker(null);
    setMarkerNote('');
  };

  const removeMarker = (markerId: string) => {
    const newMarkers = damageMarkers.filter(m => m.id !== markerId);
    // Renumber markers
    const renumbered = newMarkers.map((m, i) => ({ ...m, number: i + 1 }));
    setDamageMarkers(renumbered);
    setSelectedMarker(null);
  };

  // Signature canvas functions
  const initCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  useEffect(() => {
    if (signatureModal) {
      setTimeout(initCanvas, 100);
    }
  }, [signatureModal]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    initCanvas();
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    if (signatureModal === 'risk') {
      setRiskSignature(dataUrl);
    } else if (signatureModal === 'customer') {
      setCustomerSignature(dataUrl);
    } else if (signatureModal === 'driver') {
      setDriverSignature(dataUrl);
    }

    setSignatureModal(null);
  };

  const handleSubmit = async (asDraft: boolean = false) => {
    setError(null);
    setSuccess(null);

    if (!vehicleReg.trim()) {
      setError('Vehicle registration is required');
      return;
    }
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/vehicle-report/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          service_type: serviceType,
          vehicle_reg: vehicleReg.toUpperCase().trim(),
          vehicle_type_model: vehicleTypeModel.trim() || null,
          vehicle_weight: vehicleWeight.trim() || null,
          pickup_location: pickupLocation.trim() || null,
          delivery_location: deliveryLocation.trim() || null,
          report_date: reportDate,
          time_arrival: timeArrival || null,
          time_depart: timeDepart || null,
          customer_name: customerName.trim(),
          customer_address: customerAddress.trim() || null,
          customer_phone: customerPhone.trim() || null,
          customer_email: customerEmail.trim() || null,
          known_issues: knownIssues.trim() || null,
          risk_procedure_description: riskProcedure.trim() || null,
          risk_procedure_signature: riskSignature,
          damage_markers: damageMarkers,
          notes: notes.trim() || null,
          video_file_code: videoFileCode.trim() || null,
          customer_signature: customerSignature,
          customer_signature_date: customerSignature ? reportDate : null,
          driver_signature: driverSignature,
          driver_signature_date: driverSignature ? reportDate : null,
          status: asDraft ? 'draft' : 'completed'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create report');
      }

      setSuccess(`Report ${data.report.report_number} created successfully!`);
      setTimeout(() => {
        router.push('/autow/vehicle-report');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Image src="/logo.png" alt="AUTOW" width={100} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <h1 style={styles.title}>Vehicle Check Report</h1>
            <p style={styles.subtitle}>AUTOW Transport & Recovery</p>
          </div>
        </div>
        <button style={styles.backButton} onClick={() => router.push('/autow/vehicle-report')}>
          ← Back
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.form}>
        {/* Service Type */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Service Type</h3>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="serviceType"
                checked={serviceType === 'repair'}
                onChange={() => setServiceType('repair')}
                style={styles.radio}
              />
              Repair
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="serviceType"
                checked={serviceType === 'recovery'}
                onChange={() => setServiceType('recovery')}
                style={styles.radio}
              />
              Recovery
            </label>
          </div>
        </div>

        {/* Vehicle & Customer Info - Two Columns */}
        <div style={styles.twoColumns}>
          <div style={styles.column}>
            <h3 style={styles.sectionTitle}>Vehicle Information</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Vehicle Registration *</label>
              <input
                type="text"
                value={vehicleReg}
                onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                placeholder="AB12 CDE"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Vehicle Type / Model</label>
              <input
                type="text"
                value={vehicleTypeModel}
                onChange={(e) => setVehicleTypeModel(e.target.value)}
                placeholder="e.g., Ford Transit"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Vehicle Weight</label>
              <input
                type="text"
                value={vehicleWeight}
                onChange={(e) => setVehicleWeight(e.target.value)}
                placeholder="e.g., 2500kg"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Pickup Location</label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Address"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Delivery Location</label>
              <input
                type="text"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder="Address"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.column}>
            <h3 style={styles.sectionTitle}>Date & Time</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formRow}>
              <div style={styles.halfWidth}>
                <label style={styles.label}>Time Arrival</label>
                <input
                  type="time"
                  value={timeArrival}
                  onChange={(e) => setTimeArrival(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.halfWidth}>
                <label style={styles.label}>Time Depart</label>
                <input
                  type="time"
                  value={timeDepart}
                  onChange={(e) => setTimeDepart(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <h3 style={{ ...styles.sectionTitle, marginTop: '20px' }}>Customer Information</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Customer Address</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Address"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Known Issues / Notes</label>
              <textarea
                value={knownIssues}
                onChange={(e) => setKnownIssues(e.target.value)}
                placeholder="Any known issues with the vehicle..."
                style={styles.textarea}
              />
            </div>
          </div>
        </div>

        {/* Risk Procedure Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Procedures Involving Risk of Damage</h3>
          <p style={styles.disclaimer}>
            You have asked us to do the following, something which by its nature may cause damage to your vehicle.
          </p>
          <div style={styles.formGroup}>
            <label style={styles.label}>The Following:</label>
            <textarea
              value={riskProcedure}
              onChange={(e) => setRiskProcedure(e.target.value)}
              placeholder="Describe the procedure..."
              style={styles.textarea}
            />
          </div>
          <p style={styles.disclaimer}>
            I hereby authorize Autow (or its agent) to carry out the above procedure(s). I understand that this carries an inherent risk of damage, and that damage may be caused to my vehicle. I agree that Autow (or its agent) cannot be held liable for any such damage.
          </p>
          <div style={styles.signatureBox}>
            <label style={styles.label}>Authorization Signature:</label>
            {riskSignature ? (
              <div style={styles.signaturePreview}>
                <img src={riskSignature} alt="Risk Signature" style={styles.signatureImage} />
                <button onClick={() => setRiskSignature(null)} style={styles.clearSignatureBtn}>Clear</button>
              </div>
            ) : (
              <button onClick={() => setSignatureModal('risk')} style={styles.signButton}>
                Tap to Sign
              </button>
            )}
          </div>
        </div>

        {/* Vehicle Condition Diagram */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Vehicle Condition Report - Top-Down View</h3>
          <p style={styles.hint}>Tap on the diagram to add numbered damage markers</p>

          <div
            ref={diagramRef}
            style={styles.diagramContainer}
            onClick={handleDiagramClick}
          >
            {/* Car Check Image */}
            <img
              src="/assets/car_check.jpg"
              alt="Vehicle Check Diagram"
              style={styles.carImage}
              draggable={false}
            />

            {/* Damage Markers */}
            {damageMarkers.map((marker) => (
              <div
                key={marker.id}
                style={{
                  ...styles.marker,
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                  backgroundColor: selectedMarker === marker.id ? '#ff4444' : '#30ff37'
                }}
                onClick={(e) => handleMarkerClick(e, marker.id)}
              >
                {marker.number}
              </div>
            ))}
          </div>

          {/* Marker Notes */}
          {selectedMarker && (
            <div style={styles.markerNoteBox}>
              <div style={styles.markerNoteHeader}>
                <span>Damage Point #{damageMarkers.find(m => m.id === selectedMarker)?.number}</span>
                <button
                  onClick={() => removeMarker(selectedMarker)}
                  style={styles.removeMarkerBtn}
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                value={markerNote}
                onChange={(e) => setMarkerNote(e.target.value)}
                placeholder="Describe the damage..."
                style={styles.input}
              />
              <button onClick={updateMarkerNote} style={styles.saveNoteBtn}>
                Save Note
              </button>
            </div>
          )}

          {/* Damage List */}
          {damageMarkers.length > 0 && (
            <div style={styles.damageList}>
              <h4 style={styles.damageListTitle}>Damage Points:</h4>
              {damageMarkers.map((marker) => (
                <div key={marker.id} style={styles.damageItem}>
                  <span style={styles.damageNumber}>{marker.number}.</span>
                  <span style={styles.damageNote}>{marker.note || 'No description'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Additional Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
            style={{ ...styles.textarea, minHeight: '100px' }}
          />
        </div>

        {/* Video File Code */}
        <div style={styles.section}>
          <p style={styles.disclaimer}>
            Disclaimer: The customer confirms that the condition of the vehicle has been checked and agreed.
            The Driver will provide a walk around Video Inspection prior to recovery or repair.
          </p>
          <div style={styles.formGroup}>
            <label style={styles.label}>Video File Code:</label>
            <input
              type="text"
              value={videoFileCode}
              onChange={(e) => setVideoFileCode(e.target.value)}
              placeholder="Enter video reference code"
              style={styles.input}
            />
          </div>
        </div>

        {/* Insurance Disclaimer */}
        <div style={styles.insuranceBox}>
          <p>AUTOW Transport & Recovery holds Goods in Transit insurance up to £1,000,000. No liability is accepted for undisclosed pre-existing damage or mechanical failures not caused during recovery. By signing this form, the customer agrees to the terms outlined above.</p>
        </div>

        {/* Final Signatures */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Signatures</h3>
          <div style={styles.signatureRow}>
            <div style={styles.signatureColumn}>
              <label style={styles.label}>Customer Signature:</label>
              {customerSignature ? (
                <div style={styles.signaturePreview}>
                  <img src={customerSignature} alt="Customer Signature" style={styles.signatureImage} />
                  <button onClick={() => setCustomerSignature(null)} style={styles.clearSignatureBtn}>Clear</button>
                </div>
              ) : (
                <button onClick={() => setSignatureModal('customer')} style={styles.signButton}>
                  Customer - Tap to Sign
                </button>
              )}
              <p style={styles.signatureDate}>Date: {reportDate}</p>
            </div>

            <div style={styles.signatureColumn}>
              <label style={styles.label}>Driver Signature:</label>
              {driverSignature ? (
                <div style={styles.signaturePreview}>
                  <img src={driverSignature} alt="Driver Signature" style={styles.signatureImage} />
                  <button onClick={() => setDriverSignature(null)} style={styles.clearSignatureBtn}>Clear</button>
                </div>
              ) : (
                <button onClick={() => setSignatureModal('driver')} style={styles.signButton}>
                  Driver - Tap to Sign
                </button>
              )}
              <p style={styles.signatureDate}>Date: {reportDate}</p>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div style={styles.submitRow}>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            style={styles.draftButton}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? 'Saving...' : 'Complete Report'}
          </button>
        </div>
      </div>

      {/* Signature Modal */}
      {signatureModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>
              {signatureModal === 'risk' ? 'Authorization Signature' :
               signatureModal === 'customer' ? 'Customer Signature' : 'Driver Signature'}
            </h3>
            <p style={styles.modalHint}>Sign in the box below</p>
            <canvas
              ref={signatureCanvasRef}
              width={350}
              height={200}
              style={styles.signatureCanvas}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div style={styles.modalButtons}>
              <button onClick={() => setSignatureModal(null)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={clearSignature} style={styles.clearBtn}>Clear</button>
              <button onClick={saveSignature} style={styles.saveBtn}>Save Signature</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: '#000',
    minHeight: '100vh',
    padding: '20px',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #333',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  title: {
    color: '#30ff37',
    fontSize: '24px',
    margin: '0',
  },
  subtitle: {
    color: '#888',
    fontSize: '14px',
    margin: '5px 0 0 0',
  },
  backButton: {
    padding: '10px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  form: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    background: '#1a1a1a',
    borderRadius: '12px',
    border: '1px solid #333',
  },
  sectionTitle: {
    color: '#30ff37',
    fontSize: '18px',
    margin: '0 0 15px 0',
  },
  radioGroup: {
    display: 'flex',
    gap: '30px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  radio: {
    width: '20px',
    height: '20px',
    accentColor: '#30ff37',
  },
  twoColumns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  column: {
    padding: '20px',
    background: '#1a1a1a',
    borderRadius: '12px',
    border: '1px solid #333',
  },
  formGroup: {
    marginBottom: '15px',
  },
  formRow: {
    display: 'flex',
    gap: '15px',
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    display: 'block',
    color: '#888',
    fontSize: '14px',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '12px',
    background: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    background: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    minHeight: '80px',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  disclaimer: {
    color: '#888',
    fontSize: '13px',
    lineHeight: '1.5',
    marginBottom: '15px',
  },
  signatureBox: {
    marginTop: '15px',
  },
  signaturePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginTop: '10px',
  },
  signatureImage: {
    maxWidth: '200px',
    maxHeight: '80px',
    border: '1px solid #333',
    borderRadius: '8px',
    background: '#fff',
  },
  clearSignatureBtn: {
    padding: '8px 16px',
    background: 'rgba(255, 68, 68, 0.1)',
    color: '#ff4444',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  signButton: {
    padding: '15px 30px',
    background: 'rgba(48, 255, 55, 0.1)',
    color: '#30ff37',
    border: '2px dashed #30ff37',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px',
  },
  diagramContainer: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '500px',
    margin: '20px auto',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #333',
    cursor: 'crosshair',
    touchAction: 'none',
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
    userSelect: 'none' as const,
    pointerEvents: 'none' as const,
  },
  marker: {
    position: 'absolute' as const,
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '14px',
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
    border: '2px solid #000',
    zIndex: 10,
  },
  hint: {
    color: '#888',
    fontSize: '13px',
    textAlign: 'center' as const,
    marginBottom: '10px',
  },
  markerNoteBox: {
    marginTop: '20px',
    padding: '15px',
    background: '#222',
    borderRadius: '8px',
    border: '1px solid #30ff37',
  },
  markerNoteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    color: '#30ff37',
    fontWeight: 'bold',
  },
  removeMarkerBtn: {
    padding: '6px 12px',
    background: 'rgba(255, 68, 68, 0.1)',
    color: '#ff4444',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  saveNoteBtn: {
    marginTop: '10px',
    padding: '10px 20px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  damageList: {
    marginTop: '20px',
    padding: '15px',
    background: '#222',
    borderRadius: '8px',
  },
  damageListTitle: {
    color: '#30ff37',
    margin: '0 0 10px 0',
  },
  damageItem: {
    display: 'flex',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid #333',
  },
  damageNumber: {
    color: '#30ff37',
    fontWeight: 'bold',
  },
  damageNote: {
    color: '#ccc',
  },
  insuranceBox: {
    padding: '15px',
    background: 'rgba(255, 193, 7, 0.1)',
    border: '1px solid rgba(255, 193, 7, 0.3)',
    borderRadius: '8px',
    marginBottom: '30px',
    color: '#ffc107',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  signatureRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  signatureColumn: {
    padding: '15px',
    background: '#222',
    borderRadius: '8px',
  },
  signatureDate: {
    color: '#888',
    fontSize: '13px',
    marginTop: '10px',
  },
  submitRow: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '30px',
  },
  draftButton: {
    padding: '15px 40px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  submitButton: {
    padding: '15px 40px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  error: {
    background: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid #ff4444',
    color: '#ff4444',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  success: {
    background: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid #30ff37',
    color: '#30ff37',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    background: '#1a1a1a',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '420px',
    width: '100%',
    border: '1px solid #30ff37',
  },
  modalTitle: {
    color: '#30ff37',
    margin: '0 0 10px 0',
    textAlign: 'center' as const,
  },
  modalHint: {
    color: '#888',
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  signatureCanvas: {
    width: '100%',
    height: '200px',
    background: '#fff',
    borderRadius: '8px',
    touchAction: 'none',
    cursor: 'crosshair',
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
    justifyContent: 'center',
  },
  cancelBtn: {
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '12px 24px',
    background: 'rgba(255, 152, 0, 0.1)',
    color: '#ff9800',
    border: '1px solid rgba(255, 152, 0, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '12px 24px',
    background: '#30ff37',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};
