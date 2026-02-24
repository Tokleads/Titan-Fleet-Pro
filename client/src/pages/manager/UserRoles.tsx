/**
 * User Roles & Permissions Page
 * 
 * Manage user roles and permissions for the fleet management system.
 */

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { ManagerLayout } from './ManagerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { useToast } from '@/hooks/use-toast';
import { session } from '@/lib/session';
import { DASHBOARD_PERMISSION_KEYS } from '@shared/schema';

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Role definitions
const ROLES = [
  {
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Full system access with all permissions',
    color: 'bg-purple-500',
    permissionCount: 35
  },
  {
    value: 'TRANSPORT_MANAGER',
    label: 'Transport Manager',
    description: 'Manage fleet operations and drivers',
    color: 'bg-blue-500',
    permissionCount: 25
  },
  {
    value: 'DRIVER',
    label: 'Driver',
    description: 'Limited access to own data and inspections',
    color: 'bg-green-500',
    permissionCount: 7
  },
  {
    value: 'MECHANIC',
    label: 'Mechanic',
    description: 'View and rectify defects',
    color: 'bg-orange-500',
    permissionCount: 6
  },
  {
    value: 'AUDITOR',
    label: 'Auditor',
    description: 'Read-only access to all data',
    color: 'bg-gray-500',
    permissionCount: 15
  },
  {
    value: 'OFFICE',
    label: 'Office',
    description: 'Read-only access to manager console and dashboard',
    color: 'bg-teal-500',
    permissionCount: 10
  }
];

// Permission categories
const PERMISSION_CATEGORIES = [
  {
    name: 'Vehicles',
    permissions: [
      { key: 'vehicles:view', label: 'View Vehicles', roles: ['ADMIN', 'TRANSPORT_MANAGER', 'MECHANIC', 'AUDITOR'] },
      { key: 'vehicles:create', label: 'Create Vehicles', roles: ['ADMIN', 'TRANSPORT_MANAGER'] },
      { key: 'vehicles:edit', label: 'Edit Vehicles', roles: ['ADMIN', 'TRANSPORT_MANAGER'] },
      { key: 'vehicles:delete', label: 'Delete Vehicles', roles: ['ADMIN'] }
    ]
  },
  {
    name: 'Drivers',
    permissions: [
      { key: 'drivers:view', label: 'View Drivers', roles: ['ADMIN', 'TRANSPORT_MANAGER', 'AUDITOR'] },
      { key: 'drivers:create', label: 'Create Drivers', roles: ['ADMIN', 'TRANSPORT_MANAGER'] },
      { key: 'drivers:edit', label: 'Edit Drivers', roles: ['ADMIN', 'TRANSPORT_MANAGER'] },
      { key: 'drivers:delete', label: 'Delete Drivers', roles: ['ADMIN'] }
    ]
  },
  {
    name: 'Inspections',
    permissions: [
      { key: 'inspections:view', label: 'View Inspections', roles: ['ADMIN', 'TRANSPORT_MANAGER', 'AUDITOR'] },
      { key: 'inspections:create', label: 'Create Inspections', roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DRIVER'] },
      { key: 'inspections:edit', label: 'Edit Inspections', roles: ['ADMIN', 'TRANSPORT_MANAGER'] },
      { key: 'inspections:delete', label: 'Delete Inspections', roles: ['ADMIN'] }
    ]
  },
  {
    name: 'Defects',
    permissions: [
      { key: 'defects:view', label: 'View Defects', roles: ['ADMIN', 'TRANSPORT_MANAGER', 'MECHANIC', 'AUDITOR'] },
      { key: 'defects:create', label: 'Create Defects', roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DRIVER'] },
      { key: 'defects:rectify', label: 'Rectify Defects', roles: ['ADMIN', 'TRANSPORT_MANAGER', 'MECHANIC'] },
      { key: 'defects:delete', label: 'Delete Defects', roles: ['ADMIN'] }
    ]
  },
  {
    name: 'Reports',
    permissions: [
      { key: 'reports:view', label: 'View Reports', roles: ['ADMIN', 'TRANSPORT_MANAGER', 'AUDITOR'] },
      { key: 'reports:generate', label: 'Generate Reports', roles: ['ADMIN', 'TRANSPORT_MANAGER'] },
      { key: 'reports:export', label: 'Export Reports', roles: ['ADMIN', 'TRANSPORT_MANAGER', 'AUDITOR'] }
    ]
  },
  {
    name: 'Settings',
    permissions: [
      { key: 'settings:view', label: 'View Settings', roles: ['ADMIN'] },
      { key: 'settings:edit', label: 'Edit Settings', roles: ['ADMIN'] },
      { key: 'company:edit', label: 'Edit Company', roles: ['ADMIN'] }
    ]
  },
  {
    name: 'Users',
    permissions: [
      { key: 'users:view', label: 'View Users', roles: ['ADMIN', 'TRANSPORT_MANAGER'] },
      { key: 'users:create', label: 'Create Users', roles: ['ADMIN'] },
      { key: 'users:edit', label: 'Edit Users', roles: ['ADMIN'] },
      { key: 'users:delete', label: 'Delete Users', roles: ['ADMIN'] }
    ]
  }
];

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  permissions: string[] | null;
  createdAt: string;
}

export default function UserRoles() {
  return (
    <ManagerLayout>
      <UserRolesContent />
    </ManagerLayout>
  );
}

function UserRolesContent() {
  const { toast } = useToast();
  const companyId = session.getCompany()?.id || 1;
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [roleFilter, setRoleFilter] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId: companyId.toString(),
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(debouncedSearchQuery && { search: debouncedSearchQuery })
      });
      
      const response = await fetch(`/api/user-roles?${params}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
      setTotalItems(data.total);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load users on mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, debouncedSearchQuery, currentPage]);
  
  const getRoleBadge = (role: string) => {
    const roleInfo = ROLES.find(r => r.value === role);
    if (!roleInfo) return <Badge variant="outline">{role}</Badge>;
    
    return (
      <Badge className={`${roleInfo.color} text-white`}>
        {roleInfo.label}
      </Badge>
    );
  };
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };
  
  const allPermissionKeys = DASHBOARD_PERMISSION_KEYS
    .filter(p => !('adminOnly' in p && p.adminOnly) && !('alwaysVisible' in p && p.alwaysVisible))
    .map(p => p.key);

  const handleEditUser = (user: any) => {
    const currentPerms = user.permissions && user.permissions.length > 0
      ? user.permissions
      : [...allPermissionKeys];
    setSelectedUser({ ...user, editPermissions: currentPerms, originalRole: user.role });
    setEditDialogOpen(true);
  };

  const togglePermission = (key: string) => {
    if (!selectedUser) return;
    const current = selectedUser.editPermissions as string[];
    const updated = current.includes(key)
      ? current.filter((k: string) => k !== key)
      : [...current, key];
    setSelectedUser({ ...selectedUser, editPermissions: updated });
  };

  const selectAllPermissions = () => {
    if (!selectedUser) return;
    setSelectedUser({ ...selectedUser, editPermissions: [...allPermissionKeys] });
  };

  const clearAllPermissions = () => {
    if (!selectedUser) return;
    setSelectedUser({ ...selectedUser, editPermissions: [] });
  };
  
  const handleSaveUser = async () => {
    setSaving(true);
    
    try {
      const roleChanged = selectedUser.role !== selectedUser.originalRole;
      const permissionsToSave = selectedUser.editPermissions as string[];

      const promises: Promise<Response>[] = [];

      if (roleChanged) {
        promises.push(
          fetch(`/api/user-roles/${selectedUser.id}/role?companyId=${companyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ role: selectedUser.role })
          })
        );
      }

      promises.push(
        fetch(`/api/user-roles/${selectedUser.id}/permissions?companyId=${companyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ permissions: permissionsToSave, requestingUserId: session.getUser()?.id })
        })
      );

      const results = await Promise.all(promises);
      const allOk = results.every(r => r.ok);
      if (!allOk) throw new Error('Failed to update user');
      
      toast({
        title: 'User updated',
        description: `${selectedUser.name}'s role and permissions have been updated.`,
        duration: 3000
      });
      
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleToggleActive = async (userId: number, active: boolean) => {
    try {
      const response = await fetch(`/api/user-roles/${userId}/status?companyId=${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ active })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      toast({
        title: 'Status updated',
        description: `User ${active ? 'activated' : 'deactivated'} successfully.`
      });
      
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      });
    }
  };
  
  // Filter users (API already filters)
  const filteredUsers = users;
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Roles & Permissions</h1>
        <p className="text-muted-foreground">
          Manage user roles and access permissions
        </p>
      </div>
      
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Lock className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({loading ? '...' : filteredUsers.length})</CardTitle>
              <CardDescription>Manage user roles and access</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {user.active ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleToggleActive(user.id, !user.active)}
                            >
                              {user.active ? (
                                <Lock className="h-4 w-4 text-orange-500" />
                              ) : (
                                <Unlock className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )}
              
              {!loading && users.length > 0 && (
                <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES.map((role) => (
              <Card key={role.value}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`h-10 w-10 rounded-lg ${role.color} flex items-center justify-center`}>
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <Badge variant="outline">{role.permissionCount} permissions</Badge>
                  </div>
                  <CardTitle className="mt-4">{role.label}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    View Permissions
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          {PERMISSION_CATEGORIES.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>
                  Permissions for {category.name.toLowerCase()} management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.permissions.map((permission) => (
                    <div key={permission.key} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{permission.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {permission.key}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {permission.roles.map(role => {
                          const roleInfo = ROLES.find(r => r.value === role);
                          return roleInfo ? (
                            <Badge key={role} variant="outline" className="text-xs">
                              {roleInfo.label}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update role and dashboard access for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>User</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${role.color}`} />
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {ROLES.find(r => r.value === selectedUser.role)?.description}
                </p>
              </div>

              {selectedUser.role !== 'ADMIN' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Dashboard Access</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllPermissions}
                        data-testid="button-select-all-permissions"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearAllPermissions}
                        data-testid="button-clear-all-permissions"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose which dashboard sections this user can access. Dashboard is always visible.
                  </p>
                  <div className="space-y-2 border rounded-lg p-3">
                    {DASHBOARD_PERMISSION_KEYS.filter(p => !('adminOnly' in p && p.adminOnly) && !('alwaysVisible' in p && p.alwaysVisible)).map(perm => {
                      const isChecked = (selectedUser.editPermissions as string[]).includes(perm.key);
                      return (
                        <div key={perm.key} className="flex items-center justify-between py-1.5">
                          <Label htmlFor={`perm-${perm.key}`} className="text-sm font-normal cursor-pointer">
                            {perm.label}
                          </Label>
                          <Switch
                            id={`perm-${perm.key}`}
                            checked={isChecked}
                            onCheckedChange={() => togglePermission(perm.key)}
                            data-testid={`switch-permission-${perm.key}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving} data-testid="button-save-user">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
