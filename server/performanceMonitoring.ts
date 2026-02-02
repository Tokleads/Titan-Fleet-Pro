/**
 * Performance Monitoring Middleware
 * 
 * Tracks API response times, slow queries, and performance metrics.
 */

import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

// Store recent performance metrics in memory (last 1000 requests)
const performanceLog: PerformanceMetrics[] = [];
const MAX_LOG_SIZE = 1000;

// Slow query threshold (in milliseconds)
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

/**
 * Performance monitoring middleware
 * Tracks response time for all requests
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to capture metrics
  res.end = function(this: Response, chunk?: any, encoding?: any, callback?: any): Response {
    const duration = Date.now() - startTime;
    
    // Log the metric
    const metric: PerformanceMetrics = {
      endpoint: req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode,
      timestamp: new Date(),
    };
    
    // Add to performance log
    performanceLog.push(metric);
    if (performanceLog.length > MAX_LOG_SIZE) {
      performanceLog.shift(); // Remove oldest entry
    }
    
    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(`[Performance] Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Add performance header
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
}

/**
 * Get performance statistics
 */
export function getPerformanceStats() {
  if (performanceLog.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      slowRequestPercentage: 0,
      endpointStats: {},
    };
  }
  
  const totalRequests = performanceLog.length;
  const totalDuration = performanceLog.reduce((sum, metric) => sum + metric.duration, 0);
  const averageResponseTime = totalDuration / totalRequests;
  const slowRequests = performanceLog.filter(m => m.duration > SLOW_QUERY_THRESHOLD).length;
  const slowRequestPercentage = (slowRequests / totalRequests) * 100;
  
  // Group by endpoint
  const endpointStats: Record<string, {
    count: number;
    avgDuration: number;
    maxDuration: number;
    slowCount: number;
  }> = {};
  
  performanceLog.forEach(metric => {
    const key = `${metric.method} ${metric.endpoint}`;
    if (!endpointStats[key]) {
      endpointStats[key] = {
        count: 0,
        avgDuration: 0,
        maxDuration: 0,
        slowCount: 0,
      };
    }
    
    const stats = endpointStats[key];
    stats.count++;
    stats.avgDuration = (stats.avgDuration * (stats.count - 1) + metric.duration) / stats.count;
    stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
    if (metric.duration > SLOW_QUERY_THRESHOLD) {
      stats.slowCount++;
    }
  });
  
  return {
    totalRequests,
    averageResponseTime: Math.round(averageResponseTime),
    slowRequests,
    slowRequestPercentage: Math.round(slowRequestPercentage * 100) / 100,
    endpointStats,
    recentRequests: performanceLog.slice(-10).reverse(), // Last 10 requests
  };
}

/**
 * Get slow queries
 */
export function getSlowQueries(limit: number = 20) {
  return performanceLog
    .filter(m => m.duration > SLOW_QUERY_THRESHOLD)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);
}

/**
 * Clear performance log
 */
export function clearPerformanceLog() {
  performanceLog.length = 0;
}

/**
 * Database query timing utility
 * Use this to wrap database queries and track their performance
 */
export async function trackQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(`[Database] Slow query detected: ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Database] Query failed: ${queryName} after ${duration}ms`, error);
    throw error;
  }
}
