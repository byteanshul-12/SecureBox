import React, { useState } from "react";
import { Shield, Play, Lock, ChevronLeft, Send, AlertTriangle, HelpCircle, FileText, CheckCircle2 } from "lucide-react";

interface ScannerProps {
  onBackToDashboard: () => void;
}

interface ScanResult {
  spamScore: number;
  phishingScore: number;
  threatScore: number;
  confidenceScore: number;
  riskLevel: 'Safe' | 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical';
  classification: 'Important' | 'Personal' | 'Work' | 'Newsletter' | 'Promotion' | 'Marketing' | 'Cold Outreach' | 'Spam' | 'Phishing' | 'Scam' | 'Suspicious';
  explanation: string;
  riskFactors: string[];
  recommendedAction: string;
}

export default function EmailScanner({ onBackToDashboard }: ScannerProps) {
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sender || !content) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/scan/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sender, subject, content })
      });

      if (!res.ok) {
        throw new Error("Failed to process security scan. Check request inputs.");
      }

      const parsed = await res.json();
      if (parsed.success) {
        setResult(parsed.results);
      } else {
        throw new Error(parsed.error || "Failed to analyze content");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Manual assessment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLoadSamplePhishing = () => {
    setSender("security-paypal-support-billing@mismatch-domain-alert.com");
    setSubject("Action Required: Your Account has been suspended due to suspicious payments!");
    setContent(`Dear PayPal Customer,

We detected some suspicious activity on your credit card attached to your account.
To secure your payments and prevent full account lockout, you must update your billing profile within 24 hours.

Click the official secure link below to proceed:
http://paypal-security-update-billing.com/login-verification?token=847384

Thank you for your immediate assistance.
PayPal Trust & Safety Team`);
  };

  const handleQuickLoadSampleSafe = () => {
    setSender("jessica.kline@firmwork-solutions.com");
    setSubject("Q3 Project Milestone deliverables review call");
    setContent(`Hi team,

I wanted to quickly check if everyone is available this Thursday at 2:00 PM EST for the Q3 project milestone review.
I've uploaded the draft slides to our shared team folder, let me know if you would like to edit anything before the meeting.

Best regards,
Jessica Kline
Senior Project Manager
FirmWork Solutions`);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-slate-900 p-6 md:p-8 font-sans relative overflow-hidden">
      {/* Retrogird Background Accent lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 text-left relative z-10">
        {/* Navigation back */}
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-black/5 text-xs font-display font-black text-slate-900 uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          Back to Dashboard
        </button>

        {/* Section Heading */}
        <header className="pb-6 border-b-4 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-display font-black text-2xl md:text-3.5xl tracking-tight text-slate-950">Manual Threat Assessment</h2>
            <p className="text-xs text-slate-800 font-bold mt-1 max-w-xl leading-relaxed">
              Copy-paste unsure emails, cold outreach messages, or newsletters to run safe offline security audits with Google Gemini models.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleQuickLoadSamplePhishing}
              className="px-3.5 py-2 bg-[#FFEED4] border-2 border-black text-rose-950 text-xs font-extrabold rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffdcb0] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              Load Sample Phish
            </button>
            <button
              onClick={handleQuickLoadSampleSafe}
              className="px-3.5 py-2 bg-emerald-100 border-2 border-black text-emerald-950 text-xs font-extrabold rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              Load Sample Work
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-100 border-2 border-black text-red-950 text-xs font-bold rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        {/* Form and Results split container */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          
          {/* Paste Section */}
          <form onSubmit={handleManualScan} className="bg-white rounded-xl border-4 border-black p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-display text-base font-black text-slate-950 border-b-2 border-black pb-2">Submit Suspicious Text</h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 font-mono font-bold uppercase tracking-wider mb-1.5">Sender Email Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. support@verify-bank.com"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-black rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-mono font-bold uppercase tracking-wider mb-1.5">Email Subject Line</label>
                <input
                  type="text"
                  placeholder="e.g. Complete invoice billing update request"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-black rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-mono font-bold uppercase tracking-wider mb-1.5">Raw Message Content Body</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Paste email message contents here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-black rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono resize-none leading-relaxed"
                />
              </div>
            </div>

            <button
              id="submit-manual-scan-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-lg text-sm font-extrabold transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                loading 
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none hover:translate-x-0 hover:translate-y-0" 
                  : "bg-[#4F8CFF] hover:bg-[#3b7ae6] text-white"
              }`}
            >
              {loading ? "Analyzing Intent..." : "Run Security Scan"}
            </button>
          </form>

          {/* Results Analysis Panel */}
          <div className="space-y-6">
            {!result && !loading && (
              <div className="p-12 text-center rounded-xl border-4 border-dashed border-black bg-white/45 flex flex-col items-center justify-center min-h-[300px]">
                <Shield className="w-12 h-12 text-slate-400 mb-4 animate-bounce-subtle stroke-[1.5]" />
                <h4 className="font-display font-black text-base text-slate-950 mb-1">Analyzer Idle</h4>
                <p className="text-xs text-slate-700 font-bold max-w-xs leading-relaxed">
                  Provide a sender and raw message body, then press "Run Security Scan" to query the Gemini threat engine and evaluate cyber safety.
                </p>
              </div>
            )}

            {loading && (
              <div className="p-12 text-center rounded-xl border-4 border-black bg-white flex flex-col items-center justify-center space-y-4 min-h-[300px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-10 h-10 rounded-lg border-4 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center animate-spin">
                  <div className="w-3.5 h-3.5 bg-[#4F8CFF] rounded-sm" />
                </div>
                <h4 className="font-display font-black text-xs text-[#4F8CFF] tracking-widest uppercase">EVALUATING SEMANTICS WITH GEMINI 3.5...</h4>
              </div>
            )}

            {result && (
              <div id="offline-scan-result" className="p-6 bg-white rounded-xl border-4 border-black space-y-5 animate-fade-in text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <span className="text-[10px] font-mono font-black text-slate-650 uppercase tracking-wider">SANDBOX AUDIT REPORT</span>
                    <span className="px-2.5 py-1.5 rounded-md text-[10px] font-mono font-black bg-[#FFEED4] border-2 border-black text-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      Confidence {result.confidenceScore}%
                    </span>
                  </div>
                  <h3 className="font-display font-black text-base mt-3 text-slate-950 flex flex-wrap items-center gap-1.5">
                    Classification Outcome: <span className="text-[#4F8CFF] bg-[#4F8CFF]/5 border border-[#4F8CFF] px-2 py-0.5 rounded">{result.classification}</span>
                  </h3>
                </div>

                {/* Grid stats threat assessment */}
                <div className="grid grid-cols-3 gap-3 font-mono text-[10px]">
                  <div className="p-2.5 bg-[#F8F7F4] rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-slate-600 font-bold">Phishing Score</div>
                    <div className="text-sm font-black text-rose-600 mt-1">{result.phishingScore}%</div>
                  </div>
                  <div className="p-2.5 bg-[#F8F7F4] rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-slate-600 font-bold">Spam Score</div>
                    <div className="text-sm font-black text-[#4F8CFF] mt-1">{result.spamScore}%</div>
                  </div>
                  <div className="p-2.5 bg-[#F8F7F4] rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-slate-600 font-bold">Risk Level</div>
                    <div className="text-xs font-black text-[#e49b0f] mt-1 uppercase">{result.riskLevel}</div>
                  </div>
                </div>

                {/* Detailed explanation paragraphs */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#4F8CFF]" />
                    AI Security Evaluation Summary
                  </h4>
                  <p className="text-xs text-slate-900 font-semibold bg-[#F8F7F4] p-3 rounded-lg border-2 border-black leading-relaxed font-mono">
                    {result.explanation}
                  </p>
                </div>

                {/* Bullet list risk factors */}
                {result.riskFactors && result.riskFactors.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-rose-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Specific Indicators Highlighted
                    </h4>
                    <ul className="text-[11px] text-slate-950 space-y-1.5 bg-[#F8F7F4] p-3 rounded-lg border-2 border-black font-semibold">
                      {result.riskFactors.map((factor, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-900 font-mono">
                          <span className="text-rose-600 font-black shrink-0 select-none">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ultimate Recommended Action */}
                <div className="p-3.5 bg-emerald-50 border-2 border-black rounded-lg space-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-800">Action Recommended:</span>
                  <p className="text-xs text-emerald-950 mt-0.5 font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700 stroke-[2.5]" />
                    {result.recommendedAction}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
