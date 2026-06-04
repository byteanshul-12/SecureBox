import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { AnimatePresence, motion } from "motion/react";
import { db } from "./lib/firebase.ts";
import { UserProfile } from "./types.ts";

// Import modular layouts
import LandingPage from "./components/LandingPage.tsx";
import Dashboard from "./components/Dashboard.tsx";
import EmailScanner from "./components/EmailScanner.tsx";
import AuthModal from "./components/AuthModal.tsx";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  
  // Navigation states
  const [currentPage, setCurrentPage] = useState<string>("landing"); // "landing" | "dashboard" | "sandbox"
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize JWT user session
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const savedToken = sessionStorage.getItem("sb_jwt_token");
    const savedProfile = sessionStorage.getItem("sb_user_profile");
    const savedUser = sessionStorage.getItem("sb_user");

    if (savedToken && savedProfile && savedUser) {
      const user = JSON.parse(savedUser);
      const profile = JSON.parse(savedProfile);
      setCurrentUser(user);
      setUserProfile(profile);
      
      // Establish real-time listen to user profile in firestore
      const profileRef = doc(db, "users", user.uid);
      unsubProfile = onSnapshot(profileRef, (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
          sessionStorage.setItem("sb_user_profile", JSON.stringify(snap.data()));
        }
      }, (error) => {
        console.error("Profile listen error:", error);
      });
      
      setCurrentPage("dashboard");
    } else {
      setCurrentUser(null);
      setUserProfile(null);
      setCurrentPage("landing");
    }
    setIsLoading(false);

    return () => {
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  const handleAuthSuccess = async (jwtToken: string, profile: any, user: any) => {
    sessionStorage.setItem("sb_jwt_token", jwtToken);
    sessionStorage.setItem("sb_user_profile", JSON.stringify(profile));
    sessionStorage.setItem("sb_user", JSON.stringify(user));
    
    setCurrentUser(user);
    setUserProfile(profile);
    setShowAuthModal(false);
    setCurrentPage("dashboard");

    // Auto Gmail Sync Trigger
    try {
      await fetch("/api/gmail/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`,
          "x-user-uid": user.uid,
          "x-google-token": "simulated"
        }
      });
    } catch (e) {
      console.error("Auto Gmail Sync failed on auth success:", e);
    }
  };

  const handleInstantBypassLogin = async (emailAddress: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/instant-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddress })
      });

      if (!res.ok) {
        throw new Error("Failed to authenticate instant bypass reader.");
      }

      const data = await res.json();
      const mockUser = { uid: data.uid, email: emailAddress };

      sessionStorage.setItem("sb_jwt_token", data.jwtToken);
      sessionStorage.setItem("sb_user_profile", JSON.stringify(data.profile));
      sessionStorage.setItem("sb_user", JSON.stringify(mockUser));

      setCurrentUser(mockUser as any);
      setUserProfile(data.profile);
      setShowAuthModal(false);
      setCurrentPage("dashboard");

      // Auto Gmail Sync Trigger on Sync & Scans view open
      try {
        await fetch("/api/gmail/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${data.jwtToken}`,
            "x-user-uid": data.uid,
            "x-google-token": "simulated"
          }
        });
      } catch (e) {
        console.error("Auto Gmail Sync failed on instant bypass:", e);
      }
    } catch (err) {
      console.error("Instant bypass login connection failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualProfileQuery = async () => {
    if (!currentUser) return;
    try {
      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (err) {
      console.error("Refresh profile error:", err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("sb_jwt_token");
    sessionStorage.removeItem("sb_user_profile");
    sessionStorage.removeItem("sb_user");
    setCurrentUser(null);
    setUserProfile(null);
    setCurrentPage("landing");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center space-y-4 font-mono text-slate-800">
        <div className="w-10 h-10 rounded-lg border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center animate-spin">
          <div className="w-3 h-3 bg-[#4F8CFF] rounded-sm" />
        </div>
        <p className="text-xs font-bold tracking-widest uppercase">BOOTING SECUREBOX CORE...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F8F7F4] text-slate-900 selection:bg-[#4F8CFF] selection:text-white font-sans">
      <AnimatePresence mode="wait">
        {currentPage === "landing" && (
          <motion.div
            key="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage 
              onGoogleLogin={() => setShowAuthModal(true)} 
              onOtpLoginClick={() => setShowAuthModal(true)} 
              onInstantLogin={handleInstantBypassLogin}
            />
          </motion.div>
        )}

        {currentPage === "dashboard" && currentUser && (
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard 
              user={currentUser}
              googleToken={googleToken}
              userProfile={userProfile}
              onLogout={handleLogout}
              onRefreshProfile={handleManualProfileQuery}
              onPageChange={setCurrentPage}
            />
          </motion.div>
        )}

        {currentPage === "sandbox" && (
          <motion.div
            key="sandbox-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EmailScanner onBackToDashboard={() => setCurrentPage("dashboard")} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Authentication Trigger modal overlay */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
