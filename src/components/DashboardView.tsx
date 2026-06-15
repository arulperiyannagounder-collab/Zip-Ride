import React, { useState, useEffect } from 'react';
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
  Gauge,
  User,
  MapPin,
  Bookmark,
  Sparkles,
  Star,
  Navigation,
  History,
  Calendar
} from 'lucide-react';
import { SystemState, Ride, SystemConfig } from '../types';

interface DashboardViewProps {
  systemState: SystemState;
  allRides: Ride[];
  onUpdateConfig: (weather: SystemConfig['weather'], traffic: SystemConfig['traffic']) => Promise<void>;
  onSelectTab: (tab: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  userRole?: 'passenger' | 'driver' | 'admin' | null;
  userName?: string | null;
}

export default function DashboardView({
  systemState,
  allRides,
  onUpdateConfig,
  onSelectTab,
  onRefresh,
  isLoading,
  userRole = 'passenger',
  userName = 'Saran'
}: DashboardViewProps) {
  const { config, activeCount, completedCount, revenue, overspeedCount, harshBrakeCount, recentAlerts } = systemState;

  const [localWeather, setLocalWeather] = useState<SystemConfig['weather']>(config.weather);
  const [localTraffic, setLocalTraffic] = useState<SystemConfig['traffic']>(config.traffic);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [liveWeather, setLiveWeather] = useState<{ temp: number; weatherText: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/weather?lat=19.0760&lng=72.8777')
      .then(res => res.json())
      .then(data => {
        if (active) {
          setLiveWeather({ temp: data.temp, weatherText: data.weatherText });
        }
      })
      .catch(err => console.error('Dashboard weather load error:', err));
    return () => { active = false; };
  }, []);

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

  const todayStr = new Date().toDateString();
  const getRevenueToday = () => {
    return allRides
      .filter(r => {
        const isPaid = (r.paymentStatus || '').toLowerCase() === 'paid';
        if (!isPaid) return false;
        if (r.paidAt) return new Date(r.paidAt).toDateString() === todayStr;
        if (r.completedAt) return new Date(r.completedAt).toDateString() === todayStr;
        return false;
      })
      .reduce((sum, r) => sum + r.finalFare, 0);
  };

  const pendingPaymentsCount = allRides.filter(r => 
    r.status === 'completed' && 
    ['pending', 'processing', 'failed', 'Pending', 'failed', 'processing'].includes(r.paymentStatus || '')
  ).length;

  const successfulPaymentsCount = allRides.filter(r => (r.paymentStatus || '').toLowerCase() === 'paid').length;

  const paidRides = allRides.filter(r => (r.paymentStatus || '').toLowerCase() === 'paid');
  const totalPaidCount = paidRides.length;

  const getMethodStats = (method: string) => {
    if (totalPaidCount === 0) return { count: 0, pct: 0 };
    const count = paidRides.filter(r => r.paymentMethod === method).length;
    const pct = Math.round((count / totalPaidCount) * 100);
    return { count, pct };
  };

  const gpayStats = getMethodStats('GooglePay');
  const phonepeStats = getMethodStats('PhonePe');
  const paytmStats = getMethodStats('Paytm');
  const bhimStats = getMethodStats('BHIM');
  const amazonpayStats = getMethodStats('AmazonPay');
  const cashStats = getMethodStats('Cash');
  const upiStats = getMethodStats('UPI');
  
  const othersCount = totalPaidCount - (gpayStats.count + phonepeStats.count + paytmStats.count + bhimStats.count + amazonpayStats.count + cashStats.count + upiStats.count);
  const othersPct = totalPaidCount > 0 ? Math.round((othersCount / totalPaidCount) * 100) : 0;

  if (userRole === 'admin') {
    return (
      <div className="space-y-6">
        {/* Title block with refresh action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-theme-text-primary tracking-tight">System Operations Console</h2>
          <p className="text-sm text-theme-text-secondary">Real-time dynamic monitoring, traffic surcharging, and safety compliance feeds.</p>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-theme-text-primary bg-theme-card border border-theme-border hover:bg-theme-bg rounded-xl transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Synchronize Stream</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI: Active Rides */}
        <div id="kpi-active" className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-theme-text-secondary">Active Rides</p>
            <h3 className="text-2xl font-bold text-theme-text-primary font-mono mt-0.5">{activeCount}</h3>
          </div>
        </div>

        {/* KPI: Successful Payments */}
        <div id="kpi-paid-rides" className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-550/15 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-theme-text-secondary">Successful Payments</p>
            <h3 className="text-2xl font-bold text-theme-text-primary font-mono mt-0.5">
              {successfulPaymentsCount}
            </h3>
          </div>
        </div>

        {/* KPI: Revenue Today */}
        <div id="kpi-revenue" className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-theme-text-secondary">Revenue Today</p>
            <h3 className="text-2xl font-bold text-theme-text-primary font-mono mt-0.5">
              ₹{getRevenueToday().toFixed(2)}
            </h3>
          </div>
        </div>

        {/* KPI: Pending Payments */}
        <div id="kpi-pending-payments" className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-theme-text-secondary">Pending Payments</p>
            <h3 className="text-2xl font-bold text-theme-text-primary font-mono mt-0.5">
              {pendingPaymentsCount}
            </h3>
          </div>
        </div>

        {/* KPI: Safety Alerts */}
        <div id="kpi-overspeed" className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Gauge className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-theme-text-secondary">Safety Alerts</p>
            <h3 className="text-2xl font-bold text-theme-text-primary font-mono mt-0.5">{overspeedCount + harshBrakeCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings Console & Surcharge Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Environment Control Terminal (LG Col 4) */}
        <div className="lg:col-span-4 bg-theme-card border border-theme-border/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CloudSun className="w-5 h-5 text-brand-emerald" />
              <h3 className="font-bold text-theme-text-primary">Dynamic Environment Terminal</h3>
            </div>
            
            <p className="text-xs text-theme-text-secondary mb-5">
              Simulate changes in global weather and traffic density to dynamically adjust the system base surcharges, pricing multipliers, and maximum safety compliance speeds.
            </p>

            <form onSubmit={handleConfigSubmit} className="space-y-4">
              {/* Weather Input Select Wrapper */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-theme-text-secondary mb-2">Simulate Weather</label>
                <select
                  value={localWeather}
                  onChange={(e) => setLocalWeather(e.target.value as any)}
                  className="w-full bg-theme-bg border border-theme-border text-theme-text-primary font-medium px-4 py-3.5 rounded-xl text-sm focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10 outline-none transition"
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
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-theme-text-secondary mb-2">Simulate Traffic Congestion</label>
                <select
                  value={localTraffic}
                  onChange={(e) => setLocalTraffic(e.target.value as any)}
                  className="w-full bg-theme-bg border border-theme-border text-theme-text-primary font-medium px-4 py-3.5 rounded-xl text-sm focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10 outline-none transition"
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

          <div className="pt-5 mt-5 border-t border-theme-border flex items-center gap-3 bg-brand-emerald/5 p-4 rounded-xl border border-brand-emerald/10">
            <Shield className="w-5 h-5 text-brand-emerald shrink-0" />
            <div className="text-[11px] text-theme-text-secondary">
              ⚡ <strong>Compliance Auto-Trigger</strong> is ACTIVE. If real-time bike speed exceeds <strong>{currentLimits.speed} km/h</strong>, dynamic refund logic executes immediately.
            </div>
          </div>
        </div>

        {/* Real-time Custom SVG Surcharge factor plot (LG Col 8) */}
        <div className="lg:col-span-8 bg-theme-card border border-theme-border/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-emerald" />
                <h3 className="font-bold text-theme-text-primary">Dynamic Environmental Pricing Matrix</h3>
              </div>
              <span className="text-[11px] font-mono text-theme-text-secondary bg-theme-bg px-2.5 py-1 rounded-full font-semibold">Active Formula Simulation</span>
            </div>

            <p className="text-xs text-theme-text-secondary mb-6">
              Visualizes surcharge multipliers based on our Dynamic Pricing Framework. Current Base is modified by weather surcharges (+₹{currentLimits.surcharge}), while variable km/min fares are multiplied by the traffic multiplier factor.
            </p>

            {/* Custom SVG Bar Graph */}
            <div className="h-44 relative bg-slate-900/5 hover:bg-slate-900/[0.08] p-4 rounded-2xl border border-theme-border flex items-end justify-around gap-2.5 pt-10">
              
              {/* Dynamic Y Axis indicators */}
              <div className="absolute top-3 left-4 text-[10px] font-mono text-theme-text-secondary space-y-1">
                <div>💥 Surcharge Limit Factor: 3.5x max</div>
                <div>⚡ Running environment Surcharge: ₹{currentLimits.surcharge.toFixed(2)}</div>
              </div>

              {/* Bar 1: Weather surcharge */}
              <div className="flex-1 flex flex-col items-center group">
                <span className="text-[10px] font-mono font-bold text-theme-text-secondary group-hover:text-theme-text-primary transition mb-1 text-center">₹{currentLimits.surcharge}</span>
                <div 
                  className="w-full max-w-[50px] bg-sky-500 rounded-t-lg transition-all duration-500 hover:opacity-85 shadow"
                  style={{ height: `${Math.max(10, currentLimits.surcharge * 2.2)}px` }}
                />
                <span className="text-[10px] font-mono mt-2 font-medium text-theme-text-secondary truncate w-full text-center">Weather</span>
              </div>

              {/* Bar 2: Traffic Multiplier */}
              <div className="flex-1 flex flex-col items-center group">
                <span className="text-[10px] font-mono font-bold text-brand-emerald group-hover:text-theme-text-primary transition mb-1 text-center">
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
                <span className="text-[10px] font-mono mt-2 font-medium text-theme-text-secondary truncate w-full text-center">Traffic</span>
              </div>

              {/* Bar 3: Booking Multiplier Summary */}
              <div className="flex-1 flex flex-col items-center group">
                <span className="text-[10px] font-mono font-bold text-orange-500 group-hover:text-theme-text-primary transition mb-1 text-center">Combined</span>
                <div 
                  className="w-full max-w-[50px] bg-orange-400 rounded-t-lg transition-all duration-500 hover:opacity-85 shadow"
                  style={{ 
                    height: `${
                      Math.max(40, (100 + currentLimits.surcharge) * 0.7)
                    }px` 
                  }}
                />
                <span className="text-[10px] font-mono mt-2 font-medium text-theme-text-secondary truncate w-full text-center">Combined load</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-theme-bg border border-theme-border rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-theme-text-secondary font-bold">Dynamic Weather Factor</span>
              <p className="text-sm font-bold text-theme-text-primary mt-1">Surcharge: +₹{currentLimits.surcharge}.00</p>
            </div>
            <div className="p-4 bg-theme-bg border border-theme-border rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-theme-text-secondary font-bold">Traffic Pricing Factor</span>
              <p className="text-sm font-bold text-theme-text-primary mt-1">
                Multiplier: {config.traffic === 'Moderate' ? '1.1x' : config.traffic === 'Heavy Congestion' ? '1.3x' : config.traffic === 'Gridlock' ? '1.5x' : '1.0x'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Alert Feed Monitor (LG Col 4) & Active Rides Table (LG Col 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Rides Table Monitor (Aligned with Screenshot 1) */}
        <div id="recent-rides-panel" className="lg:col-span-8 bg-theme-card border border-theme-border/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-theme-border flex items-center justify-between">
            <h3 className="font-bold text-theme-text-primary text-lg">Recent Rides</h3>
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
                  <tr className="bg-theme-bg/40 border-b border-theme-border text-theme-text-secondary font-mono text-[10px] uppercase font-bold tracking-wider">
                    <th className="px-6 py-4">RIDE ID</th>
                    <th className="px-6 py-4">PICKUP</th>
                    <th className="px-6 py-4">DROP</th>
                    <th className="px-6 py-4">FARE</th>
                    <th className="px-6 py-4 text-center">STATUS</th>
                    <th className="px-6 py-4 text-center">PAYMENT</th>
                    <th className="px-6 py-4 text-center">RATING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/85">
                  {allRides.map((ride) => {
                    const ratingValue = ride.rating;
                    const paymentStatusValue = (ride.paymentStatus || 'pending').toLowerCase();

                    return (
                      <tr key={ride.id} className="hover:bg-theme-bg/30 transition duration-150">
                        <td className="px-6 py-4.5 font-mono font-bold text-theme-text-primary tracking-tight">{ride.id}</td>
                        <td className="px-6 py-4.5 font-sans font-medium text-theme-text-secondary">
                          <span className="truncate max-w-[180px] block">{ride.pickup}</span>
                        </td>
                        <td className="px-6 py-4.5 font-sans font-medium text-theme-text-secondary">
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
                          {paymentStatusValue === 'disputed' ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200/50 font-bold">
                              Disputed
                            </span>
                          ) : paymentStatusValue === 'paid' ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-600 font-bold">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-150/70 text-theme-text-secondary">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-center font-mono">
                          {ratingValue ? (
                            <span className="inline-flex items-center gap-1.5 justify-center">
                              <span className="text-amber-500 text-xs">★</span>
                              <span className="font-bold text-theme-text-primary">{ratingValue}</span>
                            </span>
                          ) : (
                            <span className="text-theme-text-secondary">—</span>
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
              <p className="font-semibold text-theme-text-primary text-sm">No active rides currently on board</p>
              <p className="text-xs text-theme-text-secondary max-w-[280px] mt-1 mx-auto">Toggle settings or book a simulated ride to spin up driver sensors.</p>
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
                    <div className="flex items-center justify-between mb-1.5 text-theme-text-secondary font-semibold uppercase">
                      <span>TYPE: {log.type.toUpperCase()}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-medium">{log.message}</div>
                    {log.rideId !== 'SYSTEM' && (
                      <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-slate-900 rounded text-[10px] text-theme-text-secondary font-bold">RIDE: {log.rideId}</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-theme-text-secondary text-xs flex flex-col items-center">
                <Bell className="w-8 h-8 text-theme-text-primary mb-2" />
                <span>Monitoring live telemetry links...</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-900 bg-slate-950/90 text-[10px] font-mono text-theme-text-secondary flex justify-between items-center">
            <span>Buffer Limit: 200 Logs</span>
            <span className="text-brand-emerald">Automatic Flush Active</span>
          </div>
        </div>

        {/* Payment Method Analytics Section */}
        <div className="lg:col-span-12 bg-theme-card border border-theme-border rounded-3xl p-6 shadow-sm mt-6">
          <div className="flex items-center gap-2 mb-4 border-b border-theme-border pb-3">
            <TrendingUp className="w-5 h-5 text-brand-emerald" />
            <h3 className="font-bold text-theme-text-primary text-base">Payment Method Analytics</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            
            {/* Summary statistics */}
            <div className="space-y-4 col-span-1 border-r border-theme-border pr-6">
              <div>
                <span className="text-[10px] text-theme-text-secondary font-mono uppercase block">Revenue Today</span>
                <span className="text-2xl font-black text-theme-text-primary font-mono">₹{getRevenueToday().toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-theme-text-secondary font-mono uppercase block">Successful Payments</span>
                <span className="text-xl font-bold text-emerald-600 font-mono">{successfulPaymentsCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-theme-text-secondary font-mono uppercase block">Pending Payments</span>
                <span className="text-xl font-bold text-amber-600 font-mono">{pendingPaymentsCount}</span>
              </div>
            </div>

            {/* Distribution bars */}
            <div className="col-span-3 space-y-3.5">
              <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-theme-text-secondary">App Share Distribution</span>
              
              {/* Google Pay */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-theme-text-primary flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Google Pay</span>
                  <span className="font-mono">{gpayStats.pct}% ({gpayStats.count})</span>
                </div>
                <div className="w-full bg-theme-bg rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${gpayStats.pct}%` }} />
                </div>
              </div>

              {/* PhonePe */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-theme-text-primary flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> PhonePe</span>
                  <span className="font-mono">{phonepeStats.pct}% ({phonepeStats.count})</span>
                </div>
                <div className="w-full bg-theme-bg rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${phonepeStats.pct}%` }} />
                </div>
              </div>

              {/* Paytm */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-theme-text-primary flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Paytm</span>
                  <span className="font-mono">{paytmStats.pct}% ({paytmStats.count})</span>
                </div>
                <div className="w-full bg-theme-bg rounded-full h-2">
                  <div className="bg-sky-500 h-2 rounded-full transition-all duration-500" style={{ width: `${paytmStats.pct}%` }} />
                </div>
              </div>

              {/* BHIM */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-theme-text-primary flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> BHIM</span>
                  <span className="font-mono">{bhimStats.pct}% ({bhimStats.count})</span>
                </div>
                <div className="w-full bg-theme-bg rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${bhimStats.pct}%` }} />
                </div>
              </div>

              {/* Amazon Pay & Others combined */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-theme-text-primary flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> Others (Amazon Pay, Cash, UPI)</span>
                  <span className="font-mono">{(amazonpayStats.pct + cashStats.pct + upiStats.pct + othersPct)}% ({amazonpayStats.count + cashStats.count + upiStats.count + othersCount})</span>
                </div>
                <div className="w-full bg-theme-bg rounded-full h-2">
                  <div className="bg-gray-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(amazonpayStats.pct + cashStats.pct + upiStats.pct + othersPct)}%` }} />
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
    );
  }

  // Find active passenger ride
  const passengerActiveRide = allRides.find(r => 
    ['booked', 'assigned', 'pickup', 'en_route', 'anomaly'].includes(r.status)
  );

  // Load saved locations for quick action cards
  const savedLocations = (() => {
    const saved = localStorage.getItem('zipride_saved_locations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: '1', label: 'Home', address: 'Indiranagar 100 Feet Boulevard, Bengaluru, KA' },
      { id: '2', label: 'Work', address: 'Cyber City Business Park, Gurugram, HR' }
    ];
  })();

  const handleQuickBook = (address: string) => {
    let pickup = 'Dadar Station, Mumbai';
    const addrLower = address.toLowerCase();
    if (addrLower.includes('bengaluru') || addrLower.includes('bangalore')) {
      pickup = 'Cubbon Park Rose Arch, Bengaluru, KA';
    } else if (addrLower.includes('gurugram') || addrLower.includes('delhi') || addrLower.includes('noida')) {
      pickup = 'Rajiv Chowk Metro Hub, Delhi, DL';
    } else if (addrLower.includes('coimbatore')) {
      pickup = 'Gandhipuram Town Central Bus Stand, Coimbatore, TN';
    } else if (addrLower.includes('chennai')) {
      pickup = 'Marina Beach Lighthouse point, Chennai, TN';
    }

    localStorage.setItem('zipride_rebook_pickup', pickup);
    localStorage.setItem('zipride_rebook_drop', address);
    onSelectTab('/booking');
  };

  // Use the same filter logic as RideHistoryView for consistency
  // Passengers see their own completed rides (or legacy rides without riderName)
  // Drivers see their own completed rides (or legacy rides without driverName)
  // Admins see all completed rides
  const HISTORY_STATUSES = ['completed', 'cancelled', 'disputed'];
  const completedRides = [...allRides].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Premium Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 md:p-8 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-40 h-40 bg-brand-emerald/10 rounded-full blur-2xl" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700/50 text-[11px] font-semibold text-brand-emerald">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Premium Bike Taxi Pool</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Good day, <span className="text-brand-emerald">{userName}</span>! 👋
            </h2>
            <p className="text-theme-text-secondary text-xs md:text-sm max-w-md">
              Where are we going today? Get a safe, fast, and comfortable ride in minutes.
            </p>
          </div>

          <button 
            onClick={() => onSelectTab('/booking')}
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-3 bg-brand-emerald hover:bg-brand-emerald-dark text-slate-950 font-bold rounded-2xl transition shadow-md hover:scale-[1.02] active:scale-[0.98] text-xs cursor-pointer"
          >
            <span>Book a Ride Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Surcharges & Weather Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider block font-mono">Weather</span>
            <span className="text-xs font-bold text-theme-text-primary block mt-0.5">
              {liveWeather ? `${liveWeather.temp}°C (${liveWeather.weatherText})` : config.weather}
            </span>
          </div>
        </div>

        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider block font-mono">Traffic Surcharge</span>
            <span className="text-xs font-bold text-theme-text-primary block mt-0.5">
              {config.traffic === 'Moderate' ? '1.1x Multiplier' : config.traffic === 'Heavy Congestion' ? '1.3x Multiplier' : config.traffic === 'Gridlock' ? '1.5x Multiplier' : '1.0x (Standard)'}
            </span>
          </div>
        </div>

        <div className="bg-theme-card border border-theme-border rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider block font-mono">Safety Compliance</span>
            <span className="text-xs font-bold text-theme-text-primary block mt-0.5">Limit: {currentLimits.speed} km/h</span>
          </div>
        </div>
      </div>

      {/* Active Ride Card (Pulsing state if active) */}
      {passengerActiveRide && (
        <div className="bg-gradient-to-r from-teal-500/5 to-emerald-500/5 border border-emerald-500/25 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald relative shrink-0">
              <span className="absolute inset-0 rounded-full bg-brand-emerald/20 animate-ping" />
              <Navigation className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-emerald/15 text-emerald-700">
                Trip In Progress
              </span>
              <h4 className="text-sm font-bold text-theme-text-primary mt-1">
                {passengerActiveRide.driverName ? `Riding with ${passengerActiveRide.driverName}` : 'Finding your driver...'}
              </h4>
              <p className="text-xs text-theme-text-secondary font-medium mt-1 line-clamp-1">
                Drop: {passengerActiveRide.drop}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onSelectTab('/tracker')}
            className="w-full md:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl transition shadow text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Track Live Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Booking Shortcuts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider font-mono">Quick Commute Locations</h3>
          <button 
            onClick={() => onSelectTab('/settings')}
            className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <span>Manage Shortcuts</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {savedLocations.map((loc: any) => (
            <button
              key={loc.id}
              onClick={() => handleQuickBook(loc.address)}
              className="bg-theme-card border border-theme-border/80 hover:border-brand-emerald hover:shadow-md hover:scale-[1.01] rounded-2xl p-5 text-left transition duration-200 flex flex-col justify-between h-36 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-brand-emerald/10 group-hover:border-brand-emerald/20 group-hover:text-brand-emerald transition duration-200">
                <Bookmark className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-theme-text-primary block">{loc.label}</span>
                <span className="text-[11px] text-theme-text-secondary font-medium block truncate mt-1">{loc.address}</span>
              </div>
            </button>
          ))}

          {/* Book custom ride trigger card */}
          <button
            onClick={() => onSelectTab('/booking')}
            className="bg-theme-bg border border-dashed border-theme-border hover:border-brand-emerald hover:bg-theme-card hover:shadow-md hover:scale-[1.01] rounded-2xl p-5 text-left transition duration-200 flex flex-col justify-between h-36 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-200/50 flex items-center justify-center text-theme-text-secondary shrink-0 group-hover:bg-brand-emerald/10 group-hover:border-brand-emerald/20 group-hover:text-brand-emerald transition duration-200">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-theme-text-primary block">Custom Booking</span>
              <span className="text-[11px] text-theme-text-secondary font-medium block mt-1">Enter any pickup and destination</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Rides Table */}
      <div className="bg-theme-card border border-theme-border rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-theme-border flex items-center justify-between">
          <h3 className="font-bold text-theme-text-primary text-sm uppercase tracking-wider font-mono">Recent Rides</h3>
          <button 
            onClick={() => onSelectTab('/history')}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <span>View All Trips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {completedRides.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-theme-bg/40 border-b border-theme-border text-theme-text-secondary font-mono text-[10px] uppercase font-bold tracking-wider">
                  <th className="px-6 py-4">RIDE ID</th>
                  <th className="px-6 py-4">PICKUP</th>
                  <th className="px-6 py-4">DESTINATION</th>
                  <th className="px-6 py-4">DRIVER</th>
                  <th className="px-6 py-4">FARE</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4">BOOKING TIME</th>
                  <th className="px-6 py-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/85">
                {completedRides.slice(0, 5).map((ride) => (
                  <tr key={ride.id} className="hover:bg-theme-bg/30 transition duration-150 cursor-pointer" onClick={() => onSelectTab('/history')}>
                    <td className="px-6 py-4 font-mono font-bold text-theme-text-primary tracking-tight">{ride.id}</td>
                    <td className="px-6 py-4 font-sans font-medium text-theme-text-secondary">
                      <span className="truncate max-w-[150px] block">{ride.pickup.split(',')[0]}</span>
                    </td>
                    <td className="px-6 py-4 font-sans font-medium text-theme-text-secondary">
                      <span className="truncate max-w-[150px] block">{ride.drop.split(',')[0]}</span>
                    </td>
                    <td className="px-6 py-4 font-sans font-medium text-theme-text-primary">
                      {ride.driverName || 'Finding Driver...'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-emerald">
                      ₹{ride.finalFare.toFixed(0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        ride.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : ride.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {ride.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-theme-text-secondary">
                      {new Date(ride.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(ride.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleQuickBook(ride.drop)}
                        className="px-3.5 py-1.5 bg-theme-bg border border-theme-border text-theme-text-primary hover:bg-theme-card font-bold rounded-xl transition text-[11px] cursor-pointer"
                      >
                        Rebook
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-theme-text-secondary text-xs">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span>No previous rides found. Start booking!</span>
          </div>
        )}
      </div>
    </div>
  );
}
