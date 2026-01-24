import nodemailer from 'nodemailer';

const FROM_EMAIL = process.env.EMAIL_FROM || 'Autow Services <support@autow-services.co.uk>';

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface VehicleReportEmailData {
  customerName: string;
  customerEmail: string;
  vehicleReg: string;
  vehicleType?: string;
  serviceType: 'transport' | 'recovery';
  reportNumber: string;
  reportDate: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  reportUrl: string;
  customMessage?: string;
}

/**
 * Generate HTML email template for Vehicle Report
 */
export function getVehicleReportEmailHTML(data: VehicleReportEmailData): string {
  const serviceTitle = data.serviceType === 'recovery'
    ? 'Vehicle Recovery Report'
    : 'Vehicle Transport Report';

  const serviceDescription = data.serviceType === 'recovery'
    ? 'Please find below the details of your vehicle recovery service.'
    : 'Please find below the details of your vehicle transport service.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${serviceTitle} - AUTOW Services</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #1a1a1a; border: 1px solid rgba(48, 255, 55, 0.2); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(48, 255, 55, 0.15);">

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-bottom: 1px solid rgba(48, 255, 55, 0.2);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="https://autow-services.co.uk/logo.png" alt="AUTOW Services" style="width: 180px; height: auto; margin-bottom: 20px;">
                    <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6); margin-top: 10px;">
                      Professional Vehicle Transport & Recovery
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #30ff37; font-size: 24px; font-weight: 700; padding-bottom: 20px;">
                    ${serviceTitle}
                  </td>
                </tr>
                <tr>
                  <td style="color: #ffffff; font-size: 16px; line-height: 1.6; padding-bottom: 10px;">
                    Dear <strong>${data.customerName}</strong>,
                  </td>
                </tr>
                <tr>
                  <td style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; padding-bottom: 20px;">
                    ${serviceDescription}
                  </td>
                </tr>
                ${data.customMessage ? `
                <tr>
                  <td style="color: rgba(255, 255, 255, 0.8); font-size: 16px; line-height: 1.6; padding-bottom: 30px; background: rgba(48, 255, 55, 0.05); border-left: 3px solid #30ff37; padding: 15px; margin-bottom: 20px;">
                    ${data.customMessage}
                  </td>
                </tr>
                ` : ''}

                <!-- Report Details Box -->
                <tr>
                  <td style="padding: 25px; background: rgba(48, 255, 55, 0.05); border: 1px solid rgba(48, 255, 55, 0.2); border-radius: 12px; margin: 20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #30ff37; font-size: 14px; font-weight: 600; padding-bottom: 15px; border-bottom: 1px solid rgba(48, 255, 55, 0.1);">
                          REPORT DETAILS
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 15px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0; width: 40%;">Report Number:</td>
                              <td style="color: #ffffff; font-size: 14px; font-weight: 600; padding: 8px 0;">${data.reportNumber}</td>
                            </tr>
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0;">Date:</td>
                              <td style="color: #ffffff; font-size: 14px; font-weight: 600; padding: 8px 0;">${data.reportDate}</td>
                            </tr>
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0;">Vehicle Registration:</td>
                              <td style="color: #30ff37; font-size: 14px; font-weight: 700; padding: 8px 0;">${data.vehicleReg}</td>
                            </tr>
                            ${data.vehicleType ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0;">Vehicle:</td>
                              <td style="color: #ffffff; font-size: 14px; font-weight: 600; padding: 8px 0;">${data.vehicleType}</td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0;">Service Type:</td>
                              <td style="color: #ffffff; font-size: 14px; font-weight: 600; padding: 8px 0;">
                                <span style="background: ${data.serviceType === 'recovery' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(156, 39, 176, 0.2)'}; color: ${data.serviceType === 'recovery' ? '#2196f3' : '#9c27b0'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">
                                  ${data.serviceType}
                                </span>
                              </td>
                            </tr>
                            ${data.pickupLocation ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0;">Pickup Location:</td>
                              <td style="color: #ffffff; font-size: 14px; padding: 8px 0;">${data.pickupLocation}</td>
                            </tr>
                            ` : ''}
                            ${data.deliveryLocation ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0;">Delivery Location:</td>
                              <td style="color: #ffffff; font-size: 14px; padding: 8px 0;">${data.deliveryLocation}</td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- View Report Button -->
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="${data.reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #30ff37 0%, #20cc2a 100%); color: #000000; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 16px rgba(48, 255, 55, 0.4);">
                      View Full Report
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="color: rgba(255, 255, 255, 0.5); font-size: 14px; line-height: 1.6; padding-top: 20px;">
                    If you have any questions about this report or our services, please don't hesitate to contact us.
                  </td>
                </tr>

                <tr>
                  <td style="color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6; padding-top: 30px;">
                    Kind regards,<br>
                    <strong style="color: #30ff37;">The AUTOW Services Team</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(48, 255, 55, 0.05); border-top: 1px solid rgba(48, 255, 55, 0.1); padding: 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #30ff37; font-size: 14px; font-weight: 600; padding-bottom: 15px;">
                    Contact Us
                  </td>
                </tr>
                <tr>
                  <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; line-height: 1.8;">
                    <span style="color: #30ff37;">Phone:</span> 07737 006737<br>
                    <span style="color: #30ff37;">Email:</span> <a href="mailto:support@autow-services.co.uk" style="color: #30ff37; text-decoration: none;">support@autow-services.co.uk</a><br>
                    <span style="color: #30ff37;">Website:</span> <a href="https://autow-services.co.uk" style="color: #30ff37; text-decoration: none;">autow-services.co.uk</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px;">
                    <hr style="border: none; border-top: 1px solid rgba(48, 255, 55, 0.1); margin: 0;">
                  </td>
                </tr>
                <tr>
                  <td style="color: rgba(255, 255, 255, 0.4); font-size: 12px; padding-top: 20px; text-align: center;">
                    AUTOW Services Ltd<br>
                    Professional Vehicle Transport & Recovery<br>
                    <br>
                    This email was sent regarding your vehicle service. If you did not request this, please contact us.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send vehicle report email to customer
 */
export async function sendVehicleReportEmail(data: VehicleReportEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('SMTP not configured - missing SMTP_USER or SMTP_PASSWORD env vars');
      return { success: false, error: 'Email service not configured' };
    }

    const htmlContent = getVehicleReportEmailHTML(data);

    const serviceSubject = data.serviceType === 'recovery'
      ? `Vehicle Recovery Report - ${data.vehicleReg}`
      : `Vehicle Transport Report - ${data.vehicleReg}`;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: serviceSubject,
      html: htmlContent,
    });

    console.log(`Vehicle report email sent to ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending vehicle report email:', error?.message || error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
}

// ============================================
// DISCLAIMER EMAIL FUNCTIONS
// ============================================

interface DisclaimerEmailData {
  disclaimerNumber: string;
  procedureDescription: string;
  includeExistingPartsDisclaimer: boolean;
  includeDiagnosticPaymentDisclaimer: boolean;
  customerEmail: string;
  signedAt: string;
  // New fields for complete signed document
  customerName?: string;
  customerAddress?: string;
  vehicleReg?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  customerSignature?: string; // Base64 PNG
  shareToken?: string;
}

/**
 * Generate HTML email template for Staff notification when disclaimer is signed
 */
export function getDisclaimerStaffEmailHTML(data: DisclaimerEmailData): string {
  const signedDate = new Date(data.signedAt).toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const additionalDisclaimers = [];
  if (data.includeExistingPartsDisclaimer) {
    additionalDisclaimers.push('Using Existing Parts Disclaimer');
  }
  if (data.includeDiagnosticPaymentDisclaimer) {
    additionalDisclaimers.push('Diagnostic Payment Disclaimer');
  }

  const viewUrl = data.shareToken
    ? `https://booking.autow-services.co.uk/share/disclaimer/${data.shareToken}`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Disclaimer Signed - ${data.disclaimerNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #1a1a1a; border: 1px solid rgba(48, 255, 55, 0.2); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(48, 255, 55, 0.15);">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-bottom: 1px solid rgba(48, 255, 55, 0.2);">
              <img src="https://autow-services.co.uk/logo.png" alt="AUTOW Services" style="width: 180px; height: auto; margin-bottom: 20px;">
              <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6); margin-top: 10px;">
                Disclaimer Notification
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #30ff37; font-size: 24px; font-weight: 700; padding-bottom: 20px;">
                    ✓ Disclaimer Signed
                  </td>
                </tr>
                <tr>
                  <td style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; padding-bottom: 20px;">
                    A customer has signed the disclaimer form <strong style="color: #30ff37;">${data.disclaimerNumber}</strong>.
                  </td>
                </tr>

                <!-- Customer & Vehicle Details Box -->
                ${(data.customerName || data.vehicleReg) ? `
                <tr>
                  <td style="padding: 20px; background: rgba(33, 150, 243, 0.1); border: 1px solid rgba(33, 150, 243, 0.3); border-radius: 12px; margin-bottom: 15px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #2196f3; font-size: 14px; font-weight: 600; padding-bottom: 10px;">
                          CUSTOMER & VEHICLE
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            ${data.customerName ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 5px 0; width: 35%;">Customer:</td>
                              <td style="color: #ffffff; font-size: 14px; font-weight: 600; padding: 5px 0;">${data.customerName}</td>
                            </tr>
                            ` : ''}
                            ${data.customerAddress ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 5px 0; vertical-align: top;">Address:</td>
                              <td style="color: #ffffff; font-size: 14px; padding: 5px 0;">${data.customerAddress}</td>
                            </tr>
                            ` : ''}
                            ${data.vehicleReg ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 5px 0;">Vehicle Reg:</td>
                              <td style="color: #30ff37; font-size: 14px; font-weight: 700; padding: 5px 0;">${data.vehicleReg}</td>
                            </tr>
                            ` : ''}
                            ${(data.vehicleMake || data.vehicleModel) ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 5px 0;">Vehicle:</td>
                              <td style="color: #ffffff; font-size: 14px; padding: 5px 0;">${[data.vehicleMake, data.vehicleModel].filter(Boolean).join(' ')}</td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 15px;"></td></tr>
                ` : ''}

                <!-- Disclaimer Details Box -->
                <tr>
                  <td style="padding: 25px; background: rgba(48, 255, 55, 0.05); border: 1px solid rgba(48, 255, 55, 0.2); border-radius: 12px; margin: 20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #30ff37; font-size: 14px; font-weight: 600; padding-bottom: 15px; border-bottom: 1px solid rgba(48, 255, 55, 0.1);">
                          DISCLAIMER DETAILS
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 15px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0; width: 35%;">Reference:</td>
                              <td style="color: #30ff37; font-size: 14px; font-weight: 700; padding: 8px 0;">${data.disclaimerNumber}</td>
                            </tr>
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0;">Customer Email:</td>
                              <td style="color: #ffffff; font-size: 14px; font-weight: 600; padding: 8px 0;">${data.customerEmail}</td>
                            </tr>
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0;">Signed At:</td>
                              <td style="color: #ffffff; font-size: 14px; padding: 8px 0;">${signedDate}</td>
                            </tr>
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0; vertical-align: top;">Procedure:</td>
                              <td style="color: #ffffff; font-size: 14px; padding: 8px 0;">${data.procedureDescription}</td>
                            </tr>
                            ${additionalDisclaimers.length > 0 ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0; vertical-align: top;">Additional:</td>
                              <td style="color: #ff9800; font-size: 14px; padding: 8px 0;">${additionalDisclaimers.join(', ')}</td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Signature Box -->
                ${data.customerSignature ? `
                <tr><td style="height: 15px;"></td></tr>
                <tr>
                  <td style="padding: 20px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; font-weight: 600; padding-bottom: 10px;">
                          CUSTOMER SIGNATURE
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 15px; background: #ffffff; border-radius: 8px;">
                          <img src="${data.customerSignature}" alt="Customer Signature" style="max-width: 300px; max-height: 100px;">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}

                <!-- View Document Button -->
                ${viewUrl ? `
                <tr>
                  <td align="center" style="padding: 25px 0 10px 0;">
                    <a href="${viewUrl}" style="display: inline-block; background: linear-gradient(135deg, #30ff37 0%, #20cc2a 100%); color: #000000; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 30px; border-radius: 10px; box-shadow: 0 4px 16px rgba(48, 255, 55, 0.4);">
                      View Signed Document
                    </a>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(48, 255, 55, 0.05); border-top: 1px solid rgba(48, 255, 55, 0.1); padding: 20px 40px; text-align: center;">
              <p style="color: rgba(255, 255, 255, 0.4); font-size: 12px; margin: 0;">
                This is an automated notification from AUTOW Booking System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML email template for Customer confirmation after signing
 */
export function getDisclaimerCustomerEmailHTML(data: DisclaimerEmailData): string {
  const signedDate = new Date(data.signedAt).toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  let additionalDisclaimersHTML = '';
  if (data.includeExistingPartsDisclaimer) {
    additionalDisclaimersHTML += `
      <tr>
        <td style="padding: 15px; background: rgba(255, 152, 0, 0.1); border-left: 3px solid #ff9800; margin-bottom: 15px;">
          <strong style="color: #ff9800;">Using Existing Parts:</strong>
          <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; margin: 10px 0 0 0; line-height: 1.5;">
            You have been advised that using existing parts carries additional risk. You understand that while AUTOW Services will exercise due care, they cannot guarantee the condition or performance of parts that have not been supplied new.
          </p>
        </td>
      </tr>
      <tr><td style="height: 15px;"></td></tr>
    `;
  }
  if (data.includeDiagnosticPaymentDisclaimer) {
    additionalDisclaimersHTML += `
      <tr>
        <td style="padding: 15px; background: rgba(255, 152, 0, 0.1); border-left: 3px solid #ff9800; margin-bottom: 15px;">
          <strong style="color: #ff9800;">Diagnostic Payment:</strong>
          <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; margin: 10px 0 0 0; line-height: 1.5;">
            You understand that diagnostic work requires time and expertise. Should you decide not to proceed with repairs following the diagnostic assessment, you agree to pay for the diagnostic time at the quoted or standard rate.
          </p>
        </td>
      </tr>
      <tr><td style="height: 15px;"></td></tr>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Disclaimer Confirmation - ${data.disclaimerNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #1a1a1a; border: 1px solid rgba(48, 255, 55, 0.2); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(48, 255, 55, 0.15);">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-bottom: 1px solid rgba(48, 255, 55, 0.2);">
              <img src="https://autow-services.co.uk/logo.png" alt="AUTOW Services" style="width: 180px; height: auto; margin-bottom: 20px;">
              <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6); margin-top: 10px;">
                Disclaimer Confirmation
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #30ff37; font-size: 24px; font-weight: 700; padding-bottom: 20px;">
                    Thank You for Your Authorization
                  </td>
                </tr>
                <tr>
                  <td style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; padding-bottom: 20px;">
                    This email confirms that you have signed the disclaimer form for the procedure described below.
                  </td>
                </tr>

                <!-- Vehicle Details Box (if available) -->
                ${(data.vehicleReg || data.customerName) ? `
                <tr>
                  <td style="padding: 20px; background: rgba(33, 150, 243, 0.1); border: 1px solid rgba(33, 150, 243, 0.3); border-radius: 12px; margin-bottom: 15px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #2196f3; font-size: 14px; font-weight: 600; padding-bottom: 10px;">
                          YOUR DETAILS
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            ${data.customerName ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 5px 0; width: 35%;">Name:</td>
                              <td style="color: #ffffff; font-size: 14px; font-weight: 600; padding: 5px 0;">${data.customerName}</td>
                            </tr>
                            ` : ''}
                            ${data.vehicleReg ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 5px 0;">Vehicle Reg:</td>
                              <td style="color: #30ff37; font-size: 14px; font-weight: 700; padding: 5px 0;">${data.vehicleReg}</td>
                            </tr>
                            ` : ''}
                            ${(data.vehicleMake || data.vehicleModel) ? `
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 5px 0;">Vehicle:</td>
                              <td style="color: #ffffff; font-size: 14px; padding: 5px 0;">${[data.vehicleMake, data.vehicleModel].filter(Boolean).join(' ')}</td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 15px;"></td></tr>
                ` : ''}

                <!-- Details Box -->
                <tr>
                  <td style="padding: 25px; background: rgba(48, 255, 55, 0.05); border: 1px solid rgba(48, 255, 55, 0.2); border-radius: 12px; margin: 20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #30ff37; font-size: 14px; font-weight: 600; padding-bottom: 15px; border-bottom: 1px solid rgba(48, 255, 55, 0.1);">
                          AUTHORIZATION DETAILS
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 15px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0; width: 40%;">Reference:</td>
                              <td style="color: #30ff37; font-size: 14px; font-weight: 700; padding: 8px 0;">${data.disclaimerNumber}</td>
                            </tr>
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0;">Signed:</td>
                              <td style="color: #ffffff; font-size: 14px; padding: 8px 0;">${signedDate}</td>
                            </tr>
                            <tr>
                              <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding: 8px 0; vertical-align: top;">Procedure:</td>
                              <td style="color: #ffffff; font-size: 14px; padding: 8px 0;">${data.procedureDescription}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Your Signature -->
                ${data.customerSignature ? `
                <tr><td style="height: 15px;"></td></tr>
                <tr>
                  <td style="padding: 20px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; font-weight: 600; padding-bottom: 10px;">
                          YOUR SIGNATURE
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 15px; background: #ffffff; border-radius: 8px;">
                          <img src="${data.customerSignature}" alt="Your Signature" style="max-width: 300px; max-height: 100px;">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}

                <!-- Authorization Statement -->
                <tr>
                  <td style="padding: 20px 0;">
                    <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; line-height: 1.6; margin: 0; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                      <strong>Your Authorization:</strong> You have authorized AUTOW Services (or its agent) to carry out the above procedure(s). You understand that this carries an inherent risk of damage, and that damage may be caused to your vehicle. You have agreed that AUTOW Services (or its agent) cannot be held liable for any such damage.
                    </p>
                  </td>
                </tr>

                <!-- Additional Disclaimers if any -->
                ${additionalDisclaimersHTML ? `
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${additionalDisclaimersHTML}
                    </table>
                  </td>
                </tr>
                ` : ''}

                <tr>
                  <td style="color: rgba(255, 255, 255, 0.5); font-size: 14px; line-height: 1.6; padding-top: 20px;">
                    Please keep this email for your records. If you have any questions, please don't hesitate to contact us.
                  </td>
                </tr>

                <tr>
                  <td style="color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6; padding-top: 30px;">
                    Kind regards,<br>
                    <strong style="color: #30ff37;">The AUTOW Services Team</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(48, 255, 55, 0.05); border-top: 1px solid rgba(48, 255, 55, 0.1); padding: 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #30ff37; font-size: 14px; font-weight: 600; padding-bottom: 15px;">
                    Contact Us
                  </td>
                </tr>
                <tr>
                  <td style="color: rgba(255, 255, 255, 0.6); font-size: 14px; line-height: 1.8;">
                    <span style="color: #30ff37;">Email:</span> <a href="mailto:info@autow-services.co.uk" style="color: #30ff37; text-decoration: none;">info@autow-services.co.uk</a><br>
                    <span style="color: #30ff37;">Phone:</span> 07352968276<br>
                    <span style="color: #30ff37;">Address:</span> Alverton, Penzance, TR18 4QB<br>
                    <span style="color: #30ff37;">Website:</span> <a href="https://www.autow-services.co.uk" style="color: #30ff37; text-decoration: none;">autow-services.co.uk</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send disclaimer emails to both staff and customer
 */
export async function sendDisclaimerEmails(data: DisclaimerEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('SMTP not configured - missing SMTP_USER or SMTP_PASSWORD env vars');
      return { success: false, error: 'Email service not configured' };
    }

    const staffEmail = 'info@autow-services.co.uk';

    // Send to staff
    const staffHTML = getDisclaimerStaffEmailHTML(data);
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: staffEmail,
      subject: `Disclaimer Signed - ${data.disclaimerNumber}`,
      html: staffHTML,
    });
    console.log(`Disclaimer staff notification sent to ${staffEmail}`);

    // Send to customer
    const customerHTML = getDisclaimerCustomerEmailHTML(data);
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Disclaimer Confirmation - ${data.disclaimerNumber} - AUTOW Services`,
      html: customerHTML,
    });
    console.log(`Disclaimer confirmation sent to ${data.customerEmail}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error sending disclaimer emails:', error?.message || error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
}
