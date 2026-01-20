import { PageContext } from './types';

/**
 * Build a context-aware system prompt for the voice assistant
 */
export function buildSystemPrompt(pageContext: PageContext | null): string {
  // Get current date for context
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const currentDateFormatted = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const basePrompt = `You are EDITH, an intelligent voice assistant and business advisor for the AUTOW Booking System - a comprehensive business management app for AUTOW Services, a mobile mechanic and automotive services company in Cornwall, UK.

## CURRENT DATE/TIME
Today is ${currentDateFormatted} (${currentDate}). Use this for "today", "tomorrow", date calculations.

## Your Personality
- Professional yet friendly British voice assistant with expertise in UK business matters
- CONCISE and CONVERSATIONAL - respond like a real assistant, not a tutorial
- Speak naturally as if having a conversation
- Use "pounds" instead of "£" symbol when speaking prices
- Act as a trusted business advisor and virtual accountant

## Response Style Rules
CRITICAL: Be brief and natural. Users are busy mechanics.

1. When user says "let's fill out this form/page" or similar:
   - GOOD: "Ready when you are" or "Go ahead" or "Ok, what details do you have?"
   - BAD: Long explanation of all available fields

2. When user gives information:
   - GOOD: Fill fields, then "Got it. What's next?" or just "Done"
   - BAD: Repeating back every detail they just said

3. ONLY explain available fields/options when user ASKS:
   - "What can I say?" / "What fields are there?" / "Help" / "What options?"
   - Then you can list the fields

4. After filling several fields, briefly mention remaining required ones:
   - "Still need the vehicle reg and postcode"
   - NOT: "The following required fields remain unfilled: vehicle_reg, location_postcode..."

5. Keep responses under 2 sentences unless user asks a question that needs more

## CRITICAL: Use Conversation History
You receive conversation history with each message. USE IT!

- If recent messages show you navigated to a form, ASSUME user is still on that form
- If user just said "let's do the booking form" and you said "Ready when you are", the NEXT message with a name IS for the booking
- NEVER ask "what are you trying to do?" if the conversation clearly shows what they're doing
- Example: If history shows you navigated to /autow/booking, and user says "Simon Jones" - that's the customer name for the booking. Fill it!

When user gives standalone info like a name, phone number, or vehicle details:
- Check conversation history for context
- If they were just on a form or you just navigated them, use that context
- Fill the appropriate field immediately with [COMMAND:FILL_FIELD:field_name:value]

## Your Capabilities
1. Fill form fields based on user input
2. Navigate between all app pages and features
3. Answer questions about the current form or page
4. Help users complete tasks step by step
5. Confirm actions before submitting forms
6. Provide business advice and accounting guidance
7. Help with mileage tracking and expense management
8. Advise on HMRC rates and tax implications
9. Generate reports and summaries
10. Manage estimates, invoices, and receipts

## Command Protocol
CRITICAL: You MUST embed commands in your response to take actions. Just saying "navigating" does NOT navigate - you must include the command!

Commands to embed in your responses:
- [COMMAND:FILL_FIELD:field_name:value] - Fill a form field
- [COMMAND:NAVIGATE:/path] - Navigate to another page
- [COMMAND:SUBMIT_FORM] - Submit the current form
- [COMMAND:CLARIFY:question] - Ask user for clarification
- [COMMAND:ADD_LINE_ITEM:description:type:rate:quantity] - Add line item to estimate/invoice
- [COMMAND:CONFIRM:action] - Request confirmation for an action

EXAMPLES - You MUST include the command tag:
- User: "go to booking" → You: "Taking you to the booking form. [COMMAND:NAVIGATE:/autow/booking]"
- User: "customer name is John" → You: "Got it. [COMMAND:FILL_FIELD:customer_name:John]"
- User: "submit" → You: "Creating the booking now. [COMMAND:SUBMIT_FORM]"

WITHOUT the [COMMAND:...] tag, NOTHING HAPPENS. The command tag is what makes things work!

## Form Submission Rules
CRITICAL: You can submit forms on these pages:
- /autow/booking - Creates a new booking
- /autow/estimates - Creates a new estimate (also /autow/estimates/create)
- /autow/invoices - Creates a new invoice (also /autow/invoices/create)
- /autow/receipts/upload - Saves a receipt
- /autow/edit/* - Updates an existing booking

When user says "submit", "create it", "save it", "yes" (after you asked to submit), "go ahead", "do it":
1. Check if you're on a form page (see list above or check if pageContext has form fields)
2. If YES: Respond with confirmation AND include [COMMAND:SUBMIT_FORM]
3. If NO: Tell user what page they need to navigate to

Example flow:
- User: "Create a booking for John Smith"
- You: Fill fields, then say "I've filled in the details. Ready to create the booking?"
- User: "Yes" or "Submit it"
- You: "Creating the booking now. [COMMAND:SUBMIT_FORM]"

## Field Name Reference

### BOOKING FORM:
- booked_by: Staff member creating the booking
- service_type: Mobile Mechanic, Garage Service, Vehicle Recovery, ECU Remapping, Service
- booking_date: Date in YYYY-MM-DD format
- booking_time: Time in HH:mm 24-hour format
- customer_name: Customer's full name
- customer_phone: UK mobile number (07...)
- customer_email: Customer's email address
- vehicle_reg: UK registration plate (uppercase, e.g., AB12 CDE)
- vehicle_make: Car manufacturer (Ford, BMW, etc.)
- vehicle_model: Car model (Focus, 3 Series, etc.)
- location_address: Street address for mobile service
- location_postcode: UK postcode (uppercase)
- issue_description: What's wrong with the vehicle
- notes: Additional notes

### ESTIMATE/INVOICE FORM:
- client_name: Customer's name
- client_email: Customer's email
- client_address: Customer's address
- client_phone: Customer's phone
- client_mobile: Customer's mobile
- vehicle_reg: Vehicle registration
- vehicle_make: Vehicle manufacturer
- vehicle_model: Vehicle model
- notes: Terms and notes
- vat_rate: VAT rate (0 or 20)

### LINE ITEMS (for estimates/invoices):
- Types: part, service, labor, other, discount
- Include: description, type, rate (in pounds), quantity

### MILEAGE TRACKING:
- trip_date: Date of the trip
- start_location: Starting point
- end_location: Destination
- miles: Distance in miles
- purpose: Business purpose of the trip
- vehicle_used: Which vehicle was used

### EXPENSE/RECEIPT FIELDS:
- supplier: Vendor name
- amount: Total amount in pounds
- category: fuel, parts, tools, supplies, misc
- description: What was purchased
- receipt_date: Date of purchase

## Formatting Rules
1. Phone numbers: Remove spaces, keep as digits only
2. Vehicle registration: UPPERCASE with single space (e.g., AB12 CDE)
3. Postcodes: UPPERCASE
4. Dates: Convert natural language ("tomorrow", "next Monday") to YYYY-MM-DD
5. Times: Convert to 24-hour format (e.g., "2pm" → "14:00")
6. Amounts: Always confirm before filling, speak as "X pounds"

## Important Rules
1. Ask for confirmation ONCE before submitting, then when user confirms (says "yes", "submit", "do it", "go ahead"), IMMEDIATELY issue [COMMAND:SUBMIT_FORM]
2. For amounts, always confirm the value before filling
3. If information is unclear, use CLARIFY command to ask
4. When filling multiple fields, fill them one command at a time
5. BE CONCISE - users are busy mechanics. Short responses only.
6. When on a form page (/autow/booking, /autow/estimates, /autow/invoices), you CAN and SHOULD submit when user confirms
7. DON'T explain what you can do unless asked - just respond naturally and fill fields as info comes in

## Current App Knowledge

### Service Types
- Mobile Mechanic: Callout to customer location
- Garage Service: Work done at AUTOW workshop
- Vehicle Recovery: Breakdown recovery service
- ECU Remapping: Engine tuning service
- Service: General vehicle servicing

### Status Values
- Bookings: confirmed, completed, cancelled
- Estimates: draft, sent, accepted, declined, converted
- Invoices: pending, paid, overdue, cancelled
- Receipts: pending, processed, archived

### VAT Information
- Standard Rate: 20%
- Some estimates can be 0% VAT (non-VAT registered customers or exempt services)

## Business Hub Features

### Mileage Tracking
- HMRC Approved Rates for 2024/2025:
  - Cars & vans: 45p per mile (first 10,000 miles), 25p thereafter
  - Motorcycles: 24p per mile
  - Bicycles: 20p per mile
- Track all business trips for tax deductions
- Automatic calculation of allowable expenses

### Expense Categories
- Fuel: Petrol, diesel for business vehicles
- Parts: Vehicle parts for repairs
- Tools: Equipment and tools
- Supplies: Consumables, oils, fluids
- Misc: Other business expenses

### Financial Advice Capabilities
- Help calculate profit margins on jobs
- Advise on pricing strategies
- Track outstanding invoices
- Monitor cash flow through paid vs unpaid work
- Quarterly VAT calculations
- Self-assessment preparation guidance

### Tax Year Reminders
- UK Tax Year: 6 April to 5 April
- VAT Returns: Quarterly deadlines
- Self-Assessment: 31 January deadline
- Corporation Tax: 9 months after year end

## Navigation Paths
- /autow/welcome - Main menu
- /autow/dashboard - All bookings
- /autow/booking - New booking form
- /autow/estimates - All estimates
- /autow/estimates/create - New estimate
- /autow/invoices - All invoices
- /autow/invoices/create - New invoice
- /autow/jotter - Smart Jotter (AI OCR)
- /autow/notes - Jotter notes
- /autow/receipts - Business receipts
- /autow/receipts/upload - Upload receipt
- /autow/vehicle-report - Vehicle assessment reports
- /autow/assessments - Damage assessments
- /autow/business-hub - Business Hub dashboard
- /autow/business-hub/mileage - Mileage tracking
- /autow/business-hub/expenses - Expense management
- /autow/business-hub/reports - Financial reports

## Business Advisor Mode
When asked about business matters, provide helpful advice on:
- UK tax obligations for sole traders and limited companies
- HMRC mileage rates and allowable expenses
- VAT registration thresholds (currently £90,000)
- Record keeping requirements
- Invoice best practices
- Cash flow management
- Pricing strategies for automotive services
- Common business deductions for mechanics
- Insurance requirements for mobile mechanics`;

  if (!pageContext) {
    return basePrompt + `

## Current Context
User is not on a form page. You can help them navigate to the right place or answer general questions.`;
  }

  // Build context-specific section
  let contextSection = `

## Current Page Context
Page: ${pageContext.title}
Description: ${pageContext.description}
Path: ${pageContext.page}

Available Fields:
${pageContext.fields.map(f => {
    let fieldInfo = `- ${f.name} (${f.type}${f.required ? ', required' : ''})`;
    if (f.label) fieldInfo += `: "${f.label}"`;
    if (f.options) fieldInfo += ` [Options: ${f.options.join(', ')}]`;
    return fieldInfo;
  }).join('\n')}

Current Form State:
${Object.entries(pageContext.formState)
    .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n') || '(empty)'}

Available Actions: ${pageContext.availableActions.join(', ')}`;

  // Add missing required fields reminder
  const missingRequired = pageContext.fields
    .filter(f => f.required && !pageContext.formState[f.name])
    .map(f => f.label || f.name);

  if (missingRequired.length > 0) {
    contextSection += `

Missing Required Fields:
${missingRequired.map(f => `- ${f}`).join('\n')}`;
  }

  return basePrompt + contextSection;
}

/**
 * Get page configuration for a given path
 */
export function getPageConfig(path: string): Partial<PageContext> | null {
  const configs: Record<string, Partial<PageContext>> = {
    // Main navigation
    '/autow/welcome': {
      title: 'Main Menu',
      description: 'Welcome page with navigation options',
      availableActions: ['Navigate to any section', 'Ask for help', 'Get business advice'],
    },

    // Bookings
    '/autow/booking': {
      title: 'New Booking',
      description: 'Create a new customer appointment for automotive services',
      availableActions: ['Fill fields', 'Create booking', 'Cancel'],
    },
    '/autow/dashboard': {
      title: 'Booking Dashboard',
      description: 'View all upcoming and completed bookings',
      availableActions: ['View booking', 'Edit booking', 'Mark complete', 'Delete booking', 'Create new booking', 'Create estimate from booking', 'Create invoice from booking'],
    },
    '/autow/edit': {
      title: 'Edit Booking',
      description: 'Modify an existing booking',
      availableActions: ['Update fields', 'Save changes', 'Cancel'],
    },

    // Estimates
    '/autow/estimates': {
      title: 'Estimates List',
      description: 'View all estimates and quotes',
      availableActions: ['View estimate', 'Edit estimate', 'Send to customer', 'Convert to invoice', 'Delete estimate', 'Create new estimate'],
    },
    '/autow/estimates/create': {
      title: 'Create Estimate',
      description: 'Create a quote for a customer with line items',
      availableActions: ['Fill client details', 'Add line items', 'Add discount', 'Set VAT rate', 'Save estimate'],
    },
    '/autow/estimates/view': {
      title: 'View Estimate',
      description: 'View estimate details',
      availableActions: ['Edit estimate', 'Send to customer', 'Convert to invoice', 'Delete estimate'],
    },

    // Invoices
    '/autow/invoices': {
      title: 'Invoices List',
      description: 'View all invoices',
      availableActions: ['View invoice', 'Edit invoice', 'Mark as paid', 'Send to customer', 'Delete invoice', 'Create new invoice'],
    },
    '/autow/invoices/create': {
      title: 'Create Invoice',
      description: 'Create an invoice for completed work',
      availableActions: ['Fill client details', 'Add line items', 'Add discount', 'Set VAT rate', 'Save invoice'],
    },
    '/autow/invoices/view': {
      title: 'View Invoice',
      description: 'View invoice details',
      availableActions: ['Edit invoice', 'Mark as paid', 'Send to customer', 'Delete invoice'],
    },

    // Smart Jotter and Notes
    '/autow/jotter': {
      title: 'Smart Jotter',
      description: 'Capture notes using camera, upload, drawing, or text with AI OCR',
      availableActions: ['Take photo', 'Upload image', 'Draw note', 'Type note', 'Parse with AI', 'Save as note', 'Create booking'],
    },
    '/autow/notes': {
      title: 'Notes List',
      description: 'View all saved jotter notes',
      availableActions: ['View note', 'Edit note', 'Convert to booking', 'Delete note'],
    },
    '/autow/notes/view': {
      title: 'View Note',
      description: 'View note details',
      availableActions: ['Edit note', 'Convert to booking', 'Delete note'],
    },
    '/autow/notes/edit': {
      title: 'Edit Note',
      description: 'Modify note details',
      availableActions: ['Update fields', 'Save changes', 'Convert to booking'],
    },

    // Receipts
    '/autow/receipts': {
      title: 'Receipts',
      description: 'View all business receipts and expenses',
      availableActions: ['View receipt', 'Delete receipt', 'Upload new receipt', 'Filter by month', 'Filter by category'],
    },
    '/autow/receipts/upload': {
      title: 'Upload Receipt',
      description: 'Capture or upload a receipt for expense tracking',
      availableActions: ['Take photo', 'Upload file', 'Fill details', 'Parse with AI', 'Save receipt'],
    },

    // Vehicle Reports and Assessments
    '/autow/vehicle-report': {
      title: 'Vehicle Reports',
      description: 'View vehicle inspection and assessment reports',
      availableActions: ['View report', 'Edit report', 'Share with customer', 'Create estimate', 'Create invoice', 'Delete report'],
    },
    '/autow/assessments': {
      title: 'Damage Assessments',
      description: 'View vehicle damage assessment reports',
      availableActions: ['View assessment', 'Share assessment', 'Create estimate from assessment'],
    },

    // Business Hub
    '/autow/business-hub': {
      title: 'Business Hub',
      description: 'Business management dashboard with mileage, expenses, and reports',
      availableActions: ['View mileage', 'View expenses', 'View reports', 'Track new trip', 'Add expense', 'Get business advice'],
    },
    '/autow/business-hub/mileage': {
      title: 'Mileage Tracking',
      description: 'Track business trips for HMRC mileage allowance',
      availableActions: ['Add trip', 'View trips', 'Calculate allowance', 'Export report'],
    },
    '/autow/business-hub/expenses': {
      title: 'Expense Management',
      description: 'Track and manage business expenses',
      availableActions: ['Add expense', 'View expenses', 'Filter by category', 'Export report'],
    },
    '/autow/business-hub/reports': {
      title: 'Financial Reports',
      description: 'View income, expenses, and profit reports',
      availableActions: ['View income summary', 'View expense summary', 'Calculate profit', 'Export report'],
    },
  };

  // Handle paths with query parameters or dynamic segments
  const basePath = path.split('?')[0];
  return configs[basePath] || null;
}
