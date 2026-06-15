import React, { useState } from 'react';
import { Shield, Bike, Scale, Send, Check } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (emailOrName: string) => void;
  isLoggedIn: boolean;
  currentUser: string | null;
  onLogout: () => void;
}

export default function LoginView({ onLoginSuccess, isLoggedIn, currentUser, onLogout }: LoginViewProps) {
  const [fullName, setFullName] = useState('Arul');
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [role, setRole] = useState<'rider' | 'driver'>('rider');
  const [showingOTP, setShowingOTP] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [enteredOTP, setEnteredOTP] = useState('');
  const [showingAgreement, setShowingAgreement] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorText('Please enter your full name.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setErrorText('Please enter a valid phone number.');
      return;
    }
    setErrorText('');
    
    // Generate simulated 4-digit code to show user in verification stage
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOTP(code);
    setShowingOTP(true);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOTP.trim()) {
      setErrorText('Please enter the verification code.');
      return;
    }
    if (enteredOTP === generatedOTP || enteredOTP === '1234') {
      setErrorText('');
      setShowingOTP(false);
      setShowingAgreement(true);
    } else {
      setErrorText(`Incorrect OTP. Please enter the generated OTP code: ${generatedOTP}`);
    }
  };

  const handleAcceptAgreement = () => {
    onLoginSuccess(fullName);
    setShowingAgreement(false);
  };

  if (isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center border border-emerald-100">
            <Check className="w-8 h-8 text-[#00C896]" strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Operational Session Active</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">Authorized User: {currentUser}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left text-xs space-y-2 mt-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Authorization Node:</span>
              <span className="font-mono font-bold text-emerald-600">FAIR_COMPLIANCE_APPROVED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Type:</span>
              <span className="font-mono text-slate-600">Rider / Operator Account</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            id="auth-logout-btn"
            className="w-full mt-6 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-sm border border-rose-200/50 transition cursor-pointer"
          >
            Revoke Access (Log Out)
          </button>
        </div>
      </div>
    );
  }

  if (showingOTP) {
    // FILL OTP VIEW (with dummy OTP automatically displayed or easy-click generated verification)
    return (
      <div className="max-w-[430px] mx-auto my-12 bg-white rounded-3xl border border-slate-20s0/80 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B1220] p-8 text-center text-white relative">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bike className="w-8 h-8 text-[#00C896]" />
            <h2 className="text-3xl font-extrabold tracking-tight">Verify Code</h2>
          </div>
          <p className="text-[#00C896] text-[13px] font-mono tracking-wide font-semibold">SMS Security Verification</p>
          <p className="text-slate-400 text-xs mt-2 font-sans font-medium">Verify your registered device number</p>
        </div>

        {/* Main Body */}
        <div className="p-8">
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            {errorText && (
              <div className="bg-rose-50 text-rose-600 text-xs py-2.5 px-4 rounded-xl border border-rose-100 font-semibold text-center">
                {errorText}
              </div>
            )}

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-center">
              <span className="text-xs text-slate-500 block mb-1 font-sans">Simulated Secure SMS Gateway</span>
              <span className="text-[14px] text-slate-805 font-bold block">
                Your one-time verification OTP is:{" "}
                <button
                  type="button"
                  onClick={() => setEnteredOTP(generatedOTP)}
                  className="font-mono text-base text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer inline-block mx-1 font-extrabold focus:outline-none"
                  title="Click to auto-fill"
                >
                  {generatedOTP}
                </button>
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">(Click the code block to auto-populate)</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-500 mb-2 font-sans uppercase text-center">
                Enter 4-Digit Security OTP
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                value={enteredOTP}
                onChange={(e) => setEnteredOTP(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center tracking-[1em] font-mono text-2xl px-4 py-4 bg-slate-50 border border-slate-200 focus:border-[#00C896] focus:ring-1 focus:ring-emerald-500/15 rounded-xl transition outline-none text-slate-800"
                id="auth-otp-input"
                autoFocus
              />
            </div>

            <button
              type="submit"
              id="auth-otp-submit-btn"
              className="w-full py-4 bg-[#00C896] hover:bg-[#00b384] text-white font-bold rounded-2xl text-[14px] flex items-center justify-center gap-2 tracking-wide transition shadow-sm transition-all shadow-emerald-400/5 cursor-pointer"
            >
              <Check className="w-4.5 h-4.5" strokeWidth={3} />
              <span>Verify & Continue</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowingOTP(false);
                setErrorText('');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer transition py-1"
            >
              ← Back to login details
            </button>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-5 mt-5 border-t border-slate-100/80 font-sans">
            <Shield className="w-4.5 h-4.5 text-[#00C896]" />
            <span className="font-medium">Secure verification via ZipRide SMS Gate</span>
          </div>
        </div>
      </div>
    );
  }

  if (showingAgreement) {
    // RIDER FAIRNESS AGREEMENT OVERLAY (Screenshot 4)
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-md">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100/85 mb-4">
            <Scale className="w-7 h-7 text-[#00C896]" />
          </div>
          
          <h3 className="text-[20px] font-bold text-slate-850 tracking-tight leading-tight">Rider Fairness Agreement</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
            Please review and accept before booking your first ride.
          </p>
        </div>

        {/* List of Agreement Commitments */}
        <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-100 my-6 space-y-4">
          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-[#00C896] shrink-0 mt-0.5" strokeWidth={3} />
            <span className="text-[13px] text-slate-600 font-medium leading-normal">
              I will treat my driver with respect and dignity.
            </span>
          </div>

          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-[#00C896] shrink-0 mt-0.5" strokeWidth={3} />
            <span className="text-[13px] text-slate-600 font-medium leading-normal">
              I will pay the locked fare digitally — no cash, no haggling.
            </span>
          </div>

          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-[#00C896] shrink-0 mt-0.5" strokeWidth={3} />
            <span className="text-[13px] text-slate-600 font-medium leading-normal">
              I will not request unsafe maneuvers or speeding.
            </span>
          </div>

          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-[#00C896] shrink-0 mt-0.5" strokeWidth={3} />
            <span className="text-[13px] text-slate-600 font-medium leading-normal">
              I understand fares are transparent and never surge.
            </span>
          </div>

          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-[#00C896] shrink-0 mt-0.5" strokeWidth={3} />
            <span className="text-[13px] text-slate-600 font-medium leading-normal">
              Disputes will be raised through the in-app dispute flow only.
            </span>
          </div>
        </div>

        {/* Accept Button Call to Action */}
        <button
          onClick={handleAcceptAgreement}
          className="w-full py-4 bg-[#00C896] hover:bg-[#00b384] text-white font-bold rounded-2xl text-[14px] flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-400/10 cursor-pointer"
        >
          <Check className="w-4.5 h-4.5" strokeWidth={3} />
          <span>I Accept & Agree</span>
        </button>
      </div>
    );
  }

  // SIGN IN BOX FORM (Screenshot 2)
  return (
    <div className="max-w-[430px] mx-auto my-12 bg-white rounded-3xl border border-slate-20s0/80 shadow-lg overflow-hidden">
      {/* Brand Header Slate */}
      <div className="bg-[#0B1220] p-8 text-center text-white relative">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Bike className="w-8 h-8 text-[#00C896]" />
          <h2 className="text-3xl font-extrabold tracking-tight">ZipRide</h2>
        </div>
        <p className="text-[#00C896] text-[13px] font-mono tracking-wide font-semibold">Fair fares. Safe rides.</p>
        <p className="text-slate-400 text-xs mt-2 font-sans font-medium">No surge. No cash. No surprises.</p>
      </div>

      {/* Main Body Input Fields */}
      <div className="p-8">
        <form onSubmit={handleSendOTP} className="space-y-5">
          {errorText && (
            <div className="bg-rose-50 text-rose-600 text-xs py-2.5 px-4 rounded-xl border border-rose-100 font-semibold text-center">
              {errorText}
            </div>
          )}

          {/* Full Name Input wrapper */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-slate-500 mb-2 font-sans uppercase">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-[#00C896] focus:ring-1 focus:ring-emerald-500/15 rounded-xl text-sm transition outline-none text-slate-700 font-sans"
              id="auth-fullName-input"
            />
          </div>

          {/* Phone number wrapper with layout country prefix */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-slate-500 mb-2 font-sans uppercase">
              Phone Number
            </label>
            <div className="relative flex">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium border-r border-slate-100 pr-3 font-mono">
                +91
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9876543210"
                className="w-full pl-16 pr-4 py-3.5 bg-white border border-slate-200 focus:border-[#00C896] focus:ring-1 focus:ring-emerald-500/15 rounded-xl text-sm transition outline-none text-slate-700 font-mono tracking-wide"
                id="auth-phoneNumber-input"
              />
            </div>
          </div>

          {/* Choose Role Radio items styled precisely */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-slate-500 mb-2.5 font-sans uppercase">
              Choose Your Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Rider box option */}
              <button
                type="button"
                onClick={() => setRole('rider')}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                  role === 'rider'
                    ? 'border-[#00C896] bg-[#F4FDFB] text-[#00C896] font-bold ring-2 ring-[#00C896]/10'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  role === 'rider' ? 'border-[#00C896] text-[#00C896]' : 'border-slate-300 text-slate-400'
                }`}>
                  <span className="text-[10px]">👤</span>
                </div>
                <span className="text-xs font-semibold">Rider</span>
              </button>

              {/* Driver box option */}
              <button
                type="button"
                onClick={() => setRole('driver')}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                  role === 'driver'
                    ? 'border-[#00C896] bg-[#F4FDFB] text-[#00C896] font-bold ring-2 ring-[#00C896]/10'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  role === 'driver' ? 'border-[#00C896] text-[#00C896]' : 'border-slate-300 text-slate-400'
                }`}>
                  <span className="text-[10px]">🏍️</span>
                </div>
                <span className="text-xs font-semibold">Driver</span>
              </button>
            </div>
          </div>

          {/* Verification Send OTP Button CTA */}
          <button
            type="submit"
            id="auth-login-submit-btn"
            className="w-full py-4 bg-[#00C896] hover:bg-[#00b384] text-white font-bold rounded-2xl text-[14px] flex items-center justify-center gap-2 tracking-wide transition shadow-sm transition-all shadow-emerald-400/5 cursor-pointer"
          >
            <Send className="w-4 h-4 ml-0.5" />
            <span>Send OTP</span>
          </button>
        </form>

        {/* Footer Note of Privacy Security (Screenshot 2 style) */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-5 mt-5 border-t border-slate-100/80 font-sans">
          <Shield className="w-4 h-4 text-[#00C896]" />
          <span className="font-medium">Your data is private and secure</span>
        </div>
      </div>
    </div>
  );
}
