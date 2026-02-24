import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Bell, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  X, 
  Pause,
  Calendar,
  Car
} from 'lucide-react';
import { toast } from 'sonner';
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type ReminderType = 'MOT' | 'SERVICE' | 'TACHO' | 'INSURANCE' | 'TAX' | 'INSPECTION';
type ReminderStatus = 'ACTIVE' | 'SNOOZED' | 'COMPLETED' | 'DISMISSED';

type Reminder = {
  id: number;
  vehicleId: number;
  vehicleVrm: string;
  type: ReminderType;
  title: string;
  description: string | null;
  dueDate: string;
  status: ReminderStatus;
  escalationLevel: number;
  recurring: boolean;
  recurrenceInterval: number | null;
};

type Vehicle = {
  id: number;
  vrm: string;
  make: string;
  model: string;
};

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'MOT' as ReminderType,
    title: '',
    description: '',
    dueDate: '',
    recurring: false,
    recurrenceInterval: '',
  });
  
  const [snoozeData, setSnoozeData] = useState({
    snoozedUntil: '',
    reason: '',
  });
  
  const [completeData, setCompleteData] = useState({
    notes: '',
  });

  useEffect(() => {
    fetchReminders();
    fetchVehicles();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const companyId = localStorage.getItem('companyId');
      const response = await fetch(`/api/reminders?companyId=${companyId}`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (error) {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await fetch(`/api/vehicles?companyId=${companyId}`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const handleAddReminder = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          ...formData,
          companyId: parseInt(companyId || '0'),
          vehicleId: parseInt(formData.vehicleId),
          recurrenceInterval: formData.recurring ? parseInt(formData.recurrenceInterval) : null,
        }),
      });
      
      if (response.ok) {
        toast.success('Reminder created successfully');
        setShowAddDialog(false);
        resetForm();
        fetchReminders();
      } else {
        toast.error('Failed to create reminder');
      }
    } catch (error) {
      toast.error('Failed to create reminder');
    }
  };

  const handleSnoozeReminder = async () => {
    if (!selectedReminder) return;
    
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/reminders/${selectedReminder.id}/snooze`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          ...snoozeData,
          snoozedBy: parseInt(userId || '0'),
        }),
      });
      
      if (response.ok) {
        toast.success('Reminder snoozed');
        setShowSnoozeDialog(false);
        setSnoozeData({ snoozedUntil: '', reason: '' });
        fetchReminders();
      } else {
        toast.error('Failed to snooze reminder');
      }
    } catch (error) {
      toast.error('Failed to snooze reminder');
    }
  };

  const handleCompleteReminder = async () => {
    if (!selectedReminder) return;
    
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/reminders/${selectedReminder.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          completedBy: parseInt(userId || '0'),
          notes: completeData.notes,
        }),
      });
      
      if (response.ok) {
        toast.success('Reminder marked as completed');
        setShowCompleteDialog(false);
        setCompleteData({ notes: '' });
        fetchReminders();
      } else {
        toast.error('Failed to complete reminder');
      }
    } catch (error) {
      toast.error('Failed to complete reminder');
    }
  };

  const handleDismissReminder = async (id: number) => {
    try {
      const response = await fetch(`/api/reminders/${id}/dismiss`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      
      if (response.ok) {
        toast.success('Reminder dismissed');
        fetchReminders();
      } else {
        toast.error('Failed to dismiss reminder');
      }
    } catch (error) {
      toast.error('Failed to dismiss reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      type: 'MOT',
      title: '',
      description: '',
      dueDate: '',
      recurring: false,
      recurrenceInterval: '',
    });
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (reminder: Reminder) => {
    const daysUntilDue = getDaysUntilDue(reminder.dueDate);
    
    if (reminder.status === 'COMPLETED') {
      return <Badge className="bg-green-500">Completed</Badge>;
    }
    if (reminder.status === 'DISMISSED') {
      return <Badge className="bg-gray-500">Dismissed</Badge>;
    }
    if (reminder.status === 'SNOOZED') {
      return <Badge className="bg-blue-500">Snoozed</Badge>;
    }
    
    if (daysUntilDue < 0) {
      return <Badge className="bg-red-500 animate-pulse">OVERDUE ({Math.abs(daysUntilDue)} days)</Badge>;
    }
    if (daysUntilDue === 0) {
      return <Badge className="bg-red-500">Due Today</Badge>;
    }
    if (daysUntilDue === 1) {
      return <Badge className="bg-orange-500">Due Tomorrow</Badge>;
    }
    if (daysUntilDue <= 7) {
      return <Badge className="bg-orange-500">{daysUntilDue} days</Badge>;
    }
    if (daysUntilDue <= 14) {
      return <Badge className="bg-yellow-500">{daysUntilDue} days</Badge>;
    }
    
    return <Badge className="bg-blue-500">{daysUntilDue} days</Badge>;
  };

  const stats = {
    overdue: reminders.filter(r => r.status === 'ACTIVE' && getDaysUntilDue(r.dueDate) < 0).length,
    dueThisWeek: reminders.filter(r => r.status === 'ACTIVE' && getDaysUntilDue(r.dueDate) >= 0 && getDaysUntilDue(r.dueDate) <= 7).length,
    active: reminders.filter(r => r.status === 'ACTIVE').length,
    completed: reminders.filter(r => r.status === 'COMPLETED').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Reminders</h1>
          <p className="text-gray-600 mt-1">MOT, service, insurance, and other compliance tracking</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Reminder
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.dueThisWeek}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reminders</CardTitle>
          <CardDescription>Manage compliance deadlines for your fleet</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No reminders found. Click "Add Reminder" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{reminder.vehicleVrm}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{reminder.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reminder.title}</div>
                        {reminder.description && (
                          <div className="text-sm text-gray-500">{reminder.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(reminder.dueDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(reminder)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {reminder.status === 'ACTIVE' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReminder(reminder);
                                setShowCompleteDialog(true);
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReminder(reminder);
                                setShowSnoozeDialog(true);
                              }}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDismissReminder(reminder.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Reminder</DialogTitle>
            <DialogDescription>Create a compliance reminder for a vehicle</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Vehicle</Label>
              <Select value={formData.vehicleId} onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.vrm} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Reminder Type</Label>
              <Select value={formData.type} onValueChange={(value: ReminderType) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOT">MOT</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                  <SelectItem value="TACHO">Tachograph Calibration</SelectItem>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="TAX">Road Tax</SelectItem>
                  <SelectItem value="INSPECTION">Safety Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Annual MOT Test"
              />
            </div>
            
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.recurring}
                onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="recurring">Recurring reminder</Label>
            </div>
            
            {formData.recurring && (
              <div>
                <Label>Recurrence Interval (days)</Label>
                <Input
                  type="number"
                  value={formData.recurrenceInterval}
                  onChange={(e) => setFormData({ ...formData, recurrenceInterval: e.target.value })}
                  placeholder="e.g., 365 for annual"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddReminder}>Create Reminder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snooze Dialog */}
      <Dialog open={showSnoozeDialog} onOpenChange={setShowSnoozeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snooze Reminder</DialogTitle>
            <DialogDescription>Temporarily postpone this reminder</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Snooze Until</Label>
              <Input
                type="date"
                value={snoozeData.snoozedUntil}
                onChange={(e) => setSnoozeData({ ...snoozeData, snoozedUntil: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Reason (Optional)</Label>
              <Textarea
                value={snoozeData.reason}
                onChange={(e) => setSnoozeData({ ...snoozeData, reason: e.target.value })}
                placeholder="Why are you snoozing this reminder?"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSnoozeDialog(false)}>Cancel</Button>
            <Button onClick={handleSnoozeReminder}>Snooze</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Reminder</DialogTitle>
            <DialogDescription>Mark this reminder as completed</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Completion Notes (Optional)</Label>
              <Textarea
                value={completeData.notes}
                onChange={(e) => setCompleteData({ ...completeData, notes: e.target.value })}
                placeholder="Add any relevant notes about completion..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Cancel</Button>
            <Button onClick={handleCompleteReminder}>Mark Complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
