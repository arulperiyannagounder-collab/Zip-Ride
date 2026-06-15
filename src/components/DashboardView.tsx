import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  CloudSun, 
  Map, 
  ArrowRight,
  RefreshCw,
  Bell,
  Clock,
  Shield,
  Gauge
} from 'lucide-react';
import { SystemState, Ride, SystemConfig } from '../types';

interface DashboardViewProps {
  systemState: SystemState;
  allRides: Ride[];
  onUpdateConfig: (weather: SystemConfig['weather'], traffic: SystemConfig['traffic']) => Promise<void>;
  onSelectTab: (tab: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function DashboardView({
  systemState,
  allRides,
  onUpdateConfig,
  onSelectTab,
  onRefresh,
  isLoading
}: DashboardViewProps) {
  const { config, activeCount, completedCount, revenue, overspeedCount, harshBrakeCount, recentAlerts } = systemState;

  const [localWeather, setLocalWeather] = useState<SystemConfig['weather']>(config.weather);
  const [localTraffic, setLocalTraffic] = useState<SystemConfig['traffic']>(config.traffic);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await onUpdateConfig(localWeather, localTraffic);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const activeRides = allRides.filter(r => ['booked', 'assigned', 'pickup', 'en_route', 'anomaly'].includes(r.status));

  // Safe Speed ceiling for the current weather
  const getLimits = (weather: string) => {
    switch (weather) {
      case 'Overcast': return { speed: 75, surcharge: 10 };
      case 'High Winds': return { speed: 65, surcharge: 20 };
      case 'Heavy Rain': return { speed: 60, surcharge: 30 };
      case 'Monsoon Storm': return { speed: 50, surcharge: 50 };
      default: return { speed: 80, surcharge: 0 };
    }
  };

  const currentLimits = getLimits(config.weather);

  return (
    <div className="space-y-6">
      {/* Title block with refresh action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Operations Console</h2>
          <p className="text-sm text-slate-500">Real-time dynamic monitoring, traffic surcharging, and safety compliance feeds.</p>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Synchronize Stream</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI: Active Rides */}
        <div id="kpi-active" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-slate-400">Active Rides</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{activeCount}</h3>
          </div>
        </div>

        {/* KPI: Completed Rides */}
        <div id="kpi-completed" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-slate-400">Completed Rides</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{completedCount}</h3>
          </div>
        </div>

        {/* KPI: Revenue Pool */}
        <div id="kpi-revenue" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-slate-400">Settled Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono mt-0.5">₹{revenue.toFixed(2)}</h3>
          </div>
        </div>

        {/* KPI: Overspeed Violations */}
        <div id="kpi-overspeed" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Gauge className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-slate-400">Overspeed Risks</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{overspeedCount}</h3>
          </div>
        </div>

        {/* KPI: Harsh Braking Warnings */}
        <div id="kpi-braking" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-slate-400">Harsh Braking</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{harshBrakeCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings Console & Surcharge Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Environment Control Terminal (LG Col 4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CloudSun className="w-5 h-5 text-brand-emerald" />
              <h3 className="font-bold text-slate-900">Dynamic Environment Terminal</h3>
            </div>
            
            <p className="text-xs text-slate-500 mb-5">
              Simulate changes in global weather and traffic density to dynamically adjust the system base surcharges, pricing multipliers, and maximum safety compliance speeds.
            </p>

            <form onSubmit={handleConfigSubmit} className="space-y-4">
              {/* Weather Input Select Wrapper */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">Simulate Weather</label>
                <select
                  value={localWeather}
                  onChange={(e) => setLocalWeather(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium px-4 py-3.5 rounded-xl text-sm focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10 outline-none transition"
                >
                  <option value="Clear">☀️ Clear Baseline (Max: 80 km/h)</option>
                  <option value="Overcast">☁️ Overcast (+₹10 Surcharge / Max: 75 km/h)</option>
                  <option value="High Winds">💨 High Winds (+₹20 Surcharge / Max: 65 km/h)</option>
                  <option value="Heavy Rain">🌧️ Heavy Rain (+₹30 Surcharge / Max: 60 km/h)</option>
                  <option value="Monsoon Storm">⛈️ Monsoon Storm (+₹50 Surcharge / Max: 50 km/h)</option>
                </select>
              </div>

              {/* Traffic Input Select Wrapper */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">Simulate Traffic Congestion</label>
                <select
                  value={localTraffic}
                  onChange={(e) => setLocalTraffic(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium px-4 py-3.5 rounded-xl text-sm focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10 outline-none transition"
                >
                  <option value="Light">🛣️ Light Flow (1.0x Surcharge / 1.0x ETA)</option>
                  <option value="Moderate">🚗 Moderate density (1.1x Surcharge / 1.3x ETA)</option>
                  <option value="Heavy Congestion">🚌 Heavy Congestion (1.3x Surcharge / 1.8x ETA)</option>
                  <option value="Gridlock">🛑 Gridlock Surcharge (1.5x Surcharge / 2.5x ETA)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="w-full bg-brand-emerald text-white hover:bg-brand-emerald-dark font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 mt-2"
              >
                <span>{isSavingConfig ? 'Saving Environment...' : 'Commit Settings'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-100 flex items-center gap-3 bg-brand-emerald/5 p-4 rounded-xl border border-brand-emerald/10">
            <Shield className="w-5 h-5 text-brand-emerald shrink-0" />
            <div className="text-[11px] text-slate-600">
              ⚡ <strong>Compliance Auto-Trigger</strong> is ACTIVE. If real-time bike speed exceeds <strong>{currentLimits.speed} km/h</strong>, dynamic refund logic executes immediately.
            </div>
          </div>
        </div>

        {/* Real-time Custom SVG Surcharge factor plot (LG Col 8) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-emerald" />
                <h3 className="font-bold text-slate-900">Dynamic Environmental Pricing Matrix</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">Active Formula Simulation</span>
            </div>

            <p className="text-xs text-slate-500 mb-6">
              Visualizes surcharge multipliers based on our Dynamic Pricing Framework. Current Base is modified by weather surcharges (+₹{currentLimits.surcharge}), while variable km/min fares are multiplied by the traffic multiplier factor.
            </p>

            {/* Custom SVG Bar Graph */}
            <div className="h-44 relative bg-slate-900/5 hover:bg-slate-900/[0.08] p-4 rounded-2xl border border-slate-100 flex items-end justify-around gap-2.5 pt-10">
              
              {/* Dynamic Y Axis indicators */}
              <div className="absolute top-3 left-4 text-[10px] font-mono text-slate-400 space-y-1">
                <div>💥 Surcharge Limit Factor: 3.5x max</div>
                <div>⚡ Running environment Surcharge: ₹{currentLimits.surcharge.toFixed(2)}</div>
              </div>

              {/* Bar 1: Weather surcharge */}
              <div className="flex-1 flex flex-col items-center group">
                <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-slate-900 transition mb-1 text-center">₹{currentLimits.surcharge}</span>
                <div 
                  className="w-full max-w-[50px] bg-sky-500 rounded-t-lg transition-all duration-500 hover:opacity-85 shadow"
                  style={{ height: `${Math.max(10, currentLimits.surcharge * 2.2)}px` }}
                />
                <span className="text-[10px] font-mono mt-2 font-medium text-slate-400 truncate w-full text-center">Weather</span>
              </div>

              {/* Bar 2: Traffic Multiplier */}
              <div className="flex-1 flex flex-col items-center group">
                <span className="text-[10px] font-mono font-bold text-brand-emerald group-hover:text-slate-900 transition mb-1 text-center">
                  {(config.traffic === 'Moderate' ? 1.1 : 
                    config.traffic === 'Heavy Congestion' ? 1.3 : 
                    config.traffic === 'Gridlock' ? 1.5 : 1.0).toFixed(1)}x
                </span>
                <div 
                  className="w-full max-w-[50px] bg-brand-emerald rounded-t-lg transition-all duration-500 hover:opacity-85 shadow"
                  style={{ 
                    height: `${
                      (config.traffic === 'Moderate' ? 110 : 
                       config.traffic === 'Heavy Congestion' ? 130 : 
                       config.traffic === 'Gridlock' ? 150 : 100) * 0.8
                    }px` 
                  }}
                />
                <span className="text-[10px] font-mono mt-2 font-medium text-slate-400 truncate w-full text-center">Traffic</span>
              </div>

              {/* Bar 3: Booking Multiplier Summary */}
              <div className="flex-1 flex flex-col items-center group">
                <span className="text-[10px] font-mono font-bold text-orange-500 group-hover:text-slate-900 transition mb-1 text-center">Combined</span>
                <div 
                  className="w-full max-w-[50px] bg-orange-400 rounded-t-lg transition-all duration-500 hover:opacity-85 shadow"
                  style={{ 
                    height: `${
                      Math.max(40, (100 + currentLimits.surcharge) * 0.7)
                    }px` 
                  }}
                />
                <span className="text-[10px] font-mono mt-2 font-medium text-slate-400 truncate w-full text-center">Combined load</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Dynamic Weather Factor</span>
              <p className="text-sm font-bold text-slate-800 mt-1">Surcharge: +₹{currentLimits.surcharge}.00</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Traffic Pricing Factor</span>
              <p className="text-sm font-bold text-slate-800 mt-1">
                Multiplier: {config.traffic === 'Moderate' ? '1.1x' : config.traffic === 'Heavy Congestion' ? '1.3x' : config.traffic === 'Gridlock' ? '1.5x' : '1.0x'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Alert Feed Monitor (LG Col 4) & Active Rides Table (LG Col 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Rides Table Monitor (Aligned with Screenshot 1) */}
        <div id="recent-rides-panel" className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">Recent Rides</h3>
            <button 
              onClick={() => onSelectTab('/booking')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition"
            >
              <span>Book new</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {allRides.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/40 border-b border-slate-100 text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">
                    <th className="px-6 py-4">RIDE ID</th>
                    <th className="px-6 py-4">PICKUP</th>
                    <th className="px-6 py-4">DROP</th>
                    <th className="px-6 py-4">FARE</th>
                    <th className="px-6 py-4 text-center">STATUS</th>
                    <th className="px-6 py-4 text-center">PAYMENT</th>
                    <th className="px-6 py-4 text-center">RATING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/85">
                  {allRides.map((ride) => {
                    const ratingValue = ride.rating;
                    const paymentStatusValue = ride.paymentStatus || (
                      ride.status === 'completed' ? 'Paid' : 'Pending'
                    );

                    return (
                      <tr key={ride.id} className="hover:bg-slate-50/30 transition duration-150">
                        <td className="px-6 py-4.5 font-mono font-bold text-slate-700 tracking-tight">{ride.id}</td>
                        <td className="px-6 py-4.5 font-sans font-medium text-slate-600">
                          <span className="truncate max-w-[180px] block">{ride.pickup}</span>
                        </td>
                        <td className="px-6 py-4.5 font-sans font-medium text-slate-600">
                          <span className="truncate max-w-[180px] block">{ride.drop}</span>
                        </td>
                        <td className="px-6 py-4.5 font-mono">
                          <span className="text-[#00C896] font-bold text-[13px]">
                            ₹{ride.finalFare.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50/70 text-emerald-600">
                            {ride.status}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          {paymentStatusValue === 'Disputed' ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200/50">
                              Disputed
                            </span>
                          ) : paymentStatusValue === 'Paid' ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-600 font-bold">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-150/70 text-slate-500">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-center font-mono">
                          {ratingValue ? (
                            <span className="inline-flex items-center gap-1.5 justify-center">
                              <span className="text-amber-500 text-xs">★</span>
                              <span className="font-bold text-slate-850">{ratingValue}</span>
                            </span>
                          ) : (
                            <span className="text-slate-350">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-slate-250 mb-3" />
              <p className="font-semibold text-slate-700 text-sm">No active rides currently on board</p>
              <p className="text-xs text-slate-400 max-w-[280px] mt-1 mx-auto">Toggle settings or book a simulated ride to spin up driver sensors.</p>
              <button 
                onClick={() => onSelectTab('/booking')}
                className="mt-4 inline-flex items-center gap-2 bg-brand-emerald hover:bg-brand-emerald-dark text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs"
              >
                <span>Book First Ride</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Live System Operational Alerts Feed Panel */}
        <div id="alerts-panel" className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col justify-between overflow-hidden shadow-md text-slate-300">
          <div className="p-5 border-b border-slate-900/80 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-emerald rotate-12 shrink-0" />
              <h3 className="font-bold text-white text-sm">Live System Alarm Stream</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping shrink-0" />
          </div>

          <div className="flex-1 p-4 space-y-3 max-h-[300px] overflow-y-auto">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((log) => {
                let colorClass = 'border-slate-800 bg-slate-900/30 text-slate-300';
                if (log.severity === 'high') colorClass = 'border-rose-950 bg-rose-950/20 text-rose-300';
                else if (log.severity === 'medium') colorClass = 'border-yellow-950 bg-yellow-950/20 text-yellow-300';
                else if (log.severity === 'critical') colorClass = 'border-red-900 bg-red-950/40 text-red-200 animate-pulse';

                return (
                  <div key={log.id} className={`p-3.5 rounded-xl border text-[11px] font-mono leading-relaxed transition ${colorClass}`}>
                    <div className="flex items-center justify-between mb-1.5 text-slate-500 font-semibold uppercase">
                      <span>TYPE: {log.type.toUpperCase()}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-medium">{log.message}</div>
                    {log.rideId !== 'SYSTEM' && (
                      <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-slate-900 rounded text-[10px] text-slate-400 font-bold">RIDE: {log.rideId}</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center">
                <Bell className="w-8 h-8 text-slate-800 mb-2" />
                <span>Monitoring live telemetry links...</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-900 bg-slate-950/90 text-[10px] font-mono text-slate-500 flex justify-between items-center">
            <span>Buffer Limit: 200 Logs</span>
            <span className="text-brand-emerald">Automatic Flush Active</span>
          </div>
        </div>

      </div>
    </div>
  );
}
