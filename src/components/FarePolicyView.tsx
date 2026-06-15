import React from 'react';
import { 
  IndianRupee, 
  Flag, 
  Map, 
  Clock, 
  CloudRain, 
  TrafficCone, 
  Gauge, 
  ShieldCheck 
} from 'lucide-react';

export default function FarePolicyView() {
  return (
    <div className="space-y-6">
      
      {/* Dynamic Surcharge Shield banner */}
      <div className="bg-gradient-to-r from-brand-emerald/10 to-emerald-500/5 border border-brand-emerald/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald shrink-0">
          <ShieldCheck className="w-6 h-6 shrink-0" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">No Surge Pricing Guarantee</h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            ZipRide offers full transparency. Rather than raising prices unpredictably, our values are pre-configured based on verified environmental and safety variables. Unsafe pilot maneuvers subtract costs automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Base Block */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Flag className="w-4 h-4 text-brand-emerald shrink-0" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Base Fare Fee</span>
          </div>
          <h2 className="text-2xl font-black font-mono text-slate-800">₹20.00</h2>
          <p className="text-xs text-slate-400">Fixed flag-down fee charge at checkout, covering physical dispatch origins.</p>
        </div>

        {/* Distance Block */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Map className="w-4 h-4 text-brand-emerald shrink-0" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Per Kilometer Charge</span>
          </div>
          <h2 className="text-2xl font-black font-mono text-slate-800">₹12.00 / km</h2>
          <p className="text-xs text-slate-400">Variable variable charge computed precisely on dynamic GPS travel patterns.</p>
        </div>

        {/* Duration Block */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-brand-emerald shrink-0" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Per Minute Cost</span>
          </div>
          <h2 className="text-2xl font-black font-mono text-slate-800">₹1.50 / min</h2>
          <p className="text-xs text-slate-400">Time-based variable charge covering route travel and waiting limits during transit.</p>
        </div>

      </div>

      {/* Grid for Weather & Traffic Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weather dynamic matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-brand-emerald shrink-0" />
            <span className="font-bold text-slate-800 text-sm">Dynamic Weather Base Add-ons</span>
          </div>

          <div className="p-4">
            <table className="w-full text-left text-xs font-semibold text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 font-mono text-[9px] text-slate-400">
                  <th className="py-2.5">Weather State</th>
                  <th className="py-2.5">Base Fee Add-on</th>
                  <th className="py-2.5 text-right">Warning Speed Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50 font-semibold text-slate-700">
                  <td className="py-3">Clear (Solar Baseline)</td>
                  <td className="py-3 font-mono">₹0.00</td>
                  <td className="py-3 font-mono text-right text-slate-500">80 km/h</td>
                </tr>
                <tr className="hover:bg-slate-50 font-semibold text-slate-700">
                  <td className="py-3">☁️ Overcast Cloudy</td>
                  <td className="py-3 font-mono text-indigo-500">+₹10.00</td>
                  <td className="py-3 font-mono text-right text-slate-500">75 km/h</td>
                </tr>
                <tr className="hover:bg-slate-50 font-semibold text-slate-700">
                  <td className="py-3">💨 High Winds</td>
                  <td className="py-3 font-mono text-indigo-500">+₹20.00</td>
                  <td className="py-3 font-mono text-right text-slate-500">65 km/h</td>
                </tr>
                <tr className="hover:bg-slate-50 font-semibold text-slate-700">
                  <td className="py-3">🌧️ Heavy Rain</td>
                  <td className="py-3 font-mono text-indigo-500">+₹30.00</td>
                  <td className="py-3 font-mono text-right text-slate-500">60 km/h</td>
                </tr>
                <tr className="hover:bg-slate-50 font-semibold text-slate-700">
                  <td className="py-3">⛈️ Monsoon Storm</td>
                  <td className="py-3 font-mono text-brand-emerald font-bold">+₹50.00</td>
                  <td className="py-3 font-mono text-right text-rose-500 font-bold">50 km/h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Traffic Level dynamic multipliers */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <TrafficCone className="w-4 h-4 text-brand-emerald shrink-0" />
            <span className="font-bold text-slate-800 text-sm">Dynamic Traffic Congestion Multipliers</span>
          </div>

          <div className="p-4">
            <table className="w-full text-left text-xs font-semibold text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 font-mono text-[9px] text-slate-400">
                  <th className="py-2.5">Traffic Intensity</th>
                  <th className="py-2.5">Fare Coefficient</th>
                  <th className="py-2.5 text-right">ETA Multiplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50 font-semibold text-slate-700">
                  <td className="py-3">Light Flow</td>
                  <td className="py-3 font-mono">1.0x (Baseline)</td>
                  <td className="py-3 font-mono text-right text-slate-500">1.0x (Default)</td>
                </tr>
                <tr className="hover:bg-slate-50 font-semibold text-slate-700">
                  <td className="py-3">🚗 Moderate congestion</td>
                  <td className="py-3 font-mono text-amber-500">1.1x (+10%)</td>
                  <td className="py-3 font-mono text-right text-slate-500">1.3x</td>
                </tr>
                <tr className="hover:bg-slate-50 font-semibold text-slate-700">
                  <td className="py-3">🚌 Heavy Congestion</td>
                  <td className="py-3 font-mono text-amber-500">1.3x (+30%)</td>
                  <td className="py-3 font-mono text-right text-slate-500">1.8x</td>
                </tr>
                <tr className="hover:bg-slate-50 font-semibold text-slate-700">
                  <td className="py-3">🛑 Gridlock Surcharge</td>
                  <td className="py-3 font-mono text-rose-500 font-bold">1.5x (+50%)</td>
                  <td className="py-3 font-mono text-right text-rose-500 font-bold">2.5x</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Driver safety behavior deductions details */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Gauge className="w-4 h-4 text-brand-emerald shrink-0" />
          <span className="font-bold text-slate-800 text-sm">Behavior Refund Penalties (Dynamic cost reduction)</span>
        </div>

        <p className="text-xs text-slate-500">
          Our passenger protection algorithm continuously evaluates live telemetry coordinates and speed variables. Reckless operations trigger compensation deductions automatically:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-red-500 font-bold uppercase">🚴 SPEEDING PENALTY DEVIATION</span>
            <span className="font-mono text-slate-800 text-sm font-bold block">-₹15.00 / incident</span>
            <p className="text-[11px] text-slate-500 leading-normal font-medium">Applied instantly when speed exceeds the current weather-derived safe threshold limits.</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-red-500 font-bold uppercase">🚨 ACCELERATION BRAKING PENALTY</span>
            <span className="font-mono text-slate-800 text-sm font-bold block">-₹10.00 / incident</span>
            <p className="text-[11px] text-slate-500 leading-normal font-medium">Applied instantly when deceleration thresholds trigger sudden G-force stops warnings.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
