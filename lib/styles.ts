/**
 * AUTOW Shared Styles
 * 
 * Centralized style definitions to eliminate duplication across pages.
 * Import what you need: import { colors, commonStyles, buttonStyles } from '@/lib/styles';
 */

import type { CSSProperties } from 'react';

// ============================================
// BRAND COLORS
// ============================================
export const colors = {
  // Primary brand
  primary: '#30ff37',
  primaryDark: '#28d930',
  primaryGlow: 'rgba(48, 255, 55, 0.3)',
  
  // Backgrounds
  bgDark: '#000000',
  bgCard: 'rgba(0, 0, 0, 0.4)',
  bgCardDark: 'rgba(0, 0, 0, 0.3)',
  bgHover: 'rgba(48, 255, 55, 0.1)',
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: '#aaaaaa',
  textMuted: '#666666',
  
  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  
  // Status backgrounds
  successBg: 'rgba(76, 175, 80, 0.1)',
  warningBg: 'rgba(255, 152, 0, 0.1)',
  errorBg: 'rgba(244, 67, 54, 0.1)',
  infoBg: 'rgba(33, 150, 243, 0.1)',
  
  // Borders
  borderLight: 'rgba(255, 255, 255, 0.12)',
  borderMedium: 'rgba(255, 255, 255, 0.2)',
  borderPrimary: 'rgba(48, 255, 55, 0.3)',
  
  // Document statuses
  draft: '#9e9e9e',
  sent: '#2196f3',
  accepted: '#4caf50',
  declined: '#f44336',
  converted: '#9c27b0',
  pending: '#ff9800',
  paid: '#4caf50',
  overdue: '#f44336',
  confirmed: '#4caf50',
  completed: '#2196f3',
  cancelled: '#9e9e9e',
} as const;

// ============================================
// COMMON LAYOUT STYLES
// ============================================
export const layoutStyles: { [key: string]: CSSProperties } = {
  // Full page container with safe areas
  pageContainer: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    minHeight: '100vh',
    padding: '20px',
    paddingTop: 'max(20px, env(safe-area-inset-top))',
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    paddingLeft: 'max(20px, env(safe-area-inset-left))',
    paddingRight: 'max(20px, env(safe-area-inset-right))',
  },
  
  // Centered container
  centeredContainer: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    paddingTop: 'max(20px, env(safe-area-inset-top))',
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    paddingLeft: 'max(20px, env(safe-area-inset-left))',
    paddingRight: 'max(20px, env(safe-area-inset-right))',
  },
  
  // Content box with glass effect
  contentBox: {
    maxWidth: '900px',
    width: '100%',
    background: colors.bgCard,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    border: `1px solid ${colors.borderLight}`,
  },
  
  // Narrow content box (for forms)
  narrowContentBox: {
    maxWidth: '500px',
    width: '100%',
    background: colors.bgCard,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    border: `1px solid ${colors.borderLight}`,
  },
  
  // Wide content box (for tables/lists)
  wideContentBox: {
    maxWidth: '1200px',
    width: '100%',
    background: colors.bgCard,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    border: `1px solid ${colors.borderLight}`,
  },
};

// ============================================
// TYPOGRAPHY STYLES
// ============================================
export const textStyles: { [key: string]: CSSProperties } = {
  // Page titles
  pageTitle: {
    color: colors.primary,
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '5px',
    margin: '0 0 5px 0',
  },
  
  // Section titles
  sectionTitle: {
    color: colors.primary,
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '20px',
    margin: '0 0 20px 0',
  },
  
  // Subtitles
  subtitle: {
    color: colors.textSecondary,
    fontSize: '16px',
    margin: '0',
  },
  
  // Body text
  bodyText: {
    color: colors.textPrimary,
    fontSize: '14px',
    lineHeight: 1.6,
  },
  
  // Muted text
  mutedText: {
    color: colors.textMuted,
    fontSize: '13px',
  },
  
  // Labels
  label: {
    color: colors.textSecondary,
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '6px',
    display: 'block',
  },
  
  // Error text
  errorText: {
    color: colors.error,
    fontSize: '13px',
    marginTop: '4px',
  },
};

// ============================================
// BUTTON STYLES
// ============================================
export const buttonStyles: { [key: string]: CSSProperties } = {
  // Primary button (green)
  primary: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
    color: '#000',
    transition: 'all 0.3s',
    minHeight: '56px',
    boxShadow: `0 4px 15px ${colors.primaryGlow}`,
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  
  // Secondary button (outlined)
  secondary: {
    width: '100%',
    padding: '14px',
    border: `2px solid ${colors.borderMedium}`,
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    background: 'transparent',
    color: colors.textPrimary,
    transition: 'all 0.3s',
    minHeight: '56px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  
  // Danger button (red)
  danger: {
    width: '100%',
    padding: '14px',
    border: `2px solid rgba(244, 67, 54, 0.2)`,
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    background: colors.errorBg,
    color: colors.error,
    transition: 'all 0.3s',
    minHeight: '56px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  
  // Success button (green outline)
  success: {
    width: '100%',
    padding: '14px',
    border: `2px solid rgba(76, 175, 80, 0.3)`,
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    background: colors.successBg,
    color: colors.success,
    transition: 'all 0.3s',
    minHeight: '56px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  
  // Warning button (orange)
  warning: {
    width: '100%',
    padding: '14px',
    border: `2px solid rgba(255, 152, 0, 0.3)`,
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    background: colors.warningBg,
    color: colors.warning,
    transition: 'all 0.3s',
    minHeight: '56px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  
  // Small button
  small: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    background: colors.bgCardDark,
    color: colors.textPrimary,
    transition: 'all 0.3s',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  
  // Icon button
  icon: {
    padding: '10px',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '10px',
    fontSize: '18px',
    cursor: 'pointer',
    background: colors.bgCardDark,
    color: colors.textPrimary,
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  
  // Disabled state (apply with spread)
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none' as const,
  },
};

// ============================================
// INPUT STYLES
// ============================================
export const inputStyles: { [key: string]: CSSProperties } = {
  // Standard input
  input: {
    width: '100%',
    padding: '14px 16px',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '12px',
    fontSize: '15px',
    background: colors.bgCardDark,
    color: colors.textPrimary,
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box' as const,
  },
  
  // Textarea
  textarea: {
    width: '100%',
    padding: '14px 16px',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '12px',
    fontSize: '15px',
    background: colors.bgCardDark,
    color: colors.textPrimary,
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box' as const,
    minHeight: '100px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  
  // Select
  select: {
    width: '100%',
    padding: '14px 16px',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '12px',
    fontSize: '15px',
    background: colors.bgCardDark,
    color: colors.textPrimary,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
  },
  
  // Input group (label + input wrapper)
  inputGroup: {
    marginBottom: '20px',
  },
  
  // Input with error
  inputError: {
    borderColor: colors.error,
  },
};

// ============================================
// CARD STYLES
// ============================================
export const cardStyles: { [key: string]: CSSProperties } = {
  // Standard card
  card: {
    background: colors.bgCardDark,
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  },
  
  // Clickable card
  clickableCard: {
    background: colors.bgCardDark,
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '20px',
    padding: '40px 10px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    minHeight: '180px',
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
    touchAction: 'manipulation',
  },
  
  // Info card (for displaying data)
  infoCard: {
    background: 'rgba(48, 255, 55, 0.05)',
    border: `1px solid ${colors.borderPrimary}`,
    borderRadius: '12px',
    padding: '16px',
  },
  
  // Alert card
  alertCard: {
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
};

// ============================================
// TABLE STYLES
// ============================================
export const tableStyles: { [key: string]: CSSProperties } = {
  // Table container
  container: {
    overflowX: 'auto' as const,
    borderRadius: '12px',
    border: `1px solid ${colors.borderLight}`,
  },
  
  // Table
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '14px',
  },
  
  // Table header
  th: {
    background: colors.bgCardDark,
    color: colors.textSecondary,
    padding: '14px 16px',
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  
  // Table cell
  td: {
    padding: '14px 16px',
    borderBottom: `1px solid ${colors.borderLight}`,
    color: colors.textPrimary,
  },
  
  // Table row hover (add via CSS)
  rowHover: {
    background: colors.bgHover,
  },
};

// ============================================
// STATUS BADGE STYLES
// ============================================
export const getStatusStyle = (status: string): CSSProperties => {
  const baseStyle: CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'capitalize' as const,
  };
  
  const statusColors: { [key: string]: { bg: string; color: string } } = {
    draft: { bg: 'rgba(158, 158, 158, 0.2)', color: colors.draft },
    sent: { bg: 'rgba(33, 150, 243, 0.2)', color: colors.sent },
    accepted: { bg: 'rgba(76, 175, 80, 0.2)', color: colors.accepted },
    declined: { bg: 'rgba(244, 67, 54, 0.2)', color: colors.declined },
    converted: { bg: 'rgba(156, 39, 176, 0.2)', color: colors.converted },
    pending: { bg: 'rgba(255, 152, 0, 0.2)', color: colors.pending },
    paid: { bg: 'rgba(76, 175, 80, 0.2)', color: colors.paid },
    overdue: { bg: 'rgba(244, 67, 54, 0.2)', color: colors.overdue },
    confirmed: { bg: 'rgba(76, 175, 80, 0.2)', color: colors.confirmed },
    completed: { bg: 'rgba(33, 150, 243, 0.2)', color: colors.completed },
    cancelled: { bg: 'rgba(158, 158, 158, 0.2)', color: colors.cancelled },
    active: { bg: 'rgba(76, 175, 80, 0.2)', color: colors.success },
  };
  
  const statusStyle = statusColors[status.toLowerCase()] || statusColors.draft;
  
  return {
    ...baseStyle,
    background: statusStyle.bg,
    color: statusStyle.color,
  };
};

// ============================================
// LOADING STYLES
// ============================================
export const loadingStyles: { [key: string]: CSSProperties } = {
  // Full page loading
  fullPage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  
  // Loading text
  text: {
    color: colors.primary,
    fontSize: '24px',
    textAlign: 'center' as const,
  },
  
  // Spinner container
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
  },
  
  // Inline loading
  inline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: colors.textSecondary,
  },
};

// ============================================
// MODAL STYLES
// ============================================
export const modalStyles: { [key: string]: CSSProperties } = {
  // Overlay
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  
  // Modal content
  content: {
    background: colors.bgCard,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto' as const,
    border: `1px solid ${colors.borderLight}`,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  
  // Modal header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  
  // Modal title
  title: {
    color: colors.primary,
    fontSize: '20px',
    fontWeight: 600,
    margin: 0,
  },
  
  // Modal close button
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: colors.textSecondary,
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
  },
  
  // Modal footer
  footer: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
};

// ============================================
// UTILITY FUNCTION: Merge styles
// ============================================
export const mergeStyles = (...styles: (CSSProperties | undefined | false)[]): CSSProperties => {
  return styles.reduce<CSSProperties>((acc, style) => {
    if (style) {
      return { ...acc, ...style };
    }
    return acc;
  }, {});
};

// ============================================
// HEADER STYLES (for share pages)
// ============================================
export const headerStyles: { [key: string]: CSSProperties } = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: `1px solid ${colors.borderLight}`,
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  
  logo: {
    width: '80px',
    height: 'auto',
    filter: `drop-shadow(0 4px 12px ${colors.primaryGlow})`,
  },
  
  businessInfo: {
    textAlign: 'right' as const,
  },
  
  businessName: {
    color: colors.primary,
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 4px 0',
  },
  
  businessDetail: {
    color: colors.textSecondary,
    fontSize: '13px',
    margin: '2px 0',
  },
};
