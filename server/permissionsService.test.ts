import { describe, it, expect } from 'vitest';
import { hasPermission, getRolePermissions, ROLE_PERMISSIONS } from './permissionsService';

describe('permissionsService', () => {
  describe('hasPermission', () => {
    it('should return true for ADMIN with any permission', () => {
      expect(hasPermission('ADMIN', 'vehicles:view')).toBe(true);
      expect(hasPermission('ADMIN', 'users:delete')).toBe(true);
      expect(hasPermission('ADMIN', 'company:edit')).toBe(true);
    });

    it('should return true for TRANSPORT_MANAGER with allowed permissions', () => {
      expect(hasPermission('TRANSPORT_MANAGER', 'vehicles:view')).toBe(true);
      expect(hasPermission('TRANSPORT_MANAGER', 'vehicles:create')).toBe(true);
      expect(hasPermission('TRANSPORT_MANAGER', 'drivers:edit')).toBe(true);
    });

    it('should return false for TRANSPORT_MANAGER with disallowed permissions', () => {
      expect(hasPermission('TRANSPORT_MANAGER', 'users:delete')).toBe(false);
      expect(hasPermission('TRANSPORT_MANAGER', 'company:edit')).toBe(false);
    });

    it('should return true for DRIVER with own data permissions', () => {
      expect(hasPermission('DRIVER', 'inspections:create')).toBe(true);
      expect(hasPermission('DRIVER', 'defects:create')).toBe(true);
      expect(hasPermission('DRIVER', 'vehicles:view')).toBe(true);
    });

    it('should return false for DRIVER with restricted permissions', () => {
      expect(hasPermission('DRIVER', 'vehicles:create')).toBe(false);
      expect(hasPermission('DRIVER', 'drivers:edit')).toBe(false);
      expect(hasPermission('DRIVER', 'users:view')).toBe(false);
    });

    it('should return true for MECHANIC with defect permissions', () => {
      expect(hasPermission('MECHANIC', 'defects:view')).toBe(true);
      expect(hasPermission('MECHANIC', 'defects:edit')).toBe(true);
      expect(hasPermission('MECHANIC', 'vehicles:view')).toBe(true);
    });

    it('should return false for MECHANIC with non-defect permissions', () => {
      expect(hasPermission('MECHANIC', 'drivers:view')).toBe(false);
      expect(hasPermission('MECHANIC', 'inspections:create')).toBe(false);
    });

    it('should return true for AUDITOR with read-only permissions', () => {
      expect(hasPermission('AUDITOR', 'vehicles:view')).toBe(true);
      expect(hasPermission('AUDITOR', 'drivers:view')).toBe(true);
      expect(hasPermission('AUDITOR', 'reports:view')).toBe(true);
    });

    it('should return false for AUDITOR with write permissions', () => {
      expect(hasPermission('AUDITOR', 'vehicles:create')).toBe(false);
      expect(hasPermission('AUDITOR', 'drivers:edit')).toBe(false);
      expect(hasPermission('AUDITOR', 'defects:delete')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('INVALID_ROLE', 'vehicles:view')).toBe(false);
    });

    it('should return false for invalid permission', () => {
      expect(hasPermission('ADMIN', 'invalid:permission')).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for ADMIN', () => {
      const permissions = getRolePermissions('ADMIN');
      expect(permissions.length).toBeGreaterThan(30); // Should have 41 permissions
      expect(permissions).toContain('vehicles:view');
      expect(permissions).toContain('users:delete');
      expect(permissions).toContain('company:edit');
    });

    it('should return correct permissions for TRANSPORT_MANAGER', () => {
      const permissions = getRolePermissions('TRANSPORT_MANAGER');
      expect(permissions).toContain('vehicles:view');
      expect(permissions).toContain('drivers:edit');
      expect(permissions).not.toContain('users:delete');
      expect(permissions).not.toContain('company:edit');
    });

    it('should return correct permissions for DRIVER', () => {
      const permissions = getRolePermissions('DRIVER');
      expect(permissions).toContain('vehicles:view');
      expect(permissions).toContain('inspections:create');
      expect(permissions).toContain('drivers:view'); // Drivers can view driver list
      expect(permissions).not.toContain('vehicles:create');
      expect(permissions).not.toContain('drivers:edit');
    });

    it('should return correct permissions for MECHANIC', () => {
      const permissions = getRolePermissions('MECHANIC');
      expect(permissions).toContain('defects:view');
      expect(permissions).toContain('defects:edit');
      expect(permissions).not.toContain('drivers:view');
    });

    it('should return correct permissions for AUDITOR', () => {
      const permissions = getRolePermissions('AUDITOR');
      expect(permissions).toContain('vehicles:view');
      expect(permissions).toContain('reports:view');
      expect(permissions).not.toContain('vehicles:create');
      expect(permissions).not.toContain('drivers:edit');
    });

    it('should return empty array for invalid role', () => {
      const permissions = getRolePermissions('INVALID_ROLE');
      expect(permissions).toEqual([]);
    });
  });

  describe('ROLE_PERMISSIONS structure', () => {
    it('should have all required roles', () => {
      expect(ROLE_PERMISSIONS).toHaveProperty('ADMIN');
      expect(ROLE_PERMISSIONS).toHaveProperty('TRANSPORT_MANAGER');
      expect(ROLE_PERMISSIONS).toHaveProperty('DRIVER');
      expect(ROLE_PERMISSIONS).toHaveProperty('MECHANIC');
      expect(ROLE_PERMISSIONS).toHaveProperty('AUDITOR');
    });

    it('should have unique permissions for each role', () => {
      Object.values(ROLE_PERMISSIONS).forEach((permissions) => {
        const uniquePermissions = new Set(permissions);
        expect(uniquePermissions.size).toBe(permissions.length);
      });
    });

    it('should have valid permission format (resource:action)', () => {
      Object.values(ROLE_PERMISSIONS).forEach((permissions) => {
        permissions.forEach((permission) => {
          expect(permission).toMatch(/^[a-z]+:[a-z]+$/);
        });
      });
    });
  });
});
