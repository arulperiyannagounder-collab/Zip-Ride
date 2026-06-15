// src/components/SosButton.tsx
import React, { useState } from 'react';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { useToast } from './ToastNotification';

interface SosButtonProps {
  rideId: string;
  onClick?: (rideId: string) => void;
}

export const SosButton: React.FC<SosButtonProps> = ({ rideId, onClick }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedReason, setSelectedReason] = useState('Feeling Unsafe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleTriggerSOS = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/emergency/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId,
          reason: selectedReason,
          isSilentSOS: false
        })
      });

      if (res.ok) {
        showToast('Emergency SOS dispatched! Response team has been alerted.', 'success');
        if (onClick) {
          onClick(rideId);
        }
      } else {
        showToast('Failed to trigger SOS alert. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error triggering SOS:', error);
      showToast('Network error while triggering emergency SOS.', 'error');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="absolute top-4 right-4 flex items-center justify-center w-12 h-12 rounded-full bg-red-650 hover:bg-red-700 text-white shadow-xl hover:scale-105 transition-all animate-pulse z-40 border-2 border-red-500"
        title="Trigger Safety SOS"
        aria-label="SOS Emergency Button"
      >
        <ShieldAlert className="w-6 h-6" />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-9999 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-theme-card border-2 border-rose-500/50 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold text-theme-text-primary tracking-tight">Confirm Emergency SOS</h3>
                <p className="text-[11px] text-theme-text-secondary">This will broadcast your location to safety teams.</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-theme-text-secondary">Select Emergency Reason</label>
              {[
                'Feeling Unsafe',
                'Wrong Route',
                'Vehicle Breakdown',
                'Other Emergency'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full py-2.5 px-4 rounded-xl border text-left text-xs font-semibold transition-all ${
                    selectedReason === reason
                      ? 'border-red-550 bg-red-500/10 text-red-500 font-bold'
                      : 'border-theme-border bg-theme-bg hover:bg-theme-hover-bg text-theme-text-secondary'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 bg-theme-bg border border-theme-border text-theme-text-secondary text-xs font-bold py-3 rounded-xl transition cursor-pointer hover:bg-theme-hover-bg"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerSOS}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold py-3 rounded-xl transition cursor-pointer shadow-md"
              >
                {isSubmitting ? 'Dispatching...' : 'Yes, Trigger SOS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
