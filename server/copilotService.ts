import OpenAI from 'openai';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { searchComplianceKnowledge } from './complianceSearchService';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are Fleet Copilot, an expert AI assistant built into TitanFleet — a UK fleet management platform for transport operators.

You have deep knowledge of:
- UK transport law and DVSA regulations
- Operator licensing (O-licence requirements)
- Driver hours rules (EU/UK tachograph regulations)
- Vehicle roadworthiness and walkaround checks
- Fleet compliance and audit preparation

You also have LIVE ACCESS to this company's fleet data via tools — use them to answer factual questions accurately.

When answering:
- Be concise and direct, like a knowledgeable transport manager colleague
- For data questions, always use the tools to get accurate real-time information
- Format responses clearly — use bullet points for lists, bold for key facts
- If a driver or vehicle isn't found, say so clearly
- For compliance questions, cite the relevant regulation or DVSA guidance
- Always think about safety and compliance implications

You speak like a professional with 20 years in UK transport — practical, knowledgeable, no nonsense.`;

// Tool definitions for GPT-4o function calling
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_vehicle_by_registration',
      description: 'Look up a vehicle by its registration number/number plate',
      parameters: {
        type: 'object',
        properties: {
          registration: { type: 'string', description: 'Vehicle registration number e.g. AB65 4TG' },
        },
        required: ['registration'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_driver_for_vehicle_on_date',
      description: 'Find out which driver was assigned to or drove a specific vehicle on a specific date. Checks inspections, timesheets and GPS data.',
      parameters: {
        type: 'object',
        properties: {
          vehicle_id: { type: 'number', description: 'Internal vehicle ID' },
          registration: { type: 'string', description: 'Vehicle registration as fallback' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_active_driver_locations',
      description: 'Get current GPS locations of all drivers who are clocked in or recently active. Returns driver names, coordinates, speed, and approximate location.',
      parameters: {
        type: 'object',
        properties: {
          search_location: { type: 'string', description: 'Optional city or place name to filter nearby drivers e.g. Sheffield, Leeds' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_fleet_status',
      description: 'Get a summary of the current fleet status — vehicles, active drivers, defects, MOT status, and compliance overview',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_defects',
      description: 'Get defects for the fleet — open defects, resolved, or for a specific vehicle',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['open', 'resolved', 'all'], description: 'Filter by defect status' },
          vehicle_registration: { type: 'string', description: 'Optional: filter by vehicle registration' },
          limit: { type: 'number', description: 'Max number of defects to return, default 10' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_driver_info',
      description: 'Get information about a specific driver or list all drivers',
      parameters: {
        type: 'object',
        properties: {
          driver_name: { type: 'string', description: 'Driver name to search for (partial match)' },
          include_hours: { type: 'boolean', description: 'Whether to include recent working hours' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_mot_status',
      description: 'Get MOT expiry dates and status for fleet vehicles. Can filter by vehicles expiring soon.',
      parameters: {
        type: 'object',
        properties: {
          days_ahead: { type: 'number', description: 'Show vehicles with MOT expiring within this many days. 0 = all vehicles.' },
          registration: { type: 'string', description: 'Optional: check a specific vehicle' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_inspections',
      description: 'Get vehicle inspection records — walkaround checks, PMI records, by driver or vehicle',
      parameters: {
        type: 'object',
        properties: {
          vehicle_registration: { type: 'string', description: 'Filter by vehicle registration' },
          driver_name: { type: 'string', description: 'Filter by driver name' },
          date_from: { type: 'string', description: 'Start date YYYY-MM-DD' },
          date_to: { type: 'string', description: 'End date YYYY-MM-DD' },
          limit: { type: 'number', description: 'Max records to return, default 10' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_compliance_knowledge',
      description: 'Search the DVSA compliance knowledge base for regulatory information, rules, and guidance. Use for questions about regulations, rules, legal requirements.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The compliance or regulatory question to search for' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_driver_hours',
      description: 'Get driver working hours and tachograph data for compliance checking',
      parameters: {
        type: 'object',
        properties: {
          driver_name: { type: 'string', description: 'Driver name' },
          date_from: { type: 'string', description: 'Start date YYYY-MM-DD' },
          date_to: { type: 'string', description: 'End date YYYY-MM-DD, defaults to today' },
        },
      },
    },
  },
];

// ─── Tool execution functions ─────────────────────────────────────────────────

async function getVehicleByRegistration(companyId: number, registration: string) {
  const reg = registration.toUpperCase().replace(/\s+/g, '');
  const result = await db.execute(sql`
    SELECT v.id, v.registration, v.make, v.model, v.type, v.mot_expiry, v.fuel_type, v.status, v.year
    FROM vehicles v
    WHERE v.company_id = ${companyId}
      AND UPPER(REPLACE(v.registration, ' ', '')) = ${reg}
    LIMIT 1
  `);
  return result.rows?.[0] || null;
}

async function getDriverForVehicleOnDate(companyId: number, vehicleId: number | null, registration: string | null, date: string) {
  // Try inspections first
  let vehicleFilter = vehicleId
    ? sql`v.id = ${vehicleId}`
    : sql`UPPER(REPLACE(v.registration, ' ', '')) = ${(registration || '').toUpperCase().replace(/\s+/g, '')}`;

  const inspResult = await db.execute(sql`
    SELECT u.name as driver_name, u.email, i.created_at, i.type, i.status,
           v.registration, v.make, v.model
    FROM inspections i
    JOIN users u ON i.driver_id = u.id
    JOIN vehicles v ON i.vehicle_id = v.id
    WHERE i.company_id = ${companyId}
      AND ${vehicleFilter}
      AND DATE(i.created_at) = ${date}
    ORDER BY i.created_at DESC
    LIMIT 5
  `);

  // Also check timesheets
  const tsResult = await db.execute(sql`
    SELECT u.name as driver_name, u.email, t.clock_in, t.clock_out,
           v.registration, v.make, v.model
    FROM timesheets t
    JOIN users u ON t.driver_id = u.id
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.company_id = ${companyId}
      AND ${vehicleId ? sql`t.vehicle_id = ${vehicleId}` : sql`UPPER(REPLACE(v.registration, ' ', '')) = ${(registration || '').toUpperCase().replace(/\s+/g, '')}`}
      AND DATE(t.clock_in) = ${date}
    ORDER BY t.clock_in DESC
    LIMIT 5
  `);

  return {
    inspections: inspResult.rows || [],
    timesheets: tsResult.rows || [],
    date,
  };
}

async function getActiveDriverLocations(companyId: number, searchLocation?: string) {
  const result = await db.execute(sql`
    SELECT u.name as driver_name, dl.latitude, dl.longitude, dl.speed,
           dl.updated_at, dl.heading,
           v.registration as vehicle_registration
    FROM driver_locations dl
    JOIN users u ON dl.driver_id = u.id
    LEFT JOIN timesheets t ON t.driver_id = u.id AND t.clock_out IS NULL
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    WHERE dl.company_id = ${companyId}
      AND dl.updated_at > NOW() - INTERVAL '4 hours'
    ORDER BY dl.updated_at DESC
  `);

  const drivers = result.rows || [];

  // If searching near a location, add distance info using approximate UK city coords
  const cityCoords: Record<string, [number, number]> = {
    sheffield: [53.3811, -1.4701],
    leeds: [53.8008, -1.5491],
    manchester: [53.4808, -2.2426],
    london: [51.5074, -0.1278],
    birmingham: [52.4862, -1.8904],
    doncaster: [53.5228, -1.1288],
    nottingham: [52.9548, -1.1581],
    hull: [53.7676, -0.3274],
    york: [53.9590, -1.0815],
    bradford: [53.7960, -1.7594],
    liverpool: [53.4084, -2.9916],
    bristol: [51.4545, -2.5879],
  };

  if (searchLocation) {
    const loc = searchLocation.toLowerCase();
    const coords = Object.entries(cityCoords).find(([city]) => loc.includes(city));
    if (coords) {
      const [, [lat, lon]] = coords;
      const withDistance = drivers.map((d: any) => {
        const dlat = d.latitude - lat;
        const dlon = d.longitude - lon;
        const distKm = Math.sqrt(dlat * dlat + dlon * dlon) * 111;
        return { ...d, distance_km: Math.round(distKm) };
      });
      return withDistance.sort((a: any, b: any) => a.distance_km - b.distance_km);
    }
  }

  return drivers;
}

async function getFleetStatus(companyId: number) {
  const [vehicles, activeDrivers, openDefects, expiringMOT] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) as total, status FROM vehicles WHERE company_id = ${companyId} GROUP BY status`),
    db.execute(sql`SELECT COUNT(*) as count FROM timesheets WHERE company_id = ${companyId} AND clock_out IS NULL`),
    db.execute(sql`SELECT COUNT(*) as count FROM defects WHERE company_id = ${companyId} AND status NOT IN ('resolved', 'closed')`),
    db.execute(sql`SELECT COUNT(*) as count FROM vehicles WHERE company_id = ${companyId} AND mot_expiry IS NOT NULL AND mot_expiry <= NOW() + INTERVAL '30 days' AND mot_expiry > NOW()`),
  ]);
  return {
    vehicles: vehicles.rows,
    active_drivers: (activeDrivers.rows?.[0] as any)?.count || 0,
    open_defects: (openDefects.rows?.[0] as any)?.count || 0,
    mot_expiring_soon: (expiringMOT.rows?.[0] as any)?.count || 0,
  };
}

async function getDefects(companyId: number, status: string = 'open', vehicleRegistration?: string, limit = 10) {
  const statusFilter = status === 'open'
    ? sql`d.status NOT IN ('resolved', 'closed')`
    : status === 'resolved'
    ? sql`d.status IN ('resolved', 'closed')`
    : sql`1=1`;

  const vehicleFilter = vehicleRegistration
    ? sql`AND UPPER(REPLACE(v.registration, ' ', '')) = ${vehicleRegistration.toUpperCase().replace(/\s+/g, '')}`
    : sql``;

  const result = await db.execute(sql`
    SELECT d.id, d.description, d.severity, d.status, d.created_at,
           v.registration, v.make, v.model,
           u.name as reported_by
    FROM defects d
    JOIN vehicles v ON d.vehicle_id = v.id
    LEFT JOIN users u ON d.reported_by = u.id
    WHERE d.company_id = ${companyId}
      AND ${statusFilter}
      ${vehicleFilter}
    ORDER BY d.created_at DESC
    LIMIT ${limit}
  `);
  return result.rows || [];
}

async function getDriverInfo(companyId: number, driverName?: string) {
  const nameFilter = driverName
    ? sql`AND LOWER(u.name) LIKE ${`%${driverName.toLowerCase()}%`}`
    : sql``;

  const result = await db.execute(sql`
    SELECT u.id, u.name, u.email, u.role, u.active, u.pin,
           (SELECT COUNT(*) FROM inspections i WHERE i.driver_id = u.id AND i.created_at > NOW() - INTERVAL '30 days') as recent_inspections,
           (SELECT clock_in FROM timesheets t WHERE t.driver_id = u.id ORDER BY clock_in DESC LIMIT 1) as last_shift,
           (SELECT clock_out IS NULL FROM timesheets t WHERE t.driver_id = u.id ORDER BY clock_in DESC LIMIT 1) as currently_clocked_in
    FROM users u
    WHERE u.company_id = ${companyId}
      AND u.role = 'DRIVER'
      AND u.active = true
      ${nameFilter}
    ORDER BY u.name
    LIMIT 20
  `);
  return result.rows || [];
}

async function getMOTStatus(companyId: number, daysAhead = 0, registration?: string) {
  const regFilter = registration
    ? sql`AND UPPER(REPLACE(v.registration, ' ', '')) = ${registration.toUpperCase().replace(/\s+/g, '')}`
    : sql``;

  const daysFilter = daysAhead > 0
    ? sql`AND v.mot_expiry <= NOW() + INTERVAL '1 day' * ${daysAhead}`
    : sql``;

  const result = await db.execute(sql`
    SELECT v.registration, v.make, v.model, v.mot_expiry,
           CASE
             WHEN v.mot_expiry < NOW() THEN 'EXPIRED'
             WHEN v.mot_expiry <= NOW() + INTERVAL '30 days' THEN 'EXPIRING_SOON'
             ELSE 'VALID'
           END as mot_status,
           DATE_PART('day', v.mot_expiry - NOW()) as days_until_expiry
    FROM vehicles v
    WHERE v.company_id = ${companyId}
      AND v.mot_expiry IS NOT NULL
      ${regFilter}
      ${daysFilter}
    ORDER BY v.mot_expiry ASC
    LIMIT 30
  `);
  return result.rows || [];
}

async function getInspections(companyId: number, opts: { vehicleRegistration?: string; driverName?: string; dateFrom?: string; dateTo?: string; limit?: number }) {
  const { vehicleRegistration, driverName, dateFrom, dateTo, limit = 10 } = opts;

  const result = await db.execute(sql`
    SELECT i.id, i.type, i.status, i.created_at, i.result,
           v.registration, v.make, v.model,
           u.name as driver_name
    FROM inspections i
    JOIN vehicles v ON i.vehicle_id = v.id
    JOIN users u ON i.driver_id = u.id
    WHERE i.company_id = ${companyId}
      ${vehicleRegistration ? sql`AND UPPER(REPLACE(v.registration, ' ', '')) = ${vehicleRegistration.toUpperCase().replace(/\s+/g, '')}` : sql``}
      ${driverName ? sql`AND LOWER(u.name) LIKE ${`%${driverName.toLowerCase()}%`}` : sql``}
      ${dateFrom ? sql`AND i.created_at >= ${dateFrom}` : sql``}
      ${dateTo ? sql`AND i.created_at <= ${dateTo + ' 23:59:59'}` : sql``}
    ORDER BY i.created_at DESC
    LIMIT ${limit}
  `);
  return result.rows || [];
}

async function getDriverHours(companyId: number, driverName?: string, dateFrom?: string, dateTo?: string) {
  const result = await db.execute(sql`
    SELECT u.name as driver_name,
           t.clock_in, t.clock_out,
           ROUND(EXTRACT(EPOCH FROM (COALESCE(t.clock_out, NOW()) - t.clock_in)) / 3600, 2) as hours_worked,
           v.registration as vehicle
    FROM timesheets t
    JOIN users u ON t.driver_id = u.id
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.company_id = ${companyId}
      ${driverName ? sql`AND LOWER(u.name) LIKE ${`%${driverName.toLowerCase()}%`}` : sql``}
      ${dateFrom ? sql`AND DATE(t.clock_in) >= ${dateFrom}` : sql`AND t.clock_in >= NOW() - INTERVAL '7 days'`}
      ${dateTo ? sql`AND DATE(t.clock_in) <= ${dateTo}` : sql``}
    ORDER BY t.clock_in DESC
    LIMIT 20
  `);
  return result.rows || [];
}

// ─── Tool dispatcher ──────────────────────────────────────────────────────────

async function executeTool(toolName: string, args: any, companyId: number): Promise<string> {
  try {
    switch (toolName) {
      case 'get_vehicle_by_registration': {
        const vehicle = await getVehicleByRegistration(companyId, args.registration);
        return vehicle
          ? JSON.stringify(vehicle)
          : `No vehicle found with registration ${args.registration} in your fleet.`;
      }
      case 'get_driver_for_vehicle_on_date': {
        const data = await getDriverForVehicleOnDate(companyId, args.vehicle_id, args.registration, args.date);
        return JSON.stringify(data);
      }
      case 'get_active_driver_locations': {
        const data = await getActiveDriverLocations(companyId, args.search_location);
        return JSON.stringify(data);
      }
      case 'get_fleet_status': {
        const data = await getFleetStatus(companyId);
        return JSON.stringify(data);
      }
      case 'get_defects': {
        const data = await getDefects(companyId, args.status, args.vehicle_registration, args.limit);
        return JSON.stringify(data);
      }
      case 'get_driver_info': {
        const data = await getDriverInfo(companyId, args.driver_name);
        return JSON.stringify(data);
      }
      case 'get_mot_status': {
        const data = await getMOTStatus(companyId, args.days_ahead, args.registration);
        return JSON.stringify(data);
      }
      case 'get_inspections': {
        const data = await getInspections(companyId, {
          vehicleRegistration: args.vehicle_registration,
          driverName: args.driver_name,
          dateFrom: args.date_from,
          dateTo: args.date_to,
          limit: args.limit,
        });
        return JSON.stringify(data);
      }
      case 'search_compliance_knowledge': {
        try {
          const results = await searchComplianceKnowledge({ query: args.query, topK: 3 });
          if (!results || results.length === 0) return 'No relevant compliance information found.';
          return JSON.stringify(results.map((r) => ({
            section: r.sectionTitle,
            reference: r.complianceReference,
            category: r.category,
            content: r.content,
          })));
        } catch {
          return 'Compliance knowledge base search unavailable.';
        }
      }
      case 'get_driver_hours': {
        const data = await getDriverHours(companyId, args.driver_name, args.date_from, args.date_to);
        return JSON.stringify(data);
      }
      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error: any) {
    console.error(`[Copilot] Tool ${toolName} error:`, error.message);
    return `Error executing ${toolName}: ${error.message}`;
  }
}

// ─── Main chat function ───────────────────────────────────────────────────────

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function runCopilot(
  companyId: number,
  messages: CopilotMessage[],
  userMessage: string
): Promise<string> {
  const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)),
    { role: 'user', content: userMessage },
  ];

  // Agentic loop — keep going until no more tool calls
  for (let i = 0; i < 5; i++) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: conversationMessages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1000,
      temperature: 0.3,
    });

    const message = response.choices[0].message;
    conversationMessages.push(message);

    // No tool calls — we have the final answer
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content || 'I was unable to generate a response.';
    }

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      message.tool_calls.map(async (toolCall) => {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(toolCall.function.name, args, companyId);
        return {
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: result,
        };
      })
    );

    conversationMessages.push(...toolResults);
  }

  return 'I was unable to complete the request after multiple attempts.';
}
