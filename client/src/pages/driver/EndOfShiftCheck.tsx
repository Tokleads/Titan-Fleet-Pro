import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, Check, X, Loader2, CheckCircle2, AlertCircle, 
  ClipboardCheck, Fuel, Droplet, CreditCard, Hash, Car 
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

interface CheckItem {
  id: string;
  label: string;
  required: boolean;
  requiresPhoto: boolean;
  type: 'pass_fail' | 'numeric' | 'percentage';
  minValue?: number;
  icon: React.ReactNode;
}

interface CheckItemState {
  status: 'pending' | 'passed' | 'failed';
  value?: string;
  notes?: string;
  photoFile?: File;
  photoPreview?: string;
}

interface EndOfShiftCheckProps {
  companyId: number;
  driverId: number;
  vehicleId: number;
  timesheetId: number;
  onComplete: () => void;
}

const DEFAULT_CHECK_ITEMS: CheckItem[] = [
  {
    id: 'cab_cleanliness',
    label: 'Cab Cleanliness',
    required: true,
    requiresPhoto: true,
    type: 'pass_fail',
    icon: <Car className="h-5 w-5" />
  },
  {
    id: 'number_plate',
    label: 'Number Plate in Door Pocket',
    required: true,
    requiresPhoto: true,
    type: 'pass_fail',
    icon: <Hash className="h-5 w-5" />
  },
  {
    id: 'mileage',
    label: 'Mileage Reading',
    required: true,
    requiresPhoto: true,
    type: 'numeric',
    icon: <ClipboardCheck className="h-5 w-5" />
  },
  {
    id: 'fuel_level',
    label: 'Fuel Level (%)',
    required: true,
    requiresPhoto: true,
    type: 'percentage',
    minValue: 0,
    icon: <Fuel className="h-5 w-5" />
  },
  {
    id: 'adblue_level',
    label: 'AdBlue Level (%)',
    required: true,
    requiresPhoto: true,
    type: 'percentage',
    minValue: 0,
    icon: <Droplet className="h-5 w-5" />
  },
  {
    id: 'fuel_card',
    label: 'Fuel Card Present',
    required: true,
    requiresPhoto: true,
    type: 'pass_fail',
    icon: <CreditCard className="h-5 w-5" />
  }
];

export default function EndOfShiftCheck({ 
  companyId, 
  driverId, 
  vehicleId, 
  timesheetId,
  onComplete 
}: EndOfShiftCheckProps) {
  const [checkItems, setCheckItems] = useState<Record<string, CheckItemState>>({});
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Create shift check
  const createCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/shift-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          driverId,
          vehicleId,
          timesheetId
        })
      });
      if (!response.ok) throw new Error('Failed to create shift check');
      return response.json();
    }
  });

  // Complete shift check and clock out
  const completeCheckMutation = useMutation({
    mutationFn: async (shiftCheckId: number) => {
      // Upload all photos and check items
      for (const item of DEFAULT_CHECK_ITEMS) {
        const itemState = checkItems[item.id];
        if (!itemState) continue;

        const formData = new FormData();
        formData.append('shiftCheckId', shiftCheckId.toString());
        formData.append('itemId', item.id);
        formData.append('label', item.label);
        formData.append('itemType', item.type);
        formData.append('status', itemState.status);
        
        if (itemState.value) {
          formData.append('value', itemState.value);
        }
        if (itemState.notes) {
          formData.append('notes', itemState.notes);
        }
        if (itemState.photoFile) {
          formData.append('photo', itemState.photoFile);
        }

        const response = await fetch(`/api/shift-checks/${shiftCheckId}/item`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload check item: ${item.label}`);
        }
      }

      // Complete check and trigger clock-out
      const response = await fetch(`/api/shift-checks/${shiftCheckId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: await getCurrentLatitude(),
          longitude: await getCurrentLongitude()
        })
      });

      if (!response.ok) throw new Error('Failed to complete shift check');
      return response.json();
    },
    onSuccess: () => {
      onComplete();
    }
  });

  const getCurrentLatitude = async (): Promise<string> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords.latitude.toString()),
        () => resolve('0')
      );
    });
  };

  const getCurrentLongitude = async (): Promise<string> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords.longitude.toString()),
        () => resolve('0')
      );
    });
  };

  const handlePhotoCapture = (itemId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setCheckItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          photoFile: file,
          photoPreview: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleStatusChange = (itemId: string, status: 'passed' | 'failed') => {
    setCheckItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status
      }
    }));
  };

  const handleValueChange = (itemId: string, value: string) => {
    setCheckItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        value
      }
    }));
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setCheckItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes
      }
    }));
  };

  const isItemComplete = (item: CheckItem): boolean => {
    const itemState = checkItems[item.id];
    if (!itemState) return false;

    // Check if photo is required and present
    if (item.requiresPhoto && !itemState.photoFile) return false;

    // Check if status is set
    if (item.type === 'pass_fail' && itemState.status === 'pending') return false;

    // Check if value is required and present
    if ((item.type === 'numeric' || item.type === 'percentage') && !itemState.value) return false;

    return true;
  };

  const completedCount = DEFAULT_CHECK_ITEMS.filter(isItemComplete).length;
  const totalCount = DEFAULT_CHECK_ITEMS.length;
  const allComplete = completedCount === totalCount;
  const progressPercent = (completedCount / totalCount) * 100;

  const handleSubmit = async () => {
    if (!allComplete) return;

    try {
      // Create shift check
      const shiftCheck = await createCheckMutation.mutateAsync();
      
      // Complete check and clock out
      await completeCheckMutation.mutateAsync(shiftCheck.id);
    } catch (error) {
      console.error('Error completing shift check:', error);
      alert('Failed to complete shift check. Please try again.');
    }
  };

  const isSubmitting = createCheckMutation.isPending || completeCheckMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">End of Shift Check</h1>
        </div>
        <p className="text-muted-foreground">
          Complete all checks to clock out and end your shift
        </p>
      </div>

      {/* Progress */}
      <Card className="max-w-2xl mx-auto p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} complete
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </Card>

      {/* Check Items */}
      <div className="max-w-2xl mx-auto space-y-4 mb-6">
        {DEFAULT_CHECK_ITEMS.map((item) => {
          const itemState = checkItems[item.id] || { status: 'pending' };
          const isComplete = isItemComplete(item);

          return (
            <Card key={item.id} className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-lg ${
                  isComplete 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {isComplete ? <CheckCircle2 className="h-5 w-5" /> : item.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{item.label}</h3>
                    {isComplete && (
                      <Badge variant="default" className="bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </div>

                  {/* Pass/Fail Buttons */}
                  {item.type === 'pass_fail' && (
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant={itemState.status === 'passed' ? 'default' : 'outline'}
                        className={itemState.status === 'passed' ? 'bg-green-600' : ''}
                        onClick={() => handleStatusChange(item.id, 'passed')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Pass
                      </Button>
                      <Button
                        variant={itemState.status === 'failed' ? 'default' : 'outline'}
                        className={itemState.status === 'failed' ? 'bg-red-600' : ''}
                        onClick={() => handleStatusChange(item.id, 'failed')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Fail
                      </Button>
                    </div>
                  )}

                  {/* Numeric/Percentage Input */}
                  {(item.type === 'numeric' || item.type === 'percentage') && (
                    <div className="mb-3">
                      <Input
                        type="number"
                        placeholder={item.type === 'percentage' ? 'Enter percentage (0-100)' : 'Enter value'}
                        value={itemState.value || ''}
                        onChange={(e) => {
                          handleValueChange(item.id, e.target.value);
                          // Auto-set status based on value
                          const numValue = parseFloat(e.target.value);
                          if (!isNaN(numValue)) {
                            if (item.minValue !== undefined && numValue < item.minValue) {
                              handleStatusChange(item.id, 'failed');
                            } else {
                              handleStatusChange(item.id, 'passed');
                            }
                          }
                        }}
                        min={0}
                        max={item.type === 'percentage' ? 100 : undefined}
                      />
                    </div>
                  )}

                  {/* Photo Capture */}
                  {item.requiresPhoto && (
                    <div className="mb-3">
                      <input
                        ref={(el) => { fileInputRefs.current[item.id] = el; }}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoCapture(item.id, file);
                        }}
                      />
                      
                      {itemState.photoPreview ? (
                        <div className="relative">
                          <img
                            src={itemState.photoPreview}
                            alt={item.label}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => fileInputRefs.current[item.id]?.click()}
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            Retake
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => fileInputRefs.current[item.id]?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Take Photo
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <Textarea
                    placeholder="Add notes (optional)"
                    value={itemState.notes || ''}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          {allComplete ? (
            <Button
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Completing Check & Clocking Out...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Complete Check & Clock Out
                </>
              )}
            </Button>
          ) : (
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              <p className="text-lg font-semibold mb-1">
                Complete all checks to clock out
              </p>
              <p className="text-sm text-muted-foreground">
                {totalCount - completedCount} item{totalCount - completedCount !== 1 ? 's' : ''} remaining
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
