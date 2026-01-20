import { VoiceCommand } from './types';

/**
 * Parse [COMMAND:...] patterns from AI response text
 * Example patterns:
 *   [COMMAND:FILL_FIELD:customer_name:John Smith]
 *   [COMMAND:NAVIGATE:/autow/dashboard]
 *   [COMMAND:SUBMIT_FORM]
 *   [COMMAND:CLARIFY:What is the vehicle registration?]
 *   [COMMAND:CONFIRM:submit]
 *   [COMMAND:ADD_LINE_ITEM:Brake pads:part:150:1]
 */
export function parseCommands(text: string): { cleanText: string; commands: VoiceCommand[] } {
  const commands: VoiceCommand[] = [];
  const commandPattern = /\[COMMAND:([^\]]+)\]/g;

  let match;
  while ((match = commandPattern.exec(text)) !== null) {
    const commandStr = match[1];
    const parts = commandStr.split(':');
    const type = parts[0] as VoiceCommand['type'];

    switch (type) {
      case 'FILL_FIELD':
        if (parts.length >= 3) {
          commands.push({
            type: 'FILL_FIELD',
            field: parts[1],
            value: parts.slice(2).join(':'), // Join remaining parts in case value contains colons
          });
        }
        break;

      case 'NAVIGATE':
        if (parts.length >= 2) {
          commands.push({
            type: 'NAVIGATE',
            path: parts[1],
          });
        }
        break;

      case 'SUBMIT_FORM':
        commands.push({ type: 'SUBMIT_FORM' });
        break;

      case 'CLARIFY':
        if (parts.length >= 2) {
          commands.push({
            type: 'CLARIFY',
            message: parts.slice(1).join(':'),
          });
        }
        break;

      case 'CONFIRM':
        if (parts.length >= 2) {
          commands.push({
            type: 'CONFIRM',
            value: parts[1],
          });
        }
        break;

      case 'ADD_LINE_ITEM':
        // Format: ADD_LINE_ITEM:description:type:rate:quantity
        if (parts.length >= 5) {
          commands.push({
            type: 'ADD_LINE_ITEM',
            value: JSON.stringify({
              description: parts[1],
              item_type: parts[2],
              rate: parseFloat(parts[3]),
              quantity: parseFloat(parts[4]),
            }),
          });
        }
        break;

      default:
        console.warn('Unknown command type:', type);
    }
  }

  // Remove command patterns from text for clean display
  const cleanText = text.replace(commandPattern, '').trim();

  return { cleanText, commands };
}

/**
 * Check if text matches a quick command (navigation shortcuts)
 */
export function matchQuickCommand(text: string, quickCommands: Record<string, VoiceCommand>): VoiceCommand | null {
  const normalizedText = text.toLowerCase().trim();

  // Exact match
  if (quickCommands[normalizedText]) {
    return quickCommands[normalizedText];
  }

  // Fuzzy match - check if any quick command is contained in the text
  for (const [phrase, command] of Object.entries(quickCommands)) {
    if (normalizedText.includes(phrase)) {
      return command;
    }
  }

  return null;
}

/**
 * Normalize field values for specific field types
 */
export function normalizeFieldValue(fieldName: string, value: string): string {
  // Uppercase fields
  if (['vehicle_reg', 'location_postcode'].includes(fieldName)) {
    return value.toUpperCase().replace(/\s+/g, ' ').trim();
  }

  // Phone number - strip non-numeric except leading +
  if (['customer_phone', 'client_phone', 'client_mobile'].includes(fieldName)) {
    const hasPlus = value.startsWith('+');
    const digits = value.replace(/\D/g, '');
    return hasPlus ? '+' + digits : digits;
  }

  // Email - lowercase
  if (['customer_email', 'client_email'].includes(fieldName)) {
    return value.toLowerCase().trim();
  }

  // Date fields - try to parse natural language dates
  if (['booking_date', 'estimate_date', 'invoice_date', 'due_date'].includes(fieldName)) {
    return parseNaturalDate(value);
  }

  // Time fields - normalize to HH:mm
  if (['booking_time'].includes(fieldName)) {
    return parseNaturalTime(value);
  }

  return value.trim();
}

/**
 * Parse natural language date to YYYY-MM-DD format
 */
function parseNaturalDate(input: string): string {
  const lower = input.toLowerCase().trim();
  const today = new Date();

  // Handle "today", "tomorrow", "next week"
  if (lower === 'today') {
    return today.toISOString().split('T')[0];
  }
  if (lower === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  if (lower === 'next week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  // Handle day names like "monday", "next tuesday"
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const isNext = lower.startsWith('next ');
  const dayInput = isNext ? lower.replace('next ', '') : lower;
  const dayIndex = days.indexOf(dayInput);

  if (dayIndex !== -1) {
    const currentDay = today.getDay();
    let daysToAdd = dayIndex - currentDay;
    if (daysToAdd <= 0 || isNext) {
      daysToAdd += 7;
    }
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    return targetDate.toISOString().split('T')[0];
  }

  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  // Try to parse as UK date format DD/MM/YYYY
  const ukMatch = input.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (ukMatch) {
    const day = ukMatch[1].padStart(2, '0');
    const month = ukMatch[2].padStart(2, '0');
    let year = ukMatch[3];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month}-${day}`;
  }

  // Return original if can't parse
  return input;
}

/**
 * Parse natural language time to HH:mm format
 */
function parseNaturalTime(input: string): string {
  const lower = input.toLowerCase().trim();

  // Handle spoken times like "2pm", "2:30pm", "14:30"
  const timeMatch = lower.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3];

    if (meridian === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridian === 'am' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Handle word times
  const wordTimes: Record<string, string> = {
    'noon': '12:00',
    'midday': '12:00',
    'midnight': '00:00',
    'morning': '09:00',
    'afternoon': '14:00',
    'evening': '18:00',
  };

  if (wordTimes[lower]) {
    return wordTimes[lower];
  }

  // Return original if can't parse
  return input;
}
