import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 1. Interaction Provider - The central nervous system for likes/connections
// Note: Keeping this lowercase to match your verified file naming convention
import { InteractionProvider } from './investorinteraction';

// 2. LAZY LOAD COMPONENTS - ALL CONVERTED TO LOWERCASE FOR VERCEL COMPATIBILITY
const LandingPage = lazy(() => import('./landingpage'));
const StartupVerification = lazy(() => import('./startupverification'));
const InvestorVerification = lazy(() => import('./investorverification'));
const StartupProfileSetup = lazy(() => import('./startupprofilesetup'));
const InvestorProfileSetup = lazy(() => import('./investorprofilesetup'));
const InvestorHome = lazy(() => import('./investorhome'));
const StartupHome = lazy(() => import('./startuphome'));
const StartupProfile = lazy(() => import('./startupprofile'));
const InvestorProfile = lazy(() => import('./investorprofile'));
const StartupDetails = lazy(() => import('./startupdetails'));
const Login = lazy(() => import('./signin'));
const SearchPage = lazy(() => import('./search'));
const InvestorPublicProfile = lazy(() => import('./investorpublicprofile'));
const ChatPage = lazy(() => import('./chatpage'));
const PitchBroadcast = lazy(() => import('./pitchbroadcast'));
const StartupPitchTerminal = lazy(() => import('./startuppitchterminal'));
const PitchCreation = lazy(() => import('./pitchcreation')); 
const AboutPage = lazy(() => import('./aboutpage'));
const ServicePage = lazy(() => import('./servicepage'));
const ContactPage = lazy(() => import('./contactpage'));

// Institutional Placeholder for Legal/Privacy
const PrivacyPolicy = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
    <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Privacy Protocol</h1>
    <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-4 max-w-xs">
      The STAINV data encryption and privacy policy is currently under institutional review. 
      All node data remains end-to-end encrypted.
    </p>
    <button onClick={() => window.history.back()} className="mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 hover:text-amber-700 transition-colors">
      Return to Registry
    </button>
  </div>
);

// Sleek loading fallback for the "stainv" aesthetic
const LoadingScreen = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center">
    <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 animate-pulse">Initializing Interface</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App selection:bg-amber-100">
        {/* MOBILE OPTIMIZATION GLOBAL STYLES */}
        <style>{`
          :root {
            --app-height: 100vh;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            background-color: #F8FAFC;
            overscroll-behavior-y: none;
            -webkit-tap-highlight-color: transparent;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          .mobile-container {
            max-width: 500px;
            margin: 0 auto;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background: white;
            position: relative;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
          .pt-safe { padding-top: env(safe-area-inset-top); }
        `}</style>

        <InteractionProvider>
          <Suspense fallback={<LoadingScreen />}>
            <div className="relative min-h-screen w-full overflow-x-hidden">
              <Routes>
                {/* PUBLIC & FOOTER NAVIGATION ROUTES */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />

                {/* VERIFICATION & ONBOARDING FLOWS */}
                <Route path="/startupverification" element={<StartupVerification />} />
                <Route path="/investorverification" element={<InvestorVerification />} />
                <Route path="/startupprofilesetup" element={<StartupProfileSetup />} />
                <Route path="/investorprofilesetup" element={<InvestorProfileSetup />} />
                
                {/* INVESTOR DASHBOARD & ECOSYSTEM */}
                <Route path="/investor-home" element={<InvestorHome />} />
                <Route path="/investor-profile" element={<InvestorProfile />} />
                <Route path="/profile/:id" element={<InvestorPublicProfile />} />
                <Route path="/pitch-broadcast" element={<PitchBroadcast />} />
                
                {/* STARTUP DASHBOARD & ECOSYSTEM */}
                <Route path="/startup-home" element={<StartupHome />} />
                <Route path="/startup-profile" element={<StartupProfile />} />
                <Route path="/startup-details/:id" element={<StartupDetails />} />
                
                {/* STRATEGIC PITCH MANAGEMENT */}
                <Route path="/startup-pitch-terminal" element={<StartupPitchTerminal />} /> 
                <Route path="/create-pitch" element={<PitchCreation />} />
                
                {/* SECURE COMMUNICATION */}
                <Route path="/chat/:chatId" element={<ChatPage />} />
              </Routes>
            </div>
          </Suspense>
        </InteractionProvider>
      </div>
    </Router>
  );
}

export default App;