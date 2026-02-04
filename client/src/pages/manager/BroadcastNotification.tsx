// Manager Broadcast Notification Page
// Allows managers to send push notifications to drivers

import { useState } from 'react';
import { Bell, Send, Users, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { session } from '@/lib/session';

interface BroadcastFormData {
  title: string;
  body: string;
  targetRole: 'all' | 'driver' | 'manager';
  priority: 'normal' | 'high';
  clickAction: string;
  phoneNumber?: string;
}

export default function BroadcastNotification() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState<BroadcastFormData>({
    title: '',
    body: '',
    targetRole: 'driver',
    priority: 'high',
    clickAction: '/'
  });

  // Quick templates for common messages
  const templates = [
    {
      name: 'Limited Work Available',
      title: '⚠️ Limited Work Available',
      body: 'Call office NOW to guarantee your work slot for today',
      clickAction: 'tel:+441234567890',
      priority: 'high' as const
    },
    {
      name: 'Urgent Vehicle Check',
      title: '🚨 Urgent: Vehicle Check Required',
      body: 'Please complete vehicle inspection before starting shift',
      clickAction: '/driver',
      priority: 'high' as const
    },
    {
      name: 'Shift Reminder',
      title: '⏰ Shift Starting Soon',
      body: 'Your shift starts in 30 minutes. Please prepare to clock in.',
      clickAction: '/driver',
      priority: 'normal' as const
    },
    {
      name: 'Weather Alert',
      title: '🌧️ Weather Alert',
      body: 'Heavy rain expected. Drive carefully and allow extra time.',
      clickAction: '/driver',
      priority: 'normal' as const
    },
    {
      name: 'Office Closed',
      title: '🏢 Office Closed',
      body: 'Office will be closed tomorrow for maintenance. Contact emergency line if needed.',
      clickAction: '/',
      priority: 'normal' as const
    }
  ];

  const handleTemplateSelect = (template: typeof templates[0]) => {
    setFormData({
      ...formData,
      title: template.title,
      body: template.body,
      clickAction: template.clickAction,
      priority: template.priority
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.body) {
      toast({
        title: 'Error',
        description: 'Please fill in title and message',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);

    try {
      const company = session.getCompany();
      if (!company) {
        toast({
          title: 'Error',
          description: 'No company found. Please log in again.',
          variant: 'destructive'
        });
        setSending(false);
        return;
      }
      const companyId = company.id;

      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyId,
          title: formData.title,
          body: formData.body,
          targetRole: formData.targetRole,
          priority: formData.priority,
          clickAction: formData.clickAction,
          data: {
            phoneNumber: formData.phoneNumber
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Notification Sent',
          description: `Successfully sent to ${result.sentCount} users`,
        });

        // Reset form
        setFormData({
          title: '',
          body: '',
          targetRole: 'driver',
          priority: 'high',
          clickAction: '/'
        });
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notification. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Broadcast Notification</h1>
        <p className="text-muted-foreground">
          Send push notifications to drivers and managers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Create Notification</CardTitle>
            <CardDescription>
              Compose and send a push notification to your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Limited Work Available"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/50 characters
                </p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="body">Message *</Label>
                <Textarea
                  id="body"
                  placeholder="e.g., Call office NOW to guarantee your work slot for today"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={4}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.body.length}/200 characters
                </p>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="targetRole">Send To</Label>
                <Select
                  value={formData.targetRole}
                  onValueChange={(value: any) => setFormData({ ...formData, targetRole: value })}
                >
                  <SelectTrigger id="targetRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All Users
                      </div>
                    </SelectItem>
                    <SelectItem value="driver">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Drivers Only
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Managers Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        High (Urgent)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Click Action */}
              <div className="space-y-2">
                <Label htmlFor="clickAction">Click Action</Label>
                <Select
                  value={formData.clickAction}
                  onValueChange={(value) => setFormData({ ...formData, clickAction: value })}
                >
                  <SelectTrigger id="clickAction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/">Open App</SelectItem>
                    <SelectItem value="/driver">Driver Dashboard</SelectItem>
                    <SelectItem value="tel:+441234567890">Call Office</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  What happens when user taps the notification
                </p>
              </div>

              {/* Phone Number (if call action) */}
              {formData.clickAction.startsWith('tel:') && (
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Office Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+44 1234 567890"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={sending || !formData.title || !formData.body}
              >
                {sending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Templates Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Templates</CardTitle>
              <CardDescription>
                Use pre-made templates for common messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium text-sm">{template.name}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {template.body}
                    </span>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Keep titles short and clear</p>
              <p>• Use emojis to grab attention</p>
              <p>• High priority for urgent messages</p>
              <p>• Test with yourself first</p>
              <p>• Avoid sending too frequently</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
