'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #30ff37 0%, #20cc2a 100%)',
        color: '#000',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
      className="print-btn"
    >
      Print / Download PDF
    </button>
  );
}
