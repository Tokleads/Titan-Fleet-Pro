import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryCharging,
  BatteryLow,
  BatteryWarning,
  Clock,
  Upload,
  AlertCircle,
  Play,
  Square
} from 'lucide-react';
import { useGPSTracking } from '@/hooks/use-gps-tracking';
import { motion, AnimatePresence } from 'framer-motion';

interface GPSTrackingStatusProps {
  driverId: number;
  vehicleId?: number | null;
  autoStart?: boolean;
  compact?: boolean;
  hidden?: boolean;
}

export function GPSTrackingStatus({ 
  driverId, 
  vehicleId, 
  autoStart = true,
  compact = false,
  hidden = false
}: GPSTrackingStatusProps) {
  const {
    isTracking,
    startTracking,
    stopTracking,
    lastUpdateTime,
    queueSize,
    batteryLevel,
    error,
  } = useGPSTracking({ driverId, vehicleId, autoStart });

  const getBatteryIcon = () => {
    if (batteryLevel === null) return <Battery className="h-4 w-4" />;
    if (batteryLevel < 0.15) return <BatteryLow className="h-4 w-4 text-red-500" />;
    if (batteryLevel < 0.30) return <BatteryWarning className="h-4 w-4 text-yellow-500" />;
    return <BatteryCharging className="h-4 w-4 text-green-500" />;
  };

  const getBatteryText = () => {
    if (batteryLevel === null) return 'Unknown';
    return `${Math.round(batteryLevel * 100)}%`;
  };

  const isOnline = navigator.onLine;

  // Hidden mode - tracking runs but UI is invisible
  if (hidden) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          {isTracking ? (
            <MapPin className="h-4 w-4 text-green-500 animate-pulse" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-xs text-muted-foreground">
            {isTracking ? 'Tracking' : 'Stopped'}
          </span>
        </div>

        {queueSize > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            {queueSize}
          </Badge>
        )}

        {error && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className={`h-5 w-5 ${isTracking ? 'text-green-500' : 'text-gray-400'}`} />
            <h3 className="font-semibold">GPS Tracking</h3>
          </div>
          
          <Badge variant={isTracking ? 'default' : 'secondary'}>
            {isTracking ? 'Active' : 'Stopped'}
          </Badge>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Connection</p>
              <p className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          {/* Battery Level */}
          <div className="flex items-center gap-2">
            {getBatteryIcon()}
            <div>
              <p className="text-xs text-muted-foreground">Battery</p>
              <p className="text-sm font-medium">{getBatteryText()}</p>
            </div>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Last Update</p>
              <p className="text-sm font-medium">
                {lastUpdateTime || 'Never'}
              </p>
            </div>
          </div>

          {/* Queue Size */}
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Queued</p>
              <p className="text-sm font-medium">
                {queueSize} {queueSize === 1 ? 'update' : 'updates'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offline Queue Warning */}
        <AnimatePresence>
          {queueSize > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <Upload className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">
                  Offline Updates Queued
                </p>
                <p className="text-xs text-yellow-700">
                  {queueSize} location {queueSize === 1 ? 'update' : 'updates'} will be sent when connection is restored
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Battery Optimization Notice */}
        {batteryLevel !== null && batteryLevel < 0.30 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <BatteryWarning className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Battery Optimization Active
              </p>
              <p className="text-xs text-blue-700">
                Tracking frequency reduced to conserve battery
              </p>
            </div>
          </motion.div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button
              onClick={startTracking}
              className="flex-1"
              variant="default"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          ) : (
            <Button
              onClick={stopTracking}
              className="flex-1"
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Tracking
            </Button>
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center">
          Location updates every 5 minutes • Automatic battery optimization
        </p>
      </div>
    </Card>
  );
}
