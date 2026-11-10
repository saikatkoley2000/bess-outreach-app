import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Flame,
  CheckCircle,
  FlaskConical,
  AlertTriangle,
  Calendar,
  Layers,
  FileCheck,
  Award,
  Save,
  Check,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  Eye,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCompanyWebsiteUrl, getCompanyDisplayDomain } from '../utils/companyUtils';

export default function CompanyDetailModal() {
  const {
    selectedAccountId,
    setSelectedAccountId,
    modalInitialEditMode,
    getAccount360,
    updateAccount,
    updateOpportunity,
    deleteOpportunity,
    addOpportunity,
    updateAction
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingAll, setIsEditingAll] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Sync initial edit mode when opening
  useEffect(() => {
    setIsEditingAll(modalInitialEditMode || false);
  }, [modalInitialEditMode, selectedAccountId]);

  const data = getAccount360(selectedAccountId);

  useEffect(() => {
    if (data && data.account) {
      setFormData({
        company_name: data.account.company_name || '',
        priority: data.account.priority || 'B',
        account_bucket: data.account.account_bucket || 'Prospect',
        relationship_stage: data.account.relationship_stage || 'Cold / qualify',
        business_role: data.account.business_role || '',
        application_segments: data.account.application_segments || '',
        cooling_or_product_evidence: data.account.cooling_or_product_evidence || '',
        eg50_fit: data.account.eg50_fit || '',
        immersion_fit: data.account.immersion_fit || '',
        coolant_fit_type: data.account.coolant_fit_type || 'Both',
        eg50_sample_status: data.account.eg50_sample_status || 'No recorded sample',
        immersion_sample_status: data.account.immersion_sample_status || 'No recorded sample',
        regular_supply_status: data.account.regular_supply_status || 'None',
        stage_number: data.account.stage_number || 1,
        suggested_offer: data.account.suggested_offer || '',
        procurement_qualification_gate: data.account.procurement_qualification_gate || '',
        next_action: data.account.next_action || '',
        evidence_caution: data.account.evidence_caution || '',
        primary_contact_name: data.account.primary_contact_name || '',
        primary_contact_title: data.account.primary_contact_title || '',
        primary_mobile: data.account.primary_mobile || '',
        primary_email: data.account.primary_email || '',
        address: data.account.address || '',
        website: data.account.website || '',
        research_score_100: data.account.research_score_100 !== undefined && data.account.research_score_100 !== '' ? Number(data.account.research_score_100) : 50,
        connected_yn: data.account.connected_yn || 'N',
        discussion_points_to_track: data.account.discussion_points_to_track || '',
        account_owner_edit: data.account.account_owner_edit || '',
        followup_due_date_edit: data.account.followup_due_date_edit || ''
      });
    }
  }, [selectedAccountId, data?.account]);

  if (!selectedAccountId || !data || !data.account) return null;

  const {
    account,
    contacts,
    opportunities,
    actions,
    evidence,
    exclusion,
    engagement,
    corrections,
    expo
  } = data;

  const handleClose = () => {
    setSelectedAccountId(null);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAll = (e) => {
    if (e) e.preventDefault();
    updateAccount(account.account_id, formData);

    let msg = 'Changes saved successfully!';
    if (formData.account_bucket === 'Samples supplied' || formData.eg50_sample_status?.includes('Sample supplied') || formData.immersion_sample_status?.includes('Sample supplied')) {
      msg = 'Saved! Customer shifted to "Under Testing" and updated on Qualification Tracker.';
    } else if (formData.account_bucket === 'Existing customer' || formData.regular_supply_status === 'Active regular supply') {
      msg = 'Saved! Customer shifted to "Active Regular Supply" in Existing-Customer Tracker.';
    }

    setSaveMessage(msg);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setSaveMessage('');
      setIsEditingAll(false);
    }, 2000);
  };

  // Preview cascade effects
  const willShiftToTesting =
    (formData.account_bucket === 'Samples supplied' ||
     (formData.eg50_sample_status && !formData.eg50_sample_status.toLowerCase().includes('no') && (formData.eg50_sample_status.toLowerCase().includes('supplied') || formData.eg50_sample_status.toLowerCase().includes('test'))) ||
     (formData.immersion_sample_status && !formData.immersion_sample_status.toLowerCase().includes('no') && (formData.immersion_sample_status.toLowerCase().includes('supplied') || formData.immersion_sample_status.toLowerCase().includes('test'))) ||
     formData.relationship_stage?.toLowerCase().includes('samples supplied') ||
     formData.relationship_stage?.toLowerCase().includes('under testing')) &&
    formData.account_bucket !== 'Existing customer';

  const willShiftToActiveSupply =
    formData.account_bucket === 'Existing customer' ||
    formData.regular_supply_status?.toLowerCase().includes('active regular') ||
    formData.relationship_stage?.toLowerCase().includes('regular supply');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#007A3D] via-[#005f2f] to-[#005A9C] p-6 text-white relative shrink-0">
          <div className="absolute right-5 top-5 flex items-center gap-2">
            <button
              onClick={() => setIsEditingAll(!isEditingAll)}
              className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5 border border-white/20"
            >
              {isEditingAll ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit All Fields</span>
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-32">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold backdrop-blur-md">
                  {formData.company_name || account.company_name}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-black">
                  Priority {formData.priority || account.priority}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  (formData.account_bucket || account.account_bucket) === 'Existing customer'
                    ? 'bg-emerald-300 text-emerald-950 font-black'
                    : (formData.account_bucket || account.account_bucket) === 'Samples supplied'
                    ? 'bg-blue-300 text-blue-950 font-black'
                    : 'bg-white/90 text-slate-900'
                }`}>
                  {formData.account_bucket || account.account_bucket}
                </span>
                {account.stage_number && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 font-bold">
                    Stage {account.stage_number} of 7
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black tracking-tight">{formData.company_name || account.company_name}</h2>
              <p className="text-emerald-100 text-xs mt-1">
                {formData.business_role || account.business_role || 'BESS / EV Battery OEM'} • Source: {account.event || 'Battery Show India 2026'}
              </p>

              {/* Direct Company Website & Evidence Quick Links */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <a
                  href={getCompanyWebsiteUrl(account)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs transition-all shadow-sm group/web cursor-pointer"
                  title={`Open official company website: ${getCompanyWebsiteUrl(account)}`}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#007A3D] group-hover/web:translate-x-0.5 transition-transform" />
                  <span>Visit Company Website</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({getCompanyDisplayDomain(account)})
                  </span>
                </a>
                {account.evidence_url_1 && (
                  <a
                    href={account.evidence_url_1}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-200 border border-emerald-400/40 text-xs font-semibold transition-all cursor-pointer"
                    title="View Public Thermal/Cooling Product Evidence"
                  >
                    <span>Product Evidence</span>
                    <ExternalLink className="w-3 h-3 text-emerald-300" />
                  </a>
                )}
              </div>
            </div>

            {/* Overall Research Score Gauge */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">Research Score</span>
                <span className="text-2xl font-black">{formData.research_score_100 || account.research_score_100 || 0}</span>
                <span className="text-xs text-white/70">/100</span>
              </div>
              <Award className="w-7 h-7 text-amber-300" />
            </div>
          </div>

          {/* Quick Sub-Navigation Tabs */}
          {!isEditingAll && (
            <div className="flex space-x-2 pt-5 mt-2 border-t border-white/15 overflow-x-auto text-xs font-bold scrollbar-none">
              {[
                { id: 'overview', label: 'Company 360° Profile', count: null },
                { id: 'contacts', label: 'Linked Contacts', count: contacts.length },
                { id: 'opportunities', label: 'Coolant Opportunities', count: opportunities.length },
                { id: 'actions', label: 'Action Items', count: actions.length },
                { id: 'evidence', label: 'Evidence & URLs', count: evidence.length },
                ...(exclusion ? [{ id: 'exclusion', label: 'Exclusion Details', count: 1 }] : []),
                ...(engagement ? [{ id: 'engagement', label: 'Direct Engagement', count: 1 }] : []),
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-1 px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'border-white text-white font-black'
                      : 'border-transparent text-emerald-100 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Success Banner */}
        {saveSuccess && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-200" />
              {saveMessage}
            </span>
            <span className="text-[11px] opacity-80">Synced with Master Database</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* FULL EDIT MODE */}
          {isEditingAll ? (
            <form onSubmit={handleSaveAll} className="space-y-6">
              
              {/* Cascade Notification Banner */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#005A9C] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-bold text-blue-950 block">Live Interconnected Pipeline & Field Cascading:</strong>
                  <p className="text-blue-800 leading-relaxed">
                    Changing fields here automatically shifts this customer across your pipeline. For example, selecting <strong>Account Bucket: Samples supplied</strong> or setting <strong>Sample Status: Sample supplied</strong> will instantly move this account to <strong>Under Testing</strong>, display them in the Sample Qualification Tracker, and increment your Executive Dashboard metrics.
                  </p>
                  {willShiftToTesting && (
                    <div className="mt-2 text-xs font-black text-[#005A9C] bg-white px-2.5 py-1 rounded-lg border border-blue-300 inline-block">
                      ⚡ Action Preview: This company will shift to UNDER TESTING in the Sample Qualification Tracker.
                    </div>
                  )}
                  {willShiftToActiveSupply && (
                    <div className="mt-2 text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 inline-block">
                      ⚡ Action Preview: This company will shift to ACTIVE REGULAR SUPPLY in Existing-Customer Tracker.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 1: CORE CLASSIFICATION & PIPELINE STAGE */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#007A3D]" />
                  1. Company Identity & Pipeline Stage
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Company Legal Name</label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleFieldChange('company_name', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Account Bucket</label>
                    <select
                      value={formData.account_bucket}
                      onChange={(e) => handleFieldChange('account_bucket', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                    >
                      <option value="Prospect">Prospect</option>
                      <option value="Samples supplied">Samples supplied (Under Testing)</option>
                      <option value="Existing customer">Existing customer (Active Supply)</option>
                      <option value="Conditional / watch">Conditional / watch</option>
                      <option value="Excluded">Excluded</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Relationship Stage</label>
                    <select
                      value={formData.relationship_stage}
                      onChange={(e) => handleFieldChange('relationship_stage', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                    >
                      <option value="Cold / qualify">Cold / qualify</option>
                      <option value="Meeting / discussion active">Meeting / discussion active</option>
                      <option value="Samples supplied / Under testing">Samples supplied / Under testing</option>
                      <option value="Active commercial supply">Active commercial supply</option>
                      <option value="Conditional / watch">Conditional / watch</option>
                      <option value="Excluded / archived">Excluded / archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleFieldChange('priority', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                    >
                      <option value="A">Priority A (High Impact)</option>
                      <option value="B">Priority B (Medium Impact)</option>
                      <option value="C">Priority C (Low / Conditional)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Research Score (0–100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.research_score_100}
                      onChange={(e) => handleFieldChange('research_score_100', Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Qualification Stage (1–7)</label>
                    <select
                      value={formData.stage_number}
                      onChange={(e) => handleFieldChange('stage_number', Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                    >
                      <option value={1}>Stage 1: Sample Dispatched</option>
                      <option value={2}>Stage 2: Lab Receipt & Verification</option>
                      <option value={3}>Stage 3: Active Bench/Chamber Testing</option>
                      <option value={4}>Stage 4: Preliminary / Verbal Feedback</option>
                      <option value={5}>Stage 5: Formal Lab Report</option>
                      <option value={6}>Stage 6: OEM Technical Approval</option>
                      <option value={7}>Stage 7: Commercial Pilot / Recurring Order</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: THERMAL FLUIDS & SAMPLE STATUS */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-[#005A9C]" />
                  2. Thermal Fluid Suitability & Sample Status
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Primary Coolant Fit Category</span>
                    <span className="text-[10px] text-slate-500">Select whether this OEM fits EG50, Immersion, Both, or Others</span>
                  </div>
                  <select
                    value={formData.coolant_fit_type || 'Both'}
                    onChange={(e) => handleFieldChange('coolant_fit_type', e.target.value)}
                    className="p-2 rounded-lg border border-slate-300 bg-white font-bold text-xs text-[#007A3D] focus:ring-2 focus:ring-[#007A3D]"
                  >
                    <option value="Both">Both (EG50 & Immersion)</option>
                    <option value="EG50">EG50</option>
                    <option value="Immersion">Immersion</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2">
                    <span className="font-bold text-emerald-950 block text-[11px]">EG50 Fluid (Water-Glycol Cold Plates)</span>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">EG50 Technical Fit</label>
                      <input
                        type="text"
                        value={formData.eg50_fit}
                        onChange={(e) => handleFieldChange('eg50_fit', e.target.value)}
                        placeholder="e.g. High Fit (Cold plate BESS)"
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">EG50 Sample Status</label>
                      <select
                        value={formData.eg50_sample_status}
                        onChange={(e) => handleFieldChange('eg50_sample_status', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold"
                      >
                        <option value="No recorded sample">No recorded sample</option>
                        <option value="Sample requested">Sample requested</option>
                        <option value="Sample supplied (under test)">Sample supplied (under test)</option>
                        <option value="Tested & Approved">Tested & Approved</option>
                        <option value="Not applicable">Not applicable</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-purple-200 space-y-2">
                    <span className="font-bold text-purple-950 block text-[11px]">Dielectric Immersion Coolant</span>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Immersion Technical Fit</label>
                      <input
                        type="text"
                        value={formData.immersion_fit}
                        onChange={(e) => handleFieldChange('immersion_fit', e.target.value)}
                        placeholder="e.g. Synthetic Ester / Natural Ester candidate"
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Immersion Sample Status</label>
                      <select
                        value={formData.immersion_sample_status}
                        onChange={(e) => handleFieldChange('immersion_sample_status', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold"
                      >
                        <option value="No recorded sample">No recorded sample</option>
                        <option value="Sample requested">Sample requested</option>
                        <option value="Sample supplied (under test)">Sample supplied (under test)</option>
                        <option value="Tested & Approved">Tested & Approved</option>
                        <option value="Not applicable">Not applicable</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Regular Commercial Supply Status</label>
                    <select
                      value={formData.regular_supply_status}
                      onChange={(e) => handleFieldChange('regular_supply_status', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                    >
                      <option value="None">None (Not yet commercial)</option>
                      <option value="Under trial evaluation">Under trial evaluation</option>
                      <option value="Active regular supply">Active regular supply (Confirmed Customer)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: COMMERCIAL & TECHNICAL STRATEGY */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-700" />
                  3. Strategy, Qualification Gate & Directives
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Suggested Savita Offer</label>
                    <textarea
                      rows={2}
                      value={formData.suggested_offer}
                      onChange={(e) => handleFieldChange('suggested_offer', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Procurement Qualification Gate</label>
                    <textarea
                      rows={2}
                      value={formData.procurement_qualification_gate}
                      onChange={(e) => handleFieldChange('procurement_qualification_gate', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Immediate Next Action</label>
                    <textarea
                      rows={2}
                      value={formData.next_action}
                      onChange={(e) => handleFieldChange('next_action', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Technical Caution / Claim Limit</label>
                    <textarea
                      rows={2}
                      value={formData.evidence_caution}
                      onChange={(e) => handleFieldChange('evidence_caution', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: PRIMARY CONTACT & ADDRESS */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-600" />
                  4. Primary Contact & Corporate Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Primary Contact Name</label>
                    <input
                      type="text"
                      value={formData.primary_contact_name}
                      onChange={(e) => handleFieldChange('primary_contact_name', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={formData.primary_contact_title}
                      onChange={(e) => handleFieldChange('primary_contact_title', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Direct Mobile</label>
                    <input
                      type="text"
                      value={formData.primary_mobile}
                      onChange={(e) => handleFieldChange('primary_mobile', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Direct Email</label>
                    <input
                      type="email"
                      value={formData.primary_email}
                      onChange={(e) => handleFieldChange('primary_email', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Plant / Office Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Official Website</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: SALES ASSIGNEE */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  5. Commercial Connection & Follow-up Tracking
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Connected with them? (Y/N)</label>
                    <select
                      value={formData.connected_yn}
                      onChange={(e) => handleFieldChange('connected_yn', e.target.value)}
                      className={`w-full p-2 rounded-lg border font-bold text-xs ${
                        formData.connected_yn === 'Y'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <option value="Y">Y (Yes - Connected)</option>
                      <option value="N">N (No - Not Connected)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Follow-up Due Date</label>
                    <input
                      type="date"
                      value={formData.followup_due_date_edit}
                      onChange={(e) => handleFieldChange('followup_due_date_edit', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Discussion Points to Track in future</label>
                    <textarea
                      rows={3}
                      value={formData.discussion_points_to_track}
                      onChange={(e) => handleFieldChange('discussion_points_to_track', e.target.value)}
                      placeholder="Enter detailed meeting notes, key discussion points, customer requirements, or future follow-up agenda..."
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditingAll(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#007A3D] hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Changes & Update Pipeline</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Action Banner to Enter Edit Mode */}
                  <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                    <div className="text-xs text-emerald-950">
                      <strong>Interactive Account Record:</strong> You can edit any field (Priority, Bucket, Sample Status, Address, Offer) with automated cascading.
                    </div>
                    <button
                      onClick={() => setIsEditingAll(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#007A3D] text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Account</span>
                    </button>
                  </div>

                  {/* Caution / Evidence warning if present */}
                  {account.evidence_caution && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
                      <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-amber-950 block">Technical Caution / Claim Limitation:</strong>
                        {account.evidence_caution}
                      </div>
                    </div>
                  )}

                  {/* Research Scoring 5-Factor Radar / Breakdown */}
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                      5-Factor Technical & Commercial Suitability Breakdown (Score: {account.research_score_100}/100)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-semibold block">Technical Fit</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block">{account.technical_fit_5 || 0}/5</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-semibold block">Buying Ability</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block">{account.buying_ability_5 || 0}/5</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-semibold block">Show Access</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block">{account.show_access_5 || 0}/5</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-semibold block">Scale Potential</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block">{account.scale_5 || 0}/5</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-semibold block">Timing & Readiness</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block">{account.timing_5 || 0}/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Core Offer & Qualification Strategy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#007A3D] block">
                        Suggested Savita Offer
                      </span>
                      <p className="font-bold text-slate-900 leading-relaxed">
                        {account.suggested_offer || 'EG50 qualification candidate; check OEM inhibition requirement.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#005A9C] block">
                        Procurement Qualification Gate
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {account.procurement_qualification_gate || 'Validate engineering contact and coolant specifications.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 md:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                        Immediate Next Action
                      </span>
                      <p className="text-slate-800 font-semibold leading-relaxed">
                        {account.next_action || 'Arrange technical qualification call.'}
                      </p>
                    </div>
                  </div>

                  {/* Applicable Coolant Fit Pair */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <span className="font-bold text-emerald-950 block text-xs mb-1">EG50 Coolant Fit (Water-Glycol)</span>
                      <p className="text-emerald-800 text-[11px] leading-relaxed">{account.eg50_fit || 'Unverified'}</p>
                      <span className="mt-2.5 inline-block text-[10px] font-semibold text-emerald-700 bg-white px-2.5 py-0.5 rounded border border-emerald-200">
                        Sample: {account.eg50_sample_status || 'No recorded sample'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                      <span className="font-bold text-purple-950 block text-xs mb-1">Dielectric Immersion Coolant Fit</span>
                      <p className="text-purple-800 text-[11px] leading-relaxed">{account.immersion_fit || 'Unverified'}</p>
                      <span className="mt-2.5 inline-block text-[10px] font-semibold text-purple-700 bg-white px-2.5 py-0.5 rounded border border-purple-200">
                        Sample: {account.immersion_sample_status || 'No recorded sample'}
                      </span>
                    </div>
                  </div>

                  {/* Connection Tracking, Follow-up & Discussion Points */}
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                        Connection Status & Discussion Tracking
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Connected with them? (Y/N)
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => updateAccount(account.account_id, { connected_yn: 'Y' })}
                            className={`px-3 py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                              account.connected_yn === 'Y'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            ✓ Yes (Connected)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateAccount(account.account_id, { connected_yn: 'N' })}
                            className={`px-3 py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                              account.connected_yn !== 'Y'
                                ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            ✗ No (Not Connected)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Follow-up Due Date
                        </label>
                        <input
                          type="date"
                          value={account.followup_due_date_edit || ''}
                          onChange={(e) => {
                            updateAccount(account.account_id, { followup_due_date_edit: e.target.value });
                          }}
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Discussion Points to Track in future
                        </label>
                        <textarea
                          rows={3}
                          value={account.discussion_points_to_track || ''}
                          onChange={(e) => {
                            updateAccount(account.account_id, { discussion_points_to_track: e.target.value });
                          }}
                          placeholder="Type key discussion points, customer requirements, or future follow-up agenda..."
                          className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Contact & Address details */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Registered / Operating Address
                      </span>
                      <p className="text-slate-800 font-medium">
                        {account.address || 'Address not captured on business card'}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Official Website:</span>
                        <a
                          href={getCompanyWebsiteUrl(account)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#005A9C] font-bold hover:underline font-mono"
                        >
                          <span>{getCompanyWebsiteUrl(account)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {account.evidence_url_1 && (
                        <a
                          href={account.evidence_url_1}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#007A3D] font-bold hover:underline"
                        >
                          <span>BESS Product Evidence Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LINKED CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">
                      Linked CRM Contacts ({contacts.length})
                    </h4>
                    <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                      Confidential Business Contact Info
                    </span>
                  </div>

                  {contacts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contacts.map((c) => (
                        <div
                          key={c.contact_id}
                          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-black text-sm text-slate-900">{c.full_name}</div>
                              <div className="text-slate-500 font-semibold">{c.job_title}</div>
                              <div className="text-[11px] text-slate-400 font-medium mt-0.5">{c.company_on_card}</div>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                            {c.mobile && (
                              <div className="flex items-center gap-2 text-slate-700 font-mono">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{c.mobile}</span>
                              </div>
                            )}
                            {c.email && (
                              <div className="flex items-center gap-2 text-slate-700 font-mono">
                                <Mail className="w-3.5 h-3.5 text-[#005A9C]" />
                                <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
                              </div>
                            )}
                            {c.office_address && (
                              <div className="flex items-start gap-2 text-slate-500 pt-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{c.office_address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-2xl">
                      No business card contact scanned for this account yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: LINKED OPPORTUNITIES */}
              {activeTab === 'opportunities' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                    <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">
                      Coolant Product Pipeline ({opportunities.length} Rows)
                    </h4>
                    <button
                      onClick={() => {
                        const hasEG50 = opportunities.some(o => o.product === 'EG50');
                        const defaultProd = hasEG50 ? 'Dielectric immersion' : 'EG50';
                        addOpportunity({
                          account_id: account.account_id,
                          company_name: account.company_name,
                          product: defaultProd,
                          opportunity_stage: 'Technical specification needed',
                          priority: account.priority || 'B'
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#007A3D] border border-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product Row</span>
                    </button>
                  </div>

                  {opportunities.length > 0 ? (
                    <div className="space-y-3">
                      {opportunities.map((opp) => (
                        <div
                          key={opp.opportunity_id}
                          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <select
                                value={opp.product}
                                onChange={(e) => updateOpportunity(opp.opportunity_id, { product: e.target.value })}
                                className={`text-xs font-black px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#007A3D] ${
                                  opp.product === 'EG50'
                                    ? 'bg-emerald-50 text-[#007A3D] border-emerald-300'
                                    : 'bg-purple-50 text-purple-700 border-purple-300'
                                }`}
                                title="Change product for this opportunity row"
                              >
                                <option value="EG50">EG50 (Cold Plate)</option>
                                <option value="Dielectric immersion">Dielectric immersion</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                {opp.opportunity_stage}
                              </span>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete the ${opp.product} opportunity row for ${account.company_name}?`)) {
                                    deleteOpportunity(opp.opportunity_id);
                                  }
                                }}
                                className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove this inapplicable opportunity row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                            <div>
                              <span className="text-slate-400 font-semibold block">Commercial Route</span>
                              <span className="text-slate-800 font-medium">{opp.commercial_route}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block">Technical Fit</span>
                              <span className="text-slate-800 font-medium">{opp.technical_fit_assessment}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block">Approval Status</span>
                              <span className="text-slate-800 font-medium">{opp.technical_approval_status}</span>
                            </div>
                          </div>

                          {/* Commercial Volume Scenario Inputs for this Opportunity */}
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              Volume Planning Inputs
                            </span>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-slate-500 font-semibold block">Est. Annual Volume (Litres)</label>
                                <input
                                  type="number"
                                  value={opp.estimated_annual_litres_edit}
                                  onChange={(e) => updateOpportunity(opp.opportunity_id, { estimated_annual_litres_edit: e.target.value })}
                                  placeholder="0 L"
                                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs font-medium"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 font-semibold block">Win Probability (%)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={opp.win_probability_pct_edit}
                                  onChange={(e) => updateOpportunity(opp.opportunity_id, { win_probability_pct_edit: e.target.value })}
                                  placeholder="0%"
                                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs font-medium"
                                />
                              </div>
                            </div>

                            {opp.weighted_litres_formula && (
                              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Probability-Weighted Volume:</span>
                                <span className="text-[#007A3D] font-black">{Number(opp.weighted_litres_formula).toLocaleString()} L</span>
                              </div>
                            )}
                          </div>

                          {opp.caveats && (
                            <p className="text-[11px] text-slate-500 italic">
                              <strong>Caveats:</strong> {opp.caveats}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-2xl">
                      No explicit opportunity line listed.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ACTIONS */}
              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">
                    Assigned Sales Tasks ({actions.length})
                  </h4>

                  {actions.length > 0 ? (
                    <div className="space-y-3">
                      {actions.map((act) => (
                        <div
                          key={act.action_id}
                          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{act.action_type}</span>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">
                                {act.urgency}
                              </span>
                              <select
                                value={act.status_edit || 'Not started'}
                                onChange={(e) => updateAction(act.action_id, { status_edit: e.target.value })}
                                className="text-[10px] font-bold p-1 rounded border border-slate-200 bg-slate-50"
                              >
                                <option value="Not started">Not started</option>
                                <option value="In progress">In progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Deferred">Deferred</option>
                              </select>
                            </div>
                          </div>

                          <p className="text-slate-800 font-medium leading-relaxed">
                            {act.action_description}
                          </p>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Criterion: <strong className="text-slate-700">{act.success_criterion}</strong></span>
                            <span>Assignee: <strong className="text-slate-700">{act.owner_edit || 'Unassigned'}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-2xl">
                      No sales task logged yet for this account.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: EVIDENCE */}
              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">
                    Verified Evidence Records ({evidence.length})
                  </h4>

                  {evidence.length > 0 ? (
                    <div className="space-y-3">
                      {evidence.map((ev) => (
                        <div
                          key={ev.evidence_id}
                          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{ev.evidence_type}</span>
                          </div>
                          <p className="text-slate-800 font-semibold leading-relaxed">{ev.evidence_summary}</p>
                          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                            <strong>Claim Limitation:</strong> {ev.claim_limit}
                          </div>
                          {ev.source_url && (
                            <div className="pt-1 text-right">
                              <a
                                href={ev.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005A9C] hover:underline"
                              >
                                <span>Open Source Webpage</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-2xl">
                      No specific evidence row in Evidence sheet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: EXCLUSION */}
              {activeTab === 'exclusion' && exclusion && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-rose-900 text-sm">Classification: {exclusion.classification}</span>
                    <span className="text-[10px] text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200 font-bold">
                      Audit Exclusion
                    </span>
                  </div>
                  <p className="text-rose-950 font-medium leading-relaxed">
                    <strong>Reason:</strong> {exclusion.reason}
                  </p>
                  <p className="text-rose-800">
                    <strong>Reopen Trigger:</strong> {exclusion.reopen_trigger}
                  </p>
                </div>
              )}

              {/* TAB 7: ENGAGEMENT */}
              {activeTab === 'engagement' && engagement && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-950 text-sm">{engagement.status}</span>
                    <span className="text-[10px] text-emerald-800 font-bold">Confirmed: {engagement.confirmed_by}</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed">{engagement.relationship_notes}</p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Next Technical Step</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{engagement.next_technical_step}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Next Commercial Step</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{engagement.next_commercial_step}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-bold text-slate-800">{formData.company_name || account.company_name}</span>
          <div className="flex items-center gap-2">
            {!isEditingAll && (
              <button
                onClick={() => setIsEditingAll(true)}
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#007A3D] font-bold text-xs border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit All Fields</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
