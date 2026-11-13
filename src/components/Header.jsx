import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building,
  Flame,
  CheckCircle2,
  FlaskConical,
  FileCheck,
  ListTodo,
  Download,
  User,
  RotateCcw,
  Shield,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  exportAccountsToExcel,
  exportOpportunitiesToExcel,
  exportActionsToExcel,
  exportFullMasterToExcel
} from '../utils/exportToExcel';

export default function Header() {
  const {
    currentUser,
    logout,
    activeTab,
    setActiveTab,
    accounts,
    opportunities,
    actions,
    contacts,
    evidence,
    exclusions,
    corrections,
    expo41,
    engagements,
    resetAllToWorkbookDefaults
  } = useApp();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, count: null },
    { id: 'directory', label: 'Company Directory', icon: Building, count: accounts.length },
    { id: 'opportunities', label: 'Coolant Pipeline', icon: Flame, count: opportunities.length },
    { id: 'existing_customer', label: 'Existing Customers', icon: CheckCircle2, badge: '2 Active' },
    { id: 'sample_tracker', label: 'Sample Qualification', icon: FlaskConical, badge: '4 Testing' },
    { id: 'verification', label: 'Source Verification', icon: FileCheck, count: evidence.length },
    { id: 'actions', label: 'Sales Planner', icon: ListTodo, count: actions.length },
  ];

  const handleExportFull = () => {
    exportFullMasterToExcel({
      Accounts: accounts,
      Opportunities: opportunities,
      Contacts: contacts,
      Actions: actions,
      Engagements: engagements,
      Evidence: evidence,
      Exclusions: exclusions,
      Expo_41: expo41,
      Corrections: corrections
    });
    setShowExportMenu(false);
  };

  const handleExportAccounts = () => {
    exportAccountsToExcel(accounts);
    setShowExportMenu(false);
  };

  const handleExportOpportunities = () => {
    exportOpportunitiesToExcel(opportunities);
    setShowExportMenu(false);
  };

  const handleExportActions = () => {
    exportActionsToExcel(actions);
    setShowExportMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Bar: Brand, Identity, User & Export */}
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Corporate Title */}
          <div className="flex items-center gap-3">
            <img
              src="/savita_logo.png"
              alt="SAVITA - bonds build businesses"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div className="h-8 w-[1px] bg-slate-300 hidden sm:block"></div>
            <img
              src="/quanticool_logo.png"
              alt="QuantiCool"
              className="h-6 w-auto object-contain shrink-0 hidden sm:block"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 hidden lg:inline">
                  Customer Follow-Up &amp; BD Portal
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  <Shield className="w-3 h-3 text-amber-600" /> SUPPORTING APP • CUSTOMER FOLLOW-UP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                New Customer Prospecting • Sample Qualification Testing • BD Follow-up
              </p>
            </div>
          </div>

          {/* Action buttons & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Switch to Main App (Daily Activity) */}
            <a
              href="https://bess-outreach-4kjkcvvhv-saikatkoley2000s-projects.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-300 transition-colors shadow-sm"
              title="Open Daily Activity & Outreach Tracker (Main App)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Main App: Daily Activity</span>
              <span className="md:hidden">Main App</span>
            </a>

            {/* Excel Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#007A3D] font-semibold text-xs border border-emerald-300 transition-colors cursor-pointer"
                title="Export live data with formulas to Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Excel</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showExportMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setShowExportMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Excel Export Options (.xlsx)
                  </div>
                  <button
                    onClick={handleExportFull}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between font-semibold text-slate-800 cursor-pointer"
                  >
                    <span>Full Unified Master Workbook</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">All Sheets</span>
                  </button>
                  <button
                    onClick={handleExportOpportunities}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between text-slate-700 cursor-pointer"
                  >
                    <span>Opportunities & Scenarios</span>
                    <span className="text-[10px] text-slate-500">178 rows</span>
                  </button>
                  <button
                    onClick={handleExportAccounts}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between text-slate-700 cursor-pointer"
                  >
                    <span>Accounts Master Directory</span>
                    <span className="text-[10px] text-slate-500">176 rows</span>
                  </button>
                  <button
                    onClick={handleExportActions}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between text-slate-700 cursor-pointer"
                  >
                    <span>Sales Execution Action Plan</span>
                    <span className="text-[10px] text-slate-500">85+ rows</span>
                  </button>
                </div>
              )}
            </div>

            {/* Authenticated User Profile */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-[#007A3D] hover:bg-emerald-50/50 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#007A3D] to-[#005A9C] text-white flex items-center justify-center font-bold text-[10px]">
                    S
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-bold text-slate-800 leading-tight">Savita Commercial BD</div>
                    <div className="text-[10px] text-emerald-700 font-semibold leading-none">Authorized Internal Access</div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-slate-500 text-[11px]">{currentUser.email}</p>
                      <p className="text-emerald-700 text-[10px] mt-0.5 font-medium">{currentUser.role}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          resetAllToWorkbookDefaults();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reset Edits to Excel Defaults</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="bg-slate-50/80 border-t border-slate-200/80 backdrop-blur-xs">
        <div className="max-w-[1720px] mx-auto px-3 sm:px-4 lg:px-6">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#007A3D] shadow-xs border border-emerald-300 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#007A3D]' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.count !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive
                          ? 'bg-emerald-100 text-[#007A3D]'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-[#005A9C] font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
