import { useState } from "react";
import { Clock, MapPin } from "lucide-react";

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

const SVG_WIDTH = 300;
const SVG_HEIGHT = 400;

const UK_LAT_SOUTH = 49.9;
const UK_LAT_NORTH = 58.7;
const UK_LNG_WEST = -7.6;
const UK_LNG_EAST = 1.8;

function latLngToSvg(lat: number, lng: number) {
  const x = ((lng - UK_LNG_WEST) / (UK_LNG_EAST - UK_LNG_WEST)) * SVG_WIDTH;
  const y = ((UK_LAT_NORTH - lat) / (UK_LAT_NORTH - UK_LAT_SOUTH)) * SVG_HEIGHT;
  return { x, y };
}

const UK_OUTLINE = `M 215,380 L 220,370 225,360 230,345 228,335 220,325 215,315 218,305 
  225,295 230,285 222,275 215,265 210,255 215,245 220,235 225,225 
  218,215 210,205 205,195 200,185 195,175 190,165 185,160 180,155 
  175,150 170,145 168,140 172,130 178,120 185,110 190,100 188,90 
  180,82 175,75 168,70 160,65 155,60 148,58 140,55 135,50 130,48 
  128,45 132,40 138,35 142,32 148,30 155,28 160,32 168,38 172,42 
  178,48 185,50 190,48 195,42 192,35 188,30 182,25 178,22 172,20 
  165,18 158,15 150,12 142,10 135,12 128,15 120,18 115,22 110,28 
  105,35 100,42 95,48 90,55 88,62 85,70 80,78 78,85 75,92 
  72,100 70,108 68,115 65,122 62,128 60,135 58,140 55,148 52,155 
  50,162 48,170 52,178 55,185 58,190 62,195 65,200 68,208 72,215 
  75,222 80,228 85,235 88,240 92,248 95,255 100,260 105,268 110,275 
  115,280 120,288 125,295 130,300 135,308 140,315 145,320 150,328 
  155,335 160,340 165,348 170,355 175,360 180,365 185,370 190,372 
  195,375 200,378 205,380 210,380 215,380 Z`;

const IRELAND_OUTLINE = `M 45,180 L 50,170 55,162 52,155 48,148 42,142 38,135 35,128 
  32,122 28,118 25,125 22,132 20,140 18,148 20,155 22,162 25,170 
  28,178 32,185 35,190 38,195 42,200 45,205 48,210 52,205 55,198 
  52,192 48,188 45,180 Z`;

export default function UKDriverMap({ drivers }: UKDriverMapProps) {
  const [hoveredDriver, setHoveredDriver] = useState<OnShiftDriver | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (drivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="map-empty-state">
        <MapPin className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">No drivers currently on shift</p>
        <p className="text-sm text-slate-400 mt-1">Driver locations will appear here when they clock in</p>
      </div>
    );
  }

  return (
    <div className="relative flex justify-center" data-testid="uk-driver-map">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full"
        style={{ maxHeight: '300px' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="white" />

        <path
          d={UK_OUTLINE}
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
        <path
          d={IRELAND_OUTLINE}
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        <style>{`
          @keyframes pulse-dot {
            0% { r: 4; opacity: 1; }
            50% { r: 7; opacity: 0.5; }
            100% { r: 4; opacity: 1; }
          }
        `}</style>

        {drivers.map((driver) => {
          const lat = parseFloat(driver.latitude);
          const lng = parseFloat(driver.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          const { x, y } = latLngToSvg(lat, lng);
          return (
            <g key={driver.driverId}>
              <circle
                cx={x}
                cy={y}
                r="7"
                fill="#22c55e"
                opacity="0.3"
                style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
              />
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#22c55e"
                stroke="white"
                strokeWidth="1.5"
                className="cursor-pointer"
                onMouseEnter={() => {
                  setHoveredDriver(driver);
                  setTooltipPos({ x, y });
                }}
                onMouseLeave={() => setHoveredDriver(null)}
                data-testid={`driver-dot-${driver.driverId}`}
              />
            </g>
          );
        })}
      </svg>

      {hoveredDriver && (
        <div
          className="absolute bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none z-10 whitespace-nowrap"
          style={{
            left: `${(tooltipPos.x / SVG_WIDTH) * 100}%`,
            top: `${(tooltipPos.y / SVG_HEIGHT) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
          data-testid="driver-tooltip"
        >
          <p className="font-semibold">{hoveredDriver.driverName}</p>
          <p className="text-slate-300 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {hoveredDriver.depotName}
          </p>
          <p className="text-slate-300 flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {new Date(hoveredDriver.arrivalTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
}
