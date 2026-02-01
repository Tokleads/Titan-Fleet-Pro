import { Request, Response } from 'express';
import { db } from './db';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    database: { status: 'down' },
    memory: { status: 'ok', used: 0, total: 0, percentage: 0 },
  };

  // Check database
  try {
    const dbStart = Date.now();
    await db.execute('SELECT 1');
    const dbResponseTime = Date.now() - dbStart;
    checks.database = {
      status: 'up',
      responseTime: dbResponseTime,
    };
  } catch (error: any) {
    checks.database = {
      status: 'down',
      error: error.message,
    };
  }

  // Check memory
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const memPercentage = (usedMem / totalMem) * 100;

  checks.memory = {
    status: memPercentage > 90 ? 'critical' : memPercentage > 75 ? 'warning' : 'ok',
    used: Math.round(usedMem / 1024 / 1024), // MB
    total: Math.round(totalMem / 1024 / 1024), // MB
    percentage: Math.round(memPercentage),
  };

  // Determine overall status
  let overallStatus: HealthStatus['status'] = 'healthy';
  if (checks.database.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (checks.memory.status === 'warning') {
    overallStatus = 'degraded';
  } else if (checks.memory.status === 'critical') {
    overallStatus = 'unhealthy';
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    checks,
  };

  // Return appropriate HTTP status code
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  res.status(statusCode).json(healthStatus);
}

// Liveness probe - simple check if server is running
export function livenessProbe(req: Request, res: Response) {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
}

// Readiness probe - check if server is ready to accept traffic
export async function readinessProbe(req: Request, res: Response) {
  try {
    await db.execute('SELECT 1');
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'not ready', timestamp: new Date().toISOString() });
  }
}
