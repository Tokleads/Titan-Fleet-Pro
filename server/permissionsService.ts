/**
 * Permissions Service
 * 
 * Role-based access control for Titan Fleet.
 * Defines permissions for different user roles and provides middleware for route protection.
 */

import { Request, Response, NextFunction } from "express";

// User roles in the system
export type UserRole = 'ADMIN' | 'TRANSPORT_MANAGER' | 'DRIVER' | 'MECHANIC' | 'AUDITOR';

// Permission categories
export type Permission = 
  // Vehicle permissions
  | 'vehicles:view' | 'vehicles:create' | 'vehicles:edit' | 'vehicles:delete'
  // Driver permissions
  | 'drivers:view' | 'drivers:create' | 'drivers:edit' | 'drivers:delete'
  // Inspection permissions
  | 'inspections:view' | 'inspections:create' | 'inspections:edit' | 'inspections:delete'
  // Defect permissions
  | 'defects:view' | 'defects:create' | 'defects:edit' | 'defects:delete' | 'defects:rectify'
  // Report permissions
  | 'reports:view' | 'reports:export'
  // Settings permissions
  | 'settings:view' | 'settings:edit'
  // User management permissions
  | 'users:view' | 'users:create' | 'users:edit' | 'users:delete'
  // Company permissions
  | 'company:view' | 'company:edit'
  // Geofence permissions
  | 'geofences:view' | 'geofences:create' | 'geofences:edit' | 'geofences:delete'
  // Timesheet permissions
  | 'timesheets:view' | 'timesheets:approve' | 'timesheets:export'
  // Document permissions
  | 'documents:view' | 'documents:upload' | 'documents:delete'
  // Notification permissions
  | 'notifications:view' | 'notifications:manage'
  // Hierarchy permissions
  | 'hierarchy:view' | 'hierarchy:manage';

/**
 * Role-Permission Matrix
 * Defines what permissions each role has
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  // ADMIN: Full access to everything
  ADMIN: [
    'vehicles:view', 'vehicles:create', 'vehicles:edit', 'vehicles:delete',
    'drivers:view', 'drivers:create', 'drivers:edit', 'drivers:delete',
    'inspections:view', 'inspections:create', 'inspections:edit', 'inspections:delete',
    'defects:view', 'defects:create', 'defects:edit', 'defects:delete', 'defects:rectify',
    'reports:view', 'reports:export',
    'settings:view', 'settings:edit',
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'company:view', 'company:edit',
    'geofences:view', 'geofences:create', 'geofences:edit', 'geofences:delete',
    'timesheets:view', 'timesheets:approve', 'timesheets:export',
    'documents:view', 'documents:upload', 'documents:delete',
    'notifications:view', 'notifications:manage',
    'hierarchy:view', 'hierarchy:manage'
  ],
  
  // TRANSPORT_MANAGER: Most permissions except user management and company settings
  TRANSPORT_MANAGER: [
    'vehicles:view', 'vehicles:create', 'vehicles:edit',
    'drivers:view', 'drivers:create', 'drivers:edit',
    'inspections:view', 'inspections:create', 'inspections:edit',
    'defects:view', 'defects:create', 'defects:edit', 'defects:rectify',
    'reports:view', 'reports:export',
    'settings:view',
    'users:view',
    'company:view',
    'geofences:view', 'geofences:create', 'geofences:edit',
    'timesheets:view', 'timesheets:approve', 'timesheets:export',
    'documents:view', 'documents:upload',
    'notifications:view',
    'hierarchy:view'
  ],
  
  // DRIVER: Limited to their own data and creating inspections/defects
  DRIVER: [
    'vehicles:view',
    'drivers:view',
    'inspections:view', 'inspections:create',
    'defects:view', 'defects:create',
    'timesheets:view',
    'documents:view'
  ],
  
  // MECHANIC: Can view and rectify defects, view vehicles
  MECHANIC: [
    'vehicles:view',
    'inspections:view',
    'defects:view', 'defects:edit', 'defects:rectify',
    'documents:view',
    'timesheets:view'
  ],
  
  // AUDITOR: Read-only access to most data
  AUDITOR: [
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
    'hierarchy:view'
  ]
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[userRole];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  return rolePermissions[userRole] || [];
}

/**
 * Export role permissions for testing
 */
export const ROLE_PERMISSIONS = rolePermissions;

/**
 * Middleware: Require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  next();
}

/**
 * Middleware: Require specific permission
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasPermission(user.role as UserRole, permission)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `You do not have permission to ${permission}` 
      });
    }
    
    next();
  };
}

/**
 * Middleware: Require any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasAnyPermission(user.role as UserRole, permissions)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have the required permissions' 
      });
    }
    
    next();
  };
}

/**
 * Middleware: Require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Admin access required' 
    });
  }
  
  next();
}

/**
 * Middleware: Require manager role (ADMIN or TRANSPORT_MANAGER)
 */
export function requireManager(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (user.role !== 'ADMIN' && user.role !== 'TRANSPORT_MANAGER') {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Manager access required' 
    });
  }
  
  next();
}
