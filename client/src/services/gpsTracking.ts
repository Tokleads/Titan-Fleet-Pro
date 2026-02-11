/**
 * GPS Tracking Service
 * Provides continuous background location tracking with offline queue and battery optimization
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  driverId: number;
  vehicleId: number | null;
  companyId: number;
}

export interface TrackingConfig {
  updateInterval: number; // milliseconds
  highAccuracy: boolean;
  maxAge: number;
  timeout: number;
  distanceFilter: number; // meters - minimum distance before update
  batteryOptimization: boolean;
}

export interface TrackingStatus {
  isTracking: boolean;
  lastUpdate: number | null;
  queueSize: number;
  batteryLevel: number | null;
  error: string | null;
}

class GPSTrackingService {
  private watchId: number | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private lastLocation: LocationData | null = null;
  private lastSentLocation: LocationData | null = null;
  private offlineQueue: LocationData[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSending: boolean = false;
  private config: TrackingConfig = {
    updateInterval: 5 * 60 * 1000, // 5 minutes default
    highAccuracy: true,
    maxAge: 30000,
    timeout: 10000,
    distanceFilter: 50, // 50 meters minimum movement
    batteryOptimization: true,
  };
  private statusCallbacks: Set<(status: TrackingStatus) => void> = new Set();
  private batteryLevel: number | null = null;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Monitor battery level if available
    this.initBatteryMonitoring();
    
    // Load offline queue from localStorage
    this.loadOfflineQueue();
  }

  /**
   * Initialize battery monitoring
   */
  private async initBatteryMonitoring() {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        this.batteryLevel = battery.level;
        
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.adjustTrackingForBattery();
          this.notifyStatusChange();
        });
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }
  }

  /**
   * Adjust tracking frequency based on battery level
   */
  private adjustTrackingForBattery() {
    if (!this.config.batteryOptimization || this.batteryLevel === null) return;

    if (this.batteryLevel < 0.15) {
      // Low battery: 15 minute intervals
      this.config.updateInterval = 15 * 60 * 1000;
      this.config.highAccuracy = false;
    } else if (this.batteryLevel < 0.30) {
      // Medium battery: 10 minute intervals
      this.config.updateInterval = 10 * 60 * 1000;
      this.config.highAccuracy = true;
    } else {
      // Good battery: 5 minute intervals
      this.config.updateInterval = 5 * 60 * 1000;
      this.config.highAccuracy = true;
    }

    // Restart tracking with new config
    if (this.watchId !== null) {
      this.stopTracking();
      this.startTracking(
        this.lastLocation?.driverId || 0,
        this.lastLocation?.vehicleId || null,
        this.lastLocation?.companyId
      );
    }
  }

  /**
   * Start GPS tracking
   */
  public startTracking(driverId: number, vehicleId: number | null, companyId?: number): boolean {
    if (this.watchId !== null) {
      console.warn('GPS tracking already active');
      return false;
    }

    if (!navigator.geolocation) {
      this.notifyStatusChange('Geolocation not supported');
      return false;
    }

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handleLocationUpdate(position, driverId, vehicleId, companyId),
      (error) => this.handleLocationError(error),
      {
        enableHighAccuracy: this.config.highAccuracy,
        timeout: this.config.timeout,
        maximumAge: this.config.maxAge,
      }
    );

    // Start periodic update timer
    this.updateTimer = setInterval(() => {
      this.sendLocationUpdate();
    }, this.config.updateInterval);

    this.notifyStatusChange();
    return true;
  }

  /**
   * Stop GPS tracking
   */
  public stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateTimer !== null) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    // Send any remaining queued locations
    this.processOfflineQueue();

    this.notifyStatusChange();
  }

  /**
   * Handle location update from GPS
   */
  private handleLocationUpdate(
    position: GeolocationPosition,
    driverId: number,
    vehicleId: number | null,
    companyId?: number
  ): void {
    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: position.timestamp,
      driverId,
      vehicleId,
      companyId: companyId ?? 0,
    };

    // Check if location has changed significantly
    if (this.shouldSkipUpdate(locationData)) {
      return;
    }

    this.lastLocation = locationData;
    this.notifyStatusChange();
  }

  /**
   * Check if update should be skipped based on distance filter
   */
  private shouldSkipUpdate(newLocation: LocationData): boolean {
    if (!this.lastSentLocation) return false;

    const distance = this.calculateDistance(
      this.lastSentLocation.latitude,
      this.lastSentLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    return distance < this.config.distanceFilter;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Handle location error
   */
  private handleLocationError(error: GeolocationPositionError): void {
    let errorMessage = 'Unknown location error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timeout';
        break;
    }

    console.error('GPS Error:', errorMessage, error);
    this.notifyStatusChange(errorMessage);
  }

  /**
   * Send location update to server
   */
  private async sendLocationUpdate(): Promise<void> {
    if (!this.lastLocation || this.isSending) return;

    // Add to offline queue if offline
    if (!this.isOnline) {
      this.addToOfflineQueue(this.lastLocation);
      return;
    }

    this.isSending = true;

    try {
      const response = await fetch('/api/driver/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: this.lastLocation.latitude,
          longitude: this.lastLocation.longitude,
          accuracy: this.lastLocation.accuracy,
          speed: this.lastLocation.speed,
          heading: this.lastLocation.heading,
          timestamp: this.lastLocation.timestamp,
          driverId: this.lastLocation.driverId,
          companyId: this.lastLocation.companyId,
          vehicleId: this.lastLocation.vehicleId,
        }),
      });

      if (response.ok) {
        this.lastSentLocation = this.lastLocation;
        this.notifyStatusChange();
        
        // Process offline queue if any
        if (this.offlineQueue.length > 0) {
          this.processOfflineQueue();
        }
      } else {
        // Add to offline queue on server error
        this.addToOfflineQueue(this.lastLocation);
      }
    } catch (error) {
      console.error('Failed to send location update:', error);
      this.addToOfflineQueue(this.lastLocation);
    } finally {
      this.isSending = false;
    }
  }

  /**
   * Add location to offline queue
   */
  private addToOfflineQueue(location: LocationData): void {
    this.offlineQueue.push(location);
    
    // Limit queue size to prevent memory issues
    if (this.offlineQueue.length > 100) {
      this.offlineQueue.shift();
    }

    this.saveOfflineQueue();
    this.notifyStatusChange();
  }

  /**
   * Process offline queue when connection is restored
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0 || !this.isOnline || this.isSending) {
      return;
    }

    this.isSending = true;

    try {
      // Send queued locations in batch
      const response = await fetch('/api/driver/location/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locations: this.offlineQueue,
        }),
      });

      if (response.ok) {
        this.offlineQueue = [];
        this.saveOfflineQueue();
        this.notifyStatusChange();
      }
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    } finally {
      this.isSending = false;
    }
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('gps_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    try {
      const saved = localStorage.getItem('gps_offline_queue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
        this.notifyStatusChange();
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.isOnline = true;
    this.notifyStatusChange();
    this.processOfflineQueue();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.isOnline = false;
    this.notifyStatusChange();
  };

  /**
   * Get current tracking status
   */
  public getStatus(): TrackingStatus {
    return {
      isTracking: this.watchId !== null,
      lastUpdate: this.lastLocation?.timestamp || null,
      queueSize: this.offlineQueue.length,
      batteryLevel: this.batteryLevel,
      error: null,
    };
  }

  /**
   * Subscribe to status changes
   */
  public onStatusChange(callback: (status: TrackingStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of status change
   */
  private notifyStatusChange(error: string | null = null): void {
    const status: TrackingStatus = {
      ...this.getStatus(),
      error,
    };

    this.statusCallbacks.forEach((callback) => {
      try {
        callback(status);
      } catch (err) {
        console.error('Error in status callback:', err);
      }
    });
  }

  /**
   * Update tracking configuration
   */
  public updateConfig(config: Partial<TrackingConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart tracking if active
    if (this.watchId !== null) {
      const driverId = this.lastLocation?.driverId || 0;
      const vehicleId = this.lastLocation?.vehicleId || null;
      const companyId = this.lastLocation?.companyId;
      this.stopTracking();
      this.startTracking(driverId, vehicleId, companyId);
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): TrackingConfig {
    return { ...this.config };
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.stopTracking();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.statusCallbacks.clear();
  }
}

// Export singleton instance
export const gpsTrackingService = new GPSTrackingService();
