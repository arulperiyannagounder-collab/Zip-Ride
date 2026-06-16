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
import SettingsView from './components/SettingsView';
import RideHistoryView from './components/RideHistoryView';
import ErrorBoundary from './components/ErrorBoundary';
import AiAssistantView from './components/AiAssistantView';
import AiAssistantWidget from './components/AiAssistantWidget';
import { SystemState, Ride, Dispute, SystemConfig, Driver } from './types';
import { useTheme } from './components/ThemeContext';
import { useToast } from './components/ToastNotification';

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
    return isLogged ? (localStorage.getItem('zipride_user') || 'Saran') : null;
  });
  const [currentUserRole, setCurrentUserRole] = useState<'passenger' | 'driver' | 'admin' | null>(() => {
    const savedLogged = localStorage.getItem('zipride_logged');
    const isLogged = savedLogged !== null ? savedLogged === 'true' : false;
    return isLogged ? (localStorage.getItem('zipride_role') as any || 'passenger') : null;
  });

  // Global Theme Context Hook
  const { theme, setTheme } = useTheme();

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
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);

  const { showToast } = useToast();
  
  // Track status transitions to show toasts
  const [prevRideStatuses, setPrevRideStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    allRides.forEach(ride => {
      const prevStatus = prevRideStatuses[ride.id];
      if (prevStatus && prevStatus !== ride.status) {
        // Status transitioned!
        if (ride.status === 'assigned') {
          showToast(`Driver ${ride.driverName || 'assigned'} is on their way!`, 'success');
        } else if (ride.status === 'pickup') {
          showToast(`Driver has arrived at your pickup location.`, 'info');
        } else if (ride.status === 'en_route') {
          showToast(`Ride started. Driving safely to destination.`, 'info');
        } else if (ride.status === 'completed') {
          showToast(`Commute complete. Final Fare: ₹${ride.finalFare.toFixed(0)}`, 'success');
        } else if (ride.status === 'cancelled') {
          showToast(`Ride was cancelled.`, 'warning');
        }
      }
    });

    // Update status map
    const newStatuses: Record<string, string> = {};
    allRides.forEach(r => {
      newStatuses[r.id] = r.status;
    });
    setPrevRideStatuses(newStatuses);
  }, [allRides, prevRideStatuses, showToast]);

  // Derived states
  const activeRide = allRides.find(r => {
    const activeStatuses = ['booked', 'accepted', 'assigned', 'pickup', 'en_route', 'arrived', 'anomaly', 'in_progress'];
    const isDismissedByDriver = localStorage.getItem(`zipride_dismissed_driver_ride_${r.id}`) === 'true';
    const isCompletedAndUnpaid = r.status === 'completed' && r.paymentStatus !== 'paid';
    const isCompletedAndPendingDriverSettle = r.status === 'completed' && !isDismissedByDriver;
    
    if (currentUserRole === 'driver') {
      return r.driverName === currentUser && (activeStatuses.includes(r.status) || isCompletedAndPendingDriverSettle);
    }
    if (currentUserRole === 'passenger') {
      return r.riderName === currentUser && (activeStatuses.includes(r.status) || r.status === 'completed' || r.status === 'cancelled');
    }
    return activeStatuses.includes(r.status) || r.status === 'completed' || r.status === 'cancelled';
  }) || null;

  console.log("Current Rides:", allRides);

  // 1. FETCH SYSTEM DATA
  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [stateRes, ridesRes, disputesRes, driversRes] = await Promise.all([
        fetch('/api/system-state'),
        fetch('/api/rides'),
        fetch('/api/disputes'),
        fetch('/api/drivers')
      ]);

      if (stateRes.ok && ridesRes.ok && disputesRes.ok) {
        const stateData = await stateRes.json();
        const ridesData = await ridesRes.json();
        const disputesData = await disputesRes.json();
        
        setSystemState(stateData);
        setAllRides(ridesData);
        setDisputes(disputesData);
        if (driversRes.ok) {
          const driversData = await driversRes.json();
          setAllDrivers(driversData);
        }
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

  // Enforce Protected Routing
  useEffect(() => {
    // 1. If not logged in and not on /login, redirect to /login
    if (!isLoggedIn) {
      if (currentPath !== '/login') {
        selectTab('/login');
      }
      return;
    }

    // 2. If logged in and on /login, redirect to role home
    if (isLoggedIn && currentPath === '/login') {
      if (currentUserRole === 'driver') {
        selectTab('/driver');
      } else {
        selectTab('/');
      }
      return;
    }

    // 3. Role-based route authorization
    if (currentUserRole === 'passenger') {
      const allowedPaths = ['/', '/booking', '/tracker', '/fares', '/history', '/settings', '/ai-assistant'];
      if (!allowedPaths.includes(currentPath)) {
        selectTab('/');
      }
    } else if (currentUserRole === 'driver') {
      const allowedPaths = ['/driver', '/settings', '/ai-assistant'];
      if (!allowedPaths.includes(currentPath)) {
        selectTab('/driver');
      }
    } else if (currentUserRole === 'admin') {
      // Admin has access to all routes
    }
  }, [isLoggedIn, currentPath, currentUserRole]);

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
      vehicleType?: string;
    }
  ) => {
    const res = await fetch('/api/rides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        pickup, 
        drop, 
        paymentMethod, 
        riderName: currentUser || 'Saran',
        ...extraData 
      })
    });
    const createdRide = await res.json();
    console.log("Created Ride:", createdRide);
    setAllRides(prev => [createdRide, ...prev]);
    showToast("Booking successful! Finding a driver...", "success");
    fetchAllData(true);
    return createdRide;
  };

  // 4. DRIVER ACCEPT ACTION
  const handleAcceptRide = async (id: string) => {
    const res = await fetch(`/api/rides/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverName: currentUser })
    });
    if (res.ok) {
      showToast("Ride accepted. Starting route!", "success");
      await fetchAllData(true);
    } else {
      showToast("Failed to accept ride.", "error");
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
      showToast("Commute completed successfully!", "success");
      await fetchAllData(true);
    } else {
      showToast("Failed to complete ride.", "error");
    }
  };

  // 6.5 DETECT CANCEL ACTION
  const handleCancelRide = async (id: string) => {
    const res = await fetch(`/api/rides/${id}/cancel`, { method: 'POST' });
    if (res.ok) {
      showToast("Ride cancelled.", "info");
      await fetchAllData(true);
    } else {
      showToast("Failed to cancel ride.", "error");
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
      showToast("Dispute ticket filed successfully.", "success");
      await fetchAllData(true);
    } else {
      showToast("Failed to file dispute ticket.", "error");
    }
  };

  // 7.5 RATE COMMUTE RIDE ACTION
  const handleRateRide = async (id: string, rating: number) => {
    const res = await fetch(`/api/rides/${id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating })
    });
    if (res.ok) {
      showToast("Driver rating submitted. Thank you!", "success");
      await fetchAllData(true);
    } else {
      showToast("Failed to submit rating.", "error");
    }
  };

  const handleRebook = (pickup: string, drop: string) => {
    localStorage.setItem('zipride_rebook_pickup', pickup);
    localStorage.setItem('zipride_rebook_drop', drop);
    selectTab('/booking');
  };

  const handlePayRide = async (id: string, reference?: string, method: string = 'UPI', status: string = 'paid') => {
    const res = await fetch(`/api/rides/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentReference: reference, paymentMethod: method, paymentStatus: status })
    });
    if (res.ok) {
      if (status === 'paid') {
        showToast("Payment successful! Ride status: Paid", "success");
      } else if (status === 'processing') {
        showToast("Payment processing initiated...", "info");
      } else if (status === 'failed') {
        showToast("Payment failed. Please try again.", "error");
      }
      await fetchAllData(true);
    } else {
      showToast("Payment processing failed.", "error");
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
      showToast(`Dispute resolved. Refund of ₹${refundAmount} processed.`, "success");
      await fetchAllData(true);
    } else {
      showToast("Failed to resolve dispute.", "error");
    }
  };

  // 9. PUSH DRIVER LOCATION
  const handlePushDriverLocation = async (rideId: string, lat: number, lng: number) => {
    try {
      await fetch(`/api/rides/${rideId}/driver-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
    } catch (e) {
      console.warn('Driver location push failed:', e);
    }
  };

  // 10. PUSH RIDER LOCATION
  const handlePushRiderLocation = async (rideId: string, lat: number, lng: number) => {
    try {
      await fetch(`/api/rides/${rideId}/rider-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
    } catch (e) {
      console.warn('Rider location push failed:', e);
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

  const handleLoginSuccess = (email: string, role: 'passenger' | 'driver' | 'admin' | 'rider', phone?: string) => {
    const normalizedRole = role === 'rider' ? 'passenger' : role;
    localStorage.setItem('zipride_logged', 'true');
    localStorage.setItem('zipride_user', email);
    localStorage.setItem('zipride_role', normalizedRole);
    setIsLoggedIn(true);
    setCurrentUser(email);
    setCurrentUserRole(normalizedRole);
    if (normalizedRole === 'driver') {
      selectTab('/driver');
    } else {
      selectTab('/');
    }
  };

  const handleLogout = () => {
    localStorage.setItem('zipride_logged', 'false');
    localStorage.removeItem('zipride_user');
    localStorage.removeItem('zipride_role');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentUserRole(null);
    selectTab('/login');
  };

  // Safe navigation mapping labels
  const getTabLabel = () => {
    switch (currentPath) {
      case '/': return currentUserRole === 'admin' ? 'Operations Hub' : 'Passenger Dashboard';
      case '/booking': return 'Book a Ride';
      case '/driver': return 'Driver Navigation Hub';
      case '/tracker': return 'Ride Safety Tracker';
      case '/disputes': return 'Disputes & Resolutions';
      case '/fares': return 'Fare Policy & Multipliers';
      case '/history': return 'Ride History';
      case '/settings': return 'Account Settings';
      case '/ai-assistant': return 'AI Operations Assistant';
      case '/login': return 'Welcome to ZipRide';
      default: return 'Page Not Found';
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex bg-theme-bg min-h-screen text-theme-text-primary font-sans antialiased transition-colors duration-150">
      
      {/* Sidebar Core Element (Hidden on mobile) */}
      <Sidebar 
        activeTab={currentPath} 
        onSelectTab={selectTab} 
        systemConfig={systemState.config} 
        userRole={currentUserRole}
      />

      {/* Main Container Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Top Floating Responsive TaskBar */}
        <header className="bg-theme-header-bg border-b border-theme-header-border text-theme-header-text px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-xs transition-colors duration-155 duration-150">
          
          {/* Mobile responsive drawer toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-theme-text-secondary hover:text-theme-text-primary focus:outline-none shrink-0"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <div className="flex items-center gap-2">
              <span className="md:hidden w-7 h-7 bg-brand-emerald/10 text-brand-emerald rounded flex items-center justify-center shrink-0">
                <Bike className="w-4.5 h-4.5" />
              </span>
              <h2 className="text-sm font-bold text-theme-text-primary tracking-tight leading-none">{getTabLabel()}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold pr-1">
            {isLoading && (
              <span className="flex items-center gap-1 text-theme-text-secondary font-mono text-[10px]">
                <RefreshCw className="w-3 h-3 animate-spin text-brand-emerald" />
                refreshing...
              </span>
            )}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-theme-text-secondary">Service Status:</span>
              <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border transition-colors duration-300 ${
                isServerConnected 
                  ? 'bg-emerald-950/40 text-[#00C896] border-emerald-900/50' 
                  : 'bg-rose-950/40 text-rose-400 border-rose-900/50 animate-pulse'
              }`}>
                {isServerConnected ? 'ONLINE' : 'RECONNECTING'}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Responsive Navigation Draw overlay if open */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-theme-bg text-theme-text-secondary absolute top-14 left-0 right-0 z-50 p-4 border-b border-theme-border shadow-md flex flex-col gap-1.5 animate-fadeIn">
            {(() => {
              if (!isLoggedIn) return [{ path: '/login', label: 'Welcome to ZipRide' }];
              if (currentUserRole === 'passenger') {
                return [
                  { path: '/', label: 'Dashboard' },
                  { path: '/booking', label: 'Book a Ride' },
                  { path: '/tracker', label: 'Ride Tracker' },
                  { path: '/fares', label: 'Fare Policy' },
                  { path: '/history', label: 'Ride History' },
                  { path: '/settings', label: 'Settings' }
                ];
              } else if (currentUserRole === 'driver') {
                return [
                  { path: '/driver', label: 'Driver Console' },
                  { path: '/settings', label: 'Settings' }
                ];
              } else {
                return [
                  { path: '/', label: 'Dashboard' },
                  { path: '/booking', label: 'Book a Ride' },
                  { path: '/tracker', label: 'Ride Tracker' },
                  { path: '/driver', label: 'Driver Console' },
                  { path: '/disputes', label: 'Disputes' },
                  { path: '/fares', label: 'Fare Policy' },
                  { path: '/history', label: 'Ride History' },
                  { path: '/settings', label: 'Settings' }
                ];
              }
            })().map(item => (
              <button
                key={item.path}
                onClick={() => selectTab(item.path)}
                className={`w-full py-3 px-4 rounded-xl text-left text-xs font-mono font-bold transition flex items-center justify-between ${
                  currentPath === item.path ? 'bg-brand-emerald/10 text-brand-emerald font-extrabold' : 'hover:bg-theme-hover-bg text-theme-text-secondary'
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
              drivers={allDrivers}
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
              userRole={currentUserRole}
              userName={currentUser}
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
              drivers={allDrivers}
              onPushDriverLocation={handlePushDriverLocation}
              allRides={allRides}
              currentUser={currentUser}
            />
          )}

          {currentPath === '/tracker' && (
            <RideTrackerView 
              activeRide={activeRide}
              onRefresh={fetchAllData}
              onFileDispute={handleFileDispute}
              drivers={allDrivers}
              onPushRiderLocation={handlePushRiderLocation}
              onRateRide={handleRateRide}
              onPayRide={handlePayRide}
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

          {currentPath === '/history' && (
            <RideHistoryView 
              allRides={allRides}
              currentUser={currentUser}
              currentUserRole={currentUserRole}
              onRateRide={handleRateRide}
              onFileDispute={handleFileDispute}
              onRebook={handleRebook}
              onCancelRide={handleCancelRide}
              onTrackRide={() => selectTab('/tracker')}
              disputes={disputes}
            />
          )}

          {currentPath === '/settings' && (
            <SettingsView 
              currentUser={currentUser}
              currentUserRole={currentUserRole}
              onLogout={handleLogout}
              theme={theme}
              onThemeChange={setTheme}
            />
          )}

          {currentPath === '/ai-assistant' && (
            <AiAssistantView 
              currentUser={currentUser}
              currentUserRole={currentUserRole}
              onSelectTab={selectTab}
              systemState={systemState}
              activeRide={activeRide}
            />
          )}

          {currentPath === '/404' && (
            <NotFoundView 
              onGoHome={() => selectTab('/')}
              currentPath={currentPath}
            />
          )}

          {/* Fallback client-side matching for non-registered paths */}
          {!['/', '/booking', '/driver', '/tracker', '/disputes', '/fares', '/login', '/404', '/history', '/settings', '/ai-assistant'].includes(currentPath) && (
            <NotFoundView 
              onGoHome={() => selectTab('/')}
              currentPath={currentPath}
            />
          )}
        </main>
        
        {/* Global Floating AI Assistant Widget */}
        <AiAssistantWidget 
          currentUser={currentUser}
          currentUserRole={currentUserRole}
          currentPath={currentPath}
        />
      </div>
    </div>
  </ErrorBoundary>
);
}
