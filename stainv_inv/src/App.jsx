import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 1. Interaction Provider - The central nervous system
import { InteractionProvider } from './investorinteraction';

// 2. STATIC IMPORTS (REPLACING LAZY LOADS)
import LandingPage from './landingpage';
import StartupVerification from './startupverification';
import InvestorVerification from './investorverification';
import StartupProfileSetup from './startupprofilesetup';
import InvestorProfileSetup from './investorprofilesetup';
import InvestorHome from './investorhome';
import StartupHome from './startuphome';
import StartupProfile from './startupprofile';
import InvestorProfile from './investorprofile';
import StartupDetails from './startupdetails';
import Login from './signin';
import SearchPage from './search';
import InvestorPublicProfile from './investorpublicprofile';
import ChatPage from './chatpage';
import PitchBroadcast from './pitchbroadcast';
import StartupPitchTerminal from './StartupPitchTerminal';
import PitchCreation from './pitchcreation';
import AboutPage from './aboutpage';
import ServicePage from './ServicePage';
import ContactPage from './contactpage';

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
          {/* Note: Suspense is removed as it is not required for static imports */}
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
        </InteractionProvider>
      </div>
    </Router>
  );
}

export default App;