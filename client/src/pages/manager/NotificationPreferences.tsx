/**
 * Notification Preferences Page
 * 
 * Allows managers to configure notification settings for their company.
 */

import { useState } from 'react';
import { ManagerLayout } from './ManagerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, MessageSquare, Smartphone, Save, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NotificationPreferences() {
  return (
    <ManagerLayout>
      <NotificationPreferencesContent />
    </ManagerLayout>
  );
}

function NotificationPreferencesContent() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Notification channels
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  
  // Notification types
  const [motExpiryEnabled, setMotExpiryEnabled] = useState(true);
  const [taxExpiryEnabled, setTaxExpiryEnabled] = useState(true);
  const [serviceDueEnabled, setServiceDueEnabled] = useState(true);
  const [licenseExpiryEnabled, setLicenseExpiryEnabled] = useState(true);
  const [vorStatusEnabled, setVorStatusEnabled] = useState(true);
  const [defectReportedEnabled, setDefectReportedEnabled] = useState(true);
  const [inspectionFailedEnabled, setInspectionFailedEnabled] = useState(true);
  
  // Timing preferences (days before expiry)
  const [motExpiryDays, setMotExpiryDays] = useState(30);
  const [taxExpiryDays, setTaxExpiryDays] = useState(30);
  const [serviceDueDays, setServiceDueDays] = useState(14);
  const [licenseExpiryDays, setLicenseExpiryDays] = useState(30);
  
  // Email override
  const [email, setEmail] = useState('');
  
  const handleSave = async () => {
    setSaving(true);
    
    try {
      // TODO: Call API to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated successfully.',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Configure how and when you want to receive notifications about your fleet.
        </p>
      </div>
      
      {/* Notification Channels */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-enabled" className="text-base font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              id="email-enabled"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sms-enabled" className="text-base font-medium">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via SMS (requires setup)</p>
              </div>
            </div>
            <Switch
              id="sms-enabled"
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="inapp-enabled" className="text-base font-medium">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">Show notifications in the app</p>
              </div>
            </div>
            <Switch
              id="inapp-enabled"
              checked={inAppEnabled}
              onCheckedChange={setInAppEnabled}
            />
          </div>
          
          {emailEnabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="email-override">Email Address Override (Optional)</Label>
                <Input
                  id="email-override"
                  type="email"
                  placeholder="notifications@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Leave blank to use your company email address
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Vehicle Compliance Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vehicle Compliance Notifications</CardTitle>
          <CardDescription>
            Get notified when vehicle documents are expiring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="mot-expiry" className="text-base font-medium">MOT Expiry Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify when MOT is expiring soon</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={motExpiryDays}
                    onChange={(e) => setMotExpiryDays(Number(e.target.value))}
                    className="w-20"
                    disabled={!motExpiryEnabled}
                  />
                  <span className="text-sm text-muted-foreground">days before</span>
                </div>
                <Switch
                  id="mot-expiry"
                  checked={motExpiryEnabled}
                  onCheckedChange={setMotExpiryEnabled}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="tax-expiry" className="text-base font-medium">Tax Expiry Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify when tax is expiring soon</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={taxExpiryDays}
                    onChange={(e) => setTaxExpiryDays(Number(e.target.value))}
                    className="w-20"
                    disabled={!taxExpiryEnabled}
                  />
                  <span className="text-sm text-muted-foreground">days before</span>
                </div>
                <Switch
                  id="tax-expiry"
                  checked={taxExpiryEnabled}
                  onCheckedChange={setTaxExpiryEnabled}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="service-due" className="text-base font-medium">Service Due Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify when service is due soon</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={serviceDueDays}
                    onChange={(e) => setServiceDueDays(Number(e.target.value))}
                    className="w-20"
                    disabled={!serviceDueEnabled}
                  />
                  <span className="text-sm text-muted-foreground">days before</span>
                </div>
                <Switch
                  id="service-due"
                  checked={serviceDueEnabled}
                  onCheckedChange={setServiceDueEnabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Driver Compliance Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Driver Compliance Notifications</CardTitle>
          <CardDescription>
            Get notified when driver documents are expiring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="license-expiry" className="text-base font-medium">License Expiry Alerts</Label>
              <p className="text-sm text-muted-foreground">Notify when driver license is expiring soon</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={licenseExpiryDays}
                  onChange={(e) => setLicenseExpiryDays(Number(e.target.value))}
                  className="w-20"
                  disabled={!licenseExpiryEnabled}
                />
                <span className="text-sm text-muted-foreground">days before</span>
              </div>
              <Switch
                id="license-expiry"
                checked={licenseExpiryEnabled}
                onCheckedChange={setLicenseExpiryEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Operational Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Operational Notifications</CardTitle>
          <CardDescription>
            Get notified about fleet operations and issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="vor-status" className="text-base font-medium">VOR Status Changes</Label>
              <p className="text-sm text-muted-foreground">Notify when a vehicle goes off-road or returns to service</p>
            </div>
            <Switch
              id="vor-status"
              checked={vorStatusEnabled}
              onCheckedChange={setVorStatusEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="defect-reported" className="text-base font-medium">Defect Reports</Label>
              <p className="text-sm text-muted-foreground">Notify when a new defect is reported</p>
            </div>
            <Switch
              id="defect-reported"
              checked={defectReportedEnabled}
              onCheckedChange={setDefectReportedEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="inspection-failed" className="text-base font-medium">Failed Inspections</Label>
              <p className="text-sm text-muted-foreground">Notify when an inspection fails</p>
            </div>
            <Switch
              id="inspection-failed"
              checked={inspectionFailedEnabled}
              onCheckedChange={setInspectionFailedEnabled}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
