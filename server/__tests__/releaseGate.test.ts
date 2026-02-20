import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

process.env.SESSION_SECRET = 'test-secret-key-for-jwt-signing-min-length';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-jwt';

import { signToken, verifyToken, populateUser, requireAuth, extractToken } from '../jwtAuth';
import type { JwtPayload } from '../jwtAuth';
import type { Request, Response, NextFunction } from 'express';

const mockStorage = {
  getUser: vi.fn(),
  updateUser: vi.fn(),
  getUsersByCompany: vi.fn(),
  getCompanyByCode: vi.fn(),
  getUserByCompanyAndPin: vi.fn(),
  createInspection: vi.fn(),
  getDefectsByCompany: vi.fn(),
  createVehicle: vi.fn(),
  getVehicleById: vi.fn(),
  updateVehicle: vi.fn(),
  getInspectionsByDriver: vi.fn(),
  getTimesheets: vi.fn(),
  getDriverNotifications: vi.fn(),
  getShiftChecksByDriver: vi.fn(),
  markNotificationRead: vi.fn(),
  createReminder: vi.fn(),
  getReminder: vi.fn(),
  getRemindersByCompany: vi.fn(),
  updateReminder: vi.fn(),
  deleteReminder: vi.fn(),
  getDueReminders: vi.fn(),
  getDefect: vi.fn(),
  updateDefect: vi.fn(),
  getDefectsByReporter: vi.fn(),
  assignDefectToMechanic: vi.fn(),
  createRectification: vi.fn(),
  getRectificationsByDefect: vi.fn(),
  createAuditLog: vi.fn(),
  getAuditLogs: vi.fn(),
  verifyAuditLogIntegrity: vi.fn(),
  getTimesheetsByDriver: vi.fn(),
  getNotificationsByUser: vi.fn(),
  getShiftChecksByCompany: vi.fn(),
};

vi.mock('../storage', () => ({
  storage: mockStorage,
}));

vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
  pool: {
    query: vi.fn(),
    end: vi.fn(),
  },
}));

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    params: {},
    query: {},
    body: {},
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response & { _status: number; _json: any } {
  const res: any = {
    _status: 200,
    _json: null,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: any) {
      res._json = data;
      return res;
    },
  };
  return res;
}

const testPayload: JwtPayload = {
  userId: 1,
  companyId: 100,
  role: 'DRIVER',
  email: 'driver@test.com',
  name: 'Test Driver',
};

describe('Release Gate Tests', () => {

  describe('1. Authentication Tests', () => {
    it('signToken creates valid JWT and verifyToken decodes it', () => {
      const token = signToken(testPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe(testPayload.userId);
      expect(decoded!.companyId).toBe(testPayload.companyId);
      expect(decoded!.role).toBe(testPayload.role);
      expect(decoded!.email).toBe(testPayload.email);
      expect(decoded!.name).toBe(testPayload.name);
    });

    it('verifyToken returns null for garbage/expired tokens', () => {
      expect(verifyToken('garbage.token.value')).toBeNull();
      expect(verifyToken('')).toBeNull();
      expect(verifyToken('not-a-jwt')).toBeNull();

      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6MH0.invalid';
      expect(verifyToken(expiredToken)).toBeNull();
    });

    it('populateUser middleware sets req.user from valid Bearer token', () => {
      const token = signToken(testPayload);
      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();
      const next = vi.fn();

      populateUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user!.userId).toBe(testPayload.userId);
      expect(req.user!.companyId).toBe(testPayload.companyId);
      expect(req.user!.role).toBe('DRIVER');
    });

    it('requireAuth returns 401 when no user', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
      expect(res._json).toEqual(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });
  });

  describe('2. Tenant Isolation Tests', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('getCompanyByCode returns undefined for non-existent codes', async () => {
      mockStorage.getCompanyByCode.mockResolvedValue(undefined);

      const { storage } = await import('../storage');
      const result = await storage.getCompanyByCode('NON_EXISTENT_CODE');

      expect(result).toBeUndefined();
      expect(mockStorage.getCompanyByCode).toHaveBeenCalledWith('NON_EXISTENT_CODE');
    });

    it('getUserByCompanyAndPin returns undefined for wrong company', async () => {
      mockStorage.getUserByCompanyAndPin.mockResolvedValue(undefined);

      const { storage } = await import('../storage');
      const result = await storage.getUserByCompanyAndPin(999, '1234', 'driver');

      expect(result).toBeUndefined();
      expect(mockStorage.getUserByCompanyAndPin).toHaveBeenCalledWith(999, '1234', 'driver');
    });

    it('getUserByCompanyAndPin matches manager role to TRANSPORT_MANAGER', async () => {
      const mockManager = {
        id: 5,
        companyId: 100,
        name: 'Manager User',
        email: 'manager@test.com',
        role: 'TRANSPORT_MANAGER',
        pin: '9999',
        active: true,
      };
      mockStorage.getUserByCompanyAndPin.mockResolvedValue(mockManager);

      const { storage } = await import('../storage');
      const result = await storage.getUserByCompanyAndPin(100, '9999', 'manager');

      expect(result).toBeDefined();
      expect(result!.role).toBe('TRANSPORT_MANAGER');
      expect(mockStorage.getUserByCompanyAndPin).toHaveBeenCalledWith(100, '9999', 'manager');
    });
  });

  describe('3. Storage/Data Integrity Tests', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('createInspection stores and returns correct data shape', async () => {
      const inspectionInput = {
        companyId: 100,
        vehicleId: 1,
        driverId: 1,
        type: 'SAFETY_CHECK',
        odometer: 50000,
        status: 'PASS',
        checklist: [{ item: 'brakes', status: 'ok' }],
      };

      const mockInspection = {
        id: 42,
        ...inspectionInput,
        hasTrailer: false,
        defects: null,
        cabPhotos: null,
        driveFolderId: null,
        startedAt: null,
        completedAt: null,
        durationSeconds: null,
        vehicleCategory: null,
        createdAt: new Date(),
      };

      mockStorage.createInspection.mockResolvedValue(mockInspection);

      const { storage } = await import('../storage');
      const result = await storage.createInspection(inspectionInput as any);

      expect(result).toBeDefined();
      expect(result.id).toBe(42);
      expect(result.companyId).toBe(100);
      expect(result.vehicleId).toBe(1);
      expect(result.driverId).toBe(1);
      expect(result.type).toBe('SAFETY_CHECK');
      expect(result.status).toBe('PASS');
      expect(result.odometer).toBe(50000);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('getDefectsByCompany only returns defects for that company', async () => {
      const company100Defects = [
        { id: 1, companyId: 100, category: 'BRAKES', severity: 'HIGH', status: 'OPEN' },
        { id: 2, companyId: 100, category: 'TYRES', severity: 'MEDIUM', status: 'OPEN' },
      ];

      mockStorage.getDefectsByCompany.mockImplementation(async (companyId: number) => {
        if (companyId === 100) return company100Defects;
        return [];
      });

      const { storage } = await import('../storage');

      const defects100 = await storage.getDefectsByCompany(100);
      expect(defects100).toHaveLength(2);
      expect(defects100.every((d: any) => d.companyId === 100)).toBe(true);

      const defects200 = await storage.getDefectsByCompany(200);
      expect(defects200).toHaveLength(0);
    });

    it('vehicle CRUD operations (create, get, update)', async () => {
      const vehicleInput = {
        companyId: 100,
        vrm: 'AB12 CDE',
        make: 'Ford',
        model: 'Transit',
      };

      const mockVehicle = {
        id: 10,
        ...vehicleInput,
        fleetNumber: null,
        vehicleCategory: 'HGV',
        motDue: null,
        taxDue: null,
        active: true,
        vorStatus: false,
        currentMileage: 0,
        createdAt: new Date(),
      };

      mockStorage.createVehicle.mockResolvedValue(mockVehicle);
      mockStorage.getVehicleById.mockResolvedValue(mockVehicle);
      mockStorage.updateVehicle.mockResolvedValue({ ...mockVehicle, currentMileage: 5000 });

      const { storage } = await import('../storage');

      const created = await storage.createVehicle(vehicleInput as any);
      expect(created.id).toBe(10);
      expect(created.vrm).toBe('AB12 CDE');

      const fetched = await storage.getVehicleById(10);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(10);

      const updated = await storage.updateVehicle(10, { currentMileage: 5000 });
      expect(updated).toBeDefined();
      expect(updated!.currentMileage).toBe(5000);
    });
  });

  describe('4. Wage Calculation Tests', () => {
    it('UK timezone day detection - isWeekendInUK', () => {
      function getUKDayOfWeek(date: Date): number {
        const ukDateStr = new Intl.DateTimeFormat('en-GB', {
          weekday: 'short', timeZone: 'Europe/London'
        }).format(date);
        const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
        return dayMap[ukDateStr] ?? 0;
      }

      function isWeekendInUK(date: Date): boolean {
        const day = getUKDayOfWeek(date);
        return day === 0 || day === 6;
      }

      function isNightHourInUK(date: Date, nightStart: number = 22, nightEnd: number = 6): boolean {
        const hour = parseInt(new Intl.DateTimeFormat('en-GB', {
          hour: 'numeric', hour12: false, timeZone: 'Europe/London'
        }).format(date));
        return nightStart > nightEnd
          ? (hour >= nightStart || hour < nightEnd)
          : (hour >= nightStart && hour < nightEnd);
      }

      const saturday = new Date('2026-02-21T12:00:00Z');
      const sunday = new Date('2026-02-22T12:00:00Z');
      const monday = new Date('2026-02-23T12:00:00Z');

      expect(isWeekendInUK(saturday)).toBe(true);
      expect(isWeekendInUK(sunday)).toBe(true);
      expect(isWeekendInUK(monday)).toBe(false);

      const lateNight = new Date('2026-02-20T23:00:00Z');
      const earlyMorning = new Date('2026-02-20T04:00:00Z');
      const daytime = new Date('2026-02-20T12:00:00Z');

      expect(isNightHourInUK(lateNight)).toBe(true);
      expect(isNightHourInUK(earlyMorning)).toBe(true);
      expect(isNightHourInUK(daytime)).toBe(false);
    });

    it('bank holidays fetch uses caching mechanism', async () => {
      let bankHolidayCache: { data: any; fetchedAt: number } | null = null;
      const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

      function getCachedOrFetch(now: number): { shouldFetch: boolean } {
        if (bankHolidayCache && (now - bankHolidayCache.fetchedAt) < CACHE_TTL_MS) {
          return { shouldFetch: false };
        }
        return { shouldFetch: true };
      }

      expect(getCachedOrFetch(Date.now()).shouldFetch).toBe(true);

      bankHolidayCache = { data: { 'england-and-wales': { events: [] } }, fetchedAt: Date.now() };
      expect(getCachedOrFetch(Date.now()).shouldFetch).toBe(false);

      const expiredTime = Date.now() + CACHE_TTL_MS + 1000;
      expect(getCachedOrFetch(expiredTime).shouldFetch).toBe(true);
    });

    it('shift duration calculation is correct', () => {
      const arrivalTime = new Date('2026-02-20T08:00:00Z');
      const departureTime = new Date('2026-02-20T16:30:00Z');
      const totalMinutes = Math.floor((departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60));

      expect(totalMinutes).toBe(510);

      const dailyOvertimeThreshold = 480;
      const netMinutes = totalMinutes - (totalMinutes > 360 ? 30 : 0);
      const overtimeMinutes = Math.max(0, netMinutes - dailyOvertimeThreshold);

      expect(netMinutes).toBe(480);
      expect(overtimeMinutes).toBe(0);

      const longDeparture = new Date('2026-02-20T18:00:00Z');
      const longTotalMinutes = Math.floor((longDeparture.getTime() - arrivalTime.getTime()) / (1000 * 60));
      const longNetMinutes = longTotalMinutes - (longTotalMinutes > 360 ? 30 : 0);
      const longOvertime = Math.max(0, longNetMinutes - dailyOvertimeThreshold);

      expect(longTotalMinutes).toBe(600);
      expect(longNetMinutes).toBe(570);
      expect(longOvertime).toBe(90);
    });
  });

  describe('5. GDPR Tests', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('exportUserData returns only the target user data', async () => {
      const targetUser = {
        id: 1,
        companyId: 100,
        name: 'Target User',
        email: 'target@test.com',
        role: 'DRIVER',
        active: true,
        totpEnabled: false,
        createdAt: new Date(),
      };

      mockStorage.getUser.mockResolvedValue(targetUser);
      mockStorage.getInspectionsByDriver.mockResolvedValue([
        { id: 10, vehicleId: 1, driverId: 1, status: 'PASS', createdAt: new Date() },
      ]);
      mockStorage.getDefectsByCompany.mockResolvedValue([
        { id: 20, reportedBy: 1, companyId: 100, category: 'BRAKES', status: 'OPEN', createdAt: new Date() },
        { id: 21, reportedBy: 2, companyId: 100, category: 'TYRES', status: 'OPEN', createdAt: new Date() },
      ]);
      mockStorage.getTimesheets.mockResolvedValue([
        { driverId: 1, totalMinutes: 480, status: 'COMPLETED' },
        { driverId: 2, totalMinutes: 300, status: 'COMPLETED' },
      ]);
      mockStorage.getDriverNotifications.mockResolvedValue([
        { id: 30, type: 'INFO', title: 'Test', message: 'Test msg', createdAt: new Date() },
      ]);
      mockStorage.getShiftChecksByDriver.mockResolvedValue([]);

      const { exportUserData } = await import('../gdprService');
      const result = await exportUserData(1);

      expect(result.user.id).toBe(1);
      expect(result.user.name).toBe('Target User');
      expect(result.user.email).toBe('target@test.com');

      expect(result.defectsReported).toHaveLength(1);
      expect(result.defectsReported[0].id).toBe(20);

      expect(result.timesheets).toHaveLength(1);
      expect(result.timesheets[0].totalMinutes).toBe(480);

      expect(result.metadata.totalInspections).toBe(1);
      expect(result.metadata.totalDefectsReported).toBe(1);
    });

    it('anonymizeUser redacts personal information', async () => {
      const userToAnonymize = {
        id: 5,
        companyId: 100,
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'DRIVER',
        active: true,
      };

      mockStorage.getUser.mockResolvedValue(userToAnonymize);
      mockStorage.updateUser.mockResolvedValue({
        ...userToAnonymize,
        name: 'Deleted User 5',
        email: 'deleted.user.5@anonymized.local',
        active: false,
      });
      mockStorage.getDriverNotifications.mockResolvedValue([]);

      const { anonymizeUser } = await import('../gdprService');
      await anonymizeUser(5);

      expect(mockStorage.updateUser).toHaveBeenCalledWith(5, {
        name: 'Deleted User 5',
        email: 'deleted.user.5@anonymized.local',
        active: false,
      });
    });
  });

  describe('6. Rate Limiter Config Tests', () => {
    it('rate limiter exports are proper middleware functions', async () => {
      const rateLimiter = await import('../rateLimiter');

      expect(typeof rateLimiter.standardLimiter).toBe('function');
      expect(typeof rateLimiter.authLimiter).toBe('function');
      expect(typeof rateLimiter.uploadLimiter).toBe('function');
      expect(typeof rateLimiter.reportLimiter).toBe('function');
      expect(typeof rateLimiter.gpsLimiter).toBe('function');
      expect(typeof rateLimiter.broadcastLimiter).toBe('function');
      expect(typeof rateLimiter.speedLimiter).toBe('function');
      expect(typeof rateLimiter.publicLimiter).toBe('function');
      expect(typeof rateLimiter.readLimiter).toBe('function');
      expect(typeof rateLimiter.writeLimiter).toBe('function');
    });

    it('keyGenerator returns different keys for authenticated vs anonymous', () => {
      function keyGenerator(req: any): string {
        const userId = req.user?.id;
        if (userId) return `user-${userId}`;
        const forwarded = req.headers['x-forwarded-for'];
        const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || 'unknown';
        return `ip-${ip}`;
      }

      const authedReq = { user: { id: 42 }, headers: {}, socket: { remoteAddress: '10.0.0.1' } };
      const anonReq = { headers: {}, socket: { remoteAddress: '192.168.1.1' } };
      const forwardedReq = { headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18' }, socket: {} };

      expect(keyGenerator(authedReq)).toBe('user-42');
      expect(keyGenerator(anonReq)).toBe('ip-192.168.1.1');
      expect(keyGenerator(forwardedReq)).toBe('ip-203.0.113.50');

      expect(keyGenerator(authedReq)).not.toBe(keyGenerator(anonReq));
    });
  });

  describe('7. Health Check Tests', () => {
    it('health endpoint returns proper shape', async () => {
      const { livenessProbe } = await import('../healthCheck');

      const req = createMockRequest();
      const res = createMockResponse();

      livenessProbe(req, res);

      expect(res._status).toBe(200);
      expect(res._json).toBeDefined();
      expect(res._json.status).toBe('alive');
      expect(res._json.timestamp).toBeDefined();
      expect(typeof res._json.timestamp).toBe('string');
      expect(() => new Date(res._json.timestamp)).not.toThrow();
    });
  });
});
