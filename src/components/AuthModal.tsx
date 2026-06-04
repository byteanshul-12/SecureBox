import React, { useState } from "react";
import { Shield, Mail, Lock, X, ArrowLeft, ArrowRight, Zap, CheckCircle, KeyRound, Globe } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (jwtToken: string, profile: any, user: any) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Instant login bypass - NO OTP REQUIRED
  const handleInstantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setAuthError("Please specify a valid Gmail or workspace email address.");
      return;
    }

    setIsLoggingIn(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/auth/instant-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Instant synchronization failed.");
      }

      const data = await res.json();
      
      // Let parent hook handle success with verified JWT claims
      onSuccess(data.jwtToken, data.profile, { uid: data.uid, email: email });
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Failed to establish a secure box session.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-[#F8F7F4] rounded-xl border-4 border-black text-left space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        
        {/* Header containing Exit trigger */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-[#4F8CFF] border-2 border-black rounded-sm">
              <Shield className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <span className="font-display font-black text-slate-950 uppercase tracking-wider text-xs">SECURITY LOGIN GATEWAY</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-700 hover:text-black rounded-lg hover:bg-black/5 border-2 border-transparent hover:border-black transition-all cursor-pointer"
          >
            <X className="w-5 h-5 font-bold" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h2 className="font-display text-2xl font-black text-slate-950 tracking-tight">Access SecureBox</h2>
          <p className="text-xs text-slate-700 font-semibold leading-relaxed">Enter your email address to instantly authenticate via JWT and scan for threat reports.</p>
        </div>

        {authError && (
          <div className="p-3.5 bg-rose-100 border-2 border-black text-rose-950 text-xs rounded-lg leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <strong className="font-bold">Authentication Warning:</strong> {authError}
          </div>
        )}

        {/* DIRECT BYPASS LOGIN FORM */}
        <div className="space-y-4">
          <form onSubmit={handleInstantLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-800 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                <input
                  type="email"
                  required
                  placeholder="e.g. tester@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] text-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full py-3.5 rounded-lg text-sm font-extrabold transition-all flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                isLoggingIn 
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed" 
                  : "bg-[#4F8CFF] hover:bg-[#3b7ae6] text-white cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              {isLoggingIn ? "Authenticating Session..." : "Secure Login via JWT"}
              <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
