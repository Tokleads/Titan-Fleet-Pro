# Titan Fleet - Load Testing Guide

## Overview

This guide covers load testing Titan Fleet to ensure it can handle production traffic. We use **Artillery** for load testing, which simulates realistic user behavior and measures performance under load.

---

## Prerequisites

### 1. Install Artillery

```bash
# Install globally
npm install -g artillery@latest

# Or use npx (no installation needed)
npx artillery@latest --version
```

### 2. Prepare Test Environment

```bash
# Start the application
npm run dev

# Or for production-like testing
npm run build
npm start
```

### 3. Seed Test Data (Optional)

For realistic testing, ensure your database has:
- At least 1 company
- 100+ vehicles
- 50+ inspections
- 20+ defects

---

## Load Test Configuration

The `load-test.yml` file defines:

### Test Phases

1. **Warm up** (30s): 10 users/sec - Server warm-up
2. **Ramp up** (60s): 10→50 users/sec - Gradual increase
3. **Sustained load** (120s): 50 users/sec - Normal traffic
4. **Peak load** (60s): 100 users/sec - Traffic spike
5. **Cool down** (30s): 100→10 users/sec - Gradual decrease

**Total duration:** ~5 minutes  
**Total requests:** ~15,000-20,000

### Test Scenarios

| Scenario | Weight | Description |
|----------|--------|-------------|
| Health Check | 10% | Lightweight endpoint monitoring |
| Performance Stats | 5% | Admin monitoring dashboard |
| Browse Fleet | 30% | Paginated vehicle list (heavy) |
| Vehicle Search | 20% | Database search queries |
| Dashboard Stats | 15% | Multiple aggregated queries |
| Inspection List | 10% | Paginated inspection history |
| Defects List | 10% | Filtered defect queries |

### Performance Thresholds

- **Max error rate:** 1% (99% success rate required)
- **P95 response time:** <1000ms (95% of requests)
- **P99 response time:** <2000ms (99% of requests)

---

## Running Load Tests

### Basic Load Test

```bash
# Run the default load test
artillery run load-test.yml
```

### Quick Test (Reduced Duration)

```bash
# Run a quick 1-minute test
artillery quick --count 100 --num 1000 http://localhost:3000/health
```

### Generate HTML Report

```bash
# Run test and generate report
artillery run --output report.json load-test.yml
artillery report report.json --output report.html

# Open report in browser
open report.html  # macOS
xdg-open report.html  # Linux
start report.html  # Windows
```

### Target Production Server

```bash
# Test against production
artillery run --target https://your-production-domain.com load-test.yml
```

### Custom Configuration

```bash
# Override target
artillery run --target http://staging.example.com load-test.yml

# Override duration (shorter test)
artillery run --config '{"phases":[{"duration":60,"arrivalRate":50}]}' load-test.yml
```

---

## Interpreting Results

### Sample Output

```
Summary report @ 14:23:45(+0000)
  Scenarios launched:  15234
  Scenarios completed: 15234
  Requests completed:  45702
  Mean response/sec: 152.34
  Response time (msec):
    min: 12
    max: 2341
    median: 234
    p95: 567
    p99: 891
  Scenario counts:
    Browse Fleet: 4570 (30%)
    Vehicle Search: 3047 (20%)
    Dashboard Stats: 2285 (15%)
  Codes:
    200: 45456
    404: 123
    500: 123
  Errors:
    ETIMEDOUT: 45
```

### Key Metrics

#### 1. Success Rate
```
Success Rate = (Requests completed / Scenarios launched) × 100
Target: >99%
```

#### 2. Response Time
- **Median:** Typical response time (should be <500ms)
- **P95:** 95% of requests (should be <1000ms)
- **P99:** 99% of requests (should be <2000ms)

#### 3. Throughput
```
Requests per second = Requests completed / Total duration
Target: >100 req/sec
```

#### 4. Error Rate
```
Error Rate = (Errors / Total requests) × 100
Target: <1%
```

### Performance Grades

| Grade | Success Rate | P95 | P99 | Errors |
|-------|-------------|-----|-----|--------|
| A+ | >99.5% | <500ms | <1000ms | <0.1% |
| A | >99% | <750ms | <1500ms | <0.5% |
| B | >98% | <1000ms | <2000ms | <1% |
| C | >95% | <1500ms | <3000ms | <2% |
| F | <95% | >1500ms | >3000ms | >2% |

---

## Monitoring During Tests

### 1. Application Performance

```bash
# Terminal 1: Run load test
artillery run load-test.yml

# Terminal 2: Monitor performance stats
watch -n 1 'curl -s http://localhost:3000/api/performance/stats | jq'

# Terminal 3: Monitor slow queries
watch -n 2 'curl -s http://localhost:3000/api/performance/slow-queries?limit=10 | jq'
```

### 2. System Resources

```bash
# Monitor CPU and memory
htop

# Monitor network
iftop

# Monitor database connections
# (PostgreSQL)
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### 3. Application Logs

```bash
# Follow application logs
tail -f logs/app.log

# Follow error logs
tail -f logs/error.log

# Filter for slow queries
tail -f logs/app.log | grep "Slow query"
```

---

## Common Issues & Solutions

### Issue 1: High Error Rate (>1%)

**Symptoms:**
- Many 500 errors
- ETIMEDOUT errors
- Connection refused

**Solutions:**
1. Check database connection pool size
2. Increase server memory
3. Optimize slow queries
4. Add database indexes
5. Enable connection pooling

### Issue 2: Slow Response Times (P95 >1000ms)

**Symptoms:**
- High P95/P99 response times
- Slow query warnings in logs

**Solutions:**
1. Check `/api/performance/slow-queries`
2. Add database indexes
3. Optimize N+1 queries
4. Enable query result caching
5. Use pagination for large datasets

### Issue 3: Memory Leaks

**Symptoms:**
- Memory usage increases over time
- Server crashes during test
- Out of memory errors

**Solutions:**
1. Check for unclosed database connections
2. Review event listener cleanup
3. Use Node.js profiler
4. Monitor with `process.memoryUsage()`
5. Restart server between tests

### Issue 4: Database Connection Exhaustion

**Symptoms:**
- "Too many connections" errors
- Connection timeouts
- Slow query performance

**Solutions:**
1. Increase connection pool size
2. Reduce connection timeout
3. Close connections properly
4. Use connection pooling middleware
5. Monitor active connections

---

## Optimization Strategies

### 1. Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_inspections_vehicle_id ON inspections(vehicle_id);
CREATE INDEX idx_defects_status ON defects(status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM vehicles WHERE company_id = 1;
```

### 2. Caching Strategy

```typescript
// Add Redis caching for frequently accessed data
import Redis from 'ioredis';

const redis = new Redis();

// Cache dashboard stats (5 minutes)
const cacheKey = `dashboard:${companyId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const stats = await getDashboardStats(companyId);
await redis.setex(cacheKey, 300, JSON.stringify(stats));
return stats;
```

### 3. Connection Pooling

```typescript
// Increase pool size for high traffic
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50, // Increase from default 20
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

### 4. Query Optimization

```typescript
// Bad: N+1 query problem
const vehicles = await db.select().from(vehicles);
for (const vehicle of vehicles) {
  vehicle.inspections = await db.select()
    .from(inspections)
    .where(eq(inspections.vehicleId, vehicle.id));
}

// Good: Single query with join
const vehicles = await db.select()
  .from(vehicles)
  .leftJoin(inspections, eq(vehicles.id, inspections.vehicleId));
```

---

## Continuous Load Testing

### 1. Automated Testing (CI/CD)

```yaml
# .github/workflows/load-test.yml
name: Load Test

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Artillery
        run: npm install -g artillery
      - name: Run load test
        run: artillery run --target ${{ secrets.STAGING_URL }} load-test.yml
      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: load-test-report
          path: report.html
```

### 2. Scheduled Testing

```bash
# Add to crontab for daily testing
0 2 * * * cd /path/to/titan-fleet && artillery run load-test.yml --output /var/log/load-tests/$(date +\%Y\%m\%d).json
```

### 3. Monitoring Integration

```bash
# Send results to monitoring service
artillery run load-test.yml | \
  artillery-plugin-cloudwatch --namespace TitanFleet --region us-east-1
```

---

## Best Practices

### Before Testing
- ✅ Test in staging environment first
- ✅ Ensure database has realistic data
- ✅ Back up database before testing
- ✅ Monitor system resources
- ✅ Set up alerts for critical errors

### During Testing
- ✅ Monitor application logs
- ✅ Watch performance metrics
- ✅ Check database connections
- ✅ Monitor error rates
- ✅ Track response times

### After Testing
- ✅ Analyze Artillery report
- ✅ Review slow queries
- ✅ Check for memory leaks
- ✅ Document bottlenecks
- ✅ Create optimization plan

---

## Advanced Scenarios

### Custom Scenario: User Journey

```yaml
scenarios:
  - name: "Complete User Journey"
    flow:
      # 1. Login
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "authToken"
      
      # 2. View dashboard
      - get:
          url: "/api/manager/dashboard/1"
          headers:
            Authorization: "Bearer {{ authToken }}"
      
      # 3. Browse fleet
      - get:
          url: "/api/manager/vehicles/1?limit=50"
          headers:
            Authorization: "Bearer {{ authToken }}"
      
      # 4. View vehicle details
      - get:
          url: "/api/manager/vehicles/1/123"
          headers:
            Authorization: "Bearer {{ authToken }}"
      
      # 5. Logout
      - post:
          url: "/api/auth/logout"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

---

## Troubleshooting

### Artillery Not Found

```bash
# Install globally
npm install -g artillery

# Or use npx
npx artillery@latest run load-test.yml
```

### Connection Refused

```bash
# Check if server is running
curl http://localhost:3000/health

# Start server if not running
npm run dev
```

### Test Timeout

```bash
# Increase timeout in load-test.yml
config:
  timeout: 30 # seconds
```

---

## Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [Load Testing Best Practices](https://www.artillery.io/docs/guides/guides/best-practices)
- [Performance Testing Guide](https://www.artillery.io/docs/guides/guides/performance-testing)

---

## Success Criteria

Your application is ready for production when:

- ✅ Success rate >99%
- ✅ P95 response time <1000ms
- ✅ P99 response time <2000ms
- ✅ Error rate <1%
- ✅ No memory leaks
- ✅ No connection exhaustion
- ✅ Handles 100+ concurrent users

---

**Last Updated:** February 2026  
**Version:** 1.0.0
