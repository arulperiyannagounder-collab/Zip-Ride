// src/components/AiAssistantWidget.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Sparkles, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface AiAssistantWidgetProps {
  currentUser: string | null;
  currentUserRole: 'passenger' | 'driver' | 'admin' | null;
  currentPath: string;
}

export default function AiAssistantWidget({ currentUser, currentUserRole, currentPath }: AiAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('zipride_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved chat history:', e);
      }
    } else {
      // Default initial assistant greeting message
      const greeting = `Welcome to ZipRide Support! 🚗 I have live access to the network state. Ask me anything about fares, weather surcharges, safety events, or your current ride.`;
      const initialMsgs: Message[] = [{ role: 'model', parts: [{ text: greeting }] }];
      setMessages(initialMsgs);
      sessionStorage.setItem('zipride_chat_history', JSON.stringify(initialMsgs));
    }
  }, []);

  // Save chat history to sessionStorage whenever it changes
  const saveMessages = (newMsgs: Message[]) => {
    setMessages(newMsgs);
    sessionStorage.setItem('zipride_chat_history', JSON.stringify(newMsgs));
  };

  // Scroll messages to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');

    // Append user message
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
    const greeting = `Chat history cleared. How can I help you today?`;
    const initialMsgs: Message[] = [{ role: 'model', parts: [{ text: greeting }] }];
    saveMessages(initialMsgs);
  };

  // Hide the floating bubble on the login page or the full assistant page (since it has its own chat screen)
  if (currentPath === '/login' || currentPath === '/ai-assistant') {
    return null;
  }

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-emerald hover:bg-brand-emerald-dark text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-50 border-2 border-emerald-400 cursor-pointer"
        aria-label="AI Ride Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Expandable Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 md:w-96 w-[calc(100%-2rem)] max-h-[500px] h-[calc(100vh-8rem)] bg-theme-card border border-theme-border rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-5 duration-200 overflow-hidden">
          {/* Widget Header */}
          <div className="bg-brand-emerald text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight leading-none">AI Ride Assistant</h4>
                <span className="text-[10px] text-emerald-100 font-medium font-mono mt-1 block uppercase">Active state grounded</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleClearHistory}
                className="text-[10px] bg-white/10 hover:bg-white/20 text-white font-bold py-1 px-2 rounded transition font-mono uppercase cursor-pointer"
                title="Clear Chat History"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-theme-bg/30">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}>
                  <div className={`flex items-start gap-2 max-w-[85%]`}>
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0 border border-brand-emerald/20 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap font-medium shadow-2xs ${
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
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div className="w-6 h-6 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0 border border-brand-emerald/20 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-theme-card border border-theme-border text-theme-text-secondary rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs">
                    <span>AI is typing</span>
                    <span className="flex gap-0.5 items-center">
                      <span className="w-1 h-1 bg-theme-text-secondary rounded-full animate-bounce delay-75" />
                      <span className="w-1 h-1 bg-theme-text-secondary rounded-full animate-bounce delay-150" />
                      <span className="w-1 h-1 bg-theme-text-secondary rounded-full animate-bounce delay-300" />
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-theme-border bg-theme-card flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-theme-bg border border-theme-border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-emerald text-theme-text-primary font-medium"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-brand-emerald hover:bg-brand-emerald-dark disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:text-slate-500 text-white flex items-center justify-center transition shrink-0 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
