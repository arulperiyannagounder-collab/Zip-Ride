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
import { Ride, Driver } from '../types';

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
  drivers: Driver[];
  onPushDriverLocation: (rideId: string, lat: number, lng: number) => Promise<void>;
  allRides: Ride[];
  currentUser: string | null;
}

export default function DriverConsoleView({
  activeRide,
  onAcceptRide,
  onSendTelemetry,
  onCompleteRide,
  onRefresh,
  systemConfig,
  drivers,
  onPushDriverLocation,
  allRides,
  currentUser
}: DriverConsoleViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(() => {
    return localStorage.getItem('zipride_driver_online') !== 'false';
  });

  const [availableOrders, setAvailableOrders] = useState<Ride[]>([]);
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('zipride_rejected_rides');
    return saved ? JSON.parse(saved) : [];
  });

  const [speed, setSpeed] = useState<number>(0);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  
  const [ignition, setIgnition] = useState<'on' | 'off'>('on');
  const [seat, setSeat] = useState<'empty' | 'occupied'>('empty');
  const [nfc, setNfc] = useState<'active' | 'inactive'>('inactive');
  const [motion, setMotion] = useState<'stationary' | 'moving' | 'riding' | 'braking'>('stationary');

  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll GET /api/driver/orders
  useEffect(() => {
    if (!isOnline || activeRide) return;
    
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/driver/orders');
        if (res.ok) {
          const data = await res.json();
          setAvailableOrders(data);
        }
      } catch (err) {
        console.error('Error fetching driver orders:', err);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [isOnline, activeRide]);

  // Fetch driver profile dynamically from GET /api/driver/profile
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/driver/profile?name=${encodeURIComponent(currentUser)}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setIsOnline(data.status === 'online');
        }
      } catch (err) {
        console.error('Error fetching driver profile:', err);
      }
    };

    fetchProfile();
  }, [currentUser, allRides, activeRide]);

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

          // Push driver location for real-time rider sync
          onPushDriverLocation(activeRide.id, gpsLat, gpsLng);

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

  const handleDriverConfirmPayment = async () => {
    if (!activeRide) return;
    try {
      const res = await fetch(`/api/rides/${activeRide.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference: `DRV-CASH-${Math.floor(100000 + Math.random() * 900000)}`, paymentMethod: 'UPI' })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error("Failed to confirm payment by driver:", e);
    }
  };

  const handleDriverDismissRide = () => {
    if (!activeRide) return;
    localStorage.setItem(`zipride_dismissed_driver_ride_${activeRide.id}`, 'true');
    onRefresh();
  };

  const myHistoryRides = allRides.filter(r => 
    (r.status === 'completed' || r.status === 'cancelled') && r.driverName === currentUser
  );

  const currentSpeedLimit = getLimits(activeRide ? activeRide.weatherType : systemConfig.weather);

  return (
    <div className="space-y-6">
      
      {/* Driver metadata card — Dynamic from database */}
      <div className="bg-theme-card border border-theme-border/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-emerald">
            <User className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h3 className="font-bold text-theme-text-primary text-base">{profile?.name || currentUser || 'Awaiting Assignment'} (Driver)</h3>
            <p className="text-xs font-mono text-theme-text-secondary flex items-center gap-1">
              <Bike className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
              <span>ID: {profile?.id || '—'} • {profile?.vehicleType || 'Bike'} ({profile?.vehicleNumber || '—'}) • Rated {profile?.rating || '—'}★</span>
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            const nextOnline = !isOnline;
            setIsOnline(nextOnline);
            localStorage.setItem('zipride_driver_online', String(nextOnline));
            if (currentUser) {
              try {
                await fetch('/api/driver/status', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: currentUser, status: nextOnline ? 'online' : 'offline' })
                });
              } catch (err) {
                console.error('Failed to update driver status:', err);
              }
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold font-mono border transition duration-200 cursor-pointer ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80' 
              : 'bg-theme-bg text-theme-text-secondary border-theme-border'
          }`}
          title="Click to toggle Shift Status"
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span>Shift: {isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </button>
      </div>

      {/* RIDE REQUEST BLOCK (WAITING FOR ORDER) */}
      {!isOnline ? (
        <div className="bg-theme-card border border-theme-border rounded-3xl py-16 px-6 text-center max-w-xl mx-auto flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-theme-bg flex items-center justify-center border border-theme-border mb-4 text-theme-text-secondary">
            <Radio className="w-8 h-8 text-theme-text-secondary animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-theme-text-primary">Shift is Offline</h3>
          <p className="text-xs text-theme-text-secondary max-w-[360px] mt-2 mb-6">You are currently offline. Toggle your shift status online to view available requests, manage earnings, and receive Mumbai dispatch bookings.</p>
          <button 
            onClick={async () => {
              setIsOnline(true);
              localStorage.setItem('zipride_driver_online', 'true');
              if (currentUser) {
                try {
                  await fetch('/api/driver/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: currentUser, status: 'online' })
                  });
                } catch (err) {
                  console.error('Failed to update driver status:', err);
                }
              }
            }}
            className="px-6 py-3 bg-[#00C896] hover:bg-[#00b384] font-bold text-white rounded-2xl text-xs shadow transition cursor-pointer"
          >
            Go Online & Start Shift
          </button>
        </div>
      ) : !activeRide ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Available Orders Section */}
          <div className="lg:col-span-8 bg-theme-card border border-theme-border rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-theme-border pb-3">
              <h3 className="text-base font-bold text-theme-text-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Radio className="w-5 h-5 text-brand-emerald animate-pulse" />
                <span>Available Orders</span>
              </h3>
              <button 
                onClick={onRefresh}
                className="px-3.5 py-1.5 bg-[#00C896] hover:bg-[#00b384] font-bold text-white rounded-lg text-xs transition cursor-pointer"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-theme-border text-theme-text-secondary font-mono font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Passenger</th>
                    <th className="py-3 px-3">Pickup</th>
                    <th className="py-3 px-3">Destination</th>
                    <th className="py-3 px-3">Dist</th>
                    <th className="py-3 px-3">Fare</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Time</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border font-semibold text-theme-text-primary">
                  {(() => {
                    const visibleOrders = availableOrders.filter(r => !rejectedRideIds.includes(r.id));
                    return visibleOrders.length > 0 ? (
                      visibleOrders.map(ride => (
                        <tr key={ride.id} className="hover:bg-theme-bg/50 transition duration-150">
                          <td className="py-3 px-3 font-mono font-bold text-theme-text-primary">{ride.id}</td>
                          <td className="py-3 px-3">{ride.riderName || 'Saran'}</td>
                          <td className="py-3 px-3 truncate max-w-[100px]" title={ride.pickup}>{ride.pickup.split(',')[0]}</td>
                          <td className="py-3 px-3 truncate max-w-[100px]" title={ride.drop}>{ride.drop.split(',')[0]}</td>
                          <td className="py-3 px-3 font-mono">{ride.distanceKm} km</td>
                          <td className="py-3 px-3 font-mono">₹{ride.finalFare.toFixed(2)}</td>
                          <td className="py-3 px-3 font-mono">{ride.paymentMethod}</td>
                          <td className="py-3 px-3 font-mono text-theme-text-secondary font-medium">
                            {new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-3 flex gap-1 justify-center items-center">
                            <button
                              onClick={() => onAcceptRide(ride.id)}
                              className="px-2.5 py-1.5 bg-brand-emerald hover:bg-brand-emerald-dark text-slate-950 font-extrabold rounded-lg text-[10px] transition cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                const newRejected = [...rejectedRideIds, ride.id];
                                setRejectedRideIds(newRejected);
                                localStorage.setItem('zipride_rejected_rides', JSON.stringify(newRejected));
                              }}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-[10px] transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-theme-text-secondary font-medium">
                          No available orders at the moment. Awaiting passenger bookings...
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Panel: Earnings Overview */}
          <div className="lg:col-span-4 space-y-6">
            {/* Earnings Overview */}
            <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-xs">
              <h4 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Shift Earnings</span>
              </h4>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Today's Revenue</span>
                  <span className="text-2xl font-mono font-black text-theme-text-primary block mt-0.5">₹{(profile?.todayEarnings ?? 0).toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-theme-border text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Trips Completed</span>
                    <span className="font-bold text-theme-text-primary block mt-0.5">{profile?.completedRides ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Acceptance</span>
                    <span className="font-bold text-theme-text-primary block mt-0.5">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ACTIVE JOB PRESENT */}
      {isOnline && activeRide && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Job Dispatch Info / Navigation Controller */}
          <div className="lg:col-span-4 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-theme-text-secondary block font-bold leading-none uppercase">Assigned Ride ID</span>
                <span className="text-base font-mono font-bold text-theme-text-primary mt-1 block">{activeRide.id}</span>
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
                <h4 className="font-bold text-theme-text-primary text-sm">Incoming Taxi Command!</h4>
                <div className="text-[11px] text-theme-text-secondary font-semibold space-y-1">
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
                <div className="space-y-3.5 p-4 bg-theme-bg rounded-2xl border border-theme-border/50 text-xs text-theme-text-secondary font-semibold">
                  <div className="flex gap-2.5 items-start">
                    <CircleDot className="w-4 h-4 text-brand-emerald mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono uppercase text-theme-text-secondary block font-bold">Pickup Origin</span>
                      <p className="mt-0.5 text-theme-text-primary">{activeRide.pickup}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start border-t border-theme-border/50 pt-2.5">
                    <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono uppercase text-theme-text-secondary block font-bold">Transit Destination</span>
                      <p className="mt-0.5 text-theme-text-primary">{activeRide.drop}</p>
                    </div>
                  </div>
                </div>

                {/* Rider details card */}
                {activeRide.riderName && (
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-xs space-y-2">
                    <span className="text-[10px] font-mono uppercase text-indigo-500 block font-bold">RIDER DETAILS</span>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-theme-text-primary">{activeRide.riderName}</span>
                    </div>
                    {activeRide.riderPhone && (
                      <div className="flex items-center gap-2 text-theme-text-secondary">
                        <span>📞</span>
                        <span className="font-mono font-semibold">{activeRide.riderPhone}</span>
                      </div>
                    )}
                    {activeRide.riderLat && activeRide.riderLng && (
                      <div className="flex items-center gap-2 text-theme-text-secondary font-mono text-[10px]">
                        <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>Rider GPS: {activeRide.riderLat.toFixed(4)}, {activeRide.riderLng.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Active Ride Action Controls */}
                <div className="p-4 bg-slate-55 border border-slate-800 rounded-2xl space-y-3">
                  <span className="text-[10px] font-mono uppercase text-theme-text-secondary block font-bold">Trip Actions</span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleManualTelemetryUpdate({ status: 'pickup', progress: 10 })}
                      disabled={activeRide.status !== 'assigned'}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold text-center transition cursor-pointer ${
                        activeRide.status === 'assigned'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-800 text-theme-text-secondary cursor-not-allowed'
                      }`}
                    >
                      Reached Pickup
                    </button>
                    <button
                      onClick={() => handleManualTelemetryUpdate({ status: 'en_route', progress: 25, seat: 'occupied', nfc: 'active', motion: 'riding' })}
                      disabled={activeRide.status !== 'pickup'}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold text-center transition cursor-pointer ${
                        activeRide.status === 'pickup'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-slate-800 text-theme-text-secondary cursor-not-allowed'
                      }`}
                    >
                      Start Ride
                    </button>
                    <button
                      onClick={() => onCompleteRide(activeRide.id)}
                      disabled={['completed', 'cancelled', 'booked'].includes(activeRide.status) || activeRide.status === 'assigned' || activeRide.status === 'pickup'}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold text-center transition cursor-pointer ${
                        ['en_route', 'arrived', 'anomaly'].includes(activeRide.status)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-800 text-theme-text-secondary cursor-not-allowed'
                      }`}
                    >
                      Complete Ride
                    </button>
                  </div>
                </div>

                {/* Automation trigger progress */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-theme-text-primary">
                    <span>Progress Trajectory</span>
                    <span className="font-mono">{simulationProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-theme-bg rounded-full overflow-hidden">
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
            <div className="lg:col-span-8 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xs space-y-6">
              
              <div className="flex items-center justify-between border-b border-theme-border pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-emerald" />
                  <h4 className="font-bold text-theme-text-primary text-sm">Hardware Sensor Telemetry Board</h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">STREAMING ACTIVE</span>
              </div>

              {/* Behavior parameters sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Speed Slider Parameter */}
                <div className="bg-theme-bg/50 p-5 rounded-2xl border border-theme-border">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-theme-text-primary flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-brand-emerald shrink-0" />
                      Dynamic Bike Speed
                    </span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${speed > currentSpeedLimit ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-theme-bg text-theme-text-secondary'}`}>
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
                  
                  <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-theme-text-secondary">
                    <span>Weather Speed Limit: <strong>{currentSpeedLimit} km/h</strong></span>
                    {speed > currentSpeedLimit && (
                      <span className="text-rose-500 font-bold">💥 Exceeds safe limit! (Fare will discount)</span>
                    )}
                  </div>
                </div>

                {/* Harsh Braking simulator trigger */}
                <div className="bg-theme-bg/50 p-5 rounded-2xl border border-theme-border flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-theme-text-primary flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                      Unsafe Braking Event
                    </span>
                    <p className="text-[11px] text-theme-text-secondary leading-relaxed mb-4">
                      Trigger sudden deceleration sensor reading. This applies harsh-braking rules, deducts ₹10.00 from final client cost, and updates safety score metrics.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={triggerHarshBrakingSimulation}
                    className="w-full bg-yellow-400 text-theme-text-primary border border-yellow-400 hover:bg-yellow-500 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Abruptly Slam Brakes</span>
                  </button>
                </div>

              </div>

              {/* Auxiliary Sensor Toggles (Seat, NFC, Ignition) */}
              <div>
                <span className="text-xs font-bold text-theme-text-primary block mb-3">Auxiliary Embedded Hardware Status</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Select Ignition */}
                  <div className="p-3 bg-theme-bg border border-theme-border rounded-xl space-y-1.5 text-center">
                    <span className="text-[10px] font-mono text-theme-text-secondary uppercase font-bold">Ignition State</span>
                    <div className="flex justify-center gap-1">
                      <button 
                        type="button"
                        onClick={() => { setIgnition('on'); handleManualTelemetryUpdate({ ignition: 'on' }); }}
                        className={`px-2 py-1 text-[10px] font-mono rounded font-bold ${ignition === 'on' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-theme-text-secondary'}`}
                      >
                        ON
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setIgnition('off'); handleManualTelemetryUpdate({ ignition: 'off' }); }}
                        className={`px-2 py-1 text-[10px] font-mono rounded font-bold ${ignition === 'off' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-theme-text-secondary'}`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>

                  {/* Select Seat status */}
                  <div className="p-3 bg-theme-bg border border-theme-border rounded-xl space-y-1.5 text-center">
                    <span className="text-[10px] font-mono text-theme-text-secondary uppercase font-bold">Seat sensor</span>
                    <div className="flex justify-center gap-1 font-mono">
                      <button 
                        type="button"
                        onClick={() => { setSeat('occupied'); handleManualTelemetryUpdate({ seat: 'occupied' }); }}
                        className={`px-1.5 py-1 text-[9px] rounded font-bold ${seat === 'occupied' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-theme-text-secondary'}`}
                      >
                        BUSY
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setSeat('empty'); handleManualTelemetryUpdate({ seat: 'empty' }); }}
                        className={`px-1.5 py-1 text-[9px] rounded font-bold ${seat === 'empty' ? 'bg-slate-500 text-white' : 'bg-slate-200 text-theme-text-secondary'}`}
                      >
                        EMPTY
                      </button>
                    </div>
                  </div>

                  {/* Select NFC status */}
                  <div className="p-3 bg-theme-bg border border-theme-border rounded-xl space-y-1.5 text-center">
                    <span className="text-[10px] font-mono text-theme-text-secondary uppercase font-bold">Helmet NFC Link</span>
                    <div className="flex justify-center gap-1 font-mono">
                      <button 
                        type="button"
                        onClick={() => { setNfc('active'); handleManualTelemetryUpdate({ nfc: 'active' }); }}
                        className={`px-1.5 py-1 text-[9px] rounded font-bold ${nfc === 'active' ? 'bg-brand-emerald text-white' : 'bg-slate-200 text-theme-text-secondary'}`}
                      >
                        LINK
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setNfc('inactive'); handleManualTelemetryUpdate({ nfc: 'inactive' }); }}
                        className={`px-1.5 py-1 text-[9px] rounded font-bold ${nfc === 'inactive' ? 'bg-slate-500 text-white' : 'bg-slate-200 text-theme-text-secondary'}`}
                      >
                        NULL
                      </button>
                    </div>
                  </div>

                  {/* Motion state select */}
                  <div className="p-3 bg-theme-bg border border-theme-border rounded-xl space-y-1.5 text-center">
                    <span className="text-[10px] font-mono text-theme-text-secondary uppercase font-bold text-center block">Motion Tag</span>
                    <select
                      value={motion}
                      onChange={(e) => {
                        const mVal = e.target.value as any;
                        setMotion(mVal);
                        handleManualTelemetryUpdate({ motion: mVal });
                      }}
                      className="bg-theme-card border border-theme-border rounded font-mono text-[10px] py-1 px-1 text-theme-text-primary outline-none w-full"
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
              <div className="p-4 bg-emerald-50 text-theme-text-primary rounded-2xl flex items-center justify-between border border-brand-emerald/10">
                <div className="flex items-center gap-2 text-xs font-semibold text-theme-text-primary">
                  <Coins className="w-5 h-5 text-brand-emerald shrink-0" />
                  <div>
                    <span>Running client fare: <strong>₹{activeRide.finalFare}</strong></span>
                    {activeRide.behaviorDiscount > 0 && (
                      <span className="text-emerald-600 font-bold block text-[10px]">Compensating ₹{activeRide.behaviorDiscount} refund</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-theme-text-secondary block font-bold uppercase">Dynamic safety score</span>
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
                      className="text-xs bg-theme-card text-amber-800 font-semibold py-2 px-3 border border-amber-300 rounded shadow-sm hover:bg-amber-100 transition"
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
                      className="text-xs bg-theme-card text-amber-800 font-semibold py-2 px-3 border border-amber-300 rounded shadow-sm hover:bg-amber-100 transition"
                    >
                      Trigger Route (+30% capped)
                    </button>
                  </div>
                </div>
              )}

              {/* If adjustment pending, show outcome disabled mirror status */}
              {activeRide.adjustmentStatus && activeRide.status !== 'completed' && (
                <div className="mt-6 p-4 rounded-2xl bg-theme-bg border border-theme-border">
                  <h4 className="font-bold text-theme-text-primary text-xs flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> Driver Mirror: Fare Adjustment Status
                  </h4>
                  {activeRide.adjustmentStatus === 'pending' && <p className="text-[11px] text-theme-text-secondary font-semibold">User reviewing ₹{activeRide.adjustmentAmount} system adjustment on Rider App...</p>}
                  {activeRide.adjustmentStatus === 'accepted' && <p className="text-[11px] text-emerald-600 font-bold">Rider approved ₹{activeRide.adjustmentAmount} adjustment. New fare: ₹{activeRide.finalFare}</p>}
                  {activeRide.adjustmentStatus === 'disputed' && <p className="text-[11px] text-rose-600 font-bold">Rider disputed. Original fare ₹{activeRide.finalFare} applies pending ops review.</p>}
                  <p className="text-[10px] text-theme-text-secondary mt-2 border-t border-theme-border pt-1">You cannot trigger, view evidence, or modify adjustments directly.</p>
                </div>
              )}

            </div>
          )}

          {/* ARRIVAL PAYMENT POPUP (Update for UPI Payment) */}
          {activeRide.status === 'completed' && (
            <div className="lg:col-span-8">
              <div className="bg-theme-card border-2 border-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 max-w-lg mx-auto">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-indigo-500"></div>
                
                <div className="text-center mb-6">
                  <div className="inline-flex rounded-full bg-slate-900 text-white p-3 mb-4 shadow-sm border-4 border-theme-border">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-theme-text-primary tracking-tight">📍 You've arrived!</h3>
                  <p className="text-theme-text-secondary mt-1 font-medium text-sm">Please finalize the payment with the rider</p>
                  
                  {/* Payment Status badge */}
                  <div className="mt-3.5 flex justify-center">
                    {activeRide.paymentStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-550/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                        <Check className="w-4 h-4" />
                        ✓ Payment Received (Successful)
                      </span>
                    ) : activeRide.paymentStatus === 'processing' ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        <span className="w-2 h-2 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
                        ⏳ Payment Processing...
                      </span>
                    ) : activeRide.paymentStatus === 'failed' ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <span>❌</span>
                        Payment Failed (Try Again)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                        ⏳ Payment Pending (UPI QR)
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-theme-bg border border-theme-border/80 rounded-2xl p-5 space-y-3 mb-6">
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-theme-text-secondary">Original locked fare:</span>
                    <span className="font-mono text-theme-text-secondary">₹{activeRide.initialFare.toFixed(2)}</span>
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
                    <span className="font-black text-theme-text-primary text-lg">Final total:</span>
                    <div className="text-right">
                      <span className="font-mono font-black text-3xl text-indigo-600 tracking-tight block">₹{activeRide.finalFare.toFixed(2)}</span>
                      <span className="text-[11px] font-semibold text-theme-text-secondary mt-1 block">Payment status: <span className="font-bold font-mono">{activeRide.paymentStatus || 'pending'}</span></span>
                    </div>
                  </div>

                </div>

                <div className="space-y-3">
                  {activeRide.paymentStatus === 'paid' ? (
                    <button
                      onClick={handleDriverDismissRide}
                      className="w-full bg-brand-emerald hover:bg-brand-emerald-dark text-white py-4 rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm animate-in fade-in"
                    >
                      <Check className="w-5 h-5 shrink-0" />
                      Complete & Dismiss Ride
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleDriverConfirmPayment}
                        disabled={activeRide.paymentStatus === 'processing'}
                        className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-5 h-5 shrink-0" />
                        {activeRide.paymentStatus === 'processing' ? 'Verifying payment...' : 'Confirm Cash / Settle Manually'}
                      </button>
                      <p className="text-[10px] text-center text-theme-text-secondary">Rider can scan the UPI QR on their screen. This panel will update instantly once paid.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* COMPLETED RIDES HISTORY */}
      <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-sm mt-6">
        <h3 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>Your Ride History</span>
        </h3>
        
        {myHistoryRides.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-theme-border text-theme-text-secondary font-mono font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Ride ID</th>
                  <th className="py-3 px-4">Pickup</th>
                  <th className="py-3 px-4">Drop</th>
                  <th className="py-3 px-4 font-mono">Date</th>
                  <th className="py-3 px-4 font-mono text-right">Fare</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border font-semibold text-theme-text-primary">
                {myHistoryRides.map(ride => (
                  <tr key={ride.id} className="hover:bg-theme-bg/50 transition duration-150">
                    <td className="py-3.5 px-4 font-mono text-theme-text-primary font-bold">{ride.id}</td>
                    <td className="py-3.5 px-4 truncate max-w-[150px]" title={ride.pickup}>{ride.pickup.split(',')[0]}</td>
                    <td className="py-3.5 px-4 truncate max-w-[150px]" title={ride.drop}>{ride.drop.split(',')[0]}</td>
                    <td className="py-3.5 px-4 text-theme-text-secondary font-medium font-mono">{new Date(ride.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-theme-text-primary font-bold font-mono text-right">₹{ride.finalFare.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ride.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                      }`}>
                        {ride.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-theme-text-secondary">
            No history found. Complete rides to populate your history.
          </div>
        )}
      </div>

    </div>
  );
}
