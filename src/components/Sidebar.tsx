import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Bike, 
  Navigation, 
  Flag, 
  IndianRupee,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  activeTab: string; // Pathname or identifier of the active tab
  onSelectTab: (path: string) => void;
  systemConfig: {
    weather: string;
    traffic: string;
  };
  userRole: 'passenger' | 'driver' | 'admin' | null;
}

export default function Sidebar({ activeTab, onSelectTab, userRole }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('zipride_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    localStorage.setItem('zipride_sidebar_collapsed', String(nextCollapsed));
  };

  const getNavItems = () => {
    if (userRole === 'passenger') {
      return [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/booking', label: 'Book Ride', icon: MapPin },
        { path: '/tracker', label: 'Ride Tracker', icon: Navigation },
        { path: '/road-intel', label: 'Road Intelligence', icon: ShieldAlert },
        { path: '/fares', label: 'Policies & Agreements', icon: IndianRupee },
        { path: '/history', label: 'Ride History', icon: History },
        { path: '/settings', label: 'Settings', icon: Settings },
      ];
    } else if (userRole === 'driver') {
      return [
        { path: '/driver', label: 'Driver Console', icon: Bike },
        { path: '/road-intel', label: 'Road Intelligence', icon: ShieldAlert },
        { path: '/settings', label: 'Settings', icon: Settings },
      ];
    } else { // admin
      return [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/booking', label: 'Book Ride', icon: MapPin },
        { path: '/tracker', label: 'Ride Tracker', icon: Navigation },
        { path: '/driver', label: 'Driver Console', icon: Bike },
        { path: '/disputes', label: 'Disputes', icon: Flag },
        { path: '/road-intel', label: 'Road Intelligence', icon: ShieldAlert },
        { path: '/fares', label: 'Policies & Agreements', icon: IndianRupee },
        { path: '/history', label: 'Ride History', icon: History },
        { path: '/settings', label: 'Settings', icon: Settings },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside 
      id="zipride-sidebar" 
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-theme-sidebar-bg border-r border-theme-sidebar-border flex flex-col h-screen text-theme-sidebar-text sticky top-0 shrink-0 hidden md:flex transition-all duration-300 ease-in-out`}
    >
      {/* Brand Header */}
      <div className={`p-6 flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : 'flex-row'}`}>
        <div className="flex items-center gap-3">
          <div className="text-[#00C896] shrink-0">
            <Bike className="w-6 h-6 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-theme-text-primary tracking-tight">
                ZipRide
              </h1>
              <p className="text-[10px] text-theme-text-secondary font-medium tracking-wide capitalize">
                {userRole === 'admin' ? 'Operations Hub' : userRole === 'driver' ? 'Driver Console' : 'Rider Portal'}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg bg-theme-sidebar-active-bg border border-theme-sidebar-active-border hover:bg-theme-sidebar-hover-bg text-[#00C896] transition cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Tab Links */}
      <nav className="flex-1 px-4 py-2 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.path;
          return (
            <button
              key={item.path}
              id={`nav-tab-${item.path.replace('/', 'root')}`}
              onClick={() => onSelectTab(item.path)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center py-3' : 'px-4 py-3'} rounded-xl text-left font-sans font-medium text-[13px] transition-all duration-150 cursor-pointer ${
                isActive 
                  ? 'bg-theme-sidebar-active-bg text-[#00C896] shadow-sm border border-theme-sidebar-active-border' 
                  : 'text-theme-sidebar-text hover:bg-theme-sidebar-hover-bg hover:text-theme-text-primary border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#00C896]' : 'text-theme-sidebar-text'}`} />
              {!isCollapsed && <span className="tracking-tight ml-3.5">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* System Live Status */}
      <div className="p-6 border-t border-theme-sidebar-border mt-auto">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C896] animate-pulse shrink-0" />
          {!isCollapsed && (
            <div>
              <span className="text-xs text-theme-sidebar-text font-bold block">Service Online</span>
              <span className="text-[10px] text-theme-text-secondary block font-mono">v1.0.0</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
