/**
 * Role-Based Access Control (RBAC) System
 * Defines user roles and their permissions across the Titan Fleet platform
 */

// User Roles
export const UserRole = {
  ADMIN: 'ADMIN',
  TRANSPORT_MANAGER: 'TRANSPORT_MANAGER',
  DRIVER: 'DRIVER',
  MECHANIC: 'MECHANIC',
  AUDITOR: 'AUDITOR',
  PLANNER: 'PLANNER',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Permission Categories
export const Permission = {
  // Company Management
  COMPANY_VIEW: 'COMPANY_VIEW',
  COMPANY_EDIT: 'COMPANY_EDIT',
  COMPANY_DELETE: 'COMPANY_DELETE',
  
  // User Management
  USER_VIEW: 'USER_VIEW',
  USER_CREATE: 'USER_CREATE',
  USER_EDIT: 'USER_EDIT',
  USER_DELETE: 'USER_DELETE',
  USER_ASSIGN_ROLE: 'USER_ASSIGN_ROLE',
  
  // Vehicle Management
  VEHICLE_VIEW: 'VEHICLE_VIEW',
  VEHICLE_CREATE: 'VEHICLE_CREATE',
  VEHICLE_EDIT: 'VEHICLE_EDIT',
  VEHICLE_DELETE: 'VEHICLE_DELETE',
  
  // Driver Operations
  INSPECTION_CREATE: 'INSPECTION_CREATE',
  INSPECTION_VIEW_OWN: 'INSPECTION_VIEW_OWN',
  INSPECTION_VIEW_ALL: 'INSPECTION_VIEW_ALL',
  DEFECT_CREATE: 'DEFECT_CREATE',
  DEFECT_VIEW_OWN: 'DEFECT_VIEW_OWN',
  DEFECT_VIEW_ALL: 'DEFECT_VIEW_ALL',
  TIMESHEET_CLOCK_IN: 'TIMESHEET_CLOCK_IN',
  TIMESHEET_CLOCK_OUT: 'TIMESHEET_CLOCK_OUT',
  TIMESHEET_VIEW_OWN: 'TIMESHEET_VIEW_OWN',
  
  // Manager Operations
  TIMESHEET_VIEW_ALL: 'TIMESHEET_VIEW_ALL',
  TIMESHEET_EDIT: 'TIMESHEET_EDIT',
  TIMESHEET_EXPORT: 'TIMESHEET_EXPORT',
  DEFECT_ASSIGN: 'DEFECT_ASSIGN',
  DEFECT_VERIFY: 'DEFECT_VERIFY',
  DEFECT_CLOSE: 'DEFECT_CLOSE',
  INSPECTION_APPROVE: 'INSPECTION_APPROVE',
  LIVE_TRACKING_VIEW: 'LIVE_TRACKING_VIEW',
  GEOFENCE_MANAGE: 'GEOFENCE_MANAGE',
  NOTIFICATION_BROADCAST: 'NOTIFICATION_BROADCAST',
  
  // Mechanic Operations
  DEFECT_VIEW_ASSIGNED: 'DEFECT_VIEW_ASSIGNED',
  RECTIFICATION_CREATE: 'RECTIFICATION_CREATE',
  RECTIFICATION_UPDATE: 'RECTIFICATION_UPDATE',
  RECTIFICATION_COMPLETE: 'RECTIFICATION_COMPLETE',
  PARTS_MANAGE: 'PARTS_MANAGE',
  
  // Auditor Operations
  AUDIT_LOG_VIEW: 'AUDIT_LOG_VIEW',
  AUDIT_LOG_EXPORT: 'AUDIT_LOG_EXPORT',
  COMPLIANCE_REPORT_VIEW: 'COMPLIANCE_REPORT_VIEW',
  COMPLIANCE_REPORT_EXPORT: 'COMPLIANCE_REPORT_EXPORT',
  
  // Reporting
  REPORT_VIEW: 'REPORT_VIEW',
  REPORT_EXPORT: 'REPORT_EXPORT',
  REPORT_SCHEDULE: 'REPORT_SCHEDULE',
  
  // Reminders
  REMINDER_VIEW: 'REMINDER_VIEW',
  REMINDER_CREATE: 'REMINDER_CREATE',
  REMINDER_EDIT: 'REMINDER_EDIT',
  REMINDER_DELETE: 'REMINDER_DELETE',
  
  // Settings
  SETTINGS_VIEW: 'SETTINGS_VIEW',
  SETTINGS_EDIT: 'SETTINGS_EDIT',
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

/**
 * Permissions Matrix
 * Defines which permissions each role has
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  // Admin: Full access to everything
  [UserRole.ADMIN]: [
    // Company
    Permission.COMPANY_VIEW,
    Permission.COMPANY_EDIT,
    Permission.COMPANY_DELETE,
    
    // Users
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_EDIT,
    Permission.USER_DELETE,
    Permission.USER_ASSIGN_ROLE,
    
    // Vehicles
    Permission.VEHICLE_VIEW,
    Permission.VEHICLE_CREATE,
    Permission.VEHICLE_EDIT,
    Permission.VEHICLE_DELETE,
    
    // Inspections & Defects
    Permission.INSPECTION_VIEW_ALL,
    Permission.DEFECT_VIEW_ALL,
    Permission.DEFECT_ASSIGN,
    Permission.DEFECT_VERIFY,
    Permission.DEFECT_CLOSE,
    Permission.INSPECTION_APPROVE,
    
    // Timesheets
    Permission.TIMESHEET_VIEW_ALL,
    Permission.TIMESHEET_EDIT,
    Permission.TIMESHEET_EXPORT,
    
    // Manager Operations
    Permission.LIVE_TRACKING_VIEW,
    Permission.GEOFENCE_MANAGE,
    Permission.NOTIFICATION_BROADCAST,
    
    // Auditing
    Permission.AUDIT_LOG_VIEW,
    Permission.AUDIT_LOG_EXPORT,
    Permission.COMPLIANCE_REPORT_VIEW,
    Permission.COMPLIANCE_REPORT_EXPORT,
    
    // Reporting
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.REPORT_SCHEDULE,
    
    // Reminders
    Permission.REMINDER_VIEW,
    Permission.REMINDER_CREATE,
    Permission.REMINDER_EDIT,
    Permission.REMINDER_DELETE,
    
    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],
  
  // Transport Manager: Operational management
  [UserRole.TRANSPORT_MANAGER]: [
    // Company (view only)
    Permission.COMPANY_VIEW,
    
    // Users (limited)
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_EDIT,
    
    // Vehicles
    Permission.VEHICLE_VIEW,
    Permission.VEHICLE_CREATE,
    Permission.VEHICLE_EDIT,
    
    // Inspections & Defects
    Permission.INSPECTION_VIEW_ALL,
    Permission.DEFECT_VIEW_ALL,
    Permission.DEFECT_ASSIGN,
    Permission.DEFECT_VERIFY,
    Permission.DEFECT_CLOSE,
    Permission.INSPECTION_APPROVE,
    
    // Timesheets
    Permission.TIMESHEET_VIEW_ALL,
    Permission.TIMESHEET_EDIT,
    Permission.TIMESHEET_EXPORT,
    
    // Manager Operations
    Permission.LIVE_TRACKING_VIEW,
    Permission.GEOFENCE_MANAGE,
    Permission.NOTIFICATION_BROADCAST,
    
    // Reporting
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    
    // Reminders
    Permission.REMINDER_VIEW,
    Permission.REMINDER_CREATE,
    Permission.REMINDER_EDIT,
    Permission.REMINDER_DELETE,
    
    // Settings (view only)
    Permission.SETTINGS_VIEW,
  ],
  
  // Driver: Field operations
  [UserRole.DRIVER]: [
    // Vehicles (view only)
    Permission.VEHICLE_VIEW,
    
    // Inspections
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_VIEW_OWN,
    
    // Defects
    Permission.DEFECT_CREATE,
    Permission.DEFECT_VIEW_OWN,
    
    // Timesheets
    Permission.TIMESHEET_CLOCK_IN,
    Permission.TIMESHEET_CLOCK_OUT,
    Permission.TIMESHEET_VIEW_OWN,
    
    // Reminders (view only)
    Permission.REMINDER_VIEW,
  ],
  
  // Mechanic: Defect rectification
  [UserRole.MECHANIC]: [
    // Vehicles (view only)
    Permission.VEHICLE_VIEW,
    
    // Defects
    Permission.DEFECT_VIEW_ASSIGNED,
    Permission.DEFECT_VIEW_ALL,
    
    // Rectification
    Permission.RECTIFICATION_CREATE,
    Permission.RECTIFICATION_UPDATE,
    Permission.RECTIFICATION_COMPLETE,
    Permission.PARTS_MANAGE,
    
    // Inspections (view only)
    Permission.INSPECTION_VIEW_ALL,
    
    // Reminders (view only)
    Permission.REMINDER_VIEW,
  ],
  
  // Auditor: Read-only compliance access
  [UserRole.AUDITOR]: [
    // Company (view only)
    Permission.COMPANY_VIEW,
    
    // Users (view only)
    Permission.USER_VIEW,
    
    // Vehicles (view only)
    Permission.VEHICLE_VIEW,
    
    // Inspections & Defects (view only)
    Permission.INSPECTION_VIEW_ALL,
    Permission.DEFECT_VIEW_ALL,
    
    // Timesheets (view only)
    Permission.TIMESHEET_VIEW_ALL,
    
    // Auditing (full access)
    Permission.AUDIT_LOG_VIEW,
    Permission.AUDIT_LOG_EXPORT,
    Permission.COMPLIANCE_REPORT_VIEW,
    Permission.COMPLIANCE_REPORT_EXPORT,
    
    // Reporting (view and export)
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    
    // Reminders (view only)
    Permission.REMINDER_VIEW,
    
    // Settings (view only)
    Permission.SETTINGS_VIEW,
  ],

  // Planner: View-only access to timesheets and vehicles (on-duty drivers dashboard)
  [UserRole.PLANNER]: [
    // Vehicles (view only)
    Permission.VEHICLE_VIEW,

    // Timesheets (view only, no clock in/out)
    Permission.TIMESHEET_VIEW_ALL,
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return RolePermissions[role] ?? [];
}

/**
 * Role descriptions for UI
 */
export const RoleDescriptions: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Full system access. Can manage company settings, users, and all operations.',
  [UserRole.TRANSPORT_MANAGER]: 'Operational management. Can manage fleet, drivers, inspections, and timesheets.',
  [UserRole.DRIVER]: 'Field operations. Can perform inspections, report defects, and manage own timesheets.',
  [UserRole.MECHANIC]: 'Workshop operations. Can view and rectify assigned defects.',
  [UserRole.AUDITOR]: 'Read-only compliance access. Can view all records and export audit trails.',
  [UserRole.PLANNER]: 'View-only planner access. Can see who is clocked in and view vehicles but cannot clock drivers in or out.',
};

/**
 * Role display names for UI
 */
export const RoleNames: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.TRANSPORT_MANAGER]: 'Transport Manager',
  [UserRole.DRIVER]: 'Driver',
  [UserRole.MECHANIC]: 'Mechanic',
  [UserRole.AUDITOR]: 'Auditor',
  [UserRole.PLANNER]: 'Planner',
};
