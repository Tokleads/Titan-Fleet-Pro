import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { VALID_PERMISSION_KEYS } from '@shared/schema';

const MANAGER_ROLES = ['ADMIN', 'TRANSPORT_MANAGER', 'OFFICE', 'AUDITOR', 'MECHANIC', 'manager'];

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  'ADMIN': [...VALID_PERMISSION_KEYS],
  'TRANSPORT_MANAGER': VALID_PERMISSION_KEYS.filter(k => k !== 'user-roles'),
  'OFFICE': ['dashboard', 'inspections', 'defects', 'fuel-log', 'fleet', 'documents', 'notifications'],
  'AUDITOR': ['dashboard', 'inspections', 'defects', 'fleet', 'documents', 'o-licence'],
  'MECHANIC': ['dashboard', 'defects', 'fleet', 'vehicle-mgmt'],
};

export const requirePermission = (permissionKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const jwtUser = req.user;

    if (!jwtUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (jwtUser.role === 'ADMIN') {
      return next();
    }

    if (!MANAGER_ROLES.includes(jwtUser.role)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Manager access required.' });
    }

    try {
      const dbUser = await storage.getUser(jwtUser.userId);
      if (!dbUser || !dbUser.active) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userPermissions: string[] = Array.isArray(dbUser.permissions)
        ? dbUser.permissions.filter((p): p is string => p !== null)
        : [];

      if (userPermissions.length > 0) {
        if (userPermissions.includes(permissionKey)) {
          return next();
        }
        return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to access this resource.' });
      }

      const roleDefaults = ROLE_DEFAULT_PERMISSIONS[dbUser.role] || [];
      if (roleDefaults.includes(permissionKey)) {
        return next();
      }

      return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to access this resource.' });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};
