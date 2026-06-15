import React, { useState, useEffect, useRef } from 'react';
import { 
  Bike, 
  MapPin, 
  CircleDot, 
  UserCheck, 
  User, 
  Gauge, 
  Activity, 
  Play, 
  Pause, 
  Check, 
  X,
  AlertTriangle,
  Radio,
  Clock,
  Coins,
  ShieldAlert
} from 'lucide-react';
import { Ride } from '../types';

interface DriverConsoleViewProps {
  activeRide: Ride | null;
  onAcceptRide: (id: string) => Promise<void>;
  onSendTelemetry: (id: string, data: any) => Promise<void>;
  onCompleteRide: (id: string) => Promise<void>;
  onRefresh: () => void;
  systemConfig: {
    weather: string;
    traffic: string;
  };
}

export default function DriverConsoleView({
  activeRide,
  onAcceptRide,
  onSendTelemetry,
  onCompleteRide,
  onRefresh,
  systemConfig
}: DriverConsoleViewProps) {
  const [speed, setSpeed] = useState<number>(0);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  
  const [ignition, setIgnition] = useState<'on' | 'off'>('on');
  const [seat, setSeat] = useState<'empty' | 'occupied'>('empty');
  const [nfc, setNfc] = useState<'active' | 'inactive'>('inactive');
  const [motion, setMotion] = useState<'stationary' | 'moving' | 'riding' | 'braking'>('stationary');

  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state values from active ride on mount/update
  useEffect(() => {
    if (activeRide) {
      setSimulationProgress(activeRide.progress);
      setSpeed(activeRide.speed);
      setIgnition(activeRide.ignition);
      setSeat(activeRide.seat);
      setNfc(activeRide.nfc);
      setMotion(activeRide.motion);
    } else {
      setIsAutoSimulating(false);
      setSimulationProgress(0);
      setSpeed(0);
    }
  }, [activeRide]);

  // Handle Automatic Trajectory Simulation
  useEffect(() => {
    if (isAutoSimulating && activeRide) {
      simulationIntervalRef.current = setInterval(async () => {
        setSimulationProgress((prev) => {
          const nextProgress = Math.min(100, prev + 5);
          
          let nextSpeed = speed > 0 ? speed : (30 + Math.floor(Math.random() * 20));
          let nextMotion: any = 'moving';
          let nextSeat = seat;
          let nextNfc = nfc;

          // Align statuses safely during progressive locations
          if (nextProgress > 0 && nextProgress < 25) {
            nextSeat = 'empty';
            nextNfc = 'inactive';
            nextMotion = 'moving';
          } else if (nextProgress >= 25 && nextProgress < 100) {
            nextSeat = 'occupied';
            nextNfc = 'active';
            nextMotion = 'riding';
          } else if (nextProgress >= 100) {
            nextSeat = 'empty';
            nextNfc = 'inactive';
            nextMotion = 'stationary';
            nextSpeed = 0;
            setIsAutoSimulating(false);
          }

          // Calculate offset Mumbai coordinates from pickup toward drop
          // Baseline lat around 19.0760, Lng 72.8777
          const latStep = 0.00015 * nextProgress;
          const lngStep = 0.0001 * nextProgress;
          const gpsLat = 19.0760 + latStep;
          const gpsLng = 72.8777 + lngStep;

          onSendTelemetry(activeRide.id, {
            gpsLat,
            gpsLng,
            speed: nextSpeed,
            ignition: 'on',
            seat: nextSeat,
            motion: nextMotion,
            nfc: nextNfc,
            progress: nextProgress
          });

          return nextProgress;
        });
      }, 2000);
    } else {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    }

    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [isAutoSimulating, activeRide, speed, seat, nfc]);

  const handleManualTelemetryUpdate = (updatedFields: any) => {
    if (!activeRide) return;
    
    const latStep = 0.00015 * simulationProgress;
    const lngStep = 0.0001 * simulationProgress;
    const gpsLat = 19.0760 + latStep;
    const gpsLng = 72.8777 + lngStep;

    onSendTelemetry(activeRide.id, {
      gpsLat,
      gpsLng,
      speed,
      ignition,
      seat,
      motion,
      nfc,
      progress: simulationProgress,
      ...updatedFields
    });
  };

  const triggerHarshBrakingSimulation = () => {
    if (!activeRide) return;
    setSpeed(Math.max(0, speed - 25));
    setMotion('braking');
    handleManualTelemetryUpdate({
      speed: Math.max(0, speed - 25),
      motion: 'braking',
      triggerHarshBrake: true
    });
  };

  const getLimits = (weather: string) => {
    switch (weather) {
      case 'Overcast': return 75;
      case 'High Winds': return 65;
      case 'Heavy Rain': return 60;
      case 'Monsoon Storm': return 50;
      default: return 80;
    }
  };

  const currentSpeedLimit = getLimits(activeRide ? activeRide.weatherType : systemConfig.weather);

  return (
    <div className="space-y-6">
      
      {/* Driver metadata card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-emerald">
            <User className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Rajesh Kumar (Driver)</h3>
            <p className="text-xs font-mono text-slate-500 flex items-center gap-1">
              <Bike className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
              <span>BIKE-MH12-AB-1234 • Rated 4.8★</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/10 px-4 py-2 rounded-full text-xs font-bold">
          <Radio className="w-4 h-4 animate-ping shrink-0" />
          <span>Driver Shift: ACTIVE</span>
        </div>
      </div>

      {/* RIDE REQUEST BLOCK (WAITING FOR ORDER) */}
      {!activeRide && (
        <div className="bg-white border border-slate-200 rounded-2xl py-12 px-6 text-center max-w-xl mx-auto flex flex-col items-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-4 animate-pulse">
            <Radio className="w-8 h-8 text-brand-emerald" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Awaiting Booking Broadcast...</h3>
          <p className="text-xs text-slate-400 max-w-[340px] mt-1 mb-5">Ensure your shift toggle remains active. Any rider creating a booking on Mumbai locations will prompt on this screen.</p>
          <button 
            onClick={onRefresh}
            className="px-5 py-2.5 bg-brand-emerald hover:bg-brand-emerald-dark font-semibold text-white rounded-xl text-xs shadow-sm transition"
          >
            Refresh Feed Link
          </button>
        </div>
      )}

      {/* ACTIVE JOB PRESENT */}
      {activeRide && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Job Dispatch Info / Navigation Controller */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-bold leading-none uppercase">Assigned Ride ID</span>
                <span className="text-base font-mono font-bold text-slate-800 mt-1 block">{activeRide.id}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                activeRide.status === 'booked' ? 'bg-orange-50 text-orange-600' :
                activeRide.status === 'assigned' ? 'bg-blue-50 text-blue-600' :
                activeRide.status === 'pickup' ? 'bg-indigo-50 text-indigo-600' :
                activeRide.status === 'en_route' ? 'bg-emerald-50 text-brand-emerald' : 'bg-rose-50 text-rose-600'
              }`}>
                {activeRide.status}
              </span>
            </div>

            {/* If order is newly booked, show accepting CTA card */}
            {activeRide.status === 'booked' ? (
              <div className="p-4 bg-orange-50/50 border border-orange-200 text-center rounded-2xl space-y-3.5">
                <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto animate-bounce" />
                <h4 className="font-bold text-slate-800 text-sm">Incoming Taxi Command!</h4>
                <div className="text-[11px] text-slate-500 font-semibold space-y-1">
                  <div>📍 <strong>From:</strong> {activeRide.pickup}</div>
                  <div>📍 <strong>To:</strong> {activeRide.drop}</div>
                  <div>💰 <strong>Fare:</strong> ₹{activeRide.initialFare.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => onAcceptRide(activeRide.id)}
                  className="w-full bg-brand-emerald hover:bg-brand-emerald-dark font-bold text-white text-xs py-3 rounded-xl shadow transition mt-2"
                >
                  Accept & Assign Shift
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Simulated Path Locations */}
                <div className="space-y-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 text-xs text-slate-600 font-semibold">
                  <div className="flex gap-2.5 items-start">
                    <CircleDot className="w-4 h-4 text-brand-emerald mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Pickup Origin</span>
                      <p className="mt-0.5 text-slate-700">{activeRide.pickup}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start border-t border-slate-200/50 pt-2.5">
                    <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Transit Destination</span>
                      <p className="mt-0.5 text-slate-700">{activeRide.drop}</p>
                    </div>
                  </div>
                </div>

                {/* Automation trigger progress */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Progress Trajectory</span>
                    <span className="font-mono">{simulationProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-emerald transition-all duration-300"
                      style={{ width: `${simulationProgress}%` }}
                    />
                  </div>

                  <div className="flex gap-2Pt">
                    <button
                      type="button"
                      onClick={() => setIsAutoSimulating(!isAutoSimulating)}
                      className={`flex-1 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition text-white ${
                        isAutoSimulating ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand-emerald hover:bg-brand-emerald-dark'
                      }`}
                    >
                      {isAutoSimulating ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Drive</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Auto Drive</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Final complete triggers */}
                {simulationProgress >= 100 && activeRide.status !== 'completed' && (
                  <button
                    onClick={() => onCompleteRide(activeRide.id)}
                    className="w-full bg-slate-900 text-white hover:bg-black font-extrabold py-3.5 text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all duration-150 border-t"
                  >
                    <Check className="w-4 h-4" />
                    <span>Complete Ride & Lock Fare</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Core Telemetry Simulators Form (LG Col 8) */}
          {activeRide.status !== 'booked' && (
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-emerald" />
                  <h4 className="font-bold text-slate-800 text-sm">Hardware Sensor Telemetry Board</h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">STREAMING ACTIVE</span>
              </div>

              {/* Behavior parameters sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Speed Slider Parameter */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-brand-emerald shrink-0" />
                      Dynamic Bike Speed
                    </span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${speed > currentSpeedLimit ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                      {speed} km/h
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="110"
                    value={speed}
                    onChange={(e) => {
                      const newSpeed = Number(e.target.value);
                      setSpeed(newSpeed);
                      handleManualTelemetryUpdate({ speed: newSpeed });
                    }}
                    className="w-full accent-brand-emerald h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  
                  <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-slate-400">
                    <span>Weather Speed Limit: <strong>{currentSpeedLimit} km/h</strong></span>
                    {speed > currentSpeedLimit && (
                      <span className="text-rose-500 font-bold">💥 Exceeds safe limit! (Fare will discount)</span>
                    )}
                  </div>
                </div>

                {/* Harsh Braking simulator trigger */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                      Unsafe Braking Event
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                      Trigger sudden deceleration sensor reading. This applies harsh-braking rules, deducts ₹10.00 from final client cost, and updates safety score metrics.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={triggerHarshBrakingSimulation}
                    className="w-full bg-yellow-400 text-slate-900 border border-yellow-400 hover:bg-yellow-500 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Abruptly Slam Brakes</span>
                  </button>
                </div>

              </div>

              {/* Auxiliary Sensor Toggles (Seat, NFC, Ignition) */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-3">Auxiliary Embedded Hardware Status</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Select Ignition */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Ignition State</span>
                    <div className="flex justify-center gap-1">
                      <button 
                        type="button"
                        onClick={() => { setIgnition('on'); handleManualTelemetryUpdate({ ignition: 'on' }); }}
                        className={`px-2 py-1 text-[10px] font-mono rounded font-bold ${ignition === 'on' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        ON
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setIgnition('off'); handleManualTelemetryUpdate({ ignition: 'off' }); }}
                        className={`px-2 py-1 text-[10px] font-mono rounded font-bold ${ignition === 'off' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>

                  {/* Select Seat status */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Seat sensor</span>
                    <div className="flex justify-center gap-1 font-mono">
                      <button 
                        type="button"
                        onClick={() => { setSeat('occupied'); handleManualTelemetryUpdate({ seat: 'occupied' }); }}
                        className={`px-1.5 py-1 text-[9px] rounded font-bold ${seat === 'occupied' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        BUSY
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setSeat('empty'); handleManualTelemetryUpdate({ seat: 'empty' }); }}
                        className={`px-1.5 py-1 text-[9px] rounded font-bold ${seat === 'empty' ? 'bg-slate-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        EMPTY
                      </button>
                    </div>
                  </div>

                  {/* Select NFC status */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Helmet NFC Link</span>
                    <div className="flex justify-center gap-1 font-mono">
                      <button 
                        type="button"
                        onClick={() => { setNfc('active'); handleManualTelemetryUpdate({ nfc: 'active' }); }}
                        className={`px-1.5 py-1 text-[9px] rounded font-bold ${nfc === 'active' ? 'bg-brand-emerald text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        LINK
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setNfc('inactive'); handleManualTelemetryUpdate({ nfc: 'inactive' }); }}
                        className={`px-1.5 py-1 text-[9px] rounded font-bold ${nfc === 'inactive' ? 'bg-slate-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        NULL
                      </button>
                    </div>
                  </div>

                  {/* Motion state select */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold text-center block">Motion Tag</span>
                    <select
                      value={motion}
                      onChange={(e) => {
                        const mVal = e.target.value as any;
                        setMotion(mVal);
                        handleManualTelemetryUpdate({ motion: mVal });
                      }}
                      className="bg-white border border-slate-200 rounded font-mono text-[10px] py-1 px-1 text-slate-700 outline-none w-full"
                    >
                      <option value="stationary">stationary</option>
                      <option value="moving">moving</option>
                      <option value="riding">riding</option>
                      <option value="braking">braking</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic bill status in real-time */}
              <div className="p-4 bg-emerald-50 text-slate-800 rounded-2xl flex items-center justify-between border border-brand-emerald/10">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Coins className="w-5 h-5 text-brand-emerald shrink-0" />
                  <div>
                    <span>Running client fare: <strong>₹{activeRide.finalFare}</strong></span>
                    {activeRide.behaviorDiscount > 0 && (
                      <span className="text-emerald-600 font-bold block text-[10px]">Compensating ₹{activeRide.behaviorDiscount} refund</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase">Dynamic safety score</span>
                  <span className={`text-lg font-black font-mono block ${activeRide.safetyScore < 80 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {activeRide.safetyScore}%
                  </span>
                </div>
              </div>

              {/* [TEST/DEV SIMULATION] POST-LOCK FARE ADJUSTMENT SYSTEM (System initiated, not driver) */}
              {!activeRide.adjustmentStatus && activeRide.status !== 'completed' && (
                <div className="mt-6 p-4 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50">
                  <div className="mb-3 border-b border-amber-200/50 pb-2">
                    <span className="text-[10px] font-mono text-amber-500 uppercase font-bold tracking-wider block">[DEV SIMULATION] SYSTEM TRIGGER FARE ADJUSTMENT</span>
                    <p className="text-[11px] text-amber-700 mt-1">Simulate the backend ops or algorithm triggering a mid-trip adjustment. (Addition 6)</p>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <button
                      onClick={async () => {
                        const amount = Number((activeRide.initialFare * 0.15).toFixed(2));
                        await fetch(`/api/rides/${activeRide.id}/adjustment/trigger`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ trigger: 'weather', amount, evidenceType: 'Weather API API-re-fetch', evidenceDescription: 'Weather escalated to high winds.' })
                        });
                        onRefresh();
                      }}
                      className="text-xs bg-white text-amber-800 font-semibold py-2 px-3 border border-amber-300 rounded shadow-sm hover:bg-amber-100 transition"
                    >
                      Trigger Weather (+15%)
                    </button>
                    <button
                      onClick={async () => {
                        const amount = Number((Math.min(activeRide.initialFare * 0.35, activeRide.initialFare * 0.3)).toFixed(2)); // Capping test
                        await fetch(`/api/rides/${activeRide.id}/adjustment/trigger`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ trigger: 'diversion', amount, evidenceType: 'GPS polyline delta', evidenceDescription: 'Route map deviation over 15% distance' })
                        });
                        onRefresh();
                      }}
                      className="text-xs bg-white text-amber-800 font-semibold py-2 px-3 border border-amber-300 rounded shadow-sm hover:bg-amber-100 transition"
                    >
                      Trigger Route (+30% capped)
                    </button>
                  </div>
                </div>
              )}

              {/* If adjustment pending, show outcome disabled mirror status */}
              {activeRide.adjustmentStatus && activeRide.status !== 'completed' && (
                <div className="mt-6 p-4 rounded-2xl bg-slate-100 border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> Driver Mirror: Fare Adjustment Status
                  </h4>
                  {activeRide.adjustmentStatus === 'pending' && <p className="text-[11px] text-slate-600 font-semibold">User reviewing ₹{activeRide.adjustmentAmount} system adjustment on Rider App...</p>}
                  {activeRide.adjustmentStatus === 'accepted' && <p className="text-[11px] text-emerald-600 font-bold">Rider approved ₹{activeRide.adjustmentAmount} adjustment. New fare: ₹{activeRide.finalFare}</p>}
                  {activeRide.adjustmentStatus === 'disputed' && <p className="text-[11px] text-rose-600 font-bold">Rider disputed. Original fare ₹{activeRide.finalFare} applies pending ops review.</p>}
                  <p className="text-[10px] text-slate-400 mt-2 border-t border-slate-200 pt-1">You cannot trigger, view evidence, or modify adjustments directly.</p>
                </div>
              )}

            </div>
          )}

          {/* ARRIVAL PAYMENT POPUP (Update for Addition 6) */}
          {activeRide.status === 'completed' && (
            <div className="lg:col-span-8">
              <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 max-w-lg mx-auto">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-indigo-500"></div>
                
                <div className="text-center mb-6">
                  <div className="inline-flex rounded-full bg-slate-900 text-white p-3 mb-4 shadow-sm border-4 border-slate-100">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">📍 You've arrived!</h3>
                  <p className="text-slate-500 mt-1 font-medium text-sm">Please finalize the payment with the rider</p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 mb-6">
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-600">Original locked fare:</span>
                    <span className="font-mono text-slate-500">₹{activeRide.initialFare.toFixed(2)}</span>
                  </div>

                  {activeRide.behaviorDiscount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-emerald-600 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Safety Refund:</span>
                      <span className="font-mono font-bold text-emerald-600">-₹{activeRide.behaviorDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {activeRide.adjustmentStatus === 'accepted' && (
                    <div className="flex justify-between items-center text-sm animate-pulse-slight">
                      <span className="font-bold text-amber-600">
                        {activeRide.adjustmentTrigger === 'weather' ? 'Weather adjustment' :
                         activeRide.adjustmentTrigger === 'traffic' ? 'Traffic adjustment' :
                         activeRide.adjustmentTrigger === 'diversion' ? 'Route adjustment' : 'Adjustment'}:
                      </span>
                      <span className="font-mono font-bold text-amber-600">+₹{activeRide.adjustmentAmount?.toFixed(2)}</span>
                    </div>
                  )}

                  {activeRide.adjustmentStatus === 'disputed' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-rose-500">Disputed Adjustment:</span>
                      <span className="font-mono font-bold text-rose-500 line-through">+₹{activeRide.adjustmentAmount?.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="h-px w-full bg-slate-200/80 my-1"></div>

                  <div className="flex justify-between items-end">
                    <span className="font-black text-slate-900 text-lg">Final total:</span>
                    <div className="text-right">
                      <span className="font-mono font-black text-3xl text-indigo-600 tracking-tight block">₹{activeRide.finalFare.toFixed(2)}</span>
                      <span className="text-[11px] font-semibold text-slate-400 mt-1 block">Payment: {activeRide.paymentMethod} ••••4521</span>
                    </div>
                  </div>

                </div>

                <div className="space-y-3">
                  <button className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2">
                    <Check className="w-5 h-5 shrink-0" />
                    Confirm & Pay ₹{activeRide.finalFare.toFixed(2)}
                  </button>
                  <button className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold transition shadow-sm text-sm">
                    ? Something's wrong
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
