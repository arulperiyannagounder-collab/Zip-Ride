import React, { useState } from 'react';
import { 
  IndianRupee, 
  Flag, 
  Map, 
  Clock, 
  CloudRain, 
  TrafficCone, 
  Gauge, 
  ShieldCheck,
  Shield,
  Scale
} from 'lucide-react';

export default function FarePolicyView() {
  const [activeTab, setActiveTab] = useState<'fare' | 'ride' | 'user'>('fare');

  return (
    <div className="space-y-6">
      
      {/* Tab Controls */}
      <div className="flex border border-theme-border bg-theme-card p-1 rounded-2xl shadow-sm">
        {[
          { id: 'fare', label: 'Fare Policy', icon: IndianRupee },
          { id: 'ride', label: 'Ride Policy', icon: Shield },
          { id: 'user', label: 'User Agreement', icon: Scale }
        ].map((tab) => {
          const isSel = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-205 cursor-pointer flex items-center justify-center gap-2 ${
                isSel
                  ? 'bg-[#00C896] text-slate-950 shadow-md shadow-[#00C896]/15'
                  : 'text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* FARES TAB */}
      {activeTab === 'fare' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Dynamic Surcharge Shield banner */}
          <div className="bg-gradient-to-r from-brand-emerald/10 to-emerald-500/5 border border-brand-emerald/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald shrink-0">
              <ShieldCheck className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-theme-text-primary leading-tight">No Surge Pricing Guarantee</h3>
              <p className="text-xs text-theme-text-secondary leading-relaxed mt-1">
                ZipRide offers full transparency. Rather than raising prices unpredictably, our values are pre-configured based on verified environmental and safety variables. Unsafe pilot maneuvers subtract costs automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Base Block */}
            <div className="bg-theme-card border border-theme-border p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-theme-text-secondary">
                <Flag className="w-4 h-4 text-brand-emerald shrink-0" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Base Fare Fee</span>
              </div>
              <h2 className="text-2xl font-black font-mono text-theme-text-primary">₹20.00</h2>
              <p className="text-xs text-theme-text-secondary">Fixed flag-down fee charge at checkout, covering physical dispatch origins.</p>
            </div>

            {/* Distance Block */}
            <div className="bg-theme-card border border-theme-border p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-theme-text-secondary">
                <Map className="w-4 h-4 text-brand-emerald shrink-0" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Per Kilometer Charge</span>
              </div>
              <h2 className="text-2xl font-black font-mono text-theme-text-primary">₹12.00 / km</h2>
              <p className="text-xs text-theme-text-secondary">Variable variable charge computed precisely on dynamic GPS travel patterns.</p>
            </div>

            {/* Duration Block */}
            <div className="bg-theme-card border border-theme-border p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-theme-text-secondary">
                <Clock className="w-4 h-4 text-brand-emerald shrink-0" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Per Minute Cost</span>
              </div>
              <h2 className="text-2xl font-black font-mono text-theme-text-primary">₹1.50 / min</h2>
              <p className="text-xs text-theme-text-secondary">Time-based variable charge covering route travel and waiting limits during transit.</p>
            </div>
          </div>

          {/* Grid for Weather & Traffic Matrices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weather dynamic matrix */}
            <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-theme-border bg-theme-bg/50 flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-brand-emerald shrink-0" />
                <span className="font-bold text-theme-text-primary text-sm">Dynamic Weather Base Add-ons</span>
              </div>

              <div className="p-4">
                <table className="w-full text-left text-xs font-semibold text-theme-text-secondary">
                  <thead>
                    <tr className="border-b border-theme-border font-mono text-xs uppercase text-theme-text-primary font-bold">
                      <th className="py-2.5">Weather State</th>
                      <th className="py-2.5">Base Fee Add-on</th>
                      <th className="py-2.5 text-right">Warning Speed Cap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    <tr className="hover:bg-theme-bg font-semibold text-theme-text-primary">
                      <td className="py-3">Clear (Solar Baseline)</td>
                      <td className="py-3 font-mono">₹0.00</td>
                      <td className="py-3 font-mono text-right text-theme-text-secondary">80 km/h</td>
                    </tr>
                    <tr className="hover:bg-theme-bg font-semibold text-theme-text-primary">
                      <td className="py-3">☁️ Overcast Cloudy</td>
                      <td className="py-3 font-mono text-indigo-600 dark:text-indigo-400">+₹10.00</td>
                      <td className="py-3 font-mono text-right text-theme-text-secondary">75 km/h</td>
                    </tr>
                    <tr className="hover:bg-theme-bg font-semibold text-theme-text-primary">
                      <td className="py-3">💨 High Winds</td>
                      <td className="py-3 font-mono text-indigo-600 dark:text-indigo-400">+₹20.00</td>
                      <td className="py-3 font-mono text-right text-theme-text-secondary">65 km/h</td>
                    </tr>
                    <tr className="hover:bg-theme-bg font-semibold text-theme-text-primary">
                      <td className="py-3">🌧️ Heavy Rain</td>
                      <td className="py-3 font-mono text-indigo-600 dark:text-indigo-400">+₹30.00</td>
                      <td className="py-3 font-mono text-right text-theme-text-secondary">60 km/h</td>
                    </tr>
                    <tr className="hover:bg-theme-bg font-semibold text-theme-text-primary">
                      <td className="py-3">⛈️ Monsoon Storm</td>
                      <td className="py-3 font-mono text-brand-emerald font-bold">+₹50.00</td>
                      <td className="py-3 font-mono text-right text-rose-600 dark:text-rose-400 font-bold">50 km/h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Traffic Level dynamic multipliers */}
            <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-theme-border bg-theme-bg/50 flex items-center gap-2">
                <TrafficCone className="w-4 h-4 text-brand-emerald shrink-0" />
                <span className="font-bold text-theme-text-primary text-sm">Dynamic Traffic Congestion Multipliers</span>
              </div>

              <div className="p-4">
                <table className="w-full text-left text-xs font-semibold text-theme-text-secondary">
                  <thead>
                    <tr className="border-b border-theme-border font-mono text-xs uppercase text-theme-text-primary font-bold">
                      <th className="py-2.5">Traffic Intensity</th>
                      <th className="py-2.5">Fare Coefficient</th>
                      <th className="py-2.5 text-right">ETA Multiplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    <tr className="hover:bg-theme-bg font-semibold text-theme-text-primary">
                      <td className="py-3">Light Flow</td>
                      <td className="py-3 font-mono">1.0x (Baseline)</td>
                      <td className="py-3 font-mono text-right text-theme-text-secondary">1.0x (Default)</td>
                    </tr>
                    <tr className="hover:bg-theme-bg font-semibold text-theme-text-primary">
                      <td className="py-3">🚗 Moderate congestion</td>
                      <td className="py-3 font-mono text-amber-600 dark:text-amber-400">1.1x (+10%)</td>
                      <td className="py-3 font-mono text-right text-theme-text-secondary">1.3x</td>
                    </tr>
                    <tr className="hover:bg-theme-bg font-semibold text-theme-text-primary">
                      <td className="py-3">🚌 Heavy Congestion</td>
                      <td className="py-3 font-mono text-amber-600 dark:text-amber-400">1.3x (+30%)</td>
                      <td className="py-3 font-mono text-right text-theme-text-secondary">1.8x</td>
                    </tr>
                    <tr className="hover:bg-theme-bg font-semibold text-theme-text-primary">
                      <td className="py-3">🛑 Gridlock Surcharge</td>
                      <td className="py-3 font-mono text-rose-600 dark:text-rose-400 font-bold">1.5x (+50%)</td>
                      <td className="py-3 font-mono text-right text-rose-600 dark:text-rose-400 font-bold">2.5x</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Driver safety behavior deductions details */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-theme-border pb-3">
              <Gauge className="w-4 h-4 text-brand-emerald shrink-0" />
              <span className="font-bold text-theme-text-primary text-sm">Behavior Refund Penalties (Dynamic cost reduction)</span>
            </div>

            <p className="text-xs text-theme-text-secondary leading-relaxed">
              Our passenger protection algorithm continuously evaluates live telemetry coordinates and speed variables. Reckless operations trigger compensation deductions automatically:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-theme-bg border border-theme-border rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold uppercase">🚴 SPEEDING PENALTY DEVIATION</span>
                <span className="font-mono text-theme-text-primary text-sm font-bold block">-₹15.00 / incident</span>
                <p className="text-[11px] text-theme-text-secondary leading-normal font-medium">Applied instantly when speed exceeds the current weather-derived safe threshold limits.</p>
              </div>

              <div className="p-4 bg-theme-bg border border-theme-border rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold uppercase">🚨 ACCELERATION BRAKING PENALTY</span>
                <span className="font-mono text-theme-text-primary text-sm font-bold block">-₹10.00 / incident</span>
                <p className="text-[11px] text-theme-text-secondary leading-normal font-medium">Applied instantly when deceleration thresholds trigger sudden G-force stops warnings.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RIDE POLICY TAB */}
      {activeTab === 'ride' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-theme-border pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C896] shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-theme-text-primary">Ride Safety & Conduct Policy</h3>
            </div>
            
            <p className="text-sm text-theme-text-secondary leading-relaxed">
              ZipRide enforces strict safety protocols to protect both riders and pilots. By booking a ride, you agree to comply with the following standards:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-theme-bg border border-theme-border rounded-2xl space-y-2">
                <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-[#00C896] uppercase tracking-wider block">🛡️ Vehicle Verification</span>
                <p className="text-xs text-theme-text-primary font-semibold leading-relaxed">
                  Before boarding, you must verify the vehicle license plate matches the app details exactly. Share the unique 4-digit security OTP with your pilot to initiate the journey.
                </p>
              </div>

              <div className="p-4 bg-theme-bg border border-theme-border rounded-2xl space-y-2">
                <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-[#00C896] uppercase tracking-wider block">🚴 Speed Limits & Maneuvers</span>
                <p className="text-xs text-theme-text-primary font-semibold leading-relaxed">
                  Riders must not request pilots to speed, run red lights, or execute illegal or dangerous road maneuvers. Pilots are instructed to decline unsafe requests.
                </p>
              </div>

              <div className="p-4 bg-theme-bg border border-theme-border rounded-2xl space-y-2">
                <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-[#00C896] uppercase tracking-wider block">📡 Telemetry Monitoring</span>
                <p className="text-xs text-theme-text-primary font-semibold leading-relaxed">
                  Our service logs coordinates, acceleration spikes, and velocities continuously. Speeding or harsh braking will result in automated ride deductions and warnings.
                </p>
              </div>

              <div className="p-4 bg-theme-bg border border-theme-border rounded-2xl space-y-2">
                <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-[#00C896] uppercase tracking-wider block">🚨 Emergency Protocols</span>
                <p className="text-xs text-theme-text-primary font-semibold leading-relaxed">
                  During an active ride, the SOS button provides one-tap police contact, live GPS broadcast to emergency networks, and automatic medical card transmission.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER AGREEMENT TAB */}
      {activeTab === 'user' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-theme-border pb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-theme-text-primary">ZipRide User Agreement</h3>
            </div>

            <p className="text-sm text-theme-text-secondary leading-relaxed">
              Welcome to the ZipRide platform. This agreement forms a binding contract between you and ZipRide. Please read the core conditions:
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex gap-4 p-4 bg-theme-bg border border-theme-border rounded-2xl">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 font-bold text-xs">1</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-theme-text-primary uppercase tracking-wide">Respect and Dignity</h4>
                  <p className="text-xs text-theme-text-secondary leading-relaxed">
                    All users must treat pilots and support staff with respect and dignity. Verbal abuse, physical aggression, or harassment of any form will lead to immediate and permanent account suspension.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-theme-bg border border-theme-border rounded-2xl">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 font-bold text-xs">2</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-theme-text-primary uppercase tracking-wide">Digital-Only Payments</h4>
                  <p className="text-xs text-theme-text-secondary leading-relaxed">
                    To maintain transparency and security, all fares must be paid digitally through the ZipRide application. Cash payments, side negotiations, or tip extortion are strictly prohibited.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-theme-bg border border-theme-border rounded-2xl">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 font-bold text-xs">3</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-theme-text-primary uppercase tracking-wide">In-App Disputes</h4>
                  <p className="text-xs text-theme-text-secondary leading-relaxed">
                    Any billing discrepancies, route complaints, or driver rating issues must be processed exclusively through the in-app dispute resolution panel. Side arrangements are invalid.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-theme-bg border border-theme-border rounded-2xl">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 font-bold text-xs">4</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-theme-text-primary uppercase tracking-wide">Telemetry Consent</h4>
                  <p className="text-xs text-theme-text-secondary leading-relaxed">
                    You consent to our safety engine logging and verifying GPS routes, speed logs, and emergency trigger anomalies during active journeys for mutual protection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
