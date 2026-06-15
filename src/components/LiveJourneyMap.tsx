import React, { useEffect, useState, useRef } from 'react';
import { Map, useMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  CloudSun, 
  Car, 
  Bike, 
  Bus, 
  Footprints, 
  Navigation,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Layers
} from 'lucide-react';

interface Coords {
  lat: number;
  lng: number;
}

interface RouteOption {
  id: string;
  name: string;
  durationMin: number;
  distanceKm: number;
  path: Coords[];
  summaryText: string;
}

interface LiveJourneyMapProps {
  apiKey: string;
  hasValidKey: boolean;
  pickupName: string;
  dropName: string;
  pickupCoords: Coords;
  dropCoords: Coords;
  distanceKm: number;
  weatherAtPickup?: string;
  weatherAtDrop?: string;
  speedbreakers?: Array<{ id: string; name: string; position: Coords }>;
  heavyTrafficSegments?: Array<{ id: string; position: Coords }>;
  onRouteSelect?: (distanceKm: number, durationMin: number) => void;
}

// ---------------------------------------------------------
// Custom Google Maps Traffic Layer Component
// ---------------------------------------------------------
function TrafficLayerComponent() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    return () => {
      trafficLayer.setMap(null);
    };
  }, [map]);
  return null;
}

// ---------------------------------------------------------
// Custom Bezier Curve generator for mock routes inside Coimbatore / Sandbox
// ---------------------------------------------------------
const getSimulatedBezierRoute = (start: Coords, end: Coords, offsetRatio: number, count = 30): Coords[] => {
  const points: Coords[] = [];
  const midX = (start.lat + end.lat) / 2;
  const midY = (start.lng + end.lng) / 2;
  
  // Perpendicular vector for offset
  const dx = end.lat - start.lat;
  const dy = end.lng - start.lng;
  const perpX = -dy * offsetRatio;
  const perpY = dx * offsetRatio;
  
  const controlPoint = {
    lat: midX + perpX,
    lng: midY + perpY
  };

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * controlPoint.lat + t * t * end.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * controlPoint.lng + t * t * end.lng;
    points.push({ lat, lng });
  }
  return points;
};

// Gets visual node halfway down the path for placing route tags
const getMiddlePoint = (path: Coords[]): Coords => {
  if (path.length === 0) return { lat: 0, lng: 0 };
  const midIndex = Math.floor(path.length * 0.45);
  return path[midIndex];
};

// ---------------------------------------------------------
// COMPONENT: InteractiveRoutesRenderer
// Handles drawing and selecting routes directly on Google Maps
// ---------------------------------------------------------
function InteractiveRoutesRenderer({
  routes,
  activeIndex,
  onSelect
}: {
  routes: RouteOption[];
  activeIndex: number;
  onSelect: (idx: number) => void;
}) {
  const map = useMap();
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || routes.length === 0) return;

    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    routes.forEach((route, idx) => {
      const isActive = idx === activeIndex;
      const polyline = new google.maps.Polyline({
        path: route.path,
        geodesic: true,
        strokeColor: isActive ? '#312e81' : '#cbd5e1', // Bold Indigo dark-blue for selected, simple slate for alternates
        strokeOpacity: isActive ? 0.95 : 0.65,
        strokeWeight: isActive ? 6 : 4,
        zIndex: isActive ? 100 : 50,
        clickable: true
      });

      polyline.setMap(map);

      // Listener for polyline selection directly by tapping map line
      google.maps.event.addListener(polyline, 'click', () => {
        onSelect(idx);
      });

      polylinesRef.current.push(polyline);
      route.path.forEach(pt => bounds.extend(pt));
    });

    // Fit map bounds with clean padding
    map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [map, routes, activeIndex, onSelect]);

  return null;
}

// ---------------------------------------------------------
// COMPONENT: GoogleMapInnerContent
// Hooks calling map interactions must be separated from the outer component
// ---------------------------------------------------------
function GoogleMapInnerContent({
  pickupCoords,
  dropCoords,
  distanceKm,
  routes,
  setRoutes,
  activeRouteIndex,
  setActiveRouteIndex,
  onRouteSelect,
  weatherAtPickup,
  weatherAtDrop,
  speedbreakers,
  heavyTrafficSegments,
  handleSelectRoute
}: {
  pickupCoords: Coords;
  dropCoords: Coords;
  distanceKm: number;
  routes: RouteOption[];
  setRoutes: React.Dispatch<React.SetStateAction<RouteOption[]>>;
  activeRouteIndex: number;
  setActiveRouteIndex: React.Dispatch<React.SetStateAction<number>>;
  onRouteSelect?: (distanceKm: number, durationMin: number) => void;
  weatherAtPickup: string;
  weatherAtDrop: string;
  speedbreakers: Array<{ id: string; name: string; position: Coords }>;
  heavyTrafficSegments: Array<{ id: string; position: Coords }>;
  handleSelectRoute: (idx: number) => void;
}) {
  const mapInstance = useMap();
  const lastCoordsKey = useRef('');

  useEffect(() => {
    if (!window.google || !mapInstance) return;

    const coordsHash = `${pickupCoords.lat},${pickupCoords.lng}|${dropCoords.lat},${dropCoords.lng}`;
    if (lastCoordsKey.current === coordsHash) return;
    lastCoordsKey.current = coordsHash;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: pickupCoords,
        destination: dropCoords,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      },
      (result, status) => {
        if (status === 'OK' && result && result.routes && result.routes.length > 0) {
          const fetchedRoutes: RouteOption[] = result.routes.map((r, idx) => {
            const leg = r.legs?.[0];
            const dist = leg?.distance?.value ? Number((leg.distance.value / 1000).toFixed(2)) : distanceKm;
            const dur = leg?.duration?.value ? Number((leg.duration.value / 60).toFixed(1)) : Math.round(distanceKm * 2.1);
            const pathPoints = r.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
            
            return {
              id: `route-${idx}`,
              name: r.summary ? `via ${r.summary}` : `Route Choice #${idx + 1}`,
              durationMin: Math.round(dur),
              distanceKm: dist,
              path: pathPoints,
              summaryText: idx === 0 ? "Fastest route now due to traffic conditions" : "Alternative path option"
            };
          });

          setRoutes(fetchedRoutes);
          setActiveRouteIndex(0);

          // Notify parent of the first optimal Google route metrics
          if (fetchedRoutes[0] && onRouteSelect) {
            onRouteSelect(fetchedRoutes[0].distanceKm, fetchedRoutes[0].durationMin);
          }
        }
      }
    );
  }, [pickupCoords, dropCoords, mapInstance, distanceKm, onRouteSelect, setRoutes, setActiveRouteIndex]);

  const activeRoute = routes[activeRouteIndex];
  if (!activeRoute) return null;

  return (
    <div className="w-full h-full relative" id="gmp-canvas-frame">
      {/* Dynamic traffic layer / custom paths */}
      <TrafficLayerComponent />
      
      <InteractiveRoutesRenderer 
        routes={routes} 
        activeIndex={activeRouteIndex} 
        onSelect={handleSelectRoute} 
      />

      {/* Start / Pickup Pin */}
      <AdvancedMarker position={pickupCoords} title="Pickup Location">
        <div className="flex flex-col items-center">
          <div className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 shadow-sm mb-1 whitespace-nowrap flex items-center gap-1">
            <CloudSun className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>{weatherAtPickup}</span>
          </div>
          <Pin background="#10b981" glyphColor="#ffffff" borderColor="#047857" scale={1.1} />
        </div>
      </AdvancedMarker>

      {/* Destination Pin */}
      <AdvancedMarker position={dropCoords} title="Destination Location">
        <div className="flex flex-col items-center">
          <div className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-200 shadow-sm mb-1 whitespace-nowrap flex items-center gap-1">
            <CloudSun className="w-3 h-3 text-rose-600 shrink-0" />
            <span>{weatherAtDrop}</span>
          </div>
          <Pin background="#ef4444" glyphColor="#ffffff" borderColor="#b91c1c" scale={1.1} />
        </div>
      </AdvancedMarker>

      {/* Midpoint flags on alternative lines for clicking */}
      {routes.map((rt, idx) => {
        const isSelected = idx === activeRouteIndex;
        const labelPinCoords = getMiddlePoint(rt.path);
        return (
          <AdvancedMarker key={`label-pin-${idx}`} position={labelPinCoords}>
            <button
              type="button"
              onClick={() => handleSelectRoute(idx)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono border shadow-md transition-all duration-200 ${
                isSelected 
                  ? 'bg-slate-900 border-indigo-500 text-[#00C896] scale-110 font-bold' 
                  : 'bg-white border-slate-300 text-slate-700 hover:scale-105 hover:bg-slate-50'
              }`}
            >
              {rt.durationMin} min
            </button>
          </AdvancedMarker>
        );
      })}

      {/* Speedbreakers detection markers */}
      {speedbreakers.map(sb => (
        <AdvancedMarker key={sb.id} position={sb.position} title={`Speedbreaker: ${sb.name}`}>
          <div className="w-4 h-4 bg-amber-500 rounded-full border border-white flex items-center justify-center text-[9px] shadow shadow-amber-500/50 cursor-pointer hover:scale-110 transition duration-200">
            ⚠️
          </div>
        </AdvancedMarker>
      ))}

      {/* Heavy Congestion indicator symbols */}
      {heavyTrafficSegments.map(seg => (
        <AdvancedMarker key={seg.id} position={seg.position} title="Heavy Congested segment">
          <div className="w-4.5 h-4.5 bg-red-600 rounded-md border border-white flex items-center justify-center text-[10px] shadow animate-pulse">
            🚗
          </div>
        </AdvancedMarker>
      ))}
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: GoogleMapWithDirections
// Safe loading wrapper around Map
// ---------------------------------------------------------
function GoogleMapWithDirections({
  pickupCoords,
  dropCoords,
  distanceKm,
  routes,
  setRoutes,
  activeRouteIndex,
  setActiveRouteIndex,
  onRouteSelect,
  weatherAtPickup,
  weatherAtDrop,
  speedbreakers,
  heavyTrafficSegments,
  mapStyle,
  handleSelectRoute
}: {
  pickupCoords: Coords;
  dropCoords: Coords;
  distanceKm: number;
  routes: RouteOption[];
  setRoutes: React.Dispatch<React.SetStateAction<RouteOption[]>>;
  activeRouteIndex: number;
  setActiveRouteIndex: React.Dispatch<React.SetStateAction<number>>;
  onRouteSelect?: (distanceKm: number, durationMin: number) => void;
  weatherAtPickup: string;
  weatherAtDrop: string;
  speedbreakers: Array<{ id: string; name: string; position: Coords }>;
  heavyTrafficSegments: Array<{ id: string; position: Coords }>;
  mapStyle: 'standard' | 'satellite';
  handleSelectRoute: (idx: number) => void;
}) {
  const mapCenter = { lat: 11.0168, lng: 76.9558 }; // Center in Coimbatore, Tamil Nadu
  const mapType = mapStyle === 'satellite' ? 'satellite' : 'roadmap';

  return (
    <div className="w-full h-full bg-slate-900">
      <Map
        defaultCenter={mapCenter}
        defaultZoom={12}
        mapId="DEMO_MAP_ID"
        mapTypeId={mapType}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        gestureHandling="cooperative"
        disableDefaultUI={false}
      >
        <GoogleMapInnerContent
          pickupCoords={pickupCoords}
          dropCoords={dropCoords}
          distanceKm={distanceKm}
          routes={routes}
          setRoutes={setRoutes}
          activeRouteIndex={activeRouteIndex}
          setActiveRouteIndex={setActiveRouteIndex}
          onRouteSelect={onRouteSelect}
          weatherAtPickup={weatherAtPickup}
          weatherAtDrop={weatherAtDrop}
          speedbreakers={speedbreakers}
          heavyTrafficSegments={heavyTrafficSegments}
          handleSelectRoute={handleSelectRoute}
        />
      </Map>
    </div>
  );
}

// ---------------------------------------------------------
// MASTER VIEW EXPORT (React-component totally free of direct Maps hooks)
// ---------------------------------------------------------
export default function LiveJourneyMap({
  apiKey,
  hasValidKey,
  pickupName,
  dropName,
  pickupCoords,
  dropCoords,
  distanceKm,
  weatherAtPickup = "Clear Sky",
  weatherAtDrop = "Clear Sky",
  speedbreakers = [],
  heavyTrafficSegments = [],
  onRouteSelect
}: LiveJourneyMapProps) {
  
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeTravelMode, setActiveTravelMode] = useState<'motorcycle' | 'car' | 'bus' | 'walk'>('motorcycle');
  const [mapStyleVersion, setMapStyleVersion] = useState<'standard' | 'satellite'>('standard');

  // Generate simulated route options in Sandbox Mode OR when coordinates calculate
  useEffect(() => {
    const isCoimbatore = String(pickupName).toLowerCase().includes('gandhipuram') || String(dropName).toLowerCase().includes('ukkadam');
    
    // Simulate beautiful Bezier roads curvy offsets mirroring Google's route planner
    const opt1Points = getSimulatedBezierRoute(pickupCoords, dropCoords, 0.08);
    const opt2Points = getSimulatedBezierRoute(pickupCoords, dropCoords, -0.12);
    const opt3Points = getSimulatedBezierRoute(pickupCoords, dropCoords, 0.22);

    const baseDistance = distanceKm > 0 ? distanceKm : 4.3;
    const baseDuration = Math.round(baseDistance * 2.1) || 13;

    // calibrate route distances & names to match Coimbatore image exactly if searched
    const route1Name = isCoimbatore 
      ? "via Nagapattinam - Coimbatore - Gundlupet Hwy"
      : "via Main Boulevard Transit Hwy";
    const route2Name = isCoimbatore
      ? "via NH 948"
      : "via Express Link Road Segment";
    const route3Name = isCoimbatore
      ? "via Sastri Rd and Cross Cut Rd"
      : "via Secondary Arterial Bypass";

    const simulatedRoutes: RouteOption[] = [
      {
        id: 'route-0',
        name: route1Name,
        durationMin: baseDuration,
        distanceKm: baseDistance,
        path: opt1Points,
        summaryText: "Fastest route now due to premium traffic conditions"
      },
      {
        id: 'route-1',
        name: route2Name,
        durationMin: Math.round(baseDuration * 1.3),
        distanceKm: Number((baseDistance * 1.05).toFixed(2)),
        path: opt2Points,
        summaryText: "Alternative highway option, moderate vehicle levels"
      },
      {
        id: 'route-2',
        name: route3Name,
        durationMin: Math.round(baseDuration * 1.6),
        distanceKm: Number((baseDistance * 1.15).toFixed(2)),
        path: opt3Points,
        summaryText: "Avoids major city signals, slightly higher toll radius"
      }
    ];

    setRoutes(simulatedRoutes);
    setActiveRouteIndex(0);
  }, [pickupCoords, dropCoords, distanceKm, pickupName, dropName]);

  // Handler update when route transitions trigger
  const handleSelectRoute = (idx: number) => {
    if (!routes[idx]) return;
    setActiveRouteIndex(idx);
    if (onRouteSelect) {
      onRouteSelect(routes[idx].distanceKm, routes[idx].durationMin);
    }
  };

  const activeRoute = routes[activeRouteIndex];

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden bg-slate-900" id="google-route-integration-panel">
      
      {/* ------------------------------------------------------------- */}
      {/* BACKGROUND LAYER: Interactive Map Display (Google Map or Sandbox) */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 z-0 bg-slate-950 flex flex-col" id="gmp-map-shell">
        
        {/* Floating layers controller */}
        <div className="absolute top-6 right-5 z-20 flex gap-2">
          <button
            type="button"
            onClick={() => setMapStyleVersion(prev => prev === 'standard' ? 'satellite' : 'standard')}
            className="flex items-center gap-1 bg-white/90 backdrop-blur hover:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 shadow-md cursor-pointer transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="capitalize">{mapStyleVersion}</span>
          </button>
        </div>

        {hasValidKey ? (
          // REAL LIVE GOOGLE MAPS RENDERING
          <div className="w-full h-full">
            <GoogleMapWithDirections
              pickupCoords={pickupCoords}
              dropCoords={dropCoords}
              distanceKm={distanceKm}
              routes={routes}
              setRoutes={setRoutes}
              activeRouteIndex={activeRouteIndex}
              setActiveRouteIndex={setActiveRouteIndex}
              onRouteSelect={onRouteSelect}
              weatherAtPickup={weatherAtPickup}
              weatherAtDrop={weatherAtDrop}
              speedbreakers={speedbreakers}
              heavyTrafficSegments={heavyTrafficSegments}
              mapStyle={mapStyleVersion}
              handleSelectRoute={handleSelectRoute}
            />
          </div>
        ) : (
          // ELEGANT SANDBOX VECTOR EMBED SIMULATING COIMBATORE PATHWAY MAP
          <div className="w-full h-full relative overflow-hidden flex flex-col justify-between p-4" id="sandbox-map-canvas">
            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:18px_18px] opacity-20 z-0"></div>
            
            {/* Satellite effect overlay if toggled */}
            {mapStyleVersion === 'satellite' && (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1e1b4b,#020617)] opacity-90 mix-blend-color-burn z-0"></div>
            )}

            {/* Sandbox overlay label */}
            <div className="relative z-10 flex items-center justify-between select-none pt-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
                <span className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-widest leading-tight">Sandbox GPS</span>
              </div>
            </div>

            {/* Simulated Vector Polyline Routing */}
            <div className="relative flex-1 flex items-center justify-center p-4 min-h-[250px]">
              <div className="relative w-full h-full max-w-sm mx-auto flex items-center justify-center">
                
                {/* Simulated Street-path Bezier overlay SVG */}
                <svg className="absolute inset-0 w-full h-full select-none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                  {routes.map((rt, idx) => {
                    const isSelected = idx === activeRouteIndex;
                    const strokeStyle = isSelected 
                      ? "#6366f1" // Deep royal indigo
                      : "rgba(148, 163, 184, 0.28)"; // Subtle light gray for alternate roads

                    // Adjusted curve layouts to fit standard viewBox
                    const pathD = idx === 0 
                      ? "M 100 100 Q 200 200 300 150" 
                      : idx === 1 
                        ? "M 100 100 Q 200 50 300 150" 
                        : "M 100 100 Q 200 300 300 150";

                    return (
                      <g key={`sim-group-${idx}`}>
                        <path
                          d={pathD}
                          fill="none"
                          stroke={strokeStyle}
                          strokeWidth={isSelected ? "6" : "4"}
                          className="cursor-pointer transition-all duration-350 hover:stroke-indigo-400"
                          onClick={() => handleSelectRoute(idx)}
                        />
                        {isSelected && (
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            className="animate-[dash_10s_linear_infinite]"
                          />
                        )}
                      </g>
                    );
                  })}
                  
                  <style>{`
                    @keyframes dash {
                      to {
                        stroke-dashoffset: -100;
                      }
                    }
                  `}</style>
                </svg>

                {/* Pickup node (Point A) */}
                <div className="absolute left-[20%] top-[20%] flex flex-col items-center z-15">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500 flex items-center justify-center shadow shadow-emerald-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 truncate max-w-[80px] mt-1 text-center bg-slate-900/60 px-1 rounded">
                    {pickupName.split(',')[0] || 'Pickup'}
                  </span>
                </div>

                {/* Simulated Midpoint labels on Bezier curves */}
                {routes.map((rt, idx) => {
                  const isSelected = idx === activeRouteIndex;
                  const labelStyle = idx === 0
                    ? { left: '46%', top: '51%' }
                    : idx === 1
                      ? { left: '46%', top: '22%' }
                      : { left: '46%', top: '65%' };

                  return (
                    <button
                      key={`mock-label-${idx}`}
                      type="button"
                      onClick={() => handleSelectRoute(idx)}
                      style={labelStyle}
                      className={`absolute px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border shadow transition-all duration-200 z-20 ${
                        isSelected 
                          ? 'bg-slate-900 border-[#00C896] text-[#00C896] scale-110 font-bold' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:scale-105'
                      }`}
                    >
                      {rt.durationMin}m
                    </button>
                  );
                })}

                {/* Destination node (Point B) */}
                <div className="absolute right-[20%] top-[35%] flex flex-col items-center z-15">
                  <div className="w-7 h-7 rounded-full bg-rose-500/15 border border-rose-500 flex items-center justify-center shadow shadow-rose-500/20">
                    <MapPin className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 truncate max-w-[80px] mt-1 text-center bg-slate-900/60 px-1 rounded">
                    {dropName.split(',')[0] || 'Drop'}
                  </span>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM-RIGHT FLOATING CARD: Directions & Alternate Routes  */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute overflow-hidden bottom-4 left-4 right-4 lg:left-auto lg:bottom-6 lg:right-6 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex flex-col w-auto lg:w-full lg:max-w-[340px] max-h-[50%] lg:max-h-[70%] border border-slate-200/80">
        
        {/* Pull Handle (Hidden on Desktop, keeping for structural size if needed or just padding) */}
        <div className="w-full h-2 shrink-0 bg-indigo-600/10"></div>

        <div className="p-4 overflow-y-auto space-y-4">
          
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
            {[
              { id: 'car', icon: Car, label: 'Taxi' },
              { id: 'motorcycle', icon: Bike, label: 'Bike' }
            ].map(mode => {
              const Icon = mode.icon;
              const isSelected = activeTravelMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveTravelMode(mode.id as any)}
                  className={`flex items-center justify-center py-2.5 rounded-lg gap-1.5 transition ${
                    isSelected 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'hover:bg-slate-200/50 text-slate-600 font-semibold'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] truncate font-bold leading-none">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Source and Destination inputs overview */}
          <div className="relative p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
            <div className="absolute left-[21px] top-6 bottom-6 w-[2px] bg-slate-200 border-l border-dashed border-slate-300"></div>
            
            {/* Source */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"></div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-slate-800 truncate block">{pickupName || 'Gandhipuram Bus Stand'}</span>
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"></div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-slate-800 truncate block">{dropName || 'Ukkadam Bus Stand'}</span>
              </div>
            </div>
          </div>

          {/* List of Alternate Route Choices */}
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {routes.map((rt, idx) => {
              const isSelected = idx === activeRouteIndex;
              return (
                <div
                  key={rt.id}
                  onClick={() => handleSelectRoute(idx)}
                  className={`p-3 border rounded-xl cursor-pointer transition flex justify-between items-center ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-50/30' 
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 pr-2 flex-1">
                    <h5 className="text-[11px] font-bold text-slate-800 block">{rt.name}</h5>
                    <p className="text-[9px] text-slate-400 group-hover:text-slate-500 truncate">{rt.summaryText}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-indigo-600 block">{rt.durationMin} min</span>
                    <span className="text-[10px] font-semibold text-slate-500">{rt.distanceKm} km</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
