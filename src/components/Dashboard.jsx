import React from 'react';
import {
  Building2,
  Users,
  CheckCircle,
  FlaskConical,
  Flame,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Info,
  ExternalLink,
  Layers,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const {
    accounts,
    opportunities,
    actions,
    engagements,
    setActiveTab,
    setSelectedAccountId
  } = useApp();

  // Dynamic Metrics calculation
  const totalAccounts = accounts.length;
  const regularSupplyList = accounts.filter(a => a.account_bucket === 'Existing customer' || a.regular_supply_status?.toLowerCase().includes('active regular') || a.relationship_stage?.toLowerCase().includes('regular supply'));
  const regularSupplyAccounts = regularSupplyList.length;

  const isSampleUnderTesting = (status) => {
    if (!status) return false;
    const s = status.toLowerCase();
    if (s.includes('no recorded') || s.includes('no sample') || s.includes('not applicable')) return false;
    return s.includes('sample supplied') || s.includes('under test') || s.includes('testing');
  };

  const sampleTestingList = accounts.filter(a =>
    a.account_bucket !== 'Existing customer' &&
    (a.account_bucket === 'Samples supplied' ||
     isSampleUnderTesting(a.eg50_sample_status) ||
     isSampleUnderTesting(a.immersion_sample_status) ||
     (a.relationship_stage && (a.relationship_stage.toLowerCase().includes('samples supplied') || a.relationship_stage.toLowerCase().includes('under testing'))))
  );
  const sampleTestingAccounts = sampleTestingList.length;

  const prospectAccounts = accounts.filter(a => a.account_bucket === 'Prospect').length;
  const watchAccounts = accounts.filter(a => a.account_bucket === 'Conditional / watch').length;
  const excludedAccounts = accounts.filter(a => a.account_bucket === 'Excluded').length;

  const eg50Count = opportunities.filter(o => o.product === 'EG50').length;
  const immersionCount = opportunities.filter(o => o.product === 'Dielectric immersion').length;

  const priorityACount = accounts.filter(a => a.priority === 'A').length;
  const priorityBCount = accounts.filter(a => a.priority === 'B').length;
  const priorityCCount = accounts.filter(a => a.priority === 'C').length;

  // Calculate live scenario pipeline totals if inputs are present
  const totalSimulatedLitres = opportunities.reduce((acc, curr) => acc + (Number(curr.estimated_annual_litres_edit) || 0), 0);
  const totalSimulatedWeightedLitres = opportunities.reduce((acc, curr) => acc + (Number(curr.weighted_litres_formula) || 0), 0);
  const totalSimulatedRevenue = opportunities.reduce((acc, curr) => acc + (Number(curr.unweighted_revenue_inr_formula) || 0), 0);
  const totalSimulatedWeightedRevenue = opportunities.reduce((acc, curr) => acc + (Number(curr.weighted_revenue_inr_formula) || 0), 0);

  const formatINR = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Context Banner */}
      <div className="bg-gradient-to-r from-white via-emerald-50/40 to-blue-50/30 rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2.5 flex-wrap">
              <img
                src="/savita_logo.png"
                alt="SAVITA"
                className="h-8 w-auto object-contain shrink-0"
              />
              <div className="h-6 w-[1px] bg-slate-300 hidden sm:block"></div>
              <img
                src="/quanticool_logo.png"
                alt="QuantiCool"
                className="h-5 w-auto object-contain shrink-0 hidden sm:block"
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-[#007A3D] text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Commercial BD Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              BESS & EV Battery Thermal Management Business Development
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Unified intelligence platform consolidating enterprise accounts, business contacts, and coolant opportunities across Ethylene Glycol (EG50) and Dielectric Immersion Fluids (Synthetic & Natural Ester).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('opportunities')}
              className="px-4 py-2 rounded-xl bg-[#007A3D] hover:bg-[#005f2f] text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/10 flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              View Coolant Pipeline
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              Directory (176)
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Accounts */}
        <div
          onClick={() => setActiveTab('directory')}
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-[#007A3D] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Accounts</span>
            <Building2 className="w-4 h-4 text-slate-400 group-hover:text-[#007A3D]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalAccounts}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span>Master Directory</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Regular Supply */}
        <div
          onClick={() => setActiveTab('existing_customer')}
          className="bg-gradient-to-br from-emerald-500/10 to-white rounded-2xl p-4 border border-emerald-300 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Supply</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{regularSupplyAccounts}</div>
          <div className="text-[11px] text-emerald-800 mt-1 font-semibold truncate" title={regularSupplyList.map(a => a.company_name).join(', ')}>
            {regularSupplyList.map(a => a.company_name).join(', ') || 'No active supply accounts'}
          </div>
        </div>

        {/* Samples Supplied / Testing */}
        <div
          onClick={() => setActiveTab('sample_tracker')}
          className="bg-gradient-to-br from-blue-500/10 to-white rounded-2xl p-4 border border-blue-300 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-blue-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Under Testing</span>
            <FlaskConical className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#005A9C]">{sampleTestingAccounts}</div>
          <div className="text-[11px] text-blue-800 mt-1 font-semibold truncate" title={sampleTestingList.map(a => a.company_name).join(', ')}>
            {sampleTestingList.map(a => a.company_name).join(', ') || 'No accounts under testing'}
          </div>
        </div>

        {/* Qualified Prospects */}
        <div
          onClick={() => setActiveTab('directory')}
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Open Prospects</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{prospectAccounts}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Active BD targets
          </div>
        </div>

        {/* Conditional / Watch */}
        <div
          onClick={() => setActiveTab('verification')}
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Watch List</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{watchAccounts}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Air-cooled / Watch
          </div>
        </div>

        {/* Excluded Accounts */}
        <div
          onClick={() => setActiveTab('verification')}
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Excluded</span>
            <span className="text-xs text-slate-400 font-bold">Audit</span>
          </div>
          <div className="text-2xl font-black text-slate-500">{excludedAccounts}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            EPCs / Non-OEM
          </div>
        </div>
      </div>

      {/* Product Chemistry Pipeline & Live Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Breakdown Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#007A3D]" />
                Applicable Coolant Chemistries
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {opportunities.length} Total Opportunities
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Target fluid alignment across containerized utility BESS, EV battery pack chillers, and direct dielectric immersion tanks:
            </p>

            <div className="space-y-4">
              {/* EG50 */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#007A3D]"></span>
                    EG50 (Ethylene Glycol 50% / Water-Glycol)
                  </span>
                  <span className="text-sm font-black text-[#007A3D]">{eg50Count} Leads</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-normal">
                  Dominant industry coolant standard for utility-scale BESS cold-plate loops and commercial EV pack chiller systems. Requires inhibitor package validation.
                </p>
              </div>

              {/* Dielectric Immersion */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    Dielectric Immersion Fluids (Synthetic & Natural Ester)
                  </span>
                  <span className="text-sm font-black text-purple-700">{immersionCount} Leads</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-normal">
                  Direct cell-immersion cooling for high C-rate fast charging and thermal runaway prevention. Actively supplied to commercial customers (e.g. Clean Electric).
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('opportunities')}
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            Launch Scenario Modeling
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Priority & Opportunity Modeling Snapshot */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight uppercase flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                Account Prioritization
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Priority A: {priorityACount} Accounts
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-bold text-emerald-800">Priority A</div>
                <div className="text-xl font-black text-emerald-700 mt-1">{priorityACount}</div>
                <div className="text-[10px] text-emerald-600 font-medium">BESS/OEM Core</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700">Priority B</div>
                <div className="text-xl font-black text-slate-800 mt-1">{priorityBCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Secondary OEMs</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700">Priority C</div>
                <div className="text-xl font-black text-slate-500 mt-1">{priorityCCount}</div>
                <div className="text-[10px] text-slate-400 font-medium">Component Tier</div>
              </div>
            </div>

            {/* Scenario Financial Modeling Status */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Scenario Simulator Status
                </span>
                {totalSimulatedLitres > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-[#007A3D] rounded-full">
                    Active Scenario
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                    Blank Master State
                  </span>
                )}
              </div>

              {totalSimulatedLitres > 0 ? (
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Projected Total Volume:</span>
                    <strong className="text-slate-900 font-bold">{totalSimulatedLitres.toLocaleString()} L</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Probability-Weighted Volume:</span>
                    <strong className="text-[#007A3D] font-extrabold text-sm">{totalSimulatedWeightedLitres.toLocaleString()} L</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                    <span className="font-semibold text-slate-700">Volume Realization Rate:</span>
                    <strong className="text-slate-800 font-bold">{Math.round((totalSimulatedWeightedLitres / totalSimulatedLitres) * 100)}%</strong>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 leading-relaxed py-1">
                  <em>Volume formulas are built-in and active.</em> Potential coolant volumes and win probabilities are left blank until confirmed. Launch the scenario modeling tool to calculate volume projections.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('actions')}
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            Review 85+ Sales Execution Tasks
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Priority Engagement Callouts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight uppercase flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#005A9C]" />
                Live Strategic Accounts
              </h3>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Immediate Focus
              </span>
            </div>

            <div className="space-y-3">
              {[...regularSupplyList, ...sampleTestingList].slice(0, 5).map((acc) => {
                const isActive = acc.account_bucket === 'Existing customer' || acc.regular_supply_status?.toLowerCase().includes('active regular') || acc.relationship_stage?.toLowerCase().includes('regular supply');
                return (
                  <div
                    key={acc.account_id}
                    onClick={() => setSelectedAccountId(acc.account_id)}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer group ${
                      isActive
                        ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50'
                        : 'border-blue-300 bg-blue-50/40 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-xs flex items-center gap-1.5 ${isActive ? 'text-emerald-950 group-hover:text-emerald-700' : 'text-blue-950 group-hover:text-blue-700'}`}>
                        {isActive ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <FlaskConical className="w-3.5 h-3.5 text-blue-600" />}
                        {acc.company_name}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isActive ? 'text-emerald-700 bg-white border-emerald-200' : 'text-blue-700 bg-white border-blue-200'
                      }`}>
                        {isActive ? 'Active Supply' : (acc.stage_number ? `Stage ${acc.stage_number} Testing` : 'Under Testing')}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-1 line-clamp-2 ${isActive ? 'text-emerald-900/80' : 'text-blue-900/80'}`}>
                      {acc.next_action || acc.suggested_offer || (isActive ? 'Active recurring supply shipments established.' : 'Laboratory qualification and coolant sample evaluation underway.')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('sample_tracker')}
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            Open Qualification Tracker
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
