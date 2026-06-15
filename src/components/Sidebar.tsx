import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Bike, 
  Navigation, 
  Flag, 
  IndianRupee,
  ShieldAlert,
  Globe
} from 'lucide-react';

interface SidebarProps {
  activeTab: string; // Pathname or identifier of the active tab
  onSelectTab: (path: string) => void;
  systemConfig: {
    weather: string;
    traffic: string;
  };
}

export default function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/booking', label: 'Booking', icon: MapPin },
    { path: '/driver', label: 'Driver', icon: Bike },
    { path: '/tracker', label: 'Ride Tracker', icon: Navigation },
    { path: '/disputes', label: 'Disputes', icon: Flag },
    { path: '/fares', label: 'Fares', icon: IndianRupee },
  ];

  return (
    <aside 
      id="zipride-sidebar" 
      className="w-64 bg-[#0B111E] border-r border-[#151D30] flex flex-col h-screen text-slate-350 sticky top-0 shrink-0 hidden md:flex"
    >
      {/* Brand Header */}
      <div className="p-6 flex items-start gap-3">
        <div className="text-[#00C896]">
          <Bike className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            ZipRide
          </h1>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">Ops Console</p>
        </div>
      </div>

      {/* Navigation Tab Links (Matching Screenshot 5 Style) */}
      <nav className="flex-1 px-4 py-2 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.path;
          return (
            <button
              key={item.path}
              id={`nav-tab-${item.path.replace('/', 'root')}`}
              onClick={() => onSelectTab(item.path)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left font-sans font-medium text-[13px] transition-all duration-150 ${
                isActive 
                  ? 'bg-[#151E33] text-[#00C896]' 
                  : 'text-slate-400 hover:bg-[#111A2E] hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#00C896]' : 'text-slate-500'}`} />
              <span className="tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Admin Quick Gate */}
      <div className="px-4 mb-2">
        <button
          onClick={() => onSelectTab('/login')}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left font-sans font-medium text-[13px] transition-all duration-150 ${
            activeTab === '/login'
              ? 'bg-[#151E33] text-[#00C896]'
              : 'text-slate-500 hover:bg-[#111A2E] hover:text-slate-300'
          }`}
        >
          <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-slate-500" />
          <span>Admin Portal</span>
        </button>
      </div>

      {/* System Live Status (Matching Screenshot 5 bottom-left) */}
      <div className="p-6 border-t border-[#121A2C] mt-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">System Online</span>
        </div>
        <span className="text-[10px] text-slate-600 block mt-0.5 font-sans font-medium">v1.0.0</span>
      </div>
    </aside>
  );
}
