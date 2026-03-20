import OpenAI from 'openai';
import { pool } from './db';
import { searchComplianceKnowledge } from './complianceSearchService';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are Fleet Copilot, an expert AI assistant built into TitanFleet — a UK fleet management platform for transport operators.

You have deep knowledge of:
- UK transport law and DVSA regulations
- Operator licensing (O-licence requirements)
- Driver hours rules (EU/UK tachograph regulations)
- Vehicle roadworthiness and walkaround checks
- Fleet compliance and audit preparation

You also have LIVE ACCESS to this company's fleet data via tools — use them to answer factual questions accurately.

Key data notes:
- Mileage/odometer readings are logged during walkaround checks (inspections). Use get_inspections or get_driver_for_vehicle_on_date to retrieve them. The field is called "mileage_at_inspection" and "mileage_recorded" indicates whether it was entered.
- Vehicle registrations are stored as VRM (e.g. DE22NNX, A25DTP).

When answering:
- Be concise and direct, like a knowledgeable transport manager colleague
- For data questions, always use the tools to get accurate real-time information
- Format responses clearly — use bullet points for lists, bold for key facts
- If a driver or vehicle isn't found, say so clearly
- For compliance questions, cite the relevant regulation or DVSA guidance
- Always think about safety and compliance implications

You speak like a professional with 20 years in UK transport — practical, knowledgeable, no nonsense.`;

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_vehicle_by_registration',
      description: 'Look up a vehicle by its registration number/number plate (VRM)',
      parameters: {
        type: 'object',
        properties: {
          registration: { type: 'string', description: 'Vehicle registration e.g. AB65TG or BT71TVM' },
        },
        required: ['registration'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_driver_for_vehicle_on_date',
      description: 'Find out which driver drove or inspected a specific vehicle on a specific date. Also returns the odometer/mileage logged during the walkaround check.',
      parameters: {
        type: 'object',
        properties: {
          registration: { type: 'string', description: 'Vehicle registration (VRM)' },
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
      description: 'Get current GPS locations of all recently active drivers. Returns driver names, coordinates, and speed.',
      parameters: {
        type: 'object',
        properties: {
          search_location: { type: 'string', description: 'Optional city to find nearby drivers e.g. Sheffield, Leeds, Doncaster' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_fleet_status',
      description: 'Get a summary of the current fleet — total vehicles, active/VOR status, defect counts, MOT overview',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_defects',
      description: 'Get defects for the fleet — open, resolved, or for a specific vehicle',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['open', 'resolved', 'all'], description: 'Filter by status' },
          vehicle_registration: { type: 'string', description: 'Optional: filter by VRM' },
          limit: { type: 'number', description: 'Max results, default 10' },
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
          driver_name: { type: 'string', description: 'Driver name (partial match)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_mot_status',
      description: 'Get MOT due dates for fleet vehicles, with option to filter by expiring soon',
      parameters: {
        type: 'object',
        properties: {
          days_ahead: { type: 'number', description: 'Show MOTs due within this many days (0 = all)' },
          registration: { type: 'string', description: 'Optional: check a specific vehicle' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_inspections',
      description: 'Get vehicle inspection/walkaround check records by driver or vehicle. Each record includes the odometer mileage logged at time of inspection and whether mileage was recorded.',
      parameters: {
        type: 'object',
        properties: {
          vehicle_registration: { type: 'string', description: 'Filter by VRM' },
          driver_name: { type: 'string', description: 'Filter by driver name' },
          date_from: { type: 'string', description: 'Start date YYYY-MM-DD' },
          date_to: { type: 'string', description: 'End date YYYY-MM-DD' },
          limit: { type: 'number', description: 'Max records, default 10' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_compliance_knowledge',
      description: 'Search DVSA compliance knowledge base for regulatory guidance on roadworthiness, driver hours, O-licence etc.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Compliance or regulatory question' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_driver_shifts',
      description: 'Get driver shift records (clock-in/clock-out history)',
      parameters: {
        type: 'object',
        properties: {
          driver_name: { type: 'string', description: 'Driver name' },
          date_from: { type: 'string', description: 'Start date YYYY-MM-DD' },
          date_to: { type: 'string', description: 'End date YYYY-MM-DD' },
        },
      },
    },
  },
];

// ─── DB helper ────────────────────────────────────────────────────────────────

async function q(text: string, params: any[] = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

// ─── Tool implementations ─────────────────────────────────────────────────────

async function getVehicleByRegistration(companyId: number, registration: string) {
  const vrm = registration.toUpperCase().replace(/\s+/g, '');
  const rows = await q(
    `SELECT id, vrm AS registration, make, model, vehicle_category, mot_due, vor_status, active
     FROM vehicles
     WHERE company_id = $1 AND UPPER(REPLACE(vrm, ' ', '')) = $2
     LIMIT 1`,
    [companyId, vrm]
  );
  return rows[0] || null;
}

async function getDriverForVehicleOnDate(companyId: number, registration: string | null, date: string) {
  const vrm = (registration || '').toUpperCase().replace(/\s+/g, '');

  const inspections = await q(
    `SELECT u.name AS driver_name, u.email, i.started_at, i.completed_at, i.type, i.status,
            i.odometer AS mileage_at_inspection,
            CASE WHEN i.odometer IS NULL OR i.odometer = 0 THEN false ELSE true END AS mileage_recorded,
            v.vrm AS registration, v.make, v.model
     FROM inspections i
     JOIN users u ON i.driver_id = u.id
     JOIN vehicles v ON i.vehicle_id = v.id
     WHERE i.company_id = $1
       AND UPPER(REPLACE(v.vrm, ' ', '')) = $2
       AND DATE(i.started_at) = $3
     ORDER BY i.started_at DESC
     LIMIT 5`,
    [companyId, vrm, date]
  );

  return { inspections, date, note: 'Checked inspection records. mileage_at_inspection shows the odometer reading logged during the walkaround check. mileage_recorded=false means no odometer was entered.' };
}

async function getActiveDriverLocations(companyId: number, searchLocation?: string) {
  const drivers = await q(
    `SELECT u.name AS driver_name, dl.latitude, dl.longitude, dl.speed,
            dl.timestamp AS last_seen, dl.heading
     FROM driver_locations dl
     JOIN users u ON dl.driver_id = u.id
     WHERE dl.company_id = $1
       AND dl.timestamp > NOW() - INTERVAL '4 hours'
     ORDER BY dl.timestamp DESC`,
    [companyId]
  );

  // Deduplicate — keep only most recent per driver
  const seen = new Set<number>();
  const unique: any[] = [];
  for (const d of drivers) {
    if (!seen.has(d.driver_id)) {
      seen.add(d.driver_id);
      unique.push(d);
    }
  }

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
    bawtry: [53.4270, -1.0170],
    rotherham: [53.4300, -1.3566],
  };

  if (searchLocation && unique.length > 0) {
    const loc = searchLocation.toLowerCase();
    const match = Object.entries(cityCoords).find(([city]) => loc.includes(city));
    if (match) {
      const [, [lat, lon]] = match;
      return unique
        .map((d: any) => {
          const dLat = parseFloat(d.latitude) - lat;
          const dLon = parseFloat(d.longitude) - lon;
          const distKm = Math.sqrt(dLat * dLat + dLon * dLon) * 111;
          return { ...d, distance_km: Math.round(distKm) };
        })
        .sort((a: any, b: any) => a.distance_km - b.distance_km);
    }
  }

  return unique;
}

async function getFleetStatus(companyId: number) {
  const [vehicles, openDefects, expiringMOT, vorVehicles] = await Promise.all([
    q(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE active = true) AS active,
              COUNT(*) FILTER (WHERE vor_status = true) AS vor
       FROM vehicles WHERE company_id = $1`, [companyId]),
    q(`SELECT COUNT(*) AS count FROM defects WHERE company_id = $1 AND status = 'OPEN'`, [companyId]),
    q(`SELECT COUNT(*) AS count FROM vehicles
       WHERE company_id = $1 AND mot_due IS NOT NULL
         AND mot_due <= NOW() + INTERVAL '30 days' AND mot_due > NOW()`, [companyId]),
    q(`SELECT vrm, make, model, vor_reason FROM vehicles WHERE company_id = $1 AND vor_status = true`, [companyId]),
  ]);

  return {
    fleet_totals: vehicles[0],
    open_defects: openDefects[0]?.count || 0,
    mot_expiring_within_30_days: expiringMOT[0]?.count || 0,
    vehicles_off_road: vorVehicles,
  };
}

async function getDefects(companyId: number, status = 'open', vehicleRegistration?: string, limit = 10) {
  const params: any[] = [companyId];
  let statusClause = `d.status = 'OPEN'`;
  if (status === 'resolved') statusClause = `d.status IN ('COMPLETED', 'CANCELLED')`;
  if (status === 'all') statusClause = `1=1`;

  let regClause = '';
  if (vehicleRegistration) {
    params.push(vehicleRegistration.toUpperCase().replace(/\s+/g, ''));
    regClause = `AND UPPER(REPLACE(v.vrm, ' ', '')) = $${params.length}`;
  }

  params.push(limit);
  return q(
    `SELECT d.id, d.description, d.severity, d.status, d.created_at,
            v.vrm AS registration, v.make, v.model,
            u.name AS reported_by
     FROM defects d
     JOIN vehicles v ON d.vehicle_id = v.id
     LEFT JOIN users u ON d.reported_by = u.id
     WHERE d.company_id = $1 AND ${statusClause} ${regClause}
     ORDER BY d.created_at DESC
     LIMIT $${params.length}`,
    params
  );
}

async function getDriverInfo(companyId: number, driverName?: string) {
  const params: any[] = [companyId];
  let nameClause = '';
  if (driverName) {
    params.push(`%${driverName.toLowerCase()}%`);
    nameClause = `AND LOWER(u.name) LIKE $${params.length}`;
  }

  return q(
    `SELECT u.id, u.name, u.email, u.role, u.active,
            (SELECT COUNT(*) FROM inspections i WHERE i.driver_id = u.id AND i.started_at > NOW() - INTERVAL '30 days') AS recent_inspections,
            (SELECT arrival_time FROM timesheets t WHERE t.driver_id = u.id ORDER BY arrival_time DESC LIMIT 1) AS last_shift
     FROM users u
     WHERE u.company_id = $1 AND u.role = 'DRIVER' AND u.active = true ${nameClause}
     ORDER BY u.name
     LIMIT 20`,
    params
  );
}

async function getMOTStatus(companyId: number, daysAhead = 0, registration?: string) {
  const params: any[] = [companyId];
  let regClause = '';
  let daysClause = '';

  if (registration) {
    params.push(registration.toUpperCase().replace(/\s+/g, ''));
    regClause = `AND UPPER(REPLACE(vrm, ' ', '')) = $${params.length}`;
  }
  if (daysAhead > 0) {
    params.push(daysAhead);
    daysClause = `AND mot_due <= NOW() + ($${params.length} || ' days')::INTERVAL`;
  }

  return q(
    `SELECT vrm AS registration, make, model, mot_due,
            CASE
              WHEN mot_due < NOW() THEN 'OVERDUE'
              WHEN mot_due <= NOW() + INTERVAL '30 days' THEN 'DUE_SOON'
              ELSE 'VALID'
            END AS mot_status,
            FLOOR(EXTRACT(EPOCH FROM (mot_due - NOW())) / 86400) AS days_until_due
     FROM vehicles
     WHERE company_id = $1 AND mot_due IS NOT NULL ${regClause} ${daysClause}
     ORDER BY mot_due ASC
     LIMIT 30`,
    params
  );
}

async function getInspections(companyId: number, opts: {
  vehicleRegistration?: string;
  driverName?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) {
  const { vehicleRegistration, driverName, dateFrom, dateTo, limit = 10 } = opts;
  const params: any[] = [companyId];
  const clauses: string[] = [];

  if (vehicleRegistration) {
    params.push(vehicleRegistration.toUpperCase().replace(/\s+/g, ''));
    clauses.push(`UPPER(REPLACE(v.vrm, ' ', '')) = $${params.length}`);
  }
  if (driverName) {
    params.push(`%${driverName.toLowerCase()}%`);
    clauses.push(`LOWER(u.name) LIKE $${params.length}`);
  }
  if (dateFrom) {
    params.push(dateFrom);
    clauses.push(`i.started_at >= $${params.length}`);
  }
  if (dateTo) {
    params.push(dateTo + ' 23:59:59');
    clauses.push(`i.started_at <= $${params.length}`);
  }

  const whereExtra = clauses.length > 0 ? 'AND ' + clauses.join(' AND ') : '';
  params.push(limit);

  return q(
    `SELECT i.id, i.type, i.status, i.started_at, i.completed_at,
            i.odometer AS mileage_at_inspection,
            CASE WHEN i.odometer IS NULL OR i.odometer = 0 THEN false ELSE true END AS mileage_recorded,
            v.vrm AS registration, v.make, v.model,
            u.name AS driver_name
     FROM inspections i
     JOIN vehicles v ON i.vehicle_id = v.id
     JOIN users u ON i.driver_id = u.id
     WHERE i.company_id = $1 ${whereExtra}
     ORDER BY i.started_at DESC
     LIMIT $${params.length}`,
    params
  );
}

async function getDriverShifts(companyId: number, driverName?: string, dateFrom?: string, dateTo?: string) {
  const params: any[] = [companyId];
  const clauses: string[] = [];

  if (driverName) {
    params.push(`%${driverName.toLowerCase()}%`);
    clauses.push(`LOWER(u.name) LIKE $${params.length}`);
  }
  if (dateFrom) {
    params.push(dateFrom);
    clauses.push(`DATE(t.arrival_time) >= $${params.length}`);
  } else {
    clauses.push(`t.arrival_time >= NOW() - INTERVAL '7 days'`);
  }
  if (dateTo) {
    params.push(dateTo);
    clauses.push(`DATE(t.arrival_time) <= $${params.length}`);
  }

  const whereExtra = clauses.length > 0 ? 'AND ' + clauses.join(' AND ') : '';

  return q(
    `SELECT u.name AS driver_name, t.arrival_time, t.departure_time, t.status, t.depot_name,
            ROUND(COALESCE(t.total_minutes, 0) / 60.0, 2) AS hours_worked
     FROM timesheets t
     JOIN users u ON t.driver_id = u.id
     WHERE t.company_id = $1 ${whereExtra}
     ORDER BY t.arrival_time DESC
     LIMIT 20`,
    params
  );
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
        const data = await getDriverForVehicleOnDate(companyId, args.registration, args.date);
        return JSON.stringify(data);
      }
      case 'get_active_driver_locations': {
        const data = await getActiveDriverLocations(companyId, args.search_location);
        return data.length === 0 ? 'No active driver GPS data found in the last 4 hours.' : JSON.stringify(data);
      }
      case 'get_fleet_status': {
        const data = await getFleetStatus(companyId);
        return JSON.stringify(data);
      }
      case 'get_defects': {
        const data = await getDefects(companyId, args.status, args.vehicle_registration, args.limit);
        return data.length === 0 ? 'No defects found matching the criteria.' : JSON.stringify(data);
      }
      case 'get_driver_info': {
        const data = await getDriverInfo(companyId, args.driver_name);
        return data.length === 0 ? 'No drivers found.' : JSON.stringify(data);
      }
      case 'get_mot_status': {
        const data = await getMOTStatus(companyId, args.days_ahead, args.registration);
        return data.length === 0 ? 'No vehicles found with MOT data.' : JSON.stringify(data);
      }
      case 'get_inspections': {
        const data = await getInspections(companyId, {
          vehicleRegistration: args.vehicle_registration,
          driverName: args.driver_name,
          dateFrom: args.date_from,
          dateTo: args.date_to,
          limit: args.limit,
        });
        return data.length === 0 ? 'No inspections found.' : JSON.stringify(data);
      }
      case 'search_compliance_knowledge': {
        try {
          const results = await searchComplianceKnowledge({ query: args.query, topK: 3 });
          if (!results || results.length === 0) return 'No relevant compliance information found.';
          return JSON.stringify(results.map(r => ({
            section: r.sectionTitle,
            reference: r.complianceReference,
            category: r.category,
            content: r.content,
          })));
        } catch {
          return 'Compliance knowledge base search unavailable.';
        }
      }
      case 'get_driver_shifts': {
        const data = await getDriverShifts(companyId, args.driver_name, args.date_from, args.date_to);
        return data.length === 0 ? 'No shift records found.' : JSON.stringify(data);
      }
      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error: any) {
    console.error(`[Copilot] Tool ${toolName} error:`, error.message);
    return `Database error: ${error.message}`;
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

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content || 'I was unable to generate a response.';
    }

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
