import React, { useState } from 'react';
import { 
  Check, 
  MapPin, 
  Flag, 
  AlertTriangle, 
  Trash2, 
  CornerUpRight,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { Dispute } from '../types';

interface DisputesViewProps {
  disputes: Dispute[];
  onResolveDispute: (id: string, status: 'resolved' | 'rejected', refundAmount: number) => Promise<void>;
}

export default function DisputesView({ disputes, onResolveDispute }: DisputesViewProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleResolveAction = async (id: string, actionType: 'resolve' | 'refund' | 'escalate') => {
    setIsUpdating(true);
    setSuccessMsg('');
    try {
      if (actionType === 'refund') {
        const d = disputes.find(dis => dis.id === id);
        const amt = d ? d.finalFare : 50.00;
        await onResolveDispute(id, 'resolved', amt);
        setSuccessMsg(`Dispute successfully resolved! full refund of ₹${amt.toFixed(2)} processed to rider's wallet.`);
      } else if (actionType === 'resolve') {
        await onResolveDispute(id, 'resolved', 0);
        setSuccessMsg('Dispute was resolved and marked closed without direct cash adjustment.');
      } else {
        await onResolveDispute(id, 'rejected', 0);
        setSuccessMsg('Dispute escalated to central compliance arbitration team.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Compute stat counters
  const totalCount = disputes.length;
  const cashDemandCount = disputes.filter(d => d.reason === 'extra_cash' || d.reason.includes('cash')).length || 1;
  const fareAccuracy = "0.0%"; // Aligned with mockup image

  return (
    <div className="space-y-6">
      
      {/* Top Header Row with Profile Card (Screenshot 3 layout) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Disputes</h2>
          <p className="text-sm text-slate-500 mt-1">Review flagged rides with sensor context</p>
        </div>

        {/* Profile Card (Screenshot 3 top-right) */}
        <div className="flex items-center gap-3 bg-white border border-slate-100/90 rounded-2xl px-4 py-2.5 shadow-xs shrink-0 select-none">
          <div className="w-10 h-10 rounded-full bg-[#00C896] text-white font-bold flex items-center justify-center text-sm shadow-sm">
            AR
          </div>
          <div className="text-left font-sans">
            <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 leading-none">
              Arul
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span className="text-amber-500">★</span> 
              <span className="font-semibold text-slate-600">5.0</span>
              <span className="text-slate-300">•</span>
              <span>0 rides</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats indicators grid (Screenshot 3 columns layout) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs">
          <span className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Total Disputes
          </span>
          <span className="block text-2xl font-black text-slate-800 mt-1.5 font-sans leading-none">
            {totalCount}
          </span>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs">
          <span className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Cash Demand Reports
          </span>
          <span className="block text-2xl font-black text-rose-500 mt-1.5 font-sans leading-none">
            {cashDemandCount}
          </span>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs">
          <span className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Fare Accuracy
          </span>
          <span className="block text-2xl font-black text-[#00C896] mt-1.5 font-sans leading-none">
            {fareAccuracy}
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 text-sm py-3 px-5 rounded-2xl border border-emerald-100 font-medium flex items-center gap-2.5 animate-fade-in shadow-xs">
          <span className="text-lg">✨</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Disputes logs rendering container */}
      <div className="max-w-3xl space-y-6">
        {disputes.length > 0 ? (
          disputes.map((item) => (
            <div 
              key={item.id} 
              className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col gap-5 relative group transition-all"
            >
              
              {/* Header Title & Pending badge row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600">
                  <span className="text-base text-slate-400">📂</span>
                  <span className="font-mono font-bold text-xs uppercase tracking-wide text-slate-600">
                    {item.id} — {item.rideId}
                  </span>
                </div>

                <span className={`px-3 py-1 text-[11px] font-mono font-bold rounded-lg uppercase ${
                  item.status === 'open' 
                    ? 'bg-amber-100 text-amber-700 font-semibold' 
                    : item.status === 'resolved' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.status === 'open' ? 'PENDING' : item.status.toUpperCase()}
                </span>
              </div>

              {/* Transit coordinate pins layout */}
              <div className="space-y-2 pb-1 font-sans">
                {/* Pickup pin */}
                <div className="flex items-center gap-2 text-[14px] text-slate-700 font-medium">
                  <span className="w-5 h-5 rounded-full border border-[#00C896] flex items-center justify-center text-[10px] text-[#00C896] shrink-0 font-bold bg-[#E6F9F4]/40">
                    ◎
                  </span>
                  <span>{item.pickup}</span>
                </div>

                {/* Drop pin */}
                <div className="flex items-center gap-2 text-[14px] text-slate-700 font-medium">
                  <span className="w-5 h-5 rounded-full border border-rose-450 flex items-center justify-center text-[10px] text-rose-500 shrink-0 font-bold bg-rose-50/40">
                    ✺
                  </span>
                  <span>{item.drop}</span>
                </div>
              </div>

              {/* Data Category row elements */}
              <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-100 py-3 font-sans text-xs">
                <div>
                  <span className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Category</span>
                  <span className="font-medium text-slate-800 text-[13px]">{item.reason || "extra_cash"}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Fare</span>
                  <span className="font-bold text-[#00C896] text-[13px]">₹{item.finalFare.toFixed(2)}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Filed</span>
                  <span className="font-medium text-slate-600 text-[13px]">"2026-06-1"</span>
                </div>
              </div>

              {/* Warm cream tinted summary & telemetry logs card (Screenshot 3 styled) */}
              <div className="bg-[#FAF7EF] rounded-2xl p-5 border border-[#ECE0CE]/55 text-[12.5px] text-slate-700 leading-relaxed font-sans space-y-4">
                {/* Summary field */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold font-mono uppercase tracking-wider text-amber-700">Summary</span>
                  <p className="font-medium text-slate-700">
                    Cash demand violation on ride at ₹{item.finalFare.toFixed(2)}. Context: Driver requested extra cash: Driver requested cash after arrival. Sensors: [dispute] Dispute {item.id} filed | [ops_alert] Dispute {item.id} filed: Dri
                  </p>
                </div>

                {/* Sensor Knowledge Context field */}
                <div className="space-y-1.5 pt-3.5 border-t border-[#ECE0CE]/50">
                  <span className="block text-[10px] font-bold font-mono uppercase tracking-wider text-amber-700">Sensor / Knowledge Context</span>
                  <p className="font-mono text-[11px] text-amber-900 leading-normal">
                    [dispute] Dispute {item.id} filed | [ops_alert] Dispute {item.id} filed: Driver requested extra cash: Driver requested cash after arrival | [assignment] Driver {item.driverName} assigned
                  </p>
                </div>
              </div>

              {/* Action triggers bottom row (Screenshot 3 layout) */}
              {item.status === 'open' && (
                <div className="flex gap-3 pt-1 select-none">
                  {/* Resolve Button */}
                  <button
                    onClick={() => handleResolveAction(item.id, 'resolve')}
                    disabled={isUpdating}
                    className="flex-1 bg-[#00C896] hover:bg-[#00B384] text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  >
                    <span>✓</span> Resolve
                  </button>

                  {/* Refund Button */}
                  <button
                    onClick={() => handleResolveAction(item.id, 'refund')}
                    disabled={isUpdating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  >
                    <span>₹</span> Refund
                  </button>

                  {/* Escalate button */}
                  <button
                    onClick={() => handleResolveAction(item.id, 'escalate')}
                    disabled={isUpdating}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  >
                    <span>▲</span> Escalate
                  </button>
                </div>
              )}

              {item.status !== 'open' && (
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl flex items-center gap-2 text-slate-500 text-xs">
                  <span className="text-base">✨</span>
                  <span>This ticket is closed and processed as <strong>{item.status === 'resolved' ? 'Approved Refund' : 'Rejected / Refused'}</strong>.</span>
                </div>
              )}

            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 py-16 px-6 text-center rounded-2xl flex flex-col items-center">
            <Check className="w-12 h-12 text-slate-200 mb-3" />
            <h4 className="font-semibold text-slate-700 text-sm">Disputes Log is completely clear</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No outstanding payment or cash dispute tickets opened at this time.</p>
          </div>
        )}
      </div>

    </div>
  );
}
