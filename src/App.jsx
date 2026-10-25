import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import CompanyDirectory from './components/CompanyDirectory';
import OpportunityPipeline from './components/OpportunityPipeline';
import ExistingCustomerTracker from './components/ExistingCustomerTracker';
import SampleQualificationTracker from './components/SampleQualificationTracker';
import SourceVerification from './components/SourceVerification';
import SalesActionPlanner from './components/SalesActionPlanner';
import CompanyDetailModal from './components/CompanyDetailModal';

function MainContent() {
  const { activeTab, currentUser } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <Header />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'directory' && <CompanyDirectory />}
        {activeTab === 'opportunities' && <OpportunityPipeline />}
        {activeTab === 'existing_customer' && <ExistingCustomerTracker />}
        {activeTab === 'sample_tracker' && <SampleQualificationTracker />}
        {activeTab === 'verification' && <SourceVerification />}
        {activeTab === 'actions' && <SalesActionPlanner />}
      </main>

      {/* Corporate Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">SAVITA OIL TECHNOLOGIES LTD.</span>
            <span>•</span>
            <span>QuantiCool™ Battery & EV Fluid Solutions</span>
          </div>
          <div className="text-slate-400 text-center sm:text-right">
            Confidential Internal Commercial Register • Research Snapshot: 25 Oct 2026 • Mumbai, India
          </div>
        </div>
      </footer>

      {/* 360° Company Drill-Down Modal */}
      <CompanyDetailModal />

      {/* Restricted Authentication Modal (if logged out) */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
