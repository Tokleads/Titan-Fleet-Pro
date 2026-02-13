import { useState, useEffect } from 'react';
import { PoundSterling, Clock, Moon, Calendar, TrendingUp, Save, Download, User, ChevronDown, ChevronRight, Check, X, Pencil } from 'lucide-react';
import { ManagerLayout } from './ManagerLayout';
import { session } from '@/lib/session';
import { useToast } from '@/hooks/use-toast';

interface PayRate {
  id: number;
  companyId: number;
  driverId: number | null;
  driverName?: string;
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

interface Driver {
  id: number;
  name: string;
  email: string;
  role: string;
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
  const company = session.getCompany();
  const companyId = company?.id || 1;

  const [activeTab, setActiveTab] = useState<'drivers' | 'defaults' | 'holidays' | 'export'>('drivers');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payRates, setPayRates] = useState<PayRate[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([]);
  const [defaultRate, setDefaultRate] = useState<PayRate | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [expandedDriverId, setExpandedDriverId] = useState<number | null>(null);
  const [driverRateForm, setDriverRateForm] = useState({
    baseRate: '',
    nightRate: '',
    weekendRate: '',
    bankHolidayRate: '',
    overtimeMultiplier: '',
  });

  const [exportDateRange, setExportDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchPayRates(), fetchDrivers(), fetchBankHolidays()]);
    setLoading(false);
  };

  const fetchPayRates = async () => {
    try {
      const response = await fetch(`/api/pay-rates/${companyId}/drivers`);
      const data = await response.json();
      setPayRates(data);
      const def = data.find((r: PayRate) => r.driverId === null);
      if (def) setDefaultRate(def);
    } catch (error) {
      console.error('Failed to fetch pay rates:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`/api/manager/users/${companyId}`);
      const data = await response.json();
      setDrivers(data.filter((u: Driver) => u.role === 'DRIVER'));
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
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

  const getDriverRate = (driverId: number): PayRate | undefined => {
    return payRates.find(r => r.driverId === driverId);
  };

  const getEffectiveRate = (driverId: number): PayRate | null => {
    return getDriverRate(driverId) || defaultRate;
  };

  const handleEditDriver = (driver: Driver) => {
    const rate = getDriverRate(driver.id);
    setEditingDriverId(driver.id);
    setExpandedDriverId(driver.id);
    if (rate) {
      setDriverRateForm({
        baseRate: rate.baseRate,
        nightRate: rate.nightRate,
        weekendRate: rate.weekendRate,
        bankHolidayRate: rate.bankHolidayRate,
        overtimeMultiplier: rate.overtimeMultiplier,
      });
    } else if (defaultRate) {
      setDriverRateForm({
        baseRate: defaultRate.baseRate,
        nightRate: defaultRate.nightRate,
        weekendRate: defaultRate.weekendRate,
        bankHolidayRate: defaultRate.bankHolidayRate,
        overtimeMultiplier: defaultRate.overtimeMultiplier,
      });
    }
  };

  const handleSaveDriverRate = async (driverId: number) => {
    setSaving(true);
    try {
      const response = await fetch('/api/pay-rates/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          driverId,
          ...driverRateForm,
        }),
      });

      if (response.ok) {
        toast({ title: 'Saved', description: 'Driver pay rate updated' });
        setEditingDriverId(null);
        await fetchPayRates();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save pay rate', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDriverRate = async (driverId: number) => {
    try {
      const response = await fetch(`/api/pay-rates/driver/${driverId}/${companyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'Removed', description: 'Driver will now use company default rate' });
        await fetchPayRates();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove rate', variant: 'destructive' });
    }
  };

  const handleSaveDefaultRate = async () => {
    if (!defaultRate) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/pay-rates/${defaultRate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultRate),
      });
      if (response.ok) {
        toast({ title: 'Saved', description: 'Default pay rates updated' });
        await fetchPayRates();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save rates', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeUKHolidays = async () => {
    const currentYear = new Date().getFullYear();
    try {
      const response = await fetch(`/api/bank-holidays/init-uk/${companyId}/${currentYear}`, {
        method: 'POST',
      });
      if (response.ok) {
        toast({ title: 'Added', description: `UK bank holidays for ${currentYear} added` });
        await fetchBankHolidays();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add holidays', variant: 'destructive' });
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/wages/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          startDate: exportDateRange.start,
          endDate: exportDateRange.end,
        }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wages-${exportDateRange.start}-to-${exportDateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Exported', description: 'Wage CSV downloaded successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export wages', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <ManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading pay rates...</div>
        </div>
      </ManagerLayout>
    );
  }

  const tabs = [
    { id: 'drivers' as const, label: 'Driver Wages', icon: User },
    { id: 'defaults' as const, label: 'Default Rates', icon: PoundSterling },
    { id: 'holidays' as const, label: 'Bank Holidays', icon: Calendar },
    { id: 'export' as const, label: 'Export CSV', icon: Download },
  ];

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pay Rates & Wages</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Set individual driver wages and export timesheets for payroll
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'drivers' && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                Set individual hourly rates for each driver below. Drivers without a custom rate will use the company default (£{defaultRate?.baseRate || '12.00'}/hr).
                Night, weekend, and bank holiday rates are applied automatically based on shift times.
              </p>
            </div>

            {drivers.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-900">No drivers found</p>
                <p className="text-sm text-slate-500 mt-1">Add drivers to your fleet to set their pay rates</p>
              </div>
            ) : (
              drivers.map(driver => {
                const driverRate = getDriverRate(driver.id);
                const effectiveRate = getEffectiveRate(driver.id);
                const isExpanded = expandedDriverId === driver.id;
                const isEditing = editingDriverId === driver.id;
                const hasCustomRate = !!driverRate;

                return (
                  <div
                    key={driver.id}
                    className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
                    data-testid={`driver-rate-card-${driver.id}`}
                  >
                    <button
                      onClick={() => {
                        if (isEditing) return;
                        setExpandedDriverId(isExpanded ? null : driver.id);
                      }}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-blue-600">
                          {driver.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{driver.name}</p>
                        <p className="text-xs text-slate-500">
                          {hasCustomRate ? (
                            <span className="text-emerald-600 font-medium">Custom rate set</span>
                          ) : (
                            'Using company default'
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">
                            £{effectiveRate?.baseRate || '0.00'}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">per hour</p>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && !isEditing && (
                      <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Base</p>
                            <p className="text-sm font-bold text-slate-900">£{effectiveRate?.baseRate}/hr</p>
                          </div>
                          <div className="bg-indigo-50 rounded-lg p-3">
                            <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-medium flex items-center gap-1"><Moon className="h-3 w-3" /> Night</p>
                            <p className="text-sm font-bold text-slate-900">£{effectiveRate?.nightRate}/hr</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-[10px] text-amber-600 uppercase tracking-wider font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> Weekend</p>
                            <p className="text-sm font-bold text-slate-900">£{effectiveRate?.weekendRate}/hr</p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-[10px] text-red-600 uppercase tracking-wider font-medium">Bank Hol</p>
                            <p className="text-sm font-bold text-slate-900">£{effectiveRate?.bankHolidayRate}/hr</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditDriver(driver)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            data-testid={`btn-edit-rate-${driver.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Rates
                          </button>
                          {hasCustomRate && (
                            <button
                              onClick={() => handleRemoveDriverRate(driver.id)}
                              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                              data-testid={`btn-remove-rate-${driver.id}`}
                            >
                              <X className="h-3.5 w-3.5" />
                              Use Default
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {isExpanded && isEditing && (
                      <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Base Rate (£/hr)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverRateForm.baseRate}
                              onChange={e => setDriverRateForm({ ...driverRateForm, baseRate: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              data-testid={`input-base-rate-${driver.id}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Night Rate (£/hr)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverRateForm.nightRate}
                              onChange={e => setDriverRateForm({ ...driverRateForm, nightRate: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              data-testid={`input-night-rate-${driver.id}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Weekend Rate (£/hr)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverRateForm.weekendRate}
                              onChange={e => setDriverRateForm({ ...driverRateForm, weekendRate: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              data-testid={`input-weekend-rate-${driver.id}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Bank Holiday (£/hr)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverRateForm.bankHolidayRate}
                              onChange={e => setDriverRateForm({ ...driverRateForm, bankHolidayRate: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              data-testid={`input-holiday-rate-${driver.id}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Overtime Multiplier</label>
                            <input
                              type="number"
                              step="0.1"
                              value={driverRateForm.overtimeMultiplier}
                              onChange={e => setDriverRateForm({ ...driverRateForm, overtimeMultiplier: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              data-testid={`input-overtime-${driver.id}`}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveDriverRate(driver.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            data-testid={`btn-save-rate-${driver.id}`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setEditingDriverId(null); }}
                            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'defaults' && defaultRate && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <PoundSterling className="h-5 w-5 text-blue-600" />
                    Company Default Rates
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    These rates apply to drivers without individual rates set
                  </p>
                </div>
                <button
                  onClick={handleSaveDefaultRate}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  data-testid="btn-save-defaults"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Base Rate (£/hr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultRate.baseRate}
                    onChange={e => setDefaultRate({ ...defaultRate, baseRate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-default-base"
                  />
                  <p className="text-xs text-slate-400">Standard hourly rate</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Moon className="h-4 w-4 text-indigo-500" /> Night Rate (£/hr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultRate.nightRate}
                    onChange={e => setDefaultRate({ ...defaultRate, nightRate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-default-night"
                  />
                  <p className="text-xs text-slate-400">{defaultRate.nightStartHour}:00 - {defaultRate.nightEndHour}:00</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-amber-500" /> Weekend Rate (£/hr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultRate.weekendRate}
                    onChange={e => setDefaultRate({ ...defaultRate, weekendRate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-default-weekend"
                  />
                  <p className="text-xs text-slate-400">Saturday & Sunday</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Bank Holiday Rate (£/hr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultRate.bankHolidayRate}
                    onChange={e => setDefaultRate({ ...defaultRate, bankHolidayRate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-default-holiday"
                  />
                  <p className="text-xs text-slate-400">Premium for public holidays</p>
                </div>
              </div>

              <div className="border-t border-slate-100 mt-6 pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-600" />
                  Overtime & Night Shift Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Overtime Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={defaultRate.overtimeMultiplier}
                      onChange={e => setDefaultRate({ ...defaultRate, overtimeMultiplier: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400">e.g. 1.5 = time and a half</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Daily Overtime After (hrs)</label>
                    <input
                      type="number"
                      value={defaultRate.dailyOvertimeThreshold / 60}
                      onChange={e => setDefaultRate({ ...defaultRate, dailyOvertimeThreshold: Number(e.target.value) * 60 })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Night Shift Start (24h)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={defaultRate.nightStartHour}
                      onChange={e => setDefaultRate({ ...defaultRate, nightStartHour: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400">e.g. 22 = 10 PM</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Night Shift End (24h)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={defaultRate.nightEndHour}
                      onChange={e => setDefaultRate({ ...defaultRate, nightEndHour: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400">e.g. 6 = 6 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bank Holidays</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {bankHolidays.length} holidays configured - premium pay applies on these dates
                </p>
              </div>
              <button
                onClick={handleInitializeUKHolidays}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                data-testid="btn-add-uk-holidays"
              >
                <Calendar className="h-4 w-4" />
                Add UK Holidays ({new Date().getFullYear()})
              </button>
            </div>

            {bankHolidays.length > 0 ? (
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Holiday</th>
                      <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bankHolidays.map(holiday => (
                      <tr key={holiday.id} className="hover:bg-slate-50">
                        <td className="p-3 text-sm font-medium text-slate-900">{holiday.name}</td>
                        <td className="p-3 text-sm text-slate-600">
                          {new Date(holiday.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No bank holidays configured</p>
                <p className="text-sm text-slate-400 mt-1">Add UK holidays to enable premium pay on public holidays</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Download className="h-5 w-5 text-blue-600" />
                Export Wage CSV
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Generate a CSV file with full wage breakdowns for all drivers. Use this to create wage slips or import into your payroll system.
              </p>

              <div className="flex flex-wrap items-end gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                  <input
                    type="date"
                    value={exportDateRange.start}
                    onChange={e => setExportDateRange({ ...exportDateRange, start: e.target.value })}
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-export-start"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                  <input
                    type="date"
                    value={exportDateRange.end}
                    onChange={e => setExportDateRange({ ...exportDateRange, end: e.target.value })}
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-export-end"
                  />
                </div>
                <button
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  data-testid="btn-export-csv"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? 'Generating...' : 'Download CSV'}
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">CSV includes:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Driver name and shift dates
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Clock in/out times
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Hours split: regular, night, weekend, holiday
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Individual driver rates applied
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Overtime hours and pay
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Total pay per shift and per driver
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-amber-800 mb-1">How it works</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>Each completed shift is broken down by time of day</li>
                  <li>Night hours ({defaultRate?.nightStartHour || 22}:00 - {defaultRate?.nightEndHour || 6}:00) get the night rate</li>
                  <li>Saturday and Sunday shifts get the weekend rate</li>
                  <li>Bank holiday dates get the holiday premium</li>
                  <li>Hours over {(defaultRate?.dailyOvertimeThreshold || 840) / 60} per day get overtime multiplier ({defaultRate?.overtimeMultiplier || '1.5'}x)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
