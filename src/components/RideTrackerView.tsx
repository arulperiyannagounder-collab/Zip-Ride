import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  CircleDot, 
  ShieldAlert, 
  ShieldCheck, 
  MessageSquare, 
  Send, 
  Gauge, 
  User, 
  Lock, 
  Play, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Ride } from '../types';

interface RideTrackerViewProps {
  activeRide: Ride | null;
  onRefresh: () => void;
  onFileDispute: (rideId: string, reason: string) => Promise<void>;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function RideTrackerView({
  activeRide,
  onRefresh,
  onFileDispute
}: RideTrackerViewProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      parts: [{ text: "Hello! I am ZipRide's Intelligent Safety & Fare Assistant. Ask me any questions about our pricing formulas (base ₹20, variable ₹12/km & ₹1.5/min), current dynamic weather surcharges, traffic factors, or how our real-time bad-driving fare drop refunds work!" }] 
    }
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [showSafetyConfirm, setShowSafetyConfirm] = useState(false);
  const [safetyLog, setSafetyLog] = useState<string[]>([]);
  const [disputeFiled, setDisputeFiled] = useState(false);
  const [complaintText, setComplaintText] = useState('');

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Poll for active ride updates every 2 seconds if active
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    if (activeRide && ['booked', 'assigned', 'pickup', 'en_route', 'anomaly'].includes(activeRide.status)) {
      pollInterval = setInterval(() => {
        onRefresh();
      }, 2000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeRide]);

  // Sync scroll on chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Check for overspeed or harsh brake dynamically in state
  useEffect(() => {
    if (activeRide) {
      const logs: string[] = [];
      if (activeRide.overspeedEvents > 0) {
        logs.push(`⚠️ Overspeed threshold matched! Dynamic refund discount of -₹${(activeRide.overspeedEvents * 15).toFixed(2)} applied.`);
      }
      if (activeRide.harshBrakeEvents > 0) {
        logs.push(`⚠️ Harsh braking detected! Dynamic refund discount of -₹${(activeRide.harshBrakeEvents * 10).toFixed(2)} applied.`);
      }
      setSafetyLog(logs);

      // Trigger safety prompt on new anomalies
      if (activeRide.speed > 80 && !showSafetyConfirm) {
        setShowSafetyConfirm(true);
      }
    }
  }, [activeRide?.overspeedEvents, activeRide?.harshBrakeEvents]);

  // Tiny custom regex Markdown parse helper (robust, inline)
  const parseMarkdown = (text: string) => {
    const rawLines = text.split('\n');
    return rawLines.map((line, idx) => {
      let content = line;
      
      // Parse Bold
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Parse Headings
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-slate-800 text-sm mt-3 mb-1">{content.slice(4)}</h4>;
      }
      if (line.startsWith('- ')) {
        return <li key={idx} className="list-disc ml-4 mt-1 text-slate-600 font-medium pl-1 text-[11px]">{content.slice(2)}</li>;
      }
      
      return <p key={idx} className="leading-relaxed mt-1 text-slate-600 text-[11px] font-medium" dangerouslySetInnerHTML={{ __html: content }} />;
    });
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setIsSendingChat(true);

    try {
      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          history: chatMessages
        })
      });
      const data = await response.json();
      
      setChatMessages((prev) => [
        ...prev, 
        { role: 'model', parts: [{ text: data.answer || "I'm having some trouble parsing that. Please try again." }] }
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev, 
        { role: 'model', parts: [{ text: "Error connecting to AI Assistant. Please check server configuration." }] }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRide || !complaintText.trim()) return;

    try {
      await onFileDispute(activeRide.id, complaintText);
      setDisputeFiled(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Trajectory percentages
  const bikeXPct = activeRide ? 10 + activeRide.progress * 0.8 : 10;
  const bikeYPct = activeRide ? 70 - Math.sin((activeRide.progress / 100) * Math.PI) * 45 : 70;

  return (
    <div className="space-y-6">
      
      {!activeRide ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center max-w-xl mx-auto flex flex-col items-center shadow-xs">
          <Navigation className="w-12 h-12 text-slate-300 mb-3 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-800">No Active Ride in Progress</h3>
          <p className="text-xs text-slate-400 max-w-[340px] mt-1 mb-5">You are not currently monitoring any ride. Create a booking on the Book tab and turn on driver console acceptance.</p>
          <button 
            onClick={() => onRefresh()}
            className="px-5 py-2.5 bg-brand-emerald hover:bg-brand-emerald-dark font-semibold text-white rounded-xl text-xs shadow-sm transition"
          >
            Check Active Jobs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* MAP VISUALIZATION & SPEED FEED (LG Col 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Elegant Custom SVG Animated Map */}
            <div className="relative bg-slate-950 border border-slate-900 rounded-2xl h-[340px] overflow-hidden flex items-center justify-center p-4">
              
              {/* Dynamic Overlay labels */}
              <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-full text-[10px] font-mono tracking-wider flex items-center gap-2 text-brand-emerald font-semibold select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-ping" />
                <span>REAL-TIME SENSOR TRAJECTORY MAP</span>
              </div>

              {/* Grid Background */}
              <div 
                className="absolute inset-0 opacity-[0.06] select-none pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(ellipse at center, #00C896 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Simulated SVG Path */}
              <svg className="w-full h-full absolute inset-0 text-brand-emerald pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M 10,70 Q 50,25 90,70"
                  fill="none"
                  stroke="rgba(0, 200, 150, 0.2)"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
                <path
                  d="M 10,70 Q 50,25 90,70"
                  fill="none"
                  stroke="#00C896"
                  strokeWidth="0.4"
                  strokeDasharray="1 1"
                  className="stroke-[0.3]"
                />
              </svg>

              {/* Pickup Pin */}
              <div className="absolute flex flex-col items-center shrink-0" style={{ left: '10%', top: '70%', transform: 'translate(-50%, -100%)' }}>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-900/80 px-2 py-0.5 border border-slate-800 rounded-md mb-1 whitespace-nowrap">Pickup</span>
                <CircleDot className="w-5 h-5 text-brand-emerald bg-slate-950 rounded-full" />
              </div>

              {/* Active Marker Bike Pin */}
              <div 
                className="absolute flex flex-col items-center transition-all duration-700 ease-out shrink-0" 
                style={{ left: `${bikeXPct}%`, top: `${bikeYPct}%`, transform: 'translate(-50%, -100%)' }}
              >
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md mb-1 whitespace-nowrap shadow-sm ${
                  activeRide.speed > 80 ? 'bg-rose-500 text-white animate-bounce' : 'bg-brand-emerald text-slate-950'
                }`}>
                  {activeRide.speed} km/h
                </span>
                <div className={`w-9 h-9 rounded-full bg-slate-900 border flex items-center justify-center transition ${
                  activeRide.speed > 80 ? 'border-rose-500 animate-pulse text-rose-500' : 'border-brand-emerald text-brand-emerald'
                }`}>
                  <Gauge className="w-5 h-5 shrink-0" />
                </div>
              </div>

              {/* Drop Pin */}
              <div className="absolute flex flex-col items-center shrink-0" style={{ left: '90%', top: '70%', transform: 'translate(-50%, -100%)' }}>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-900/80 px-2 py-0.5 border border-slate-800 rounded-md mb-1 whitespace-nowrap">Drop</span>
                <MapPin className="w-5 h-5 text-rose-500" />
              </div>
            </div>

            {/* Live Telemetry warning overlays */}
            {safetyLog.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 block">⚠️ SAFETY TELEMETRY THRESHOLD ALERTS:</span>
                <div className="space-y-1">
                  {safetyLog.map((log, idx) => (
                    <div key={idx} className="text-xs font-semibold text-rose-700 leading-normal">{log}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Mid-Trip System Fare Adjustment Approval Override */}
            {activeRide.adjustmentStatus === 'pending' && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                    <span className="text-amber-600 text-lg">🚦</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 flex items-center gap-2">
                      Fare Adjustment Detected
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-mono">System Triggered</span>
                    </h4>
                    
                    <p className="text-sm font-medium text-amber-800 mt-1">
                      Reason: <span className="font-bold">
                        {activeRide.adjustmentTrigger === 'weather' ? 'Weather escalated to heavy rain mid-trip' :
                         activeRide.adjustmentTrigger === 'diversion' ? 'Mandatory route diversion detected by GPS' :
                         activeRide.adjustmentTrigger === 'rider_stop' ? 'Additional stop requested by rider' :
                         activeRide.adjustmentTrigger === 'traffic' ? 'Severe traffic delay beyond estimated time' :
                         activeRide.adjustmentTrigger === 'force_majeure' ? 'Road closure confirmed — alternate route taken' : 
                         'Live trip conditions updated'}
                      </span>
                    </p>

                    <div className="mt-4 p-3 bg-white/60 border border-amber-200/60 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-amber-800/80 font-medium">Original locked fare:</span>
                        <span className="font-mono text-slate-500 line-through">₹{activeRide.finalFare}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-amber-800/80 font-medium">Adjustment:</span>
                        <span className="font-mono text-amber-600 font-bold">+₹{activeRide.adjustmentAmount}</span>
                      </div>
                      <div className="border-t border-amber-200/60 pt-2 flex justify-between items-center">
                        <span className="text-amber-900 font-bold">New Total:</span>
                        <span className="font-mono text-amber-900 font-black text-lg">₹{(activeRide.finalFare + (activeRide.adjustmentAmount || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/rides/${activeRide.id}/adjustment/respond`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'accept' })
                        });
                        if (res.ok) onRefresh();
                      } catch (e) { console.error(e) }
                    }}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition active:scale-95 text-sm flex items-center justify-center gap-2"
                  >
                    ✓ Accept Adjustment
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/rides/${activeRide.id}/adjustment/respond`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'dispute' })
                        });
                        if (res.ok) onRefresh();
                      } catch (e) { console.error(e) }
                    }}
                    className="flex-shrink-0 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 font-bold py-3 px-5 rounded-xl shadow-sm transition active:scale-95 text-sm"
                  >
                    ✗ Dispute
                  </button>
                </div>
              </div>
            )}

            {activeRide.adjustmentStatus === 'disputed' && (
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Fare Adjustment Disputed</h4>
                  <p className="text-xs text-slate-600 mt-1">You disputed the +₹{activeRide.adjustmentAmount} charge. Original locked fare of <span className="font-mono font-bold">₹{activeRide.finalFare}</span> applies pending operations review. Decision within 2 hours.</p>
                </div>
              </div>
            )}

            {/* Ride Status Variables Summary Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* Dynamic Cost */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">DYNAMIC LOCKED FARE</span>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <h3 className="text-2xl font-black font-mono text-slate-800 tracking-tight">₹{activeRide.finalFare}</h3>
                  {activeRide.behaviorDiscount > 0 && (
                    <span className="text-[10px] text-emerald-500 font-bold font-mono">(-₹{activeRide.behaviorDiscount})</span>
                  )}
                </div>
              </div>

              {/* Safety Rating */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">SAFETY INDEX SCORE</span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <h3 className={`text-2xl font-black font-mono tracking-tight ${activeRide.safetyScore < 80 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {activeRide.safetyScore}%
                  </h3>
                  {activeRide.safetyScore < 100 ? (
                    <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
              </div>

              {/* Distance Info */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">TRANSIT ESTIMATION</span>
                <h3 className="text-2xl font-black font-mono text-slate-800 tracking-tight mt-1.5">
                  {activeRide.distanceKm} km
                </h3>
              </div>

              {/* ETA Mins */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">REMAINING TIME ETA</span>
                <h3 className="text-2xl font-black font-mono text-slate-800 tracking-tight mt-1.5">
                  {(activeRide.durationMin * (1 - activeRide.progress / 100)).toFixed(1)} mins
                </h3>
              </div>

            </div>

            {/* Unsafe Rider safety confirmation panel overlay */}
            {showSafetyConfirm && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-yellow-800 text-sm">We Detected Unsafe Driving Sells!</h4>
                    <p className="text-xs text-yellow-700 leading-relaxed mt-0.5">Your pilot exceeded dynamic monsoon parameters or deceleration limits. Safety teams require physical status confirmation immediately.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSafetyConfirm(false);
                      setSafetyLog(prev => [...prev, "Rider physically declared 'I feel safe' via active overlay."]);
                    }}
                    className="flex-1 bg-brand-emerald text-white hover:bg-brand-emerald-dark font-bold text-xs py-2.5 rounded-xl transition shadow"
                  >
                    I Feel Safe & Secure
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSafetyConfirm(false);
                      setComplaintText("Triggered active emergency overlay: driver is steering aggressively and ignored limit calls.");
                    }}
                    className="flex-1 bg-rose-500 text-white hover:bg-rose-600 font-bold text-xs py-2.5 rounded-xl transition shadow"
                  >
                    Escalate to Operations
                  </button>
                </div>
              </div>
            )}

            {/* TRIP COMPLETED -> FILE COMPLAINT / DISPUTE DIRECT FORM */}
            {activeRide.status === 'completed' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldAlert className="w-5 h-5 text-brand-emerald" />
                  <h4 className="font-bold text-slate-800 text-sm">File Dynamic Safe Shield Report</h4>
                </div>
                
                {disputeFiled ? (
                  <div className="p-4 bg-emerald-50 text-slate-800 border border-emerald-100 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-800 text-xs text-center block">Dispute Filed Successfully!</span>
                    <p className="text-[11px] text-slate-600 text-center">Your operations analyst summary has booted. Head to the Disputes tab to watch Gemini analytical decision trees.</p>
                  </div>
                ) : (
                  <form onSubmit={handleComplaint} className="space-y-4">
                    <p className="text-xs text-slate-500">Provide an operational note about any transit overspeeding risks, harsh driving, or surcharges to initiate fully automated dispute adjudication.</p>
                    <textarea
                      value={complaintText}
                      onChange={(e) => setComplaintText(e.target.value)}
                      placeholder="Comment on overspeeding/harsh braking or fare billing issues..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 p-3 text-xs font-semibold text-slate-700 rounded-xl outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10 transition"
                    />
                    <button
                      type="submit"
                      disabled={!complaintText.trim()}
                      className="bg-slate-900 text-white hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer disabled:cursor-not-allowed transition"
                    >
                      File Analysis Dispute
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

          {/* AI HELPFUL AGENT CHAT BOT ASSISTANT (LG Col 4) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl h-[560px] flex flex-col justify-between overflow-hidden shadow-xs">
            
            {/* Chat header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-emerald/15 flex items-center justify-center text-brand-emerald shrink-0">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">ZipRide AI Copilot</span>
                  <span className="text-[9px] font-mono text-slate-400 block font-bold leading-none uppercase">Grounded policy support</span>
                </div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>

            {/* Chat message body feeds */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4.5 bg-slate-50/30">
              {chatMessages.map((msg, index) => {
                const isModel = msg.role === 'model';
                return (
                  <div key={index} className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 border shadow-xs ${
                      isModel 
                        ? 'bg-white border-slate-200 text-slate-700' 
                        : 'bg-slate-900 border-slate-900 text-white'
                    }`}>
                      {isModel ? (
                        <div className="space-y-1.5">
                          {parseMarkdown(msg.parts[0].text)}
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed font-semibold">{msg.parts[0].text}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isSendingChat && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-2 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-brand-emerald animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-brand-emerald animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-brand-emerald animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Message input triggers */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-250 bg-white flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about weather fee or safety refunds..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold text-slate-700 outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10 transition"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingChat}
                className="w-10 h-10 rounded-xl bg-brand-emerald hover:bg-brand-emerald-dark text-white flex items-center justify-center shrink-0 transition shadow disabled:opacity-50"
              >
                <Send className="w-4 h-4 shrink-0" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
