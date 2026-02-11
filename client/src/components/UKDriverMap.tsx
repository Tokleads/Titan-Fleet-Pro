import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

interface OnShiftDriver {
  driverId: number;
  driverName: string;
  depotName: string;
  latitude: string;
  longitude: string;
  arrivalTime: string;
}

interface UKDriverMapProps {
  drivers: OnShiftDriver[];
}

export default function UKDriverMap({ drivers }: UKDriverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current).setView([53.5, -1.5], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current) return;

    const map = leafletMapRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    drivers.forEach((driver) => {
      const lat = parseFloat(driver.latitude);
      const lng = parseFloat(driver.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 16px;
            height: 16px;
            background-color: #22c55e;
            border: 2.5px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 3px rgba(34,197,94,0.3), 0 2px 4px rgba(0,0,0,0.2);
            animation: ukmap-pulse 2s ease-in-out infinite;
          "></div>
          <style>
            @keyframes ukmap-pulse {
              0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.3), 0 2px 4px rgba(0,0,0,0.2); }
              50% { box-shadow: 0 0 0 8px rgba(34,197,94,0.1), 0 2px 4px rgba(0,0,0,0.2); }
            }
          </style>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      const clockInTime = new Date(driver.arrivalTime).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 160px;">
          <h3 style="font-weight: bold; margin: 0 0 6px 0; font-size: 14px; color: #0f172a;">
            ${driver.driverName}
          </h3>
          <p style="margin: 3px 0; font-size: 12px; color: #475569;">
            📍 ${driver.depotName}
          </p>
          <p style="margin: 3px 0; font-size: 12px; color: #475569;">
            🕐 Clocked in ${clockInTime}
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    if (drivers.length > 0) {
      try {
        const validCoords = drivers
          .map((d) => [parseFloat(d.latitude), parseFloat(d.longitude)] as [number, number])
          .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));

        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords);
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch (error) {
        console.warn('Error fitting bounds:', error);
      }
    }
  }, [drivers]);

  return (
    <div className="relative" data-testid="uk-driver-map">
      <div ref={mapRef} className="w-full rounded-xl" style={{ height: '350px' }} />
      {drivers.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-xl z-[1000]" data-testid="map-empty-state">
          <MapPin className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No drivers currently on shift</p>
          <p className="text-sm text-slate-400 mt-1">Driver locations will appear here when they clock in</p>
        </div>
      )}
    </div>
  );
}
