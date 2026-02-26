import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, CheckCircle, XCircle, Loader2, AlertCircle, ChevronDown, ChevronRight, Signal, Shield, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gpsTrackingService } from '@/services/gpsTracking';
import { session } from '@/lib/session';

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  calculateDistance, 
  isPointInGeofence, 
  findNearestGeofence,
  type Geofence 
} from '@shared/geofenceUtils';

interface ActiveTimesheet {
  id: number;
  depotName: string;
  arrivalTime: string;
  totalMinutes: number | null;
}

interface ClockInOutProps {
  companyId: number;
  driverId: number;
  driverName: string;
}

export default function ClockInOut({ companyId, driverId, driverName }: ClockInOutProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearestDepot, setNearestDepot] = useState<{ geofence: Geofence; distance: number } | null>(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState(false);
  const [matchingGeofences, setMatchingGeofences] = useState<Geofence[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<number | null>(null);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(() => {
    // Check if policy was accepted today
    const acceptedDate = localStorage.getItem(`policy-accepted-${driverId}`);
    if (acceptedDate) {
      const today = new Date().toDateString();
      return acceptedDate === today;
    }
    return false;
  });
  const queryClient = useQueryClient();

  // Fetch geofences (depots)
  const { data: geofences = [] } = useQuery<Geofence[]>({
    queryKey: ['geofences', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/geofences/${companyId}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch depots');
      return response.json();
    }
  });

  // Fetch active timesheet
  const { data: activeTimesheet, isLoading: loadingTimesheet } = useQuery<ActiveTimesheet | null>({
    queryKey: ['active-timesheet', driverId],
    queryFn: async () => {
      const response = await fetch(`/api/timesheets/active/${driverId}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch active timesheet');
      const data = await response.json();
      return data.timesheet || null;
    },
    refetchInterval: 30000
  });

  // Get current location with high accuracy
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGpsAccuracy(position.coords.accuracy);
        setLocationError(null);
      },
      (error) => {
        setLocationError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Check geofences when location changes
  useEffect(() => {
    if (!currentLocation || geofences.length === 0) {
      setNearestDepot(null);
      setIsInsideGeofence(false);
      setMatchingGeofences([]);
      return;
    }

    // Find all geofences the user is inside
    const matching = geofences.filter(g => 
      g.isActive && isPointInGeofence(currentLocation, g)
    );
    setMatchingGeofences(matching);
    setIsInsideGeofence(matching.length > 0);

    // Find nearest geofence
    const nearest = findNearestGeofence(currentLocation, geofences.filter(g => g.isActive));
    setNearestDepot(nearest);

    // Auto-select first matching geofence if inside one (only if not already selected)
    if (matching.length > 0) {
      setSelectedDepotId(prevId => prevId ?? matching[0].id);
    }
  }, [currentLocation, geofences]);

  // Get GPS accuracy color and status
  const getAccuracyStatus = (accuracy: number | null) => {
    if (accuracy === null) return { color: 'text-slate-400', bg: 'bg-slate-100', label: 'Unknown', valid: false };
    if (accuracy <= 10) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Excellent', valid: true };
    if (accuracy <= 30) return { color: 'text-green-500', bg: 'bg-green-50', label: 'Good', valid: true };
    if (accuracy <= 50) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Fair', valid: true };
    if (accuracy <= 100) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Poor', valid: true };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Low', valid: true };
  };

  const accuracyStatus = getAccuracyStatus(gpsAccuracy);
  const isAccuracyValid = gpsAccuracy !== null;
  const isLowAccuracy = gpsAccuracy !== null && gpsAccuracy > 100;

  // Determine which depot to use for clock in
  const getSelectedDepot = (): Geofence | null => {
    if (selectedDepotId) {
      return geofences.find(g => g.id === selectedDepotId) || null;
    }
    if (matchingGeofences.length > 0) {
      return matchingGeofences[0];
    }
    return null;
  };

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async () => {
      if (!currentLocation) throw new Error('Location not available');
      
      const depot = getSelectedDepot() || (nearestDepot ? nearestDepot.geofence : null);
      const isManualSelection = !isInsideGeofence;

      const response = await fetch('/api/timesheets/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          companyId,
          driverId,
          depotId: depot?.id || null,
          latitude: currentLocation.lat.toString(),
          longitude: currentLocation.lng.toString(),
          accuracy: gpsAccuracy,
          manualSelection: isManualSelection,
          lowAccuracy: isLowAccuracy
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clock in');
      }

      return response.json();
    },
    onSuccess: () => {
      gpsTrackingService.startTracking(driverId, null, companyId);
      queryClient.invalidateQueries({ queryKey: ['active-timesheet', driverId] });
      setSelectedDepotId(null);
      setShowManualSelection(false);
    }
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!activeTimesheet) throw new Error('No active timesheet');

      const response = await fetch('/api/timesheets/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          timesheetId: activeTimesheet.id,
          latitude: currentLocation?.lat?.toString() || null,
          longitude: currentLocation?.lng?.toString() || null,
          accuracy: gpsAccuracy
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clock out');
      }

      return response.json();
    },
    onSuccess: () => {
      gpsTrackingService.stopTracking();
      queryClient.invalidateQueries({ queryKey: ['active-timesheet', driverId] });
    }
  });

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasNoDepots = geofences.filter(g => g.isActive).length === 0;
  // Can clock in if: location available (always allow, flags for review if outside geofence)
  const canClockIn = currentLocation && isAccuracyValid;

  // Handle policy acceptance
  const handleAcceptPolicy = () => {
    const today = new Date().toDateString();
    localStorage.setItem(`policy-accepted-${driverId}`, today);
    setPolicyAccepted(true);
    setShowPolicyModal(false);
    // Now proceed with clock in
    clockInMutation.mutate();
  };

  // Handle clock in button click - show policy if not accepted
  const handleClockInClick = () => {
    if (!policyAccepted) {
      setShowPolicyModal(true);
    } else {
      clockInMutation.mutate();
    }
  };

  if (loadingTimesheet) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 titan-page-enter">
      {activeTimesheet ? (
        <>
          {/* CLOCKED IN STATE */}
          <Card className="p-0 overflow-hidden border-green-200 shadow-lg shadow-green-100/50">
            <div className="bg-green-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Clocked In</h2>
                    <p className="text-green-100 text-sm font-medium">
                      Since {formatTime(activeTimesheet.arrivalTime)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold tabular-nums">
                    {formatDuration(
                      Math.floor((Date.now() - new Date(activeTimesheet.arrivalTime).getTime()) / 60000)
                    )}
                  </p>
                  <p className="text-green-100 text-xs">elapsed</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Location:</span>
                <span className="font-medium text-green-900">{activeTimesheet.depotName}</span>
              </div>
              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold titan-btn-press bg-red-600 hover:bg-red-700 text-white shadow-md"
                onClick={() => clockOutMutation.mutate()}
                disabled={clockOutMutation.isPending}
                data-testid="button-clock-out"
              >
                {clockOutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Clocking Out...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-6 w-6" />
                    Clock Out
                  </>
                )}
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* CLOCKED OUT STATE - Clock In button first */}
          <Card className="p-0 overflow-hidden border-primary/20 shadow-lg">
            <div className="p-5 text-center space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Welcome, {driverName}</p>
              <Button
                size="lg"
                className="w-full h-16 text-xl font-bold titan-btn-press"
                onClick={handleClockInClick}
                disabled={!canClockIn || clockInMutation.isPending}
                data-testid="button-clock-in"
              >
                {clockInMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Clocking In...
                  </>
                ) : !currentLocation ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-6 w-6" />
                    Clock In
                  </>
                )}
              </Button>

              {currentLocation && !isInsideGeofence && !hasNoDepots && (
                <p className="text-xs text-amber-600">
                  You're outside depot range — clock-in will be flagged for manager review
                </p>
              )}
              {isLowAccuracy && (
                <p className="text-xs text-amber-600">
                  Low GPS accuracy — clock-in will be flagged for manager review
                </p>
              )}
            </div>
          </Card>

          {/* Location details - collapsible summary */}
          <Card className="p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setLocationExpanded(!locationExpanded)}
              className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-muted/50 transition-colors"
              data-testid="button-toggle-location"
            >
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="flex-1 text-sm truncate">
                {locationError ? (
                  <span className="text-destructive">{locationError}</span>
                ) : !currentLocation ? (
                  <span className="text-muted-foreground">Getting location...</span>
                ) : isInsideGeofence && nearestDepot ? (
                  <span className="text-green-600 font-medium">At depot · {nearestDepot.geofence.name}</span>
                ) : nearestDepot ? (
                  <span className="text-orange-600 font-medium">
                    Outside depot range · {nearestDepot.geofence.name} {nearestDepot.distance >= 1000 
                      ? `${(nearestDepot.distance / 1000).toFixed(1)}km` 
                      : `${nearestDepot.distance.toFixed(0)}m`}
                  </span>
                ) : hasNoDepots ? (
                  <span className="text-muted-foreground">No depots configured</span>
                ) : (
                  <span className="text-muted-foreground">Checking depot proximity...</span>
                )}
              </span>
              {gpsAccuracy !== null && (
                <span className={`text-[11px] ${accuracyStatus.color} flex-shrink-0`}>
                  ±{Math.round(gpsAccuracy)}m
                </span>
              )}
              {locationExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </button>

            {locationExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">Your Location</h3>
                    {locationError ? (
                      <div className="flex items-center gap-2 text-destructive mt-1">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">{locationError}</span>
                      </div>
                    ) : currentLocation ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs text-muted-foreground">Getting location...</span>
                      </div>
                    )}
                  </div>
                </div>

                {gpsAccuracy !== null && (
                  <div className={`flex items-center gap-3 p-2.5 rounded-lg ${accuracyStatus.bg}`}>
                    <Signal className={`h-4 w-4 ${accuracyStatus.color}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-medium ${accuracyStatus.color}`}>
                          GPS Accuracy: {accuracyStatus.label}
                        </span>
                        <span className={`text-xs ${accuracyStatus.color}`}>
                          ±{Math.round(gpsAccuracy)}m
                        </span>
                      </div>
                      {isLowAccuracy && (
                        <p className="text-[11px] text-amber-600 mt-0.5">
                          Low GPS accuracy — your clock-in will be flagged for manager review.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {nearestDepot && (
                  <div className="bg-muted rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Nearest Depot:</span>
                      <span className="text-xs font-medium">{nearestDepot.geofence.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Distance:</span>
                      <span className={`text-xs font-medium ${isInsideGeofence ? 'text-green-600' : 'text-orange-600'}`}>
                        {nearestDepot.distance.toFixed(0)}m
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      {isInsideGeofence ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle className="h-3 w-3" />
                          At Depot
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-600 text-xs font-medium">
                          <AlertCircle className="h-3 w-3" />
                          Outside Range
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {!isInsideGeofence && geofences.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-700">Manual Depot Selection</span>
                      <button
                        onClick={() => setShowManualSelection(!showManualSelection)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {showManualSelection ? 'Hide' : 'Select depot'}
                        <ChevronDown className={`h-3 w-3 transition-transform ${showManualSelection ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    
                    {showManualSelection && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-amber-600">
                          Manual selection will be flagged for review.
                        </p>
                        <select
                          value={selectedDepotId || ''}
                          onChange={(e) => setSelectedDepotId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a depot...</option>
                          {geofences.filter(g => g.isActive).map(depot => (
                            <option key={depot.id} value={depot.id}>
                              {depot.name} ({nearestDepot && depot.id === nearestDepot.geofence.id 
                                ? `${nearestDepot.distance.toFixed(0)}m away` 
                                : calculateDistance(
                                    currentLocation?.lat || 0,
                                    currentLocation?.lng || 0,
                                    parseFloat(depot.latitude),
                                    parseFloat(depot.longitude)
                                  ).toFixed(0) + 'm away'
                              })
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Error Messages */}
      {clockInMutation.error && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <p className="text-sm text-destructive">
            {clockInMutation.error.message}
          </p>
        </Card>
      )}
      {clockOutMutation.error && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <p className="text-sm text-destructive">
            {clockOutMutation.error.message}
          </p>
        </Card>
      )}

      {/* GPS Tracking Policy Modal */}
      <Dialog open={showPolicyModal} onOpenChange={setShowPolicyModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-xl">GPS Tracking Policy</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              Please read and acknowledge the following policy before starting your shift.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Vehicle Location Monitoring</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    During your shift, the company vehicle's location will be tracked for fleet management, route optimization, and safety purposes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">When Tracking Occurs</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Location tracking is active only while you are clocked in for your shift. Tracking stops automatically when you clock out.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Data Protection</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    All location data is stored securely and used only for legitimate business purposes in accordance with GDPR and UK data protection laws.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Data Retention</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Location history is retained for 90 days for operational purposes and may be used for timesheet verification.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              By clicking "I Understand & Accept", you confirm that you have read and understood this GPS tracking policy. This acknowledgment is required daily before starting your shift.
            </p>
          </div>
          
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button 
              onClick={handleAcceptPolicy}
              className="w-full"
              size="lg"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              I Understand & Accept
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowPolicyModal(false)}
              className="w-full text-muted-foreground"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
