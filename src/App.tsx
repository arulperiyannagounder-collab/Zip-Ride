import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  Menu, 
  X, 
  RefreshCw, 
  CloudSun, 
  Navigation,
  Shield,
  Activity
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import BookingView from './components/BookingView';
import DriverConsoleView from './components/DriverConsoleView';
import RideTrackerView from './components/RideTrackerView';
import DisputesView from './components/DisputesView';
import FarePolicyView from './components/FarePolicyView';
import LoginView from './components/LoginView';
import NotFoundView from './components/NotFoundView';
import { SystemState, Ride, Dispute, SystemConfig } from './types';

export default function App() {
  // Path Router Configuration matching precisely /login, /, /booking, etc.
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Administrative login session state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('zipride_logged');
    // Default to false for first-time viewers so the login form pops up automatically
    return saved !== null ? saved === 'true' : false;
  });
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    const savedLogged = localStorage.getItem('zipride_logged');
    const isLogged = savedLogged !== null ? savedLogged === 'true' : false;
    return isLogged ? (localStorage.getItem('zipride_user') || 'Arul') : null;
  });

  // Global Backend Polled States
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);
  const [systemState, setSystemState] = useState<SystemState>({
    config: { weather: 'Clear', traffic: 'Light' },
    activeCount: 0,
    completedCount: 0,
    revenue: 0,
    overspeedCount: 0,
    harshBrakeCount: 0,
    recentAlerts: []
  });
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  // Derived states
  const activeRide = allRides.find(r => ['booked', 'assigned', 'pickup', 'en_route', 'anomaly'].includes(r.status)) || null;

  // 1. FETCH SYSTEM DATA
  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [stateRes, ridesRes, disputesRes] = await Promise.all([
        fetch('/api/system-state'),
        fetch('/api/rides'),
        fetch('/api/disputes')
      ]);

      if (stateRes.ok && ridesRes.ok && disputesRes.ok) {
        const stateData = await stateRes.json();
        const ridesData = await ridesRes.json();
        const disputesData = await disputesRes.json();
        
        setSystemState(stateData);
        setAllRides(ridesData);
        setDisputes(disputesData);
        setIsServerConnected(true);
      } else {
        setIsServerConnected(false);
      }
    } catch (e) {
      console.warn('Temporary connection loss during poll:', e);
      setIsServerConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Mount effects + Periodic server synchronization checks
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Force login view redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn && currentPath !== '/login') {
      selectTab('/login');
    }
  }, [isLoggedIn, currentPath]);

  // 2. ENVIRONMENT ACTION TRIGGERS
  const updateConfig = async (weather: SystemConfig['weather'], traffic: SystemConfig['traffic']) => {
    try {
      const res = await fetch('/api/system-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weather, traffic })
      });
      if (res.ok) {
        await fetchAllData(true);
      }
    } catch (e) {
      console.error('Failed to commit config settings:', e);
    }
  };

  // 3. BOOK RIDE ACTION
  const handleBookRide = async (
    pickup: string, 
    drop: string, 
    paymentMethod: 'UPI' | 'Wallet' | 'Card',
    extraData?: {
      distanceKm?: number;
      durationMin?: number;
      weatherType?: string;
      trafficType?: string;
      initialFare?: number;
      gpsLat?: number;
      gpsLng?: number;
    }
  ) => {
    const res = await fetch('/api/rides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup, drop, paymentMethod, ...extraData })
    });
    const data = await res.json();
    await fetchAllData(true);
    return data;
  };

  // 4. DRIVER ACCEPT ACTION
  const handleAcceptRide = async (id: string) => {
    const res = await fetch(`/api/rides/${id}/accept`, { method: 'POST' });
    if (res.ok) {
      await fetchAllData(true);
    }
  };

  // 5. DRIVER TELEMETRY BROADCASTER ACTION
  const handleSendTelemetry = async (id: string, data: any) => {
    const res = await fetch(`/api/rides/${id}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const updatedRide = await res.json();
      setAllRides(prev => prev.map(r => r.id === id ? updatedRide : r));
    }
  };

  // 6. DETECT COMPLETE ACTION
  const handleCompleteRide = async (id: string) => {
    const res = await fetch(`/api/rides/${id}/complete`, { method: 'POST' });
    if (res.ok) {
      await fetchAllData(true);
    }
  };

  // 7. FILE REPORT DISPUTE COMPLAINT
  const handleFileDispute = async (rideId: string, reason: string) => {
    const res = await fetch(`/api/rides/${rideId}/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (res.ok) {
      await fetchAllData(true);
    }
  };

  // 8. RESOLVE TICKET DISPUTE ACTION
  const handleResolveDispute = async (id: string, status: 'resolved' | 'rejected', refundAmount: number) => {
    const res = await fetch(`/api/disputes/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, refundAmount })
    });
    if (res.ok) {
      await fetchAllData(true);
    }
  };

  // Route selection and window pushstate sync
  const selectTab = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    setMobileMenuOpen(false);
  };

  // Sync state when back/forward history buttons are clicked
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginSuccess = (email: string) => {
    localStorage.setItem('zipride_logged', 'true');
    localStorage.setItem('zipride_user', email);
    setIsLoggedIn(true);
    setCurrentUser(email);
    selectTab('/');
  };

  const handleLogout = () => {
    localStorage.setItem('zipride_logged', 'false');
    localStorage.removeItem('zipride_user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    selectTab('/login');
  };

  // Safe navigation mapping labels
  const getTabLabel = () => {
    switch (currentPath) {
      case '/': return 'Operations & Dynamic Pricing Monitor';
      case '/booking': return 'Dynamic Booking Desk';
      case '/driver': return 'Simulated Pilot Telemetry Desk';
      case '/tracker': return 'Ride Safety Shield Tracker';
      case '/disputes': return 'AI Legal Dispute Adjudicator';
      case '/fares': return 'ZipRide Dynamic Fare Parameters';
      case '/login': return 'Administrative Auth Portal';
      case '/404': return 'Destination Unresolvable (Route Error)';
      default: return 'Custom Route Console';
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans antialiased">
      
      {/* Sidebar Core Element (Hidden on mobile) */}
      <Sidebar 
        activeTab={currentPath} 
        onSelectTab={selectTab} 
        systemConfig={systemState.config} 
      />

      {/* Main Container Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Top Floating Responsive TaskBar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-xs">
          
          {/* Mobile responsive drawer toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 focus:outline-none shrink-0"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <div className="flex items-center gap-2">
              <span className="md:hidden w-7 h-7 bg-brand-emerald/10 text-brand-emerald rounded flex items-center justify-center shrink-0">
                <Bike className="w-4.5 h-4.5" />
              </span>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight leading-none">{getTabLabel()}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold pr-1">
            {isLoading && (
              <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                <RefreshCw className="w-3 h-3 animate-spin text-brand-emerald" />
                refreshing...
              </span>
            )}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-slate-400">Environment Node:</span>
              <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border transition-colors duration-300 ${
                isServerConnected 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80' 
                  : 'bg-rose-50 text-rose-500 border-rose-200 animate-pulse'
              }`}>
                {isServerConnected ? 'MUTEX_ONLINE' : 'RECONNECTING'}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Responsive Navigation Draw overlay if open */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 text-slate-300 absolute top-14 left-0 right-0 z-50 p-4 border-b border-slate-900 shadow-md flex flex-col gap-1.5 animate-fadeIn">
            {[
              { path: '/login', label: '/login (Auth Portal)' },
              { path: '/', label: '/ (Operations Dashboard)' },
              { path: '/booking', label: '/booking (Book a Ride)' },
              { path: '/driver', label: '/driver (Driver Console)' },
              { path: '/tracker', label: '/tracker (Ride Tracker)' },
              { path: '/disputes', label: '/disputes (Disputes Console)' },
              { path: '/fares', label: '/fares (Fare Policy)' },
              { path: '/404', label: '/404 (Route Tester)' }
            ].map(item => (
              <button
                key={item.path}
                onClick={() => selectTab(item.path)}
                className={`w-full py-3 px-4 rounded-xl text-left text-xs font-mono font-bold transition flex items-center justify-between ${
                  currentPath === item.path ? 'bg-brand-emerald/10 text-brand-emerald font-extrabold' : 'hover:bg-slate-900 text-slate-400'
                }`}
              >
                <span>{item.label}</span>
                {currentPath === item.path && <span className="text-[10px] text-brand-emerald font-sans">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Center Canvas */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* Main Router Switch Case */}
          {currentPath === '/login' && (
            <LoginView 
              onLoginSuccess={handleLoginSuccess}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}

          {currentPath === '/' && (
            <DashboardView 
              systemState={systemState} 
              allRides={allRides}
              onUpdateConfig={updateConfig} 
              onSelectTab={selectTab}
              onRefresh={fetchAllData}
              isLoading={isLoading}
            />
          )}

          {currentPath === '/booking' && (
            <BookingView 
              systemConfig={systemState.config}
              onBookRide={handleBookRide} 
              onSelectTab={selectTab}
            />
          )}

          {currentPath === '/driver' && (
            <DriverConsoleView 
              activeRide={activeRide}
              onAcceptRide={handleAcceptRide}
              onSendTelemetry={handleSendTelemetry}
              onCompleteRide={handleCompleteRide}
              onRefresh={fetchAllData}
              systemConfig={systemState.config}
            />
          )}

          {currentPath === '/tracker' && (
            <RideTrackerView 
              activeRide={activeRide}
              onRefresh={fetchAllData}
              onFileDispute={handleFileDispute}
            />
          )}

          {currentPath === '/disputes' && (
            <DisputesView 
              disputes={disputes}
              onResolveDispute={handleResolveDispute}
            />
          )}

          {currentPath === '/fares' && (
            <FarePolicyView />
          )}

          {currentPath === '/404' && (
            <NotFoundView 
              onGoHome={() => selectTab('/')}
              currentPath={currentPath}
            />
          )}

          {/* Fallback client-side matching for non-registered paths */}
          {!['/', '/booking', '/driver', '/tracker', '/disputes', '/fares', '/login', '/404'].includes(currentPath) && (
            <NotFoundView 
              onGoHome={() => selectTab('/')}
              currentPath={currentPath}
            />
          )}
        </main>
      </div>

    </div>
  );
}
