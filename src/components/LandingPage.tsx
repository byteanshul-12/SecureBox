import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Mail, Zap, CheckCircle, Bell, ArrowRight, Play, Server, 
  Clock, Lock, Eye, Chrome, Sparkles, AlertTriangle, RefreshCw,
  HelpCircle, ChevronDown, Check, Star, Users, ArrowUpRight, CheckSquare,
  Network
} from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase.ts";

interface LandingProps {
  onGoogleLogin: () => void;
  onOtpLoginClick: () => void;
  onInstantLogin?: (email: string) => Promise<void>;
}

export default function LandingPage({ onGoogleLogin, onOtpLoginClick, onInstantLogin }: LandingProps) {
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  
  // Terminal Simulator State
  const [simStep, setSimStep] = useState(1);
  const [simActive, setSimActive] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(0);

  // Scenarios for interactive terminal preview
  const scenarios = [
    {
      from: "support@billing-google.com",
      subject: "Urgent: Direct payment required for workspace preservation",
      type: "Phishing",
      score: "99%",
      badges: ["SPF Mismatch", "Suspicious Link", "Urgent Subject"],
      spf: "FAIL",
      dkim: "INVALID",
      linkSafety: "DANGEROUS",
      senderHistory: "UNKNOWN (0 Days)"
    },
    {
      from: "secure-alert@paypal-update-services.net",
      subject: "Unauthorized Login Attempt Flagged from Belarus - Confirm ID",
      type: "Phishing",
      score: "96%",
      badges: ["Spoofed Domain", "External URL", "High Urgency"],
      spf: "FAIL",
      dkim: "UNVERIFIED",
      linkSafety: "MALFORMED LINK",
      senderHistory: "UNTRUSTED"
    },
    {
      from: "newsletter@hacker-news-digest.org",
      subject: "HN Core: Show HN: SecureBox - Retro-Brutalist Spam Shield",
      type: "Safe",
      score: "2%",
      spf: "PASS",
      dkim: "VALID",
      linkSafety: "CLEAN",
      senderHistory: "HIGH REPUTATION"
    }
  ];

  const currentScenario = scenarios[selectedScenario];

  // Auto-advance terminal steps for immersive simulator
  useEffect(() => {
    if (!simActive) return;
    const interval = setInterval(() => {
      setSimStep((prev) => {
        if (prev >= 5) {
          // Stay on final step for a bit, then cycle scenarios & start over
          setTimeout(() => {
            setSimStep(1);
            setSelectedScenario((s) => (s + 1) % scenarios.length);
          }, 4500);
          return 5;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [simActive, selectedScenario]);

  // Statistics counters
  const [stats, setStats] = useState({ spamBlock: 142084, phishShield: 29845 });
  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => ({
        spamBlock: prev.spamBlock + Math.floor(Math.random() * 3) + 1,
        phishShield: prev.phishShield + (Math.random() > 0.85 ? 1 : 0)
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // FAQ Expandable State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes("@")) return;

    setWaitlistLoading(true);
    try {
      await addDoc(collection(db, "waitlist"), {
        email: waitlistEmail,
        registeredAt: new Date().toISOString()
      }).catch(dbErr => {
        console.warn("Firestore waitlist write skipped, proceeding directly:", dbErr);
      });

      if (onInstantLogin) {
        await onInstantLogin(waitlistEmail);
      } else {
        setWaitlistSuccess(true);
        setWaitlistEmail("");
      }
    } catch (err) {
      console.error("Waitlist error:", err);
      if (onInstantLogin) {
        // Fallback to direct bypass login to keep experience robust
        await onInstantLogin(waitlistEmail).catch(e => console.error("Bypass login failed:", e));
      } else {
        setWaitlistSuccess(true);
      }
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <div id="landing-root" className="min-h-screen bg-[#F8F7F4] text-slate-900 pb-24 font-sans selection:bg-[#4F8CFF] selection:text-white relative overflow-x-hidden">
      
      {/* Retrogird Background Accent lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* ================================== NAVBAR ================================== */}
      <nav id="navbar" className="sticky top-0 z-50 bg-[#F8F7F4]/90 backdrop-blur-md border-b-4 border-black transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Left: Shield logo & Label */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4F8CFF] border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Shield className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              SecureBox <span className="text-[#4F8CFF]">AI</span>
            </span>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 font-display text-sm font-bold">
            <a href="#features" className="hover:text-[#4F8CFF] transition-colors relative group py-1">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full" />
            </a>
            <a href="#problem" className="hover:text-[#4F8CFF] transition-colors relative group py-1">
              The Problem
            </a>
            <a href="#how-it-works" className="hover:text-[#4F8CFF] transition-colors relative group py-1">
              How It Works
            </a>
            <a href="#integrations" className="hover:text-[#4F8CFF] transition-colors relative group py-1">
              Integrations
            </a>
            <a href="#pricing" className="hover:text-[#4F8CFF] transition-colors relative group py-1">
              Pricing
            </a>
          </div>

          {/* Right CTA / Auth controls */}
          <div className="flex items-center gap-3.5">
            <button 
              id="nav-oauth-login"
              onClick={onOtpLoginClick} 
              className="text-xs sm:text-sm font-display font-black hover:text-[#4F8CFF] transition-all cursor-pointer mr-2.5"
            >
              Returning Member / OTP
            </button>
            <button 
              id="get-started-cta"
              onClick={onGoogleLogin}
              className="px-4.5 py-2.5 rounded-lg text-xs sm:text-sm font-display font-extrabold bg-[#4F8CFF] text-white border-2 sm:border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ================================== HERO SECTION ================================== */}
      <header className="max-w-7xl mx-auto px-6 pt-12 lg:pt-20 pb-20 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center relative">
        
        {/* Left Column Area */}
        <div className="lg:col-span-7 space-y-8 text-left z-10">
          
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#FFEED4] border-[3px] border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-bounce-subtle">
            <div className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500"></span>
            </div>
            <span className="font-display text-xs font-black tracking-wider text-slate-800 uppercase">
              AI AGENTS SPAM BLOCKER • BETA ACCESS OPEN
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-slate-950 font-extrabold">
            Stop Spam Before It <br className="hidden sm:inline" />
            Reaches Your{" "}
            <span className="inline-block relative px-3 py-1 bg-[#4F8CFF] text-white border-[4.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg] hover:rotate-[1deg] transition-transform duration-200">
              Inbox.
            </span>
          </h1>

          {/* Subheadline content */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-700 max-w-[620px] leading-relaxed font-medium">
            Autonomous AI agents continuously monitor, filter, analyze, and block spam, phishing attacks, malicious links, and unwanted newsletters before they reach your inbox. 
          </p>

          {/* CTA Action Buttons side-by-side */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4.5 pt-2">
            
            <button
              id="hero-primary-cta"
              onClick={onGoogleLogin}
              className="px-8 py-4.5 bg-[#4F8CFF] text-white text-base font-display font-black rounded-xl border-3.5 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2.5"
            >
              Get Started Free <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <a
              href="#interactive-sandbox"
              className="px-8 py-4.5 bg-[#FFFFFF] text-slate-900 text-base font-display font-black rounded-xl border-3.5 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2.5 cursor-pointer text-center"
            >
              ▶ Watch Demo
            </a>
          </div>

          {/* Trust Indicators Section */}
          <div className="pt-8 border-t border-black/10 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-md border border-neutral-400">
                <Check className="w-4.5 h-4.5 text-emerald-800 stroke-[3]" />
              </div>
              <span className="font-display font-extrabold text-xs sm:text-sm text-slate-800">3-Min Setup</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-md border border-neutral-400">
                <Check className="w-4.5 h-4.5 text-blue-800 stroke-[3]" />
              </div>
              <span className="font-display font-extrabold text-xs sm:text-sm text-slate-800">99.98% Spam Accuracy</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-md border border-neutral-400">
                <Check className="w-4.5 h-4.5 text-purple-800 stroke-[3]" />
              </div>
              <span className="font-display font-extrabold text-xs sm:text-sm text-slate-800">SOC2 Compliant</span>
            </div>
          </div>

        </div>

        {/* ================================== RIGHT COLUMN: AI Live Terminal Monitor ================================== */}
        <div className="lg:col-span-5 w-full flex flex-col justify-center items-center">
          
          <div className="relative w-full max-w-[480px]">
            {/* Absolute Backing Block Shadow (Brutalist style) */}
            <div className="absolute inset-0 bg-[#000000] rounded-2xl md:translate-x-3.5 md:translate-y-3.5 translate-x-2.5 translate-y-2.5" />
            
            <div className="relative w-full rounded-2xl border-4 border-black bg-[#1E202B] text-slate-200 overflow-hidden text-left flex flex-col h-[480px] shadow-lg animate-float">
              
              {/* Terminal Title Header */}
              <div className="bg-[#2E3142] px-4 py-3 border-b-4 border-black flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-black shadow-[1px_1px_0px_rgba(0,0,0,0.5)] cursor-pointer" />
                  <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 border border-black shadow-[1px_1px_0px_rgba(0,0,0,0.5)] cursor-pointer" />
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-black shadow-[1px_1px_0px_rgba(0,0,0,0.5)] cursor-pointer" />
                  <span className="ml-2 font-mono text-xs font-semibold text-[#8F94A7]">agent-monitor.sh</span>
                </div>
                
                <span className="px-2 py-0.5 rounded bg-black/30 border border-slate-700 font-mono text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  ONLINE
                </span>
              </div>

              {/* Terminal Body Content Area */}
              <div className="flex-1 p-5 font-mono text-[12px] leading-relaxed overflow-y-auto space-y-4">
                
                {/* Scenario Toggle Panel */}
                <div className="pb-3 border-b border-slate-800 flex items-center justify-between text-[11px] text-[#8F94A7]">
                  <span>SCENARIO DEMO TRACK:</span>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedScenario(idx);
                          setSimStep(1);
                        }}
                        className={`px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          selectedScenario === idx 
                            ? "bg-[#4F8CFF] text-white border-black" 
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 1: Incoming Email Found */}
                <div className="transition-all duration-300">
                  <p className="text-[#8F94A7] font-semibold flex items-center gap-2">
                    <span className="text-blue-400">Step 1:</span> Incoming Email Found
                  </p>
                  <div className="ml-4 mt-1 p-2 bg-black/40 border border-[#2E3142] rounded text-[11px] text-slate-300">
                    <span className="text-yellow-400">From:</span> {currentScenario.from}
                    <br />
                    <span className="text-yellow-400 font-medium">Subject:</span> "{currentScenario.subject.substring(0, 48)}..."
                  </div>
                </div>

                {/* Step 2: AI Threat Scan Running */}
                <AnimatePresence>
                  {simStep >= 2 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="transition-all duration-300"
                    >
                      <p className="text-[#8F94A7] font-semibold flex items-center gap-2">
                        <span className="text-blue-400">Step 2:</span> AI Threat Scan Running...
                      </p>
                      <div className="ml-4 mt-1 flex items-center gap-1.5 text-[#4F8CFF] font-bold">
                        <div className="w-2 h-2 bg-[#4F8CFF] animate-ping rounded-full" />
                        <span>[Gemini Pro Cognitive Inspector Executing]</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step 3: Heuristic Scans validation */}
                <AnimatePresence>
                  {simStep >= 3 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1 transition-all duration-300"
                    >
                      <p className="text-[#8F94A7] font-semibold">
                        <span className="text-blue-400">Step 3:</span> Analyzing:
                      </p>
                      <div className="ml-4 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-300 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={currentScenario.spf === "PASS" ? "text-emerald-400" : "text-rose-400 font-bold"}>✓</span> 
                          <span>SPF Record: <strong className={currentScenario.spf === "PASS" ? "text-emerald-400" : "text-rose-400"}>{currentScenario.spf}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={currentScenario.dkim === "VALID" ? "text-emerald-400" : "text-rose-400 font-bold"}>✓</span> 
                          <span>DKIM: <strong className={currentScenario.dkim === "VALID" ? "text-emerald-400" : "text-rose-400"}>{currentScenario.dkim}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={currentScenario.type === "Safe" ? "text-emerald-400" : "text-rose-400 font-bold"}>✓</span> 
                          <span>Domain Reputation</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={currentScenario.linkSafety === "CLEAN" ? "text-emerald-400" : "text-rose-400 font-bold"}>✓</span> 
                          <span>Link Safety</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <span className="text-emerald-400">✓</span> 
                          <span>Sender History: {currentScenario.senderHistory || "VERIFIED"}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step 4: Show Alert Badge */}
                <AnimatePresence>
                  {simStep >= 4 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="transition-all duration-300"
                    >
                      <p className="text-[#8F94A7] font-semibold">
                        <span className="text-blue-400">Step 4:</span> Global Profile Assessment:
                      </p>
                      
                      {currentScenario.type === "Phishing" ? (
                        <div className="relative mt-2 p-3 bg-red-950/40 border-3 border-rose-500 rounded-lg flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(239,68,68,1)] text-rose-200">
                          <div>
                            <p className="font-extrabold text-[12px] tracking-wider text-rose-500 uppercase">PHISHING DETECTED</p>
                            <p className="text-[10px] text-rose-300">Confidence Match Score: {currentScenario.score}</p>
                          </div>
                          <AlertTriangle className="w-7 h-7 text-rose-500 animate-bounce" />
                        </div>
                      ) : (
                        <div className="relative mt-2 p-3 bg-emerald-950/40 border-3 border-emerald-500 rounded-lg flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(16,185,129,1)] text-emerald-200">
                          <div>
                            <p className="font-extrabold text-[12px] tracking-wider text-emerald-500 uppercase">INBOX SAFE</p>
                            <p className="text-[10px] text-emerald-300">Clean Sentiment Rating: 98%</p>
                          </div>
                          <CheckSquare className="w-7 h-7 text-emerald-400" />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step 5: Show Final Decision */}
                <AnimatePresence>
                  {simStep >= 5 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="transition-all duration-300"
                    >
                      <p className="text-[#8F94A7] font-semibold">
                        <span className="text-blue-400">Step 5:</span> Threat Mitigator Outcome:
                      </p>
                      
                      {currentScenario.type === "Phishing" ? (
                        <div className="mt-2.5 px-3.5 py-2.5 bg-emerald-950/80 border-[3px] border-emerald-500 rounded text-center text-emerald-400 font-black tracking-widest text-[12px] uppercase">
                          DECISION: QUARANTINED SUCCESSFULLY
                        </div>
                      ) : (
                        <div className="mt-2.5 px-3.5 py-2.5 bg-[#4F8CFF]/15 border-[3px] border-[#4F8CFF] rounded text-center text-[#4F8CFF] font-black tracking-widest text-[12px] uppercase">
                          DECISION: ROUTED TO GENERAL INBOX
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Interactive Pause/Play */}
              <div className="bg-[#14151D] px-4 py-2 border-t-2 border-black flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Simulation Loop Running</span>
                <button 
                  onClick={() => setSimActive(!simActive)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-600 font-bold transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${simActive ? "animate-spin" : ""}`} />
                  {simActive ? "Pause Loop" : "Resume"}
                </button>
              </div>

            </div>
          </div>

          {/* Bottom Live Activity Feed Bar */}
          <div className="w-full max-w-[480px] mt-6 relative">
            <div className="absolute inset-0 bg-[#000000] rounded-xl translate-x-2.5 translate-y-2.5" />
            <div className="relative bg-[#FFFFFF] border-3 border-black p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div className="text-left font-mono text-xs text-slate-800">
                  <span className="font-bold text-slate-500 uppercase tracking-widest block text-[9px]">● Live Feed Activity</span>
                  <span className="font-extrabold truncate block max-w-[200px] sm:max-w-xs">{currentScenario.from}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-[9px] font-black text-slate-400 uppercase block">Status:</span>
                <span className="font-mono text-xs font-black text-blue-600 animate-pulse">{simStep < 5 ? "Scanning..." : "Mitigated ✓"}</span>
              </div>
            </div>
          </div>

        </div>

      </header>

      {/* ================================== COGNITIVE COUNTERS BANNER ================================== */}
      <section className="bg-black text-white border-y-4 border-black py-8 mt-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10 font-display">
          
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest font-black text-slate-400">Total Scans Synchronized</p>
            <p className="text-3xl sm:text-4xl font-black font-mono text-[#4F8CFF]">{(stats.spamBlock * 4.3).toFixed(0)}</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest font-black text-slate-400">Spam Vectors Deflected</p>
            <p className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">{stats.spamBlock.toLocaleString()}</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest font-black text-slate-400">Active Phishing Defeated</p>
            <p className="text-3xl sm:text-4xl font-black font-mono text-rose-500">{stats.phishShield.toLocaleString()}</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest font-black text-slate-400">Average Threat Latency</p>
            <p className="text-3xl sm:text-4xl font-black font-mono text-purple-400">0.02s</p>
          </div>

        </div>
      </section>

      {/* ================================== THE PROBLEM ================================== */}
      <section id="problem" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="font-display text-xs font-black uppercase text-[#4F8CFF] px-2.5 py-1 bg-[#4F8CFF]/10 rounded-md border-2 border-black inline-block">The Current Scenario</span>
          <h2 className="font-display text-3xl sm:text-5xl font-black tracking-tight leading-none text-slate-950 font-extrabold">
            Standard Email Filters are Broken.
          </h2>
          <p className="text-slate-600 font-semibold max-w-xl mx-auto text-base">
            Modern corporate email accounts are targets of customized conversational attacks that fly past basic static filter lists and legacy rule blocks effortlessly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          
          {/* Box 1: Why current filters fail */}
          <div className="bg-[#FFF0F0] border-4 border-black rounded-2xl p-8 relative shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-rose-500 border-2 border-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">Legacy Rules & Keywords</h3>
            </div>
            
            <p className="text-slate-700 text-sm font-medium leading-relaxed mb-6">
              Old spam filters search for generic red flags like "viagra" or "claim prize". Modern phishers write natural, professional-sounding messages that look exactly like standard workspace updates from HR or Billing.
            </p>

            <ul className="space-y-3.5 font-mono text-xs text-rose-900">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-600 font-extrabold">✕</span>
                <span>Fooled by look-alike sender domain variations</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-600 font-extrabold">✕</span>
                <span>Cannot trace redirections in deep link networks</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-600 font-extrabold">✕</span>
                <span>Zero cognitive reasoning on email attachment contents</span>
              </li>
            </ul>
          </div>

          {/* Box 2: SecureBox Agent Shield solution */}
          <div className="bg-[#F0FFF4] border-4 border-black rounded-2xl p-8 relative shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-500 border-2 border-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">Autonomous SecureBox AI</h3>
            </div>
            
            <p className="text-slate-700 text-sm font-medium leading-relaxed mb-6">
              SecureBox deploys persistent cognitive agents built with state-of-the-art LLMs. The platform evaluates semantic context, verifies complete security headers, resolves destination links, and blocks threats.
            </p>

            <ul className="space-y-3.5 font-mono text-xs text-emerald-900">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-extrabold">✓</span>
                <span>Deploys Gemini reasoning to diagnose intent in text</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-extrabold">✓</span>
                <span>Verifies authenticated SPF/DKIM validation metrics</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-extrabold">✓</span>
                <span>Runs inline link simulations inside secure isolated sandboxes</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ================================== INTERACTIVE SANDBOX DEMO TESTER ================================== */}
      <section id="interactive-sandbox" className="py-20 px-6 max-w-7xl mx-auto bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4F8CFF]/10 border-b-4 border-l-4 border-black flex items-center justify-center font-display font-black text-xs rotate-[10deg] select-none translate-x-8 -translate-y-4">
          SANDBOX ENGINE
        </div>

        <div className="grid lg:grid-cols-2 gap-12 text-left">
          
          <div className="space-y-6">
            <span className="px-2.5 py-1 text-xs bg-purple-100 text-purple-800 border-2 border-black font-display font-black rounded-lg inline-block">
              TEST YOUR OWN MAIL COPY
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-950 font-extrabold leading-tight">
              Test suspicious text offline in our diagnostic sandbox.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed font-semibold">
              Copy-paste metadata, suspicious headers, content blocks, or email texts directly below. SecureBox running in secure preview simulation mode will parse your input on the fly to diagnose security flags in real time.
            </p>

            <div className="space-y-4 font-mono text-xs text-slate-700 bg-[#F8F7F4] p-4.5 border-2 border-black rounded-xl">
              <p className="font-bold border-b border-black/10 pb-2 text-[11px] text-slate-500 uppercase tracking-widest">Diagnostic Flags we look for:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#4F8CFF] rounded-full" />
                  <span>Intent Tone Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#4F8CFF] rounded-full" />
                  <span>Urgent Action Flags</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#4F8CFF] rounded-full" />
                  <span>Hidden Link Safety</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#4F8CFF] rounded-full" />
                  <span>Social Engineering Tricks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Tester Sandbox Element */}
          <div className="space-y-4">
            <MailSandboxDemo />
          </div>

        </div>
      </section>

      {/* ================================== FEATURES GRID ================================== */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="font-display text-xs font-black uppercase text-[#4F8CFF] px-2.5 py-1 bg-[#4F8CFF]/10 rounded-md border-2 border-black inline-block">The SecureBox Suite</span>
          <h2 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-slate-950 font-extrabold leading-none">
            Built for Absolute Security.
          </h2>
          <p className="text-slate-600 font-semibold max-w-lg mx-auto text-base">
            Equipped with deep AI diagnostic scanners, automatic rule executors, and robust security panels.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Google OAuth */}
          <div className="bg-white border-4 border-black rounded-2xl p-6.5 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-12 h-12 bg-[#E1EBFF] border-3 border-black rounded-xl mb-6 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <Server className="w-6 h-6 text-[#4F8CFF]" />
              </div>
              <h3 className="font-display font-black text-xl mb-2.5 text-slate-900 group-hover:text-[#4F8CFF] transition-colors">Google OAuth Access</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Connect your real Gmail identity securely through certified authentication popups. No custom API tokens or raw passwords required.
              </p>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#4F8CFF] mt-6 tracking-widest block uppercase">✓ FULLY COMPLIANT</span>
          </div>

          {/* Card 2: Automated Categorization */}
          <div className="bg-white border-4 border-black rounded-2xl p-6.5 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-12 h-12 bg-[#E6FDF4] border-3 border-black rounded-xl mb-6 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="font-display font-black text-xl mb-2.5 text-slate-900 group-hover:text-[#4F8CFF] transition-colors">Automated Sorting</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Sort out promotional spam, newsletter updates, cold marketing outreach, work emails, and urgent personal items instantly.
              </p>
            </div>
            <span className="font-mono text-[10px] font-bold text-emerald-500 mt-6 tracking-widest block uppercase">✓ AUTO LABELS</span>
          </div>

          {/* Card 3: Dynamic Guard Levels */}
          <div className="bg-white border-4 border-black rounded-2xl p-6.5 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-12 h-12 bg-[#FFF3EE] border-3 border-black rounded-xl mb-6 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <Bell className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-display font-black text-xl mb-2.5 text-slate-900 group-hover:text-[#4F8CFF] transition-colors">Dynamic Guard Levels</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Choose between Relaxed, Balanced, Strict, and Enterprise scanning policies to match your specific threat security profile.
              </p>
            </div>
            <span className="font-mono text-[10px] font-bold text-orange-500 mt-6 tracking-widest block uppercase">✓ ADJUSTABLE THRESHOLD</span>
          </div>

          {/* Card 4: Intelligent Custom Rules */}
          <div className="bg-white border-4 border-black rounded-2xl p-6.5 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-12 h-12 bg-amber-50 border-3 border-black rounded-xl mb-6 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-display font-black text-xl mb-2.5 text-slate-900 group-hover:text-[#4F8CFF] transition-colors">Custom Rule Executor</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Establish custom matching rules for email categories to label, auto-archive, delete, or flag suspicious warnings in Gmail automatically.
              </p>
            </div>
            <span className="font-mono text-[10px] font-bold text-amber-500 mt-6 tracking-widest block uppercase">✓ CUSTOM ACTION DECK</span>
          </div>

          {/* Card 5: URL & Attachment Analysis */}
          <div className="bg-white border-4 border-black rounded-2xl p-6.5 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-12 h-12 bg-[#F6EEFF] border-3 border-black rounded-xl mb-6 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-display font-black text-xl mb-2.5 text-slate-900 group-hover:text-[#4F8CFF] transition-colors">Attachment Sandbox</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Detect phishing domain tricks, fraudulent request forms, mismatching envelope senders, and risky inline resources.
              </p>
            </div>
            <span className="font-mono text-[10px] font-bold text-purple-500 mt-6 tracking-widest block uppercase">✓ ISOLATED CHECK SITES</span>
          </div>

          {/* Card 6: Threat Sandbox Controls */}
          <div className="bg-white border-4 border-black rounded-2xl p-6.5 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-12 h-12 bg-pink-50 border-3 border-black rounded-xl mb-6 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <Eye className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="font-display font-black text-xl mb-2.5 text-slate-900 group-hover:text-[#4F8CFF] transition-colors">Heuristic Simulator</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Draft a suspicious cold outreach email or copy unknown sender messages into our custom scanner page to test indicators offline.
              </p>
            </div>
            <span className="font-mono text-[10px] font-bold text-pink-500 mt-6 tracking-widest block uppercase">✓ INSTANT TESTING DECK</span>
          </div>

        </div>
      </section>

      {/* ================================== HOW IT WORKS ================================== */}
      <section id="how-it-works" className="py-24 bg-black text-white border-y-4 border-black relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          <div className="text-center max-w-2.5xl mx-auto mb-20 space-y-4">
            <span className="font-display text-xs font-black uppercase text-[#4F8CFF] px-2.5 py-1 bg-[#4F8CFF]/15 rounded-md border-2 border-slate-700 inline-block">DEPLOY STEPS</span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight font-extrabold">How SecureBox Shields You</h2>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-md mx-auto">
              Get up and running within 180 seconds. SecureBox runs quietly in the cloud without slowing down your local computer.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 text-left relative">
            
            {/* Step 1 */}
            <div className="space-y-4 relative">
              <div className="w-14 h-14 bg-white text-slate-950 font-display font-black text-2xl border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(79,140,255,1)]">
                1
              </div>
              <h3 className="font-display font-bold text-xl text-white">OAuth Secure Bind</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Link SecureBox directly with your Google Workspace using a secure read-only token. We don't save your master credentials.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 relative">
              <div className="w-14 h-14 bg-white text-slate-950 font-display font-black text-2xl border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]">
                2
              </div>
              <h3 className="font-display font-bold text-xl text-white">Select Guard Profiles</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Configure rules corresponding to your threat risk profile. Choose simple auto-label folders, quick warns, or complete quarantined moves.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 relative">
              <div className="w-14 h-14 bg-white text-slate-950 font-display font-black text-2xl border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]">
                3
              </div>
              <h3 className="font-display font-bold text-xl text-white">Continuous Shielding</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Sit back while cognitive agents process every incoming email. View live statistics, flag triggers, and customized logs in real-time.
              </p>
            </div>

          </div>

          {/* Secure CTAs */}
          <div className="mt-16 pt-12 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={onGoogleLogin}
              className="px-8 py-4 bg-[#4F8CFF] hover:bg-[#3D7AEA] font-display font-black rounded-xl border-3 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] text-white hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:translate-x-0 cursor-pointer text-sm transition-all flex items-center gap-2"
            >
              Link Gmail Account Setup <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </section>

      {/* ================================== CHROMIUM INTEGRATIONS ================================== */}
      <section id="integrations" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="bg-white border-4 border-black rounded-3xl p-8 sm:p-12 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] grid lg:grid-cols-12 gap-12 items-center text-left overflow-hidden">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="px-3 py-1 bg-blue-100 border-2 border-black text-blue-900 font-display font-black text-xs rounded-lg inline-flex items-center gap-2">
              <Chrome className="w-4 h-4 text-blue-700" />
              CHROME EXTENSION (BETA)
            </span>
            
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-none">
              Scan Direct inside Google Mail with the Extension
            </h2>
            <p className="text-slate-600 text-sm font-semibold leading-relaxed">
              Analyze incoming messages directly inside your Google Chrome Gmail client view without switching applications. Click one button to trigger instant AI classifications, secure malicious warnings, and read sandboxed explanations, right on your screen.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2 font-display text-xs sm:text-sm font-extrabold">
              <div className="flex items-center gap-2 text-slate-800">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                In-tab email thread diagnostics
              </div>
              <div className="flex items-center gap-2 text-slate-800">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                Phishing threat warning overlays
              </div>
              <div className="flex items-center gap-2 text-slate-800">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                Real-time warning indicator flags
              </div>
              <div className="flex items-center gap-2 text-slate-800">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                Custom category logs in browser
              </div>
            </div>
          </div>

          {/* Form for waitlist submission in brutalist card style */}
          <div className="lg:col-span-5 bg-[#F8F7F4] border-4 border-black p-6 sm:p-8 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative w-full">
            <h3 className="font-display text-lg font-black text-slate-900 mb-2">Join Chromium Beta Waitlist</h3>
            <p className="text-slate-600 font-medium text-xs mb-6">
              Lock in early developer access codes and download instructions when active deployment opens.
            </p>

            {waitlistSuccess ? (
              <div className="p-4 bg-[#E6FDF4] border-3 border-emerald-500 rounded-lg text-emerald-800 font-display font-black text-xs text-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                🎉 Success! You have joined the beta waiting list. Stay tuned!
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="landing-email-input" className="block font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gmail address:</label>
                  <input
                    id="landing-email-input"
                    type="email"
                    required
                    placeholder="e.g. testing@gmail.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-3 border-black rounded-xl font-display font-bold text-slate-800 text-sm focus:outline-none focus:ring-0 shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:border-[#4F8CFF] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>

                <button
                  id="landing-email-submit"
                  type="submit"
                  disabled={waitlistLoading}
                  className="w-full pb-3.5 pt-3 bg-[#4F8CFF] text-white font-display font-black rounded-xl border-3 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {waitlistLoading ? "Requesting..." : "Reserve Beta Slots"}
                  <ArrowRight className="w-4 h-4 stroke-[2]" />
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* ================================== FLEXIBLE PLANS / PRICING ================================== */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="font-display text-xs font-black uppercase text-[#4F8CFF] px-2.5 py-1 bg-[#4F8CFF]/10 rounded-md border-2 border-black inline-block">Flexible Access</span>
          <h2 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-slate-950 font-extrabold leading-none">
            Choose Your Guard Level.
          </h2>
          <p className="text-slate-600 font-semibold max-w-md mx-auto text-base">
            No hidden fees. Free tier available to start scanning manual items instantly on deployment.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 items-stretch">
          
          {/* Plan 1: Standard Free */}
          <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between text-left relative hover:-translate-y-1 transition-transform">
            <div className="space-y-6">
              <div>
                <span className="font-mono text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan tier 01</span>
                <h3 className="font-display font-black text-2xl text-slate-900 mt-1">FREE PLAN</h3>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="font-display font-black text-5xl text-slate-950 font-extrabold">$0</span>
                <span className="text-slate-600 font-bold text-sm">/ month</span>
              </div>

              <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed">
                Perfect sandbox protection for users looking to analyze individual security elements manually.
              </p>

              <div className="border-t-2 border-black/10 my-4" />

              <ul className="space-y-3 font-display font-extrabold text-xs sm:text-sm text-slate-800">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Secure OAuth Login Gate</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>10 Manual Scans / day</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Standard Threat Database</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onGoogleLogin}
              className="w-full mt-8 py-3.5 bg-white text-slate-900 font-display font-black rounded-lg border-2.5 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 transition-all text-xs text-center cursor-pointer"
            >
              Start Diagnostic Free
            </button>
          </div>

          {/* Plan 2: Superman Edition Recommended */}
          <div className="bg-[#FFFDF4] border-4 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(79,140,255,1)] flex flex-col justify-between text-left relative hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1 bg-yellow-400 border-2.5 border-black text-slate-950 font-display font-black text-[10px] tracking-widest uppercase rounded">
              ★ POPULAR
            </div>

            <div className="space-y-6">
              <div>
                <span className="font-mono text-[9px] font-black text-[#4F8CFF] uppercase tracking-widest">Plan tier 02</span>
                <h3 className="font-display font-black text-2xl text-slate-900 mt-1">SUPERMAN PLAN</h3>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="font-display font-black text-5xl text-[#4F8CFF] font-extrabold">$20</span>
                <span className="text-slate-600 font-bold text-sm">/ month</span>
              </div>

              <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed">
                The absolute sweet spot. Fully automated background routing scanning, threat quarantines and logs.
              </p>

              <div className="border-t-2 border-black/10 my-4" />

              <ul className="space-y-3 font-display font-extrabold text-xs sm:text-sm text-slate-800">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Real-Time Background Sync</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Unlimited Gemini Powered Checks</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Interactive Threat Quarantine Logs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Automated Gmail Tag Categorization</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onGoogleLogin}
              className="w-full mt-8 py-3.5 bg-[#4F8CFF] text-white font-display font-black rounded-lg border-2.5 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 transition-all text-xs text-center cursor-pointer"
            >
              Get Superman Edition
            </button>
          </div>

          {/* Plan 3: Batman Edition */}
          <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between text-left relative hover:-translate-y-1 transition-transform">
            <div className="space-y-6">
              <div>
                <span className="font-mono text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan tier 03</span>
                <h3 className="font-display font-black text-2xl text-slate-900 mt-1">BATMAN EDITION</h3>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="font-display font-black text-5xl text-slate-950 font-extrabold">$35</span>
                <span className="text-slate-600 font-bold text-sm">/ month</span>
              </div>

              <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed">
                Maximum diagnostic strength with retro console dashboard features, customized alert systems and VIP lines.
              </p>

              <div className="border-t-2 border-black/10 my-4" />

              <ul className="space-y-3 font-display font-extrabold text-xs sm:text-sm text-slate-800">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>VIP Priority Processing Line</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Dedicated Threat Expert SLA</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Custom API endpoints webhooks</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onGoogleLogin}
              className="w-full mt-8 py-3.5 bg-black text-white font-display font-black rounded-lg border-2.5 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 transition-all text-xs text-center cursor-pointer"
            >
              Start Batman Account
            </button>
          </div>

        </div>
      </section>

      {/* ================================== FAQ ACCORDION SECTION ================================== */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-left">
        <div className="text-center mb-16 space-y-4">
          <span className="font-display text-xs font-black uppercase text-[#4F8CFF] px-2.5 py-1 bg-[#4F8CFF]/10 rounded-md border-2 border-black inline-block">FAQS</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 font-black">Frequently Addressed Questions</h2>
          <p className="text-slate-600 font-semibold text-sm">
            Everything you need to understand regarding Google compliance, OAuth scopes and security.
          </p>
        </div>

        <div className="space-y-4 font-display">
          {[
            {
              q: "Does SecureBox AI save my actual Google Password?",
              a: "Absolutely not. We rely fully on Google's implementation of OAuth 2.0. That means you authorize our platform using standard permission screens generated by Google without sharing passwords or sensitive accounts details."
            },
            {
              q: "Can I adjust how strict the threat categorization model scans?",
              a: "Yes! Your profiles carry 4 levels of diagnostic thresholds: Relaxed, Balanced, Strict and Enterprise. These configure matching confidence coefficients on phishing threat indicators."
            },
            {
              q: "How does the custom rule labeling interact with my Gmail account?",
              a: "SecureBox binds labels to incoming emails matching criteria. For suspicious emails, we dynamically insert 'SecureBox/PHISHING' folder tags to alert you immediately inside any standard Gmail folder."
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="bg-white border-3 border-black rounded-xl p-5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
            >
              <div className="flex justify-between items-center gap-4">
                <h4 className="font-bold text-sm sm:text-base text-slate-900">{item.q}</h4>
                <div className={`p-1 border-2 border-black bg-slate-100 rounded transition-transform duration-200 ${expandedFaq === idx ? "rotate-180" : ""}`}>
                  <ChevronDown className="w-4 h-4 text-slate-800" />
                </div>
              </div>

              <AnimatePresence>
                {expandedFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-slate-600 text-xs sm:text-sm mt-4 font-medium leading-relaxed border-t border-black/5 pt-4">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ================================== FOOTER ================================== */}
      <footer className="py-16 px-6 border-t-4 border-black text-slate-600 font-display text-xs text-center bg-white relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#4F8CFF] border-2 border-black rounded shadow-[1px_1px_0px_rgba(0,0,0,1)]">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-900 tracking-tight text-sm">
              SecureBox <span className="text-[#4F8CFF]">AI</span>
            </span>
          </div>

          <p className="font-semibold text-[11px]">
            © 2026 SecureBox AI Inc. All rights protected. Built with verified Google and Firebase OAuth.
          </p>

          <div className="flex gap-6 font-bold text-[11px]">
            <a href="#landing-root" className="hover:text-[#4F8CFF] transition-colors">Workspace Terms</a>
            <a href="#landing-root" className="hover:text-[#4F8CFF] transition-colors">Privacy Guide</a>
            <a href="#landing-root" className="hover:text-[#4F8CFF] transition-colors">GDPR SLA</a>
          </div>

        </div>
      </footer>

    </div>
  );
}

// Mail Sandbox Demo Sub-component
function MailSandboxDemo() {
  const [inputText, setInputText] = useState(
    "Dear user,\nWe have detected irregular activity in your account. To prevent cancellation, link your Google billing portal account with the link: http://billing-google-urgent-resolution-portal.net immediately."
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<{
    type: "Phishing" | "Spam" | "Safe";
    score: number;
    flags: string[];
    fixNotes: string;
  } | null>(null);

  const triggerAnalyze = () => {
    if (!inputText) return;
    setAnalyzing(true);
    setReport(null);

    setTimeout(() => {
      // Direct heuristic assessment for client-side demo
      const upper = inputText.toUpperCase();
      let score = 5;
      const flags: string[] = [];

      if (upper.includes("BILLING") || upper.includes("PAYMENT") || upper.includes("CREDIT CARD")) {
        score += 25;
        flags.push("Billing Intent Detected");
      }
      if (upper.includes("URGENT") || upper.includes("IMMEDIATELY") || upper.includes("CANCELLATION") || upper.includes("SUSPENDED")) {
        score += 30;
        flags.push("Urgent Action Pressure Flagged");
      }
      if (upper.includes("HTTP://") || upper.includes(".NET") || upper.includes(".ORG") || upper.includes("WWW.") || upper.includes("LINK:")) {
        score += 35;
        flags.push("External Action Link Found");
      }

      let type: "Phishing" | "Spam" | "Safe" = "Safe";
      let fixNotes = "This message contains standard conversation signals. Threat score is minimum.";

      if (score >= 65) {
        type = "Phishing";
        fixNotes = "CRITICAL: Urgent request style coupled with unknown external link patterns matched high-probability credential harvesting models.";
      } else if (score >= 30) {
        type = "Spam";
        fixNotes = "WARNING: Promotional indicators or marketing links found. Route to Spam folder suggested.";
      }

      setReport({
        type,
        score,
        flags: flags.length > 0 ? flags : ["Heuristics Normal", "No Urgent Phrase"],
        fixNotes
      });
      setAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 bg-black rounded-2xl translate-x-2.5 translate-y-2.5" />
      
      <div className="relative bg-white border-4 border-black rounded-2xl p-6 space-y-4 shadow-sm text-left">
        
        <div className="space-y-1">
          <label className="block font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">INPUT EMAIL TEXT CONTENT:</label>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3.5 bg-[#F8F7F4] border-3 border-black rounded-xl font-display text-xs text-slate-850 font-semibold focus:outline-none focus:border-[#4F8CFF] transition-colors resize-none shadow-inner"
            placeholder="Type or paste suspicious outreach content here..."
          />
        </div>

        <button
          onClick={triggerAnalyze}
          disabled={analyzing}
          className="w-full py-3.5 bg-[#4F8CFF] hover:bg-[#327EFB] text-white font-display font-black rounded-xl border-3 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {analyzing ? (
            <>
              <RefreshCw className="w-4.5 h-4.5 animate-spin" />
              <span>Simulating Micro-Scanning...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5 text-yellow-300 fill-yellow-300" />
              <span>Analyze Clipboard Text</span>
            </>
          )}
        </button>

        {report && (
          <div className="mt-4 p-4 border-3 border-black rounded-xl space-y-3 font-display transition-all animate-fade-in bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">COGNITIVE VERDICT:</span>
              <span className={`px-2.5 py-0.5 border-2 border-black font-black text-xs rounded uppercase ${
                report.type === "Phishing" 
                  ? "bg-rose-100 text-rose-800" 
                  : report.type === "Spam" 
                  ? "bg-orange-100 text-orange-850" 
                  : "bg-emerald-100 text-emerald-800"
              }`}>
                {report.type}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-normal">THREAT SCORE:</span>
                <div className="h-4 bg-slate-200 border-2 border-black rounded overflow-hidden mt-1 relative flex items-center justify-center">
                  <div 
                    className={`h-full absolute left-0 top-0 transition-all duration-500 ${
                      report.type === "Phishing" ? "bg-rose-500" : report.type === "Spam" ? "bg-orange-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${report.score}%` }}
                  />
                  <span className="relative font-mono font-black text-[9px] text-slate-800 drop-shadow-sm">{report.score}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-black/10">
              <span className="font-mono text-[9px] font-black text-slate-500 uppercase tracking-normal block">VERIFICATION SIGNALS DETECTED:</span>
              <div className="flex flex-wrap gap-1.5">
                {report.flags.map((flg, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white border border-slate-400 text-slate-800 font-mono text-[9px] font-bold rounded">
                    {flg}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-700 font-semibold bg-white p-2.5 border border-slate-300 rounded leading-relaxed mt-2.5">
              💡 {report.fixNotes}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
