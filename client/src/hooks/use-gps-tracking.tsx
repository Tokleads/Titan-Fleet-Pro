import { useEffect, useState, useCallback } from 'react';
import { gpsTrackingService, type TrackingStatus } from '@/services/gpsTracking';
import { session } from '@/lib/session';

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

export function useGPSTracking(options: UseGPSTrackingOptions): UseGPSTrackingReturn {
  const { driverId, vehicleId = null, companyId, autoStart = false } = options;
  
  const [status, setStatus] = useState<TrackingStatus>(() => 
    gpsTrackingService.getStatus()
  );

  useEffect(() => {
    gpsTrackingService.setAuthTokenProvider(() => session.getToken());
  }, []);

  useEffect(() => {
    const unsubscribe = gpsTrackingService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (autoStart && driverId) {
      gpsTrackingService.startTracking(driverId, vehicleId, companyId);
    }

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
