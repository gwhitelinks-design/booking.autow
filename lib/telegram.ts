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
