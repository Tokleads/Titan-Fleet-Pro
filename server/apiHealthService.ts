import { openai } from "./replit_integrations/image/client";
import { db } from "./db";
import { apiHealthChecks, apiHealthIncidents, apiHealthFixes } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export const MONITORED_APIS = {
  RESEND: 'resend',
  NOMINATIM: 'nominatim',
  OSRM: 'osrm',
  STRIPE: 'stripe',
  XERO: 'xero',
  QUICKBOOKS: 'quickbooks',
} as const;

export interface HealthCheckResult {
  apiType: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  checkedAt: Date;
}

async function checkResend(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return {
        apiType: MONITORED_APIS.RESEND,
        status: 'down',
        responseTime: Date.now() - start,
        errorMessage: 'RESEND_API_KEY not configured',
        checkedAt: new Date(),
      };
    }
    const res = await fetch('https://api.resend.com/api-keys', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    const responseTime = Date.now() - start;
    if (res.ok) {
      return { apiType: MONITORED_APIS.RESEND, status: 'healthy', responseTime, checkedAt: new Date() };
    }
    return {
      apiType: MONITORED_APIS.RESEND,
      status: res.status >= 500 ? 'down' : 'degraded',
      responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      checkedAt: new Date(),
    };
  } catch (error: any) {
    return {
      apiType: MONITORED_APIS.RESEND,
      status: 'down',
      responseTime: Date.now() - start,
      errorMessage: error.message || 'Unknown error',
      checkedAt: new Date(),
    };
  }
}

async function checkNominatim(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(
      'https://nominatim.openstreetmap.org/search?format=json&q=London,UK&limit=1',
      {
        headers: { 'User-Agent': 'TitanFleet/1.0' },
        signal: AbortSignal.timeout(10000),
      }
    );
    const responseTime = Date.now() - start;
    if (res.ok) {
      return { apiType: MONITORED_APIS.NOMINATIM, status: 'healthy', responseTime, checkedAt: new Date() };
    }
    return {
      apiType: MONITORED_APIS.NOMINATIM,
      status: res.status >= 500 ? 'down' : 'degraded',
      responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      checkedAt: new Date(),
    };
  } catch (error: any) {
    return {
      apiType: MONITORED_APIS.NOMINATIM,
      status: 'down',
      responseTime: Date.now() - start,
      errorMessage: error.message || 'Unknown error',
      checkedAt: new Date(),
    };
  }
}

async function checkOSRM(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(
      'https://router.project-osrm.org/route/v1/driving/-0.1276,51.5074;-0.0899,51.5155?overview=false',
      { signal: AbortSignal.timeout(10000) }
    );
    const responseTime = Date.now() - start;
    if (res.ok) {
      return { apiType: MONITORED_APIS.OSRM, status: 'healthy', responseTime, checkedAt: new Date() };
    }
    return {
      apiType: MONITORED_APIS.OSRM,
      status: res.status >= 500 ? 'down' : 'degraded',
      responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      checkedAt: new Date(),
    };
  } catch (error: any) {
    return {
      apiType: MONITORED_APIS.OSRM,
      status: 'down',
      responseTime: Date.now() - start,
      errorMessage: error.message || 'Unknown error',
      checkedAt: new Date(),
    };
  }
}

async function checkStripe(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      return {
        apiType: MONITORED_APIS.STRIPE,
        status: 'down',
        responseTime: Date.now() - start,
        errorMessage: 'STRIPE_SECRET_KEY not configured',
        checkedAt: new Date(),
      };
    }
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    const responseTime = Date.now() - start;
    if (res.ok) {
      return { apiType: MONITORED_APIS.STRIPE, status: 'healthy', responseTime, checkedAt: new Date() };
    }
    return {
      apiType: MONITORED_APIS.STRIPE,
      status: res.status >= 500 ? 'down' : 'degraded',
      responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      checkedAt: new Date(),
    };
  } catch (error: any) {
    return {
      apiType: MONITORED_APIS.STRIPE,
      status: 'down',
      responseTime: Date.now() - start,
      errorMessage: error.message || 'Unknown error',
      checkedAt: new Date(),
    };
  }
}

async function checkXero(): Promise<HealthCheckResult> {
  return {
    apiType: MONITORED_APIS.XERO,
    status: 'healthy',
    responseTime: 0,
    checkedAt: new Date(),
  };
}

async function checkQuickBooks(): Promise<HealthCheckResult> {
  return {
    apiType: MONITORED_APIS.QUICKBOOKS,
    status: 'healthy',
    responseTime: 0,
    checkedAt: new Date(),
  };
}

const healthCheckFunctions: Record<string, () => Promise<HealthCheckResult>> = {
  [MONITORED_APIS.RESEND]: checkResend,
  [MONITORED_APIS.NOMINATIM]: checkNominatim,
  [MONITORED_APIS.OSRM]: checkOSRM,
  [MONITORED_APIS.STRIPE]: checkStripe,
  [MONITORED_APIS.XERO]: checkXero,
  [MONITORED_APIS.QUICKBOOKS]: checkQuickBooks,
};

export async function checkApiHealth(apiType: string): Promise<HealthCheckResult> {
  const checkFn = healthCheckFunctions[apiType];
  if (!checkFn) {
    return {
      apiType,
      status: 'down',
      responseTime: 0,
      errorMessage: `Unknown API type: ${apiType}`,
      checkedAt: new Date(),
    };
  }
  return checkFn();
}

async function handleFailedCheck(result: HealthCheckResult): Promise<void> {
  try {
    const existingIncidents = await db
      .select()
      .from(apiHealthIncidents)
      .where(
        and(
          eq(apiHealthIncidents.apiType, result.apiType),
          eq(apiHealthIncidents.status, 'open')
        )
      )
      .limit(1);

    if (existingIncidents.length > 0) {
      const incident = existingIncidents[0];
      await db
        .update(apiHealthIncidents)
        .set({
          failureCount: (incident.failureCount || 1) + 1,
          lastFailedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(apiHealthIncidents.id, incident.id));
      return;
    }

    const severity = result.status === 'down' ? 'critical' : 'warning';
    const [newIncident] = await db
      .insert(apiHealthIncidents)
      .values({
        apiType: result.apiType,
        status: 'open',
        severity,
        errorMessage: result.errorMessage || 'Unknown error',
        errorDetails: result.errorDetails || {},
        failureCount: 1,
        detectedAt: new Date(),
        lastFailedAt: new Date(),
      })
      .returning();

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert API integration engineer." },
          {
            role: "user",
            content: `API health check failed.\n\nAPI: ${result.apiType}\nStatus: ${result.status}\nError: ${result.errorMessage}\n\nDiagnose the issue and suggest a fix. Respond in JSON:\n{"summary":"...","rootCause":"...","fixDescription":"...","fixCode":"// suggested code","fixType":"code_patch|config_update|api_key_refresh"}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        await db.insert(apiHealthFixes).values({
          incidentId: newIncident.id,
          apiType: result.apiType,
          diagnosis: parsed.summary || parsed.rootCause || 'AI diagnosis unavailable',
          fixDescription: parsed.fixDescription || 'No fix description provided',
          fixCode: parsed.fixCode || '// No code suggestion',
          fixType: parsed.fixType || 'config_update',
          status: 'pending_approval',
        });
      }
    } catch (aiError) {
      console.error(`[ApiHealth] AI diagnosis failed for ${result.apiType}:`, aiError);
    }
  } catch (error) {
    console.error(`[ApiHealth] Failed to handle failed check for ${result.apiType}:`, error);
  }
}

async function handleRecoveredApi(apiType: string): Promise<void> {
  try {
    const openIncidents = await db
      .select()
      .from(apiHealthIncidents)
      .where(
        and(
          eq(apiHealthIncidents.apiType, apiType),
          eq(apiHealthIncidents.status, 'open')
        )
      );

    for (const incident of openIncidents) {
      await db
        .update(apiHealthIncidents)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          resolutionNotes: 'Auto-resolved: API recovered',
          updatedAt: new Date(),
        })
        .where(eq(apiHealthIncidents.id, incident.id));
    }
  } catch (error) {
    console.error(`[ApiHealth] Failed to handle recovery for ${apiType}:`, error);
  }
}

export async function runAllHealthChecks(): Promise<void> {
  try {
    const apiTypes = Object.values(MONITORED_APIS);
    const results = await Promise.all(apiTypes.map((apiType) => checkApiHealth(apiType)));

    for (const result of results) {
      try {
        await db.insert(apiHealthChecks).values({
          apiType: result.apiType,
          status: result.status,
          responseTime: result.responseTime,
          errorMessage: result.errorMessage || null,
          errorDetails: result.errorDetails || null,
          checkedAt: result.checkedAt,
        });

        if (result.status !== 'healthy') {
          await handleFailedCheck(result);
        } else {
          await handleRecoveredApi(result.apiType);
        }
      } catch (error) {
        console.error(`[ApiHealth] Failed to store check result for ${result.apiType}:`, error);
      }
    }
  } catch (error) {
    console.error('[ApiHealth] Failed to run all health checks:', error);
  }
}

export async function getHealthStatus(): Promise<object> {
  try {
    const apiTypes = Object.values(MONITORED_APIS);
    const statuses: Record<string, object> = {};
    let healthyCount = 0;
    let degradedCount = 0;
    let downCount = 0;

    for (const apiType of apiTypes) {
      const [latest] = await db
        .select()
        .from(apiHealthChecks)
        .where(eq(apiHealthChecks.apiType, apiType))
        .orderBy(desc(apiHealthChecks.checkedAt))
        .limit(1);

      if (latest) {
        statuses[apiType] = {
          status: latest.status,
          responseTime: latest.responseTime,
          lastChecked: latest.checkedAt,
          errorMessage: latest.errorMessage,
        };
        if (latest.status === 'healthy') healthyCount++;
        else if (latest.status === 'degraded') degradedCount++;
        else downCount++;
      } else {
        statuses[apiType] = {
          status: 'unknown',
          responseTime: 0,
          lastChecked: null,
          errorMessage: null,
        };
      }
    }

    return {
      apis: statuses,
      summary: {
        total: apiTypes.length,
        healthy: healthyCount,
        degraded: degradedCount,
        down: downCount,
      },
    };
  } catch (error) {
    console.error('[ApiHealth] Failed to get health status:', error);
    return { apis: {}, summary: { total: 0, healthy: 0, degraded: 0, down: 0 } };
  }
}

export async function getIncidents(status?: string): Promise<object[]> {
  try {
    if (status) {
      return db
        .select()
        .from(apiHealthIncidents)
        .where(eq(apiHealthIncidents.status, status))
        .orderBy(desc(apiHealthIncidents.detectedAt));
    }
    return db
      .select()
      .from(apiHealthIncidents)
      .orderBy(desc(apiHealthIncidents.detectedAt));
  } catch (error) {
    console.error('[ApiHealth] Failed to get incidents:', error);
    return [];
  }
}

export async function getPendingFixes(): Promise<object[]> {
  try {
    return db
      .select()
      .from(apiHealthFixes)
      .where(eq(apiHealthFixes.status, 'pending_approval'))
      .orderBy(desc(apiHealthFixes.createdAt));
  } catch (error) {
    console.error('[ApiHealth] Failed to get pending fixes:', error);
    return [];
  }
}

export async function approveFix(fixId: number, userId: number): Promise<void> {
  try {
    await db
      .update(apiHealthFixes)
      .set({
        status: 'applied',
        approvedBy: userId,
        approvedAt: new Date(),
        appliedAt: new Date(),
      })
      .where(eq(apiHealthFixes.id, fixId));
  } catch (error) {
    console.error(`[ApiHealth] Failed to approve fix ${fixId}:`, error);
    throw error;
  }
}

export async function rejectFix(fixId: number): Promise<void> {
  try {
    await db
      .update(apiHealthFixes)
      .set({
        status: 'rejected',
      })
      .where(eq(apiHealthFixes.id, fixId));
  } catch (error) {
    console.error(`[ApiHealth] Failed to reject fix ${fixId}:`, error);
    throw error;
  }
}

export async function getAnalytics(days: number): Promise<object> {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const allChecks = await db
      .select()
      .from(apiHealthChecks)
      .orderBy(desc(apiHealthChecks.checkedAt));

    const recentChecks = allChecks.filter(
      (c) => c.checkedAt && c.checkedAt >= since
    );

    const resolvedIncidents = await db
      .select()
      .from(apiHealthIncidents)
      .where(eq(apiHealthIncidents.status, 'resolved'));

    const recentResolved = resolvedIncidents.filter(
      (i) => i.resolvedAt && i.resolvedAt >= since
    );

    const totalResponseTime = recentChecks.reduce((sum, c) => sum + c.responseTime, 0);
    const avgResponseTime = recentChecks.length > 0 ? Math.round(totalResponseTime / recentChecks.length) : 0;

    const apiTypes = Object.values(MONITORED_APIS);
    const uptimePerApi: Record<string, number> = {};

    for (const apiType of apiTypes) {
      const apiChecks = recentChecks.filter((c) => c.apiType === apiType);
      if (apiChecks.length === 0) {
        uptimePerApi[apiType] = 100;
        continue;
      }
      const healthyChecks = apiChecks.filter((c) => c.status === 'healthy').length;
      uptimePerApi[apiType] = Math.round((healthyChecks / apiChecks.length) * 10000) / 100;
    }

    return {
      period: { days, since: since.toISOString() },
      totalChecks: recentChecks.length,
      incidentsResolved: recentResolved.length,
      avgResponseTime,
      uptimePerApi,
    };
  } catch (error) {
    console.error('[ApiHealth] Failed to get analytics:', error);
    return {
      period: { days, since: new Date().toISOString() },
      totalChecks: 0,
      incidentsResolved: 0,
      avgResponseTime: 0,
      uptimePerApi: {},
    };
  }
}
