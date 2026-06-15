import React, { useState } from 'react';
import { User, Sun, Moon, Laptop, MapPin, Plus, Trash2, LogOut, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useToast } from './ToastNotification';

interface SavedLocation {
  id: string;
  label: string;
  address: string;
}

interface SettingsViewProps {
  currentUser: string | null;
  currentUserRole: 'passenger' | 'driver' | 'admin' | null;
  onLogout: () => void;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (newTheme: 'light' | 'dark' | 'system') => void;
}

export default function SettingsView({ currentUser, currentUserRole, onLogout, theme, onThemeChange }: SettingsViewProps) {
  const { showToast } = useToast();
  const [name, setName] = useState(currentUser || 'Saran');
  const [phone, setPhone] = useState('9876543210');
  
  const [emergencyName, setEmergencyName] = useState(() => localStorage.getItem('zipride_emergency_name') || 'Police Control Room');
  const [emergencyPhone, setEmergencyPhone] = useState(() => localStorage.getItem('zipride_emergency_phone') || '112');
  
  const [savedLocs, setSavedLocs] = useState<SavedLocation[]>(() => {
    const saved = localStorage.getItem('zipride_saved_locations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      { id: '1', label: 'Home', address: 'Indiranagar 100 Feet Boulevard, Bengaluru, KA' },
      { id: '2', label: 'Work', address: 'Cyber City Business Park, Gurugram, HR' }
    ];
  });
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newAddress.trim()) return;
    const updated = [...savedLocs, {
      id: Date.now().toString(),
      label: newLabel.trim(),
      address: newAddress.trim()
    }];
    setSavedLocs(updated);
    localStorage.setItem('zipride_saved_locations', JSON.stringify(updated));
    setNewLabel('');
    setNewAddress('');
  };

  const handleRemoveLocation = (id: string) => {
    const updated = savedLocs.filter(loc => loc.id !== id);
    setSavedLocs(updated);
    localStorage.setItem('zipride_saved_locations', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-theme-text-primary tracking-tight">Account Settings</h2>
        <p className="text-sm text-theme-text-secondary mt-1">Manage your passenger profile, theme preferences, and shortcuts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card & Theme */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-theme-text-primary text-base">{name}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-emerald/10 text-brand-emerald">
                  {currentUserRole || 'passenger'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-theme-border text-xs">
              <div>
                <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary outline-none focus:border-brand-emerald font-semibold mt-1" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Phone Number</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary font-mono mt-1 font-semibold" 
                />
              </div>
            </div>
          </div>

          {/* Safety & Emergency Contact Card */}
          <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-theme-text-primary text-base">Safety SOS Setup</h3>
                <p className="text-[10px] text-theme-text-secondary">Emergency contact for SOS alerts</p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-theme-border text-xs">
              <div>
                <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Contact Name</label>
                <input 
                  type="text" 
                  value={emergencyName} 
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Police, Spouse, Parent"
                  className="w-full bg-theme-bg border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary outline-none focus:border-rose-500 font-semibold mt-1" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Contact Phone</label>
                <input 
                  type="text" 
                  value={emergencyPhone} 
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="e.g. 112 or 10-digit number"
                  className="w-full bg-theme-bg border border-theme-border px-3 py-2 rounded-xl text-theme-text-primary font-mono mt-1 font-semibold" 
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('zipride_emergency_name', emergencyName);
                  localStorage.setItem('zipride_emergency_phone', emergencyPhone);
                  showToast('Emergency contact saved successfully!', 'success');
                }}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                Save Contact
              </button>
            </div>
          </div>

          {/* Theme customizer */}
          <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-sm space-y-3">
            <span className="block text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono">Display Theme</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Laptop }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onThemeChange(item.id as any)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition cursor-pointer ${
                      isSelected 
                        ? 'border-brand-emerald bg-brand-emerald/10 text-brand-emerald font-bold' 
                        : 'border-theme-border bg-theme-bg hover:border-theme-border text-theme-text-secondary font-semibold'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout card */}
          <div className="bg-theme-card border border-theme-border rounded-3xl p-4 shadow-sm">
            <button
              onClick={onLogout}
              className="w-full py-3 bg-rose-50/20 hover:bg-rose-50/40 text-rose-500 border border-rose-500/30 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out & Lock Session</span>
            </button>
          </div>

        </div>

        {/* Saved Locations Column (MD Col 2) */}
        <div className="md:col-span-2 bg-theme-card border border-theme-border rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <span className="text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono block">Saved Commute Locations</span>
            <p className="text-xs text-theme-text-secondary mt-1">Configure saved shortcuts to speed up pick-up and destination selection.</p>
          </div>

          {/* List of saved locations */}
          <div className="space-y-3">
            {savedLocs.length > 0 ? (
              savedLocs.map(loc => (
                <div key={loc.id} className="flex items-center justify-between p-4 bg-theme-bg border border-theme-border rounded-2xl hover:bg-theme-hover-bg transition">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 bg-theme-card border border-theme-border rounded-xl text-theme-text-secondary shrink-0">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-theme-text-primary block">{loc.label}</span>
                      <span className="text-[11px] text-theme-text-secondary font-medium truncate block mt-0.5">{loc.address}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveLocation(loc.id)}
                    className="p-2 text-theme-text-secondary hover:text-rose-500 rounded-lg hover:bg-theme-card hover:border-theme-border border border-transparent transition cursor-pointer"
                    title="Remove Location"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-theme-bg border border-dashed border-theme-border rounded-2xl text-theme-text-secondary text-xs">
                No saved locations. Add your first commute shortcut below.
              </div>
            )}
          </div>

          {/* Add new saved location form */}
          <form onSubmit={handleAddLocation} className="border-t border-theme-border pt-5 space-y-4">
            <span className="text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-mono block">Add Saved Location</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="e.g. Work, College, Gym"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border px-4 py-3 rounded-xl text-xs font-semibold text-theme-text-primary outline-none focus:border-brand-emerald"
              />
              <input
                type="text"
                placeholder="Full street address in India..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full sm:col-span-2 bg-theme-bg border border-theme-border px-4 py-3 rounded-xl text-xs font-semibold text-theme-text-primary outline-none focus:border-brand-emerald"
              />
            </div>
            <button
              type="submit"
              disabled={!newLabel.trim() || !newAddress.trim()}
              className="bg-brand-emerald hover:bg-brand-emerald-dark disabled:bg-theme-border disabled:text-theme-text-secondary text-slate-950 font-bold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Save Location</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
