import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  IndianRupee,
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
  Calendar,
  Heart,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemState, Ride, SystemConfig } from '../types';
import { ZipRideRepository } from '../services/dbInterface';
import RideMatePanel from './RideMatePanel';
import { RoadIntelligenceView } from './RoadIntelligenceView';

// High-performance upward-counting stats counter
function AnimatedCounter({ value, duration = 1.0, formatter = (v: number) => String(Math.floor(v)) }: { value: number; duration?: number; formatter?: (v: number) => string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const totalMiliseconds = duration * 1000;
    const intervalTime = 30; // ~33fps
    const totalSteps = totalMiliseconds / intervalTime;
    const stepIncrement = (end - start) / totalSteps;

    let current = start;
    const timer = setInterval(() => {
      current += stepIncrement;
      if ((stepIncrement > 0 && current >= end) || (stepIncrement < 0 && current <= end)) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(current);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{formatter(displayValue)}</>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 80, damping: 14 } }
} as const;


interface DashboardViewProps {
  systemState: SystemState;
  allRides: Ride[];
  onUpdateConfig: (weather: SystemConfig['weather'], traffic: SystemConfig['traffic']) => Promise<void>;
  onSelectTab: (tab: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  userRole?: 'passenger' | 'driver' | 'admin' | null;
  userName?: string | null;
  onClearTrips?: () => Promise<void>;
}

export default function DashboardView({
  systemState,
  allRides,
  onUpdateConfig,
  onSelectTab,
  onRefresh,
  isLoading,
  userRole = 'passenger',
  userName = 'Saran',
  onClearTrips
}: DashboardViewProps) {
  const { config, activeCount, completedCount, revenue, overspeedCount, harshBrakeCount, recentAlerts } = systemState;

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'road_intel'>('overview');
  const [localWeather, setLocalWeather] = useState<SystemConfig['weather']>(config.weather);
  const [localTraffic, setLocalTraffic] = useState<SystemConfig['traffic']>(config.traffic);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [liveWeather, setLiveWeather] = useState<{ temp: number; weatherText: string } | null>(null);

  // Safety statistics & accessibility calculations (declared at top for access in both panels)
  const completedRides = [...allRides].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const womenRidesCount = allRides.filter(r => r.isWomenSafety).length;
  const childRidesCount = allRides.filter(r => r.isChildSafety).length;
  const familyRidesCount = allRides.filter(r => r.isFamilySafety).length;
  const totalSafetyRides = womenRidesCount + childRidesCount + familyRidesCount;

  const hazardsList = ZipRideRepository.getHazards();
  const potholesCount = hazardsList.filter(h => h.type === 'Pothole').length;
  const verifiedPotholes = hazardsList.filter(h => h.type === 'Pothole' && h.isVerified).length;
  const floodsCount = hazardsList.filter(h => h.type === 'Flood').length;
  const verifiedFloods = hazardsList.filter(h => h.type === 'Flood' && h.isVerified).length;
  const otherHazardsCount = hazardsList.filter(h => h.type !== 'Pothole' && h.type !== 'Flood').length;

  const accessibilityRidesCount = allRides.filter(r => r.isChildSafety).length + 2; // Simulated base

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
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        {/* Title block with refresh action */}
      <motion.div variants={cardVariants} className="flex items-center justify-between">
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
      </motion.div>

      {/* KPI Stats Grid */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI: Active Rides */}
        <div id="kpi-active" className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-theme-text-secondary">Active Rides</p>
            <h3 className="text-2xl font-bold text-theme-text-primary font-mono mt-0.5"><AnimatedCounter value={activeCount} /></h3>
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
              <AnimatedCounter value={successfulPaymentsCount} />
            </h3>
          </div>
        </div>

        {/* KPI: Revenue Today */}
        <div id="kpi-revenue" className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6 text-[#00C896]" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium tracking-wide uppercase text-theme-text-secondary">Revenue Today</p>
            <h3 className="text-2xl font-bold text-theme-text-primary font-mono mt-0.5">
              ₹<AnimatedCounter value={getRevenueToday()} formatter={(v) => v.toFixed(2)} />
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
              <AnimatedCounter value={pendingPaymentsCount} />
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
            <h3 className="text-2xl font-bold text-theme-text-primary font-mono mt-0.5"><AnimatedCounter value={overspeedCount + harshBrakeCount} /></h3>
          </div>
        </div>
      </motion.div>

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
        <div id="alerts-panel" className="lg:col-span-4 bg-theme-card border border-theme-border rounded-2xl flex flex-col justify-between overflow-hidden shadow-md text-theme-text-primary">
          <div className="p-5 border-b border-theme-border bg-theme-bg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-emerald rotate-12 shrink-0" />
              <h3 className="font-bold text-theme-text-primary text-sm">Live System Alarm Stream</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping shrink-0" />
          </div>

          <div className="flex-1 p-4 space-y-3 max-h-[300px] overflow-y-auto">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((log) => {
                let colorClass = 'border-theme-border bg-theme-bg/30 text-theme-text-primary';
                if (log.severity === 'high') colorClass = 'border-rose-300 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300';
                else if (log.severity === 'medium') colorClass = 'border-yellow-300 dark:border-yellow-950 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-300';
                else if (log.severity === 'critical') colorClass = 'border-red-400 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-200 animate-pulse';

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
                      <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-theme-bg border border-theme-border rounded text-[10px] text-theme-text-secondary font-bold">RIDE: {log.rideId}</span>
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

          <div className="p-4 border-t border-theme-border bg-theme-bg text-[10px] font-mono text-theme-text-secondary flex justify-between items-center">
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

        {/* RideMate Advanced Impact & Admin Analytics Dashboard */}
        <div className="lg:col-span-12 bg-theme-card border border-theme-border rounded-3xl p-6 shadow-sm mt-6 text-theme-text-secondary">
          <div className="flex items-center justify-between mb-4 border-b border-theme-border pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
              <h3 className="font-bold text-theme-text-primary text-base">RideMate Platform Impact & Admin Analytics</h3>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Ecosystem Dashboard
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Safety & Accessibility Analytics */}
            <div className="space-y-4 border-r border-theme-border pr-6">
              <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">🛡️ Safety & Accessibility Analytics</span>
              
              <div className="space-y-3">
                {/* Women Safety */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-theme-text-primary">Women Safety Rides</span>
                    <span className="font-mono text-theme-text-secondary">{womenRidesCount} rides</span>
                  </div>
                  <div className="w-full bg-theme-bg rounded-full h-1.5 border border-theme-border">
                    <div className="bg-pink-500 h-1.5 rounded-full animate-pulse" style={{ width: `${Math.min(100, (womenRidesCount / (allRides.length || 1)) * 100)}%` }} />
                  </div>
                </div>

                {/* Child Safety */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-theme-text-primary">Child Safety Rides (Verification)</span>
                    <span className="font-mono text-theme-text-secondary">{childRidesCount} rides</span>
                  </div>
                  <div className="w-full bg-theme-bg rounded-full h-1.5 border border-theme-border">
                    <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (childRidesCount / (allRides.length || 1)) * 100)}%` }} />
                  </div>
                </div>

                {/* Accessibility Support */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-theme-text-primary">Accessibility Support Dispatches</span>
                    <span className="font-mono text-theme-text-secondary">{accessibilityRidesCount} rides</span>
                  </div>
                  <div className="w-full bg-theme-bg rounded-full h-1.5 border border-theme-border">
                    <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (accessibilityRidesCount / (allRides.length || 1)) * 100)}%` }} />
                  </div>
                </div>

                {/* Guardian Alerts */}
                <div className="flex justify-between items-center text-xs font-semibold bg-theme-bg/40 p-2.5 rounded-xl border border-theme-border">
                  <span className="text-theme-text-secondary">Guardian Alerts Sent</span>
                  <span className="font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-bold">{totalSafetyRides * 2 + 1} alerts</span>
                </div>
              </div>
            </div>

            {/* Column 2: Road Intelligence & Emergency Statistics */}
            <div className="space-y-4 md:border-r border-theme-border md:px-6">
              <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-650 dark:text-emerald-400">🛣️ Road Intelligence & Emergencies</span>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-theme-border pb-2">
                  <span className="text-theme-text-secondary">Reported Potholes (Verified / Total):</span>
                  <span className="font-bold text-theme-text-primary font-mono">{verifiedPotholes} / {potholesCount}</span>
                </div>
                <div className="flex justify-between border-b border-theme-border pb-2">
                  <span className="text-theme-text-secondary">Reported Floods (Verified / Total):</span>
                  <span className="font-bold text-theme-text-primary font-mono">{verifiedFloods} / {floodsCount}</span>
                </div>
                <div className="flex justify-between border-b border-theme-border pb-2">
                  <span className="text-theme-text-secondary">Other Community Hazards:</span>
                  <span className="font-bold text-theme-text-primary font-mono">{otherHazardsCount} reports</span>
                </div>
                
                {/* Emergency Stats block */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-theme-bg p-2.5 rounded-xl border border-theme-border text-center">
                    <span className="text-[9px] uppercase font-mono text-theme-text-secondary font-bold block">Active SOS Alerts</span>
                    <span className="text-lg font-bold text-rose-500 font-mono mt-0.5 block">{allRides.filter(r => r.hasActiveSOS).length}</span>
                  </div>
                  <div className="bg-theme-bg p-2.5 rounded-xl border border-theme-border text-center">
                    <span className="text-[9px] uppercase font-mono text-theme-text-secondary font-bold block">Compliance Alerts</span>
                    <span className="text-lg font-bold text-amber-500 font-mono mt-0.5 block">{overspeedCount + harshBrakeCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Platform Impact Metrics & Score */}
            <div className="space-y-4 md:pl-6">
              <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-brand-emerald">⛽ Environmental & Platform Savings</span>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-theme-text-secondary">Travel Time Saved:</span>
                  <span className="font-bold font-mono text-brand-emerald">{(completedRides.length * 4.5).toFixed(0)} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-text-secondary">Estimated Fuel Saved:</span>
                  <span className="font-bold font-mono text-brand-emerald">{(completedRides.length * 0.35).toFixed(2)} Liters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-text-secondary">CO₂ Emissions Reduced:</span>
                  <span className="font-bold font-mono text-brand-emerald">{(completedRides.length * 0.82).toFixed(2)} kg</span>
                </div>

                {/* Weighted Platform Impact Score */}
                <div className="mt-3.5 bg-gradient-to-br from-indigo-500/5 to-theme-bg border border-indigo-500/20 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-indigo-650 dark:text-indigo-400 font-extrabold block">Platform Impact Score</span>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-2xl font-black text-theme-text-primary tracking-tight">
                      {((completedRides.length * 4.5 * 0.1) + (completedRides.length * 0.35 * 2) + (completedRides.length * 0.82 * 1.5) + (totalSafetyRides * 5) + (accessibilityRidesCount * 3) + 15).toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 font-mono uppercase animate-pulse">HIGH IMPACT</span>
                  </div>
                  <p className="text-[9px] text-theme-text-secondary mt-1">Weighted metric index of travel savings, carbon reduction, and safety activations</p>
                </div>
              </div>
            </div>

          </div>
          
          {/* Driver Leaderboard in Admin Dashboard */}
          <div className="mt-6 pt-6 border-t border-theme-border">
            <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-theme-text-secondary mb-3">⭐ Active Driver Reputation Leaderboard</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Rajesh Kumar', score: 98, trips: 24, compliance: '100% compliant' },
                { name: 'Karthik Raja', score: 94, trips: 18, compliance: '96% compliant' },
                { name: 'Siva Murugan', score: 91, trips: 15, compliance: '94% compliant' }
              ].map((drv, idx) => (
                <div key={idx} className="bg-theme-bg p-3.5 rounded-2xl border border-theme-border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold block text-theme-text-primary">#{idx+1} {drv.name}</span>
                    <span className="text-[10px] text-theme-text-secondary">{drv.trips} rides • {drv.compliance}</span>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded text-center">
                    <span className="font-black text-indigo-650 dark:text-indigo-400 block font-mono">{drv.score}</span>
                    <span className="text-[8px] uppercase text-indigo-650 dark:text-indigo-400 font-bold block">Score</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
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

  const handleRebook = (pickup: string, drop: string) => {
    localStorage.setItem('zipride_rebook_pickup', pickup);
    localStorage.setItem('zipride_rebook_drop', drop);
    onSelectTab('/booking');
  };

  // Use the same filter logic as RideHistoryView for consistency
  // Passengers see their own completed rides (or legacy rides without riderName)
  // Drivers see their own completed rides (or legacy rides without driverName)
  // Admins see all completed rides
  const HISTORY_STATUSES = ['completed', 'cancelled', 'disputed'];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      {/* Premium Welcome Banner */}
      <motion.div variants={cardVariants} className="relative overflow-hidden rounded-3xl bg-theme-card border border-theme-border text-theme-text-primary p-6 md:p-8 shadow-sm">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-40 h-40 bg-brand-emerald/10 rounded-full blur-2xl" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-theme-bg border border-theme-border text-[11px] font-semibold text-brand-emerald">
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
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-3 bg-brand-emerald hover:bg-brand-emerald-dark text-slate-950 font-bold rounded-2xl transition shadow-md hover:scale-[1.02] active:scale-[0.98] text-xs cursor-pointer border-0"
          >
            <span>Book a Ride Now</span>
            <ArrowRight className="w-4 h-4 animate-pulse" />
          </button>
        </div>
      </motion.div>

      {/* Sub-tab navigation */}
      <motion.div variants={cardVariants} className="flex border-b border-theme-border pb-px gap-6">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`py-2 text-xs font-bold font-mono border-b-2 transition ${
            activeSubTab === 'overview'
              ? 'border-brand-emerald text-brand-emerald'
              : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          Operations & Booking
        </button>
        <button
          onClick={() => setActiveSubTab('road_intel')}
          className={`py-2 text-xs font-bold font-mono border-b-2 transition ${
            activeSubTab === 'road_intel'
              ? 'border-brand-emerald text-brand-emerald'
              : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          Community Road Intelligence
        </button>
      </motion.div>

      {activeSubTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Content Column (Left, span 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Current Ride Overview */}
            {passengerActiveRide ? (
              <div className="bg-gradient-to-r from-teal-500/5 to-emerald-500/5 border border-emerald-500/25 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald relative shrink-0">
                    <span className="absolute inset-0 rounded-full bg-brand-emerald/20 animate-ping" />
                    <Navigation className="w-6 h-6 rotate-45" />
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-emerald/15 text-emerald-700">
                      Active Trip
                    </span>
                    <h4 className="text-sm font-bold text-theme-text-primary mt-1">
                      {passengerActiveRide.driverName ? `Riding with ${passengerActiveRide.driverName}` : 'Finding your driver...'}
                    </h4>
                    <p className="text-xs text-theme-text-secondary font-medium mt-1 line-clamp-1">
                      Drop Target: {passengerActiveRide.drop}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => onSelectTab('/tracker')}
                  className="w-full md:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow text-xs flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  <span>Track Live Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-xs flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-150">
                    Ride Status
                  </span>
                  <h4 className="text-base font-bold text-theme-text-primary mt-1">No Active Ride</h4>
                  <p className="text-xs text-theme-text-secondary font-medium">Ready for your next trip? Enter your destinations to view fares and routes.</p>
                </div>
                <button
                  onClick={() => onSelectTab('/booking')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Book Ride
                </button>
              </div>
            )}

            {/* 7. Saved Places */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider font-mono">Saved Places</h3>
                <button 
                  onClick={() => onSelectTab('/settings')}
                  className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Manage presets
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

                <button
                  onClick={() => onSelectTab('/booking')}
                  className="bg-theme-bg border border-dashed border-theme-border hover:border-brand-emerald hover:bg-theme-card hover:shadow-md hover:scale-[1.01] rounded-2xl p-5 text-left transition duration-200 flex flex-col justify-between h-36 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-200/50 flex items-center justify-center text-theme-text-secondary shrink-0 group-hover:bg-brand-emerald/10 group-hover:border-brand-emerald/20 group-hover:text-brand-emerald transition duration-200">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-theme-text-primary block">Custom Destination</span>
                    <span className="text-[11px] text-theme-text-secondary font-medium block mt-1">Enter any pickup and drop coords</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 6. Recent Trips (Recent Rides) */}
            <div className="bg-theme-card border border-theme-border rounded-3xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-theme-border flex items-center justify-between">
                <h3 className="font-bold text-theme-text-primary text-sm uppercase tracking-wider font-mono">Recent Trips</h3>
                <div className="flex items-center gap-4">
                  {completedRides.length > 0 && (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Clear All Trips
                    </button>
                  )}
                  <button 
                    onClick={() => onSelectTab('/history')}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Trips</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                              onClick={() => handleRebook(ride.pickup, ride.drop)}
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

          {/* Right Column: AI RideMate, Travel updates & Emergency monitor (Right, span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 10. AI RideMate Panel */}
            <RideMatePanel 
              weatherCondition={liveWeather ? liveWeather.weatherText : config.weather}
              trafficLevel={config.traffic}
              activeRide={passengerActiveRide}
              driverMode={false}
            />

            {/* Travel Intelligence Updates Dashboard Card */}
            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-theme-text-primary uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-theme-border pb-3">
                <Shield className="w-4.5 h-4.5 text-indigo-500" />
                <span>Live Travel Conditions</span>
              </h4>
              
              <div className="space-y-4 text-xs font-semibold leading-relaxed">
                
                {/* 5. Safety Monitor */}
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-3">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 block uppercase font-mono">Safety Monitor</span>
                    <span className="text-theme-text-primary text-[11px] block mt-0.5">No incidents reported on your active routes.</span>
                  </div>
                </div>

                {/* 2. Traffic Update */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3">
                  <span className="text-lg">🚦</span>
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 block uppercase font-mono">Traffic Update</span>
                    <span className="text-theme-text-primary text-[11px] block mt-0.5">
                      {config.traffic === 'Light' ? 'Light traffic flows. Main city corridors clear.' : 
                       `Moderate congestion near Gandhipuram. Traffic index: ${config.traffic}.`}
                    </span>
                  </div>
                </div>

                {/* 3. Weather Update */}
                <div className="p-3 bg-sky-500/5 border border-sky-500/10 rounded-xl flex gap-3">
                  <span className="text-lg">🌦️</span>
                  <div>
                    <span className="text-[10px] font-bold text-sky-600 block uppercase font-mono">Weather Update</span>
                    <span className="text-theme-text-primary text-[11px] block mt-0.5">
                      {config.weather === 'Clear' ? 'Clear skies. Optimal road grip.' : 
                       `Weather condition is ${config.weather}. Drive carefully.`}
                    </span>
                  </div>
                </div>

                {/* 4. Road Conditions */}
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-3">
                  <span className="text-lg">🛣️</span>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 block uppercase font-mono">Road Conditions</span>
                    <span className="text-theme-text-primary text-[11px] block mt-0.5">
                      {hazardsList.length > 0 ? `${hazardsList.length} road hazards reported near active paths.` : 'Road conditions clean. No delays.'}
                    </span>
                  </div>
                </div>

                {/* 8. Family Tracking */}
                <div className="p-3 bg-pink-500/5 border border-pink-500/10 rounded-xl flex gap-3">
                  <span className="text-lg">👨‍👩‍👧</span>
                  <div>
                    <span className="text-[10px] font-bold text-pink-600 block uppercase font-mono">Family Tracking</span>
                    <span className="text-theme-text-primary text-[11px] block mt-0.5">
                      {ZipRideRepository.getProfile().guardianName ? `Alerts linked to guardian: ${ZipRideRepository.getProfile().guardianName}.` : 'Guardian sync is inactive.'}
                    </span>
                  </div>
                </div>

                {/* 9. Emergency Services Nearby */}
                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex gap-3">
                  <span className="text-lg">🏥</span>
                  <div>
                    <span className="text-[10px] font-bold text-rose-600 block uppercase font-mono">Emergency Services Nearby</span>
                    <span className="text-theme-text-primary text-[11px] block mt-0.5">City emergency dispatch clinic active. SOS armed.</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <RoadIntelligenceView />
        </div>
      )}

      {/* TRIP CLEAR CONFIRMATION MODAL OVERLAY */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-theme-card border border-theme-border rounded-3xl p-6 shadow-2xl space-y-5 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-bold text-theme-text-primary">Clear Trip History</h3>
                <p className="text-xs text-theme-text-secondary leading-relaxed">
                  Are you sure you want to clear all trip history? This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 bg-theme-bg border border-theme-border text-theme-text-primary hover:bg-theme-hover-bg font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowClearConfirm(false);
                    if (onClearTrips) {
                      await onClearTrips();
                    }
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-rose-600/10"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
