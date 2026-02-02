// Pay Rates Management
// Allows managers to configure flexible pay rates for wage calculations

import { useState, useEffect } from 'react';
import { DollarSign, Clock, Moon, Calendar, TrendingUp, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PayRate {
  id: number;
  companyId: number;
  driverId: number | null;
  baseRate: string;
  nightRate: string;
  weekendRate: string;
  bankHolidayRate: string;
  overtimeMultiplier: string;
  nightStartHour: number;
  nightEndHour: number;
  dailyOvertimeThreshold: number;
  weeklyOvertimeThreshold: number;
  isActive: boolean;
}

interface BankHoliday {
  id: number;
  companyId: number;
  name: string;
  date: string;
  isRecurring: boolean;
}

export default function PayRates() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payRates, setPayRates] = useState<PayRate[]>([]);
  const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([]);
  const [defaultRate, setDefaultRate] = useState<PayRate | null>(null);
  
  const companyId = 1; // TODO: Get from auth context

  useEffect(() => {
    fetchPayRates();
    fetchBankHolidays();
  }, []);

  const fetchPayRates = async () => {
    try {
      const response = await fetch(`/api/pay-rates/${companyId}`);
      const data = await response.json();
      setPayRates(data);
      
      // Find default rate (driverId = null)
      const defaultRateData = data.find((r: PayRate) => r.driverId === null);
      if (defaultRateData) {
        setDefaultRate(defaultRateData);
      }
    } catch (error) {
      console.error('Failed to fetch pay rates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pay rates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBankHolidays = async () => {
    try {
      const response = await fetch(`/api/bank-holidays/${companyId}`);
      const data = await response.json();
      setBankHolidays(data);
    } catch (error) {
      console.error('Failed to fetch bank holidays:', error);
    }
  };

  const handleSaveDefaultRate = async () => {
    if (!defaultRate) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/pay-rates/${defaultRate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultRate)
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Pay rates updated successfully'
        });
        fetchPayRates();
      } else {
        throw new Error('Failed to update pay rates');
      }
    } catch (error) {
      console.error('Failed to save pay rates:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pay rates',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeUKHolidays = async () => {
    const currentYear = new Date().getFullYear();
    try {
      const response = await fetch(`/api/bank-holidays/init-uk/${companyId}/${currentYear}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `UK bank holidays for ${currentYear} added`
        });
        fetchBankHolidays();
      }
    } catch (error) {
      console.error('Failed to initialize holidays:', error);
      toast({
        title: 'Error',
        description: 'Failed to add bank holidays',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading pay rates...</div>
      </div>
    );
  }

  if (!defaultRate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No pay rates configured</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pay Rates & Wages</h1>
          <p className="text-muted-foreground mt-1">
            Configure flexible pay rates for accurate wage calculations
          </p>
        </div>
        <Button onClick={handleSaveDefaultRate} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="rates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rates">Pay Rates</TabsTrigger>
          <TabsTrigger value="holidays">Bank Holidays</TabsTrigger>
          <TabsTrigger value="preview">CSV Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="rates" className="space-y-6">
          {/* Base Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Hourly Pay Rates
              </CardTitle>
              <CardDescription>
                Set different rates for regular hours, night shifts, weekends, and bank holidays
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="baseRate">Base Rate (£/hour)</Label>
                <Input
                  id="baseRate"
                  type="number"
                  step="0.01"
                  value={defaultRate.baseRate}
                  onChange={(e) => setDefaultRate({ ...defaultRate, baseRate: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">Standard hourly rate for regular hours</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nightRate" className="flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  Night Rate (£/hour)
                </Label>
                <Input
                  id="nightRate"
                  type="number"
                  step="0.01"
                  value={defaultRate.nightRate}
                  onChange={(e) => setDefaultRate({ ...defaultRate, nightRate: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Rate for hours between {defaultRate.nightStartHour}:00 - {defaultRate.nightEndHour}:00
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekendRate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Weekend Rate (£/hour)
                </Label>
                <Input
                  id="weekendRate"
                  type="number"
                  step="0.01"
                  value={defaultRate.weekendRate}
                  onChange={(e) => setDefaultRate({ ...defaultRate, weekendRate: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">Rate for Saturday and Sunday</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankHolidayRate">Bank Holiday Rate (£/hour)</Label>
                <Input
                  id="bankHolidayRate"
                  type="number"
                  step="0.01"
                  value={defaultRate.bankHolidayRate}
                  onChange={(e) => setDefaultRate({ ...defaultRate, bankHolidayRate: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">Premium rate for public holidays</p>
              </div>
            </CardContent>
          </Card>

          {/* Overtime Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Overtime Settings
              </CardTitle>
              <CardDescription>
                Configure overtime thresholds and multipliers
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="overtimeMultiplier">Overtime Multiplier</Label>
                <Input
                  id="overtimeMultiplier"
                  type="number"
                  step="0.1"
                  value={defaultRate.overtimeMultiplier}
                  onChange={(e) => setDefaultRate({ ...defaultRate, overtimeMultiplier: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Multiplier applied to base rate (e.g., 1.5 = time and a half)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyOvertimeThreshold">Daily Overtime Threshold (hours)</Label>
                <Input
                  id="dailyOvertimeThreshold"
                  type="number"
                  value={defaultRate.dailyOvertimeThreshold / 60}
                  onChange={(e) => setDefaultRate({ 
                    ...defaultRate, 
                    dailyOvertimeThreshold: Number(e.target.value) * 60 
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Hours per day before overtime kicks in
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Night Shift Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Night Shift Hours
              </CardTitle>
              <CardDescription>
                Define when night shift premium applies
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nightStartHour">Night Shift Start (24h format)</Label>
                <Input
                  id="nightStartHour"
                  type="number"
                  min="0"
                  max="23"
                  value={defaultRate.nightStartHour}
                  onChange={(e) => setDefaultRate({ ...defaultRate, nightStartHour: Number(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Hour when night rate starts (e.g., 22 = 10 PM)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nightEndHour">Night Shift End (24h format)</Label>
                <Input
                  id="nightEndHour"
                  type="number"
                  min="0"
                  max="23"
                  value={defaultRate.nightEndHour}
                  onChange={(e) => setDefaultRate({ ...defaultRate, nightEndHour: Number(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Hour when night rate ends (e.g., 6 = 6 AM)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bank Holidays</CardTitle>
              <CardDescription>
                Manage public holidays for premium pay calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {bankHolidays.length} bank holidays configured
                </p>
                <Button onClick={handleInitializeUKHolidays} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add UK Holidays ({new Date().getFullYear()})
                </Button>
              </div>

              {bankHolidays.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">Holiday Name</th>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Recurring</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankHolidays.map((holiday) => (
                        <tr key={holiday.id} className="border-t">
                          <td className="p-3">{holiday.name}</td>
                          <td className="p-3">
                            {new Date(holiday.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="p-3">
                            {holiday.isRecurring ? 'Yes' : 'No'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Export Preview</CardTitle>
              <CardDescription>
                Example of how wages will appear in exported timesheet CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <div className="whitespace-nowrap">
                  Driver Name,Date,Clock In,Clock Out,Depot,Total Hours,Regular Hours,Night Hours,Weekend Hours,Bank Holiday Hours,Overtime Hours,Base Rate,Night Rate,Weekend Rate,Holiday Rate,Overtime Rate,Regular Pay,Night Pay,Weekend Pay,Holiday Pay,Overtime Pay,Total Pay,Status
                </div>
                <div className="whitespace-nowrap text-muted-foreground mt-2">
                  "John Smith",01/02/2026,08:00,17:30,Main Depot,9.50,8.00,0.00,0.00,0.00,1.50,{defaultRate.baseRate},{defaultRate.nightRate},{defaultRate.weekendRate},{defaultRate.bankHolidayRate},{(parseFloat(defaultRate.baseRate) * parseFloat(defaultRate.overtimeMultiplier)).toFixed(2)},{(8 * parseFloat(defaultRate.baseRate)).toFixed(2)},0.00,0.00,0.00,{(1.5 * parseFloat(defaultRate.baseRate) * parseFloat(defaultRate.overtimeMultiplier)).toFixed(2)},{(8 * parseFloat(defaultRate.baseRate) + 1.5 * parseFloat(defaultRate.baseRate) * parseFloat(defaultRate.overtimeMultiplier)).toFixed(2)},COMPLETED
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Regular Pay (8h)</div>
                  <div className="text-2xl font-bold">
                    £{(8 * parseFloat(defaultRate.baseRate)).toFixed(2)}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Overtime Pay (1.5h)</div>
                  <div className="text-2xl font-bold">
                    £{(1.5 * parseFloat(defaultRate.baseRate) * parseFloat(defaultRate.overtimeMultiplier)).toFixed(2)}
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="text-sm text-muted-foreground">Total Pay</div>
                  <div className="text-2xl font-bold">
                    £{(8 * parseFloat(defaultRate.baseRate) + 1.5 * parseFloat(defaultRate.baseRate) * parseFloat(defaultRate.overtimeMultiplier)).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">How It Works:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• System automatically calculates hours by type (regular, night, weekend, holiday)</li>
                  <li>• Each hour type is multiplied by its corresponding rate</li>
                  <li>• Overtime is calculated after {defaultRate.dailyOvertimeThreshold / 60} hours per day</li>
                  <li>• CSV can be directly imported into payroll systems</li>
                  <li>• All calculations are saved and auditable</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
