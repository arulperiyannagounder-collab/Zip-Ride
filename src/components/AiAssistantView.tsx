// src/components/AiAssistantView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot, User, Trash2, ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface AiAssistantViewProps {
  currentUser: string | null;
  currentUserRole: 'passenger' | 'driver' | 'admin' | null;
  onSelectTab: (path: string) => void;
  systemState: any;
  activeRide: any;
}

export default function AiAssistantView({ currentUser, currentUserRole, onSelectTab, systemState, activeRide }: AiAssistantViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync session chat history on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('zipride_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved chat history:', e);
      }
    } else {
      const greeting = `Welcome to ZipRide Support! 🚗 I have live access to the network state. Ask me anything about fares, weather surcharges, safety events, or your current ride.`;
      const initialMsgs: Message[] = [{ role: 'model', parts: [{ text: greeting }] }];
      setMessages(initialMsgs);
      sessionStorage.setItem('zipride_chat_history', JSON.stringify(initialMsgs));
    }
  }, []);

  const saveMessages = (newMsgs: Message[]) => {
    setMessages(newMsgs);
    sessionStorage.setItem('zipride_chat_history', JSON.stringify(newMsgs));
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');

    const updatedMsgs = [...messages, { role: 'user' as const, parts: [{ text: userText }] }];
    saveMessages(updatedMsgs);
    setIsTyping(true);

    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          history: messages,
          currentUser: currentUser || 'Saran',
          role: currentUserRole || 'passenger'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const modelText = data.answer || "I'm having trouble responding right now.";
        saveMessages([...updatedMsgs, { role: 'model' as const, parts: [{ text: modelText }] }]);
      } else {
        saveMessages([...updatedMsgs, { role: 'model' as const, parts: [{ text: "Error connecting to AI service." }] }]);
      }
    } catch (err) {
      console.error('AI Chat Error:', err);
      saveMessages([...updatedMsgs, { role: 'model' as const, parts: [{ text: "Network connection lost." }] }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    const greeting = `Chat history cleared. How can I assist you with ZipRide guidelines today?`;
    const initialMsgs: Message[] = [{ role: 'model', parts: [{ text: greeting }] }];
    saveMessages(initialMsgs);
  };

  const presetQuestions = [
    "What are the weather surcharges?",
    "Explain the overspeed penalties.",
    "Show me the traffic fare multipliers.",
    "Is my active ride safe?"
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-theme-card border border-theme-border rounded-2xl p-4 md:p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onSelectTab('/')}
            className="p-2.5 rounded-xl border border-theme-border bg-theme-bg text-theme-text-secondary hover:text-theme-text-primary transition cursor-pointer"
            title="Go back to Dashboard"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C896] animate-ping" />
              <h2 className="text-lg font-black text-theme-text-primary tracking-tight">Global AI Assistant Hub</h2>
            </div>
            <p className="text-xs text-theme-text-secondary font-medium mt-1">Grounded real-time safety & dynamic operations intelligence portal.</p>
          </div>
        </div>

        <button 
          onClick={handleClearHistory}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-50/70 border border-rose-200/50 hover:bg-rose-50 hover:text-rose-700 text-rose-600 rounded-xl font-bold text-xs transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Grounded State Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* User profile card */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-mono font-bold text-theme-text-secondary uppercase tracking-wider mb-4">Current Session Context</h4>
            <div className="flex items-center gap-3 border-b border-theme-border/60 pb-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 border flex items-center justify-center text-brand-emerald shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-theme-text-primary">{currentUser || 'Saran'}</h5>
                <span className="text-[10px] text-theme-text-secondary font-bold font-mono uppercase tracking-wide bg-theme-bg border border-theme-border px-1.5 py-0.5 rounded mt-0.5 inline-block">
                  Role: {currentUserRole || 'passenger'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-theme-text-secondary">Global Weather:</span>
                <span className="text-theme-text-primary font-bold">{systemState.config.weather}</span>
              </div>
              <div className="flex justify-between border-t border-theme-border/30 pt-2">
                <span className="text-theme-text-secondary">Global Traffic:</span>
                <span className="text-theme-text-primary font-bold">{systemState.config.traffic}</span>
              </div>
              <div className="flex justify-between border-t border-theme-border/30 pt-2">
                <span className="text-theme-text-secondary">Server Latency:</span>
                <span className="text-[#00C896] font-mono">14ms (Healthy)</span>
              </div>
            </div>
          </div>

          {/* Active Ride Card */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-mono font-bold text-theme-text-secondary uppercase tracking-wider mb-4">Grounded Active Ride</h4>
            {activeRide ? (
              <div className="space-y-3">
                <div className="p-3 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl">
                  <span className="text-[9px] font-mono text-emerald-700 font-extrabold uppercase tracking-wide">STATUS: {activeRide.status.replace('_', ' ')}</span>
                  <h5 className="text-xs font-bold text-theme-text-primary mt-0.5">Route: {activeRide.pickup} → {activeRide.drop}</h5>
                </div>

                <div className="space-y-2.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-theme-text-secondary">Ride ID:</span>
                    <span className="font-mono text-theme-text-primary">{activeRide.id}</span>
                  </div>
                  <div className="flex justify-between border-t border-theme-border/30 pt-2">
                    <span className="text-theme-text-secondary">Driver:</span>
                    <span className="text-theme-text-primary font-bold">{activeRide.driverName || 'Finding Driver...'}</span>
                  </div>
                  <div className="flex justify-between border-t border-theme-border/30 pt-2">
                    <span className="text-theme-text-secondary">Dynamic Fare:</span>
                    <span className="text-indigo-500 font-bold">₹{activeRide.finalFare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-theme-border/30 pt-2">
                    <span className="text-theme-text-secondary">Safety Score:</span>
                    <span className={`${activeRide.safetyScore >= 80 ? 'text-emerald-600' : 'text-rose-500'} font-bold`}>{activeRide.safetyScore}%</span>
                  </div>
                  <div className="flex justify-between border-t border-theme-border/30 pt-2">
                    <span className="text-theme-text-secondary">SOS Alerts:</span>
                    <span className={`${activeRide.hasActiveSOS ? 'text-red-650 animate-pulse font-extrabold' : 'text-theme-text-secondary'}`}>
                      {activeRide.hasActiveSOS ? '🚨 ACTIVE SOS' : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-theme-text-secondary text-xs">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <span>No active ride. General queries mode.</span>
              </div>
            )}
          </div>

          {/* Quick FAQ / Presets */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-mono font-bold text-theme-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Suggested Queries</span>
            </h4>
            <div className="space-y-2">
              {presetQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="w-full text-left p-2.5 rounded-xl border border-theme-border hover:border-brand-emerald bg-theme-bg/50 hover:bg-theme-hover-bg text-xs font-semibold text-theme-text-primary transition cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Screen */}
        <div className="lg:col-span-8 bg-theme-card border border-theme-border rounded-2xl h-[550px] flex flex-col shadow-xs overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-theme-border/80 bg-theme-card flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center border border-brand-emerald/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-theme-text-primary tracking-tight">Gemini Support Assistant</h3>
              <p className="text-[10px] text-theme-text-secondary font-mono leading-none mt-1">MODEL: gemini-3.5-flash</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-theme-bg/20">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-100`}>
                  <div className="flex items-start gap-3 max-w-[80%]">
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-brand-emerald/15 text-brand-emerald flex items-center justify-center shrink-0 border border-brand-emerald/20 mt-0.5">
                        <Bot className="w-4.5 h-4.5" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed font-semibold shadow-xs ${
                      isUser
                        ? 'bg-brand-emerald text-white rounded-tr-none'
                        : 'bg-theme-card border border-theme-border text-theme-text-primary rounded-tl-none'
                    }`}>
                      {msg.parts[0].text}
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="flex items-start gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-brand-emerald/15 text-brand-emerald flex items-center justify-center shrink-0 border border-brand-emerald/20 mt-0.5">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                  <div className="bg-theme-card border border-theme-border text-theme-text-secondary rounded-2xl rounded-tl-none px-4 py-3 text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs">
                    <span>AI Assistant is writing</span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-theme-text-secondary rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-theme-text-secondary rounded-full animate-bounce delay-75" />
                      <span className="w-1 h-1 bg-theme-text-secondary rounded-full animate-bounce delay-150" />
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-theme-border bg-theme-card flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-brand-emerald text-theme-text-primary"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-5 bg-brand-emerald hover:bg-brand-emerald-dark disabled:bg-slate-350 disabled:dark:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl flex items-center justify-center transition shrink-0 shadow-md cursor-pointer text-xs"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
