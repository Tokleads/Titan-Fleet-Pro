/**
 * User Roles & Permissions API Routes
 * 
 * Handles user role management, role assignment, and permission checks
 */

import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { users, VALID_PERMISSION_KEYS } from '../shared/schema.js';
import { eq, and, sql, desc, or, like } from 'drizzle-orm';

const router = Router();

// Role definitions with permissions
const ROLES = {
  ADMIN: {
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      'vehicles:view', 'vehicles:create', 'vehicles:edit', 'vehicles:delete',
      'drivers:view', 'drivers:create', 'drivers:edit', 'drivers:delete',
      'inspections:view', 'inspections:create', 'inspections:edit', 'inspections:delete',
      'defects:view', 'defects:create', 'defects:edit', 'defects:delete', 'defects:rectify',
      'reports:view', 'reports:export',
      'settings:view', 'settings:edit',
      'users:view', 'users:create', 'users:edit', 'users:delete',
      'company:view', 'company:edit',
      'geofences:view', 'geofences:create', 'geofences:edit', 'geofences:delete',
      'timesheets:view', 'timesheets:approve',
      'documents:view', 'documents:upload', 'documents:delete',
      'notifications:view', 'notifications:edit'
    ]
  },
  TRANSPORT_MANAGER: {
    value: 'TRANSPORT_MANAGER',
    label: 'Transport Manager',
    description: 'Fleet management with most permissions except user management',
    permissions: [
      'vehicles:view', 'vehicles:create', 'vehicles:edit',
      'drivers:view', 'drivers:create', 'drivers:edit',
      'inspections:view', 'inspections:create', 'inspections:edit',
      'defects:view', 'defects:create', 'defects:edit', 'defects:rectify',
      'reports:view', 'reports:export',
      'settings:view',
      'geofences:view', 'geofences:create', 'geofences:edit',
      'timesheets:view', 'timesheets:approve',
      'documents:view', 'documents:upload',
      'notifications:view'
    ]
  },
  DRIVER: {
    value: 'DRIVER',
    label: 'Driver',
    description: 'Limited access to own data and inspections',
    permissions: [
      'vehicles:view',
      'inspections:view', 'inspections:create',
      'defects:view', 'defects:create',
      'timesheets:view',
      'documents:view'
    ]
  },
  MECHANIC: {
    value: 'MECHANIC',
    label: 'Mechanic',
    description: 'Can view and rectify defects',
    permissions: [
      'vehicles:view',
      'defects:view', 'defects:edit', 'defects:rectify',
      'inspections:view',
      'documents:view'
    ]
  },
  AUDITOR: {
    value: 'AUDITOR',
    label: 'Auditor',
    description: 'Read-only access to all data',
    permissions: [
      'vehicles:view',
      'drivers:view',
      'inspections:view',
      'defects:view',
      'reports:view', 'reports:export',
      'settings:view',
      'users:view',
      'company:view',
      'geofences:view',
      'timesheets:view',
      'documents:view',
      'notifications:view'
    ]
  }
};

/**
 * GET /api/user-roles/users
 * Get all users with filters
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const { role, active, search, limit = '100', offset = '0' } = req.query;
    
    // Build where conditions
    const conditions = [eq(users.companyId, companyId)];
    
    if (role && role !== 'all') {
      conditions.push(eq(users.role, role as string));
    }
    
    if (active !== undefined && active !== 'all') {
      conditions.push(eq(users.active, active === 'true'));
    }
    
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )!
      );
    }
    
    const userList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      permissions: users.permissions,
      createdAt: users.createdAt
    })
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    // Get total count
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...conditions));
    
    res.json({
      users: userList,
      total: Number(count)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * PUT /api/user-roles/users/:id/role
 * Update user role
 */
router.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    // Validate role
    if (!ROLES[role as keyof typeof ROLES]) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Update user role
    const [user] = await db.update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

/**
 * PUT /api/user-roles/users/:id/status
 * Update user active status
 */
router.put('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { active } = req.body;
    
    // Update user status
    const [user] = await db.update(users)
      .set({ active })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        active: users.active
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * GET /api/user-roles/roles
 * Get all available roles
 */
router.get('/roles', async (req: Request, res: Response) => {
  try {
    const roles = Object.values(ROLES).map(role => ({
      value: role.value,
      label: role.label,
      description: role.description,
      permissionCount: role.permissions.length
    }));
    
    res.json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

/**
 * GET /api/user-roles/roles/:role/permissions
 * Get permissions for a specific role
 */
router.get('/roles/:role/permissions', async (req: Request, res: Response) => {
  try {
    const role = req.params.role.toUpperCase();
    
    if (!ROLES[role as keyof typeof ROLES]) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    const roleData = ROLES[role as keyof typeof ROLES];
    
    res.json({
      role: roleData.value,
      label: roleData.label,
      description: roleData.description,
      permissions: roleData.permissions
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

/**
 * GET /api/user-roles/permissions/check
 * Check if user has a specific permission
 */
router.get('/permissions/check', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const permission = req.query.permission as string;
    
    if (!userId || !permission) {
      return res.status(400).json({ error: 'Missing userId or permission' });
    }
    
    // Get user
    const [user] = await db.select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check permission
    const roleData = ROLES[user.role as keyof typeof ROLES];
    const hasPermission = roleData ? roleData.permissions.includes(permission) : false;
    
    res.json({ hasPermission });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({ error: 'Failed to check permission' });
  }
});

export default router;
