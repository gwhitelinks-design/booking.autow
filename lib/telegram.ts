export async function sendTelegramNotification(bookingData: any) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramBotToken || !telegramChatId) {
    console.warn('Telegram credentials not configured');
    return { success: false, error: 'Telegram not configured' };
  }

  const message = `
🔔 *NEW BOOKING ALERT*

🔧 *Service:* ${bookingData.service_type}
📅 *Date:* ${bookingData.booking_date}
⏰ *Time:* ${bookingData.booking_time.substring(0, 5)}

👤 *Customer:* ${bookingData.customer_name}
📞 *Phone:* ${bookingData.customer_phone}
${bookingData.customer_email ? `📧 *Email:* ${bookingData.customer_email}` : ''}

🚗 *Vehicle:* ${bookingData.vehicle_make} ${bookingData.vehicle_model}
🔢 *Reg:* ${bookingData.vehicle_reg}

📍 *Location:* ${bookingData.location_address}, ${bookingData.location_postcode}

🛠 *Issue:* ${bookingData.issue_description}
${bookingData.notes ? `📝 *Notes:* ${bookingData.notes}` : ''}

👷 *Booked by:* ${bookingData.booked_by}
  `.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      console.error('Telegram API error:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendShareLinkNotification(documentType: 'estimate' | 'invoice' | 'assessment', documentData: any) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramBotToken || !telegramChatId) {
    console.warn('Telegram credentials not configured');
    return { success: false, error: 'Telegram not configured' };
  }

  let message = '';

  if (documentType === 'assessment') {
    // Damage Assessment notification
    message = `
🔍 *DAMAGE ASSESSMENT VIEWED*

🚗 *Vehicle:* ${documentData.vehicle_reg || 'N/A'}
${documentData.vehicle_make && documentData.vehicle_model ? `🔧 *Make/Model:* ${documentData.vehicle_make} ${documentData.vehicle_model}` : ''}

📅 *Assessment Date:* ${documentData.assessment_date ? new Date(documentData.assessment_date).toLocaleDateString('en-GB') : 'N/A'}
${documentData.recommendation ? `📊 *Recommendation:* ${documentData.recommendation.toUpperCase()}` : ''}

💷 *Est. Repair Cost:* £${parseFloat(documentData.repair_cost_min || 0).toFixed(0)} - £${parseFloat(documentData.repair_cost_max || 0).toFixed(0)}

⏰ *Viewed:* ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
    `.trim();
  } else {
    // Estimate/Invoice notification
    const icon = documentType === 'estimate' ? '📋' : '💰';
    const docType = documentType.charAt(0).toUpperCase() + documentType.slice(1);

    message = `
${icon} *${docType.toUpperCase()} VIEWED*

👤 *Client:* ${documentData.client_name}
${documentData.client_phone ? `📞 *Phone:* ${documentData.client_phone}` : ''}
${documentData.client_email ? `📧 *Email:* ${documentData.client_email}` : ''}

${documentData.vehicle_reg ? `🚗 *Vehicle:* ${documentData.vehicle_reg}` : ''}
${documentData.vehicle_make && documentData.vehicle_model ? `🔧 *Make/Model:* ${documentData.vehicle_make} ${documentData.vehicle_model}` : ''}

💷 *Total:* £${parseFloat(documentData.total).toFixed(2)}
${documentData.status ? `📊 *Status:* ${documentData.status}` : ''}

⏰ *Viewed:* ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
    `.trim();
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      console.error('Telegram API error:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return { success: false, error: String(error) };
  }
}
