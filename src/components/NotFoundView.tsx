import React from 'react';
import { Compass, AlertOctagon, CornerDownLeft, Map, RefreshCcw } from 'lucide-react';

interface NotFoundViewProps {
  onGoHome: () => void;
  currentPath: string;
}

export default function NotFoundView({ onGoHome, currentPath }: NotFoundViewProps) {
  return (
    <div className="max-w-xl mx-auto my-12 text-center space-y-8">
      {/* Visual Lost Map Simulation */}
      <div className="relative mx-auto w-40 h-40 bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300 animate-pulse overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
        <Compass className="w-16 h-16 text-slate-400 rotate-[35deg] transform transition-transform duration-1000" />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md">
          !
        </div>
      </div>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-mono font-bold tracking-wide border border-rose-100">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>ROUTE RESOLUTION FAILED</span>
        </div>
        <h3 className="text-3xl font-display font-black text-slate-800 tracking-tight">404 - Lost GPS Signal</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          The operations endpoint <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-bold">{currentPath}</span> was not unbundled or mapped on our active fleet grid.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 text-xs font-mono text-slate-600">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Request URI:</span>
          <span>{currentPath}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Response Code:</span>
          <span className="text-rose-500 font-bold">404 NOT_FOUND</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">GPS Ping Status:</span>
          <span className="text-amber-500 font-semibold select-none animate-pulse">● LOST_BEACON</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
        <button
          onClick={onGoHome}
          id="notfound-back-home-btn"
          className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <CornerDownLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
        <button
          onClick={() => window.location.reload()}
          id="notfound-reconnect-btn"
          className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider border border-slate-200 transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Re-Ping Network</span>
        </button>
      </div>
    </div>
  );
}
