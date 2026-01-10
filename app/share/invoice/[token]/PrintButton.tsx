'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '12px 24px',
        background: '#30ff37',
        border: 'none',
        borderRadius: '8px',
        color: '#000',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
      }}
      className="print-btn"
    >
      🖨️ Print / Save as PDF
    </button>
  );
}
