import { useEffect, useState, useCallback } from 'react';
import { gpsTrackingService, type TrackingStatus } from '@/services/gpsTracking';

export interface UseGPSTrackingOptions {
  driverId: number;
  vehicleId?: number | null;
  companyId?: number;
  autoStart?: boolean;
}

export interface UseGPSTrackingReturn {
  status: TrackingStatus;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  lastUpdateTime: string | null;
  queueSize: number;
  batteryLevel: number | null;
  error: string | null;
}

/**
 * React hook for GPS tracking
 * Provides easy integration of GPS tracking into driver components
 */
export function useGPSTracking(options: UseGPSTrackingOptions): UseGPSTrackingReturn {
  const { driverId, vehicleId = null, companyId, autoStart = false } = options;
  
  const [status, setStatus] = useState<TrackingStatus>(() => 
    gpsTrackingService.getStatus()
  );

  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = gpsTrackingService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (autoStart && driverId) {
      gpsTrackingService.startTracking(driverId, vehicleId, companyId);
    }

    // Cleanup on unmount
    return () => {
      if (autoStart) {
        gpsTrackingService.stopTracking();
      }
    };
  }, [driverId, vehicleId, companyId, autoStart]);

  const startTracking = useCallback(() => {
    gpsTrackingService.startTracking(driverId, vehicleId, companyId);
  }, [driverId, vehicleId, companyId]);

  const stopTracking = useCallback(() => {
    gpsTrackingService.stopTracking();
  }, []);

  const lastUpdateTime = status.lastUpdate 
    ? new Date(status.lastUpdate).toLocaleTimeString()
    : null;

  return {
    status,
    isTracking: status.isTracking,
    startTracking,
    stopTracking,
    lastUpdateTime,
    queueSize: status.queueSize,
    batteryLevel: status.batteryLevel,
    error: status.error,
  };
}
