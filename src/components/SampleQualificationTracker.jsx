import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Building2,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Info,
  Check,
  User,
  Phone,
  Mail,
  HelpCircle,
  Plus,
  Sparkles,
  ArrowRight,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SampleQualificationTracker() {
  const {
    engagements,
    accounts,
    updateAccount,
    updateEngagement,
    setSelectedAccountId,
    openAccountDetail,
    dispatchSampleToAccount,
    elevateToActiveSupply
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAddAccountId, setSelectedAddAccountId] = useState('');
  const [addSampleType, setAddSampleType] = useState('both');
  const [addInitialStage, setAddInitialStage] = useState(1);
  const [addNotes, setAddNotes] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const isSampleUnderTesting = (status) => {
    if (!status) return false;
    const s = status.toLowerCase();
    if (s.includes('no recorded') || s.includes('no sample') || s.includes('not applicable')) return false;
    return s.includes('sample supplied') || s.includes('under test') || s.includes('testing');
  };

  // Dynamically find all accounts that qualify as Under Testing
  const sampleAccounts = accounts.filter(a =>
    a.account_bucket !== 'Existing customer' &&
    (a.account_bucket === 'Samples supplied' ||
     isSampleUnderTesting(a.eg50_sample_status) ||
     isSampleUnderTesting(a.immersion_sample_status) ||
     (a.relationship_stage && (a.relationship_stage.toLowerCase().includes('samples supplied') || a.relationship_stage.toLowerCase().includes('under testing'))))
  );

  const STAGES = [
    { id: 1, label: 'Sample Dispatched', desc: 'Sample bottles dispatched to client lab' },
    { id: 2, label: 'Lab Receipt', desc: 'Received & cataloged by client test engineer' },
    { id: 3, label: 'Active Testing', desc: 'Thermal cycling, corrosion & materials compatibility' },
    { id: 4, label: 'Preliminary Feedback', desc: 'Informal / verbal observations reported' },
    { id: 5, label: 'Formal Lab Report', desc: 'Documented test metrics & parameter report' },
    { id: 6, label: 'OEM Engineering Approval', desc: 'Technical sign-off / coolant BOM approved' },
    { id: 7, label: 'Commercial Order', desc: 'Pilot contract or recurring supply purchase' },
  ];

  // Helper to determine current stage for an account
  const getStageNumber = (account) => {
    if (account.stage_number) return Number(account.stage_number);
    const eng = engagements.find(e => e.account_id === account.account_id || e.account.toLowerCase().includes(account.company_name.toLowerCase()));
    if (eng?.stage_number) return Number(eng.stage_number);
    
    const accName = (account.company_name || '').toLowerCase();
    if (accName.includes('good enough')) return 4; // Good Enough - verbal positive
    if (accName.includes('replus')) return 3; // REPLUS - active evaluation pending
    if (accName.includes('lineage')) return 3; // Lineage Power - benchmark tested, tailored formulation under test
    if (accName.includes('epitome') || accName.includes('lib')) return 2; // Epitome Sustainable Energy - sample qualification & receipt
    return 3;
  };

  const handleStageClick = (account, stageId) => {
    updateAccount(account.account_id, { stage_number: stageId });
    setToastMessage(`Updated ${account.company_name} to Stage ${stageId}: ${STAGES.find(s => s.id === stageId)?.label}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleDispatchNewSample = (e) => {
    e.preventDefault();
    if (!selectedAddAccountId) return;

    dispatchSampleToAccount(selectedAddAccountId, {
      sampleType: addSampleType,
      initialStage: Number(addInitialStage),
      notes: addNotes
    });

    const target = accounts.find(a => a.account_id === selectedAddAccountId);
    setToastMessage(`Dispatched sample to ${target?.company_name || 'Account'}! Shifted to Under Testing.`);
    setTimeout(() => setToastMessage(''), 3500);

    setShowAddModal(false);
    setSelectedAddAccountId('');
    setAddNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#007A3D] text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-[#005A9C] to-[#007A3D] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-blue-100 text-xs font-bold mb-2">
              <FlaskConical className="w-3.5 h-3.5 text-blue-200" />
              Technical Qualification Gate
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Sample Qualification Tracker • Live Trials ({sampleAccounts.length} Accounts)
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-3xl">
              Rigorous laboratory qualification pipeline tracking live customer trials: {sampleAccounts.map(a => a.company_name).join(', ')}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-[#005A9C] font-black text-xs hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dispatch Sample / Add Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* Qualification Principle Notice */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4.5 flex items-start gap-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-bold text-amber-950 block">Technical Approval Discipline:</strong>
          A verbal statement of "positive test results" (e.g. GoodEnough Energy) does <span className="underline font-bold">NOT</span> represent a formal technical approval, warranty validation, or purchase order.
          Savita commercial forecasting requires independent laboratory reports, material compatibility signs-offs, and procurement BOM qualification.
          <span className="block mt-1 font-semibold text-amber-950">Tip: Click on any stage in the progress stepper below to advance that account's testing milestone.</span>
        </div>
      </div>

      {/* Qualification Cards for all under-testing accounts */}
      <div className="space-y-6">
        {sampleAccounts.map((account) => {
          const currentStage = getStageNumber(account);
          const eng = engagements.find(e => e.account_id === account.account_id || e.account.toLowerCase().includes(account.company_name.toLowerCase())) || {};

          return (
            <div
              key={account.account_id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#005A9C] flex items-center justify-center font-black text-sm shrink-0 border border-blue-200">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-slate-900">
                        {account.company_name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-[#005A9C]">
                        Priority {account.priority}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-blue-700 mt-0.5">
                      {eng.status || 'Active sample testing & customer evaluation'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => openAccountDetail(account.account_id, true)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Account</span>
                  </button>
                  <button
                    onClick={() => openAccountDetail(account.account_id, false)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-[#007A3D] text-[#007A3D] hover:text-white font-bold text-xs border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>360° Profile</span>
                  </button>
                  {currentStage >= 6 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Elevate ${account.company_name} to Active Commercial Supply?`)) {
                          elevateToActiveSupply(account.account_id);
                          setToastMessage(`Elevated ${account.company_name} to Active Regular Supply!`);
                          setTimeout(() => setToastMessage(''), 3000);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      title="Promote to Active Commercial Supply"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Elevate to Active Supply</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 7-Stage Interactive Stepper */}
              <div className="p-5 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Qualification Progression: Stage {currentStage} of 7 — <span className="text-[#005A9C] font-extrabold">{STAGES.find(s => s.id === currentStage)?.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold italic">
                    Click any stage box to set status
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {STAGES.map((s) => {
                    const isPassed = s.id < currentStage;
                    const isCurrent = s.id === currentStage;
                    const isFuture = s.id > currentStage;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleStageClick(account, s.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer hover:shadow-xs group ${
                          isCurrent
                            ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                            : isPassed
                            ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/60'
                            : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-100 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCurrent
                                ? 'bg-[#005A9C] text-white'
                                : isPassed
                                ? 'bg-[#007A3D] text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isPassed ? <Check className="w-3 h-3" /> : s.id}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-black uppercase text-blue-700 animate-pulse">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-[11px] text-slate-900 leading-tight group-hover:text-[#005A9C]">
                          {s.label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                          {s.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Technical Details & Next Directives */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs bg-slate-50/30">
                {/* Fluid Samples & Contact */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Samples & Stakeholder
                  </h4>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">EG50 Status:</span>
                      <strong className="text-slate-800 text-[11px] truncate max-w-[170px]" title={account.eg50_sample_status}>
                        {account.eg50_sample_status || eng.eg50 || 'Sample supplied'}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Immersion Status:</span>
                      <strong className="text-slate-800 text-[11px] truncate max-w-[170px]" title={account.immersion_sample_status}>
                        {account.immersion_sample_status || eng.immersion || 'Under technical review'}
                      </strong>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact / Key Person:</span>
                      <span className="font-bold text-slate-900">
                        {account.primary_contact_name ? `${account.primary_contact_name} (${account.primary_contact_title || ''})` : (eng.contact_or_owner || account.account_owner_edit || 'Commercial BD')}
                      </span>
                      {account.primary_mobile && (
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{account.primary_mobile}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Technical Next Step */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[#007A3D] uppercase tracking-wider text-[10px]">
                    Technical Action Step
                  </h4>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 h-[calc(100%-24px)] flex flex-col justify-between">
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {eng.next_technical_step || account.procurement_qualification_gate || 'Conduct material compatibility testing on customer bench & compare with benchmark parameters.'}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-bold mt-2">
                      Milestone: Formal Lab Data
                    </span>
                  </div>
                </div>

                {/* Commercial Next Step */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[#005A9C] uppercase tracking-wider text-[10px]">
                    Commercial Action Step
                  </h4>
                  <div className="bg-white p-3 rounded-xl border border-blue-200 h-[calc(100%-24px)] flex flex-col justify-between">
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {eng.next_commercial_step || account.suggested_offer || 'Review sample feedback with procurement, confirm production schedule, and prepare pilot order contract.'}
                    </p>
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-600 font-medium">
                      <strong>Next Action:</strong> {account.next_action || 'Follow up with engineering lead'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {sampleAccounts.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <FlaskConical className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-base">No accounts currently under testing</p>
            <p className="text-xs text-slate-400 mt-1">Click the button below to dispatch a sample and shift a customer into Under Testing.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-[#007A3D] text-white font-bold text-xs"
            >
              + Dispatch Sample / Add Client
            </button>
          </div>
        )}
      </div>

      {/* DISPATCH SAMPLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-blue-700 to-[#007A3D] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">Dispatch Sample & Shift to Under Testing</h3>
                <p className="text-blue-100 text-xs">Initiate trial qualification for any client</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchNewSample} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Select Target Company
                </label>
                <select
                  required
                  value={selectedAddAccountId}
                  onChange={(e) => setSelectedAddAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs"
                >
                  <option value="">-- Choose Company from Accounts Master --</option>
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.company_name} (Priority {a.priority} • Current: {a.account_bucket})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Sample Fluid Type Dispatched
                </label>
                <select
                  value={addSampleType}
                  onChange={(e) => setAddSampleType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs"
                >
                  <option value="both">Both Fluids (EG50 Water-Glycol & Dielectric Immersion)</option>
                  <option value="eg50">EG50 Water-Glycol Cold Plate Coolant</option>
                  <option value="immersion">Dielectric Immersion Coolant (Synthetic / Natural Ester)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Initial Qualification Stage
                </label>
                <select
                  value={addInitialStage}
                  onChange={(e) => setAddInitialStage(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs"
                >
                  <option value={1}>Stage 1: Sample Dispatched (In Transit / Delivered)</option>
                  <option value={2}>Stage 2: Lab Receipt & Verification (Received by Engineer)</option>
                  <option value={3}>Stage 3: Active Bench/Chamber Testing (Cycling / Compatibility)</option>
                  <option value={4}>Stage 4: Preliminary / Verbal Feedback</option>
                  <option value={5}>Stage 5: Formal Lab Report</option>
                  <option value={6}>Stage 6: OEM Engineering Approval</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Dispatch Notes / Key Test Engineer
                </label>
                <textarea
                  rows={3}
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="e.g. Sent 20L drum sample to R&D test bench for battery thermal cycle qualification..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedAddAccountId}
                  className="px-5 py-2 rounded-xl bg-[#007A3D] hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Dispatch & Shift to Under Testing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
