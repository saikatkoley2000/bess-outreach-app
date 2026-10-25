import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Building2,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  User,
  Phone,
  Mail,
  Calendar,
  Check,
  Edit3,
  Flame,
  ArrowRight,
  Droplets,
  Layers,
  Sparkles,
  Plus,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ExistingCustomerTracker() {
  const {
    accounts,
    engagements,
    opportunities,
    actions,
    updateAccount,
    updateEngagement,
    setSelectedAccountId,
    openAccountDetail,
    elevateToActiveSupply
  } = useApp();

  // Find all active regular supply accounts dynamically
  const activeSupplyAccounts = accounts.filter(a =>
    a.account_bucket === 'Existing customer' ||
    a.regular_supply_status?.toLowerCase().includes('active regular') ||
    a.relationship_stage?.toLowerCase().includes('regular supply')
  );

  const [selectedAccountIdInternal, setSelectedAccountIdInternal] = useState(() => {
    return activeSupplyAccounts[0]?.account_id || '';
  });

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [selectedElevateId, setSelectedElevateId] = useState('');
  const [elevateNotes, setElevateNotes] = useState('');

  // Keep selectedAccountIdInternal valid
  useEffect(() => {
    if (activeSupplyAccounts.length > 0) {
      const exists = activeSupplyAccounts.some(a => a.account_id === selectedAccountIdInternal);
      if (!exists) {
        setSelectedAccountIdInternal(activeSupplyAccounts[0].account_id);
      }
    }
  }, [activeSupplyAccounts, selectedAccountIdInternal]);

  const activeCustomer = activeSupplyAccounts.find(a => a.account_id === selectedAccountIdInternal) || activeSupplyAccounts[0] || {};
  const activeEngagement = engagements.find(e => e.account_id === activeCustomer.account_id || e.account?.toLowerCase().includes(activeCustomer.company_name?.toLowerCase())) || {};
  const activeOpportunities = opportunities.filter(o => o.account_id === activeCustomer.account_id || o.company_name?.toLowerCase().includes(activeCustomer.company_name?.toLowerCase()));
  const activeActions = actions.filter(a => a.account_id === activeCustomer.account_id || a.company?.toLowerCase().includes(activeCustomer.company_name?.toLowerCase()));

  const [notes, setNotes] = useState(activeEngagement.relationship_notes || activeCustomer.next_action || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setNotes(activeEngagement.relationship_notes || activeCustomer.next_action || '');
  }, [activeCustomer.account_id, activeEngagement.relationship_notes, activeCustomer.next_action]);

  const handleSaveNotes = () => {
    if (activeEngagement.engagement_id) {
      updateEngagement(activeEngagement.engagement_id, { relationship_notes: notes });
    }
    updateAccount(activeCustomer.account_id, { next_action: notes });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleElevateCustomer = (e) => {
    e.preventDefault();
    if (!selectedElevateId) return;

    elevateToActiveSupply(selectedElevateId, { notes: elevateNotes });
    setSelectedAccountIdInternal(selectedElevateId);
    setShowAddCustomerModal(false);
    setSelectedElevateId('');
    setElevateNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-[#007A3D] to-[#005A9C] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-bold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              Verified Commercial Accounts ({activeSupplyAccounts.length} Active Customers)
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Existing-Customer Commercial Tracker
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-3xl">
              Savita's confirmed recurring revenue relationships in utility BESS and fast-charging EV thermal management. Tracks active dielectric immersion supplies, recurring commercial orders, and production expansions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Active Customer</span>
            </button>
            <button
              onClick={() => openAccountDetail(activeCustomer.account_id, false)}
              className="px-4 py-2 rounded-xl bg-white text-[#007A3D] hover:bg-emerald-50 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Open 360° Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Switcher Cards / Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeSupplyAccounts.map((account) => {
          const isSelected = account.account_id === activeCustomer.account_id;
          const isCleanElectric = account.company_name?.toLowerCase().includes('clean electric');
          const isAmpereHour = account.company_name?.toLowerCase().includes('amperehour');

          return (
            <div
              key={account.account_id}
              onClick={() => setSelectedAccountIdInternal(account.account_id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                isSelected
                  ? 'bg-white border-[#007A3D] ring-2 ring-emerald-200 shadow-md'
                  : 'bg-white hover:bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <h3 className="font-extrabold text-sm text-slate-900">{account.company_name}</h3>
                </div>
                <p className="text-xs text-emerald-800 font-bold mt-1">
                  {isCleanElectric
                    ? 'Immersion Coolant (Synthetic & Natural Ester)'
                    : isAmpereHour
                    ? 'BESS Commercial Regular Supply'
                    : 'Active Commercial Regular Supply'}
                </p>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                  <span>Priority {account.priority}</span>
                  <span>•</span>
                  <span>{account.primary_contact_name || 'Commercial BD'}</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                isSelected ? 'bg-emerald-100 text-emerald-950' : 'bg-slate-100 text-slate-600'
              }`}>
                Active
              </span>
            </div>
          );
        })}
      </div>

      {/* Customer Full Detail Dashboard */}
      {activeCustomer.account_id && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black">
                    Verified Customer
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold">
                    Priority {activeCustomer.priority}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium">
                    {activeCustomer.business_role || 'Specialty Pack OEM'}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">{activeCustomer.company_name}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Plant / Office: {activeCustomer.address || 'Address registered on business card'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAccountDetail(activeCustomer.account_id, true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Account Details</span>
                </button>
              </div>
            </div>

            {/* Key Commercial Metrics & Supplies */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">
                  Supplied Thermal Products
                </span>
                <p className="font-extrabold text-slate-900 text-sm">
                  {activeEngagement.immersion || activeCustomer.immersion_sample_status || 'Immersion & Specialty Coolants'}
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                  Active regular manufacturing shipments
                </span>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] font-bold uppercase text-blue-800 block mb-1">
                  Key Contact & Decision Maker
                </span>
                <p className="font-extrabold text-slate-900 text-sm">
                  {activeCustomer.primary_contact_name || activeEngagement.contact_or_owner || 'Commercial Procurement Team'}
                </p>
                <div className="text-[11px] text-blue-800 font-mono mt-1 flex items-center gap-2">
                  {activeCustomer.primary_mobile && (
                    <span className="flex items-center gap-0.5">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {activeCustomer.primary_mobile}
                    </span>
                  )}
                  {activeCustomer.primary_email && (
                    <span className="flex items-center gap-0.5">
                      <Mail className="w-3 h-3 text-[#005A9C]" />
                      {activeCustomer.primary_email}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                <span className="text-[10px] font-bold uppercase text-purple-800 block mb-1">
                  Next Expansion Milestone
                </span>
                <p className="font-bold text-slate-900 text-xs">
                  {activeEngagement.next_commercial_step || activeCustomer.suggested_offer || 'Scale volume orders & review next-generation pack architectures.'}
                </p>
                <span className="text-[10px] text-purple-700 font-semibold block mt-1">
                  Commercial Expansion Target
                </span>
              </div>
            </div>
          </div>

          {/* Linked Opportunities Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#007A3D]" />
              Coolant Volume Pipeline ({activeOpportunities.length} Rows)
            </h3>
            {activeOpportunities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 bg-slate-50">
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5">Stage</th>
                      <th className="p-2.5">Annual Volume (L)</th>
                      <th className="p-2.5">Win %</th>
                      <th className="p-2.5">Weighted Volume (L)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeOpportunities.map(opp => (
                      <tr key={opp.opportunity_id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{opp.product}</td>
                        <td className="p-2.5 font-medium text-emerald-700">{opp.opportunity_stage}</td>
                        <td className="p-2.5 font-mono">{opp.estimated_annual_litres_edit ? `${Number(opp.estimated_annual_litres_edit).toLocaleString()} L` : 'To be planned'}</td>
                        <td className="p-2.5 font-mono">{opp.win_probability_pct_edit ? `${opp.win_probability_pct_edit}%` : '90%'}</td>
                        <td className="p-2.5 font-mono font-bold text-[#007A3D]">
                          {opp.weighted_litres_formula ? `${Number(opp.weighted_litres_formula).toLocaleString()} L` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No specific opportunity line mapped.</p>
            )}
          </div>

          {/* Editable Relationship Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#005A9C]" />
                Account Notes & BD Directives
              </h3>
              {isSaved && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>

            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter ongoing relationship notes, supply schedule updates, batch shipments..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007A3D]"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                className="px-5 py-2 rounded-xl bg-[#007A3D] hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Save Relationship Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ELEVATE CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-emerald-600 to-[#007A3D] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">Elevate Account to Active Supply</h3>
                <p className="text-emerald-100 text-xs">Convert any prospect or trial into a confirmed customer</p>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleElevateCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Select Target Company
                </label>
                <select
                  required
                  value={selectedElevateId}
                  onChange={(e) => setSelectedElevateId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs"
                >
                  <option value="">-- Choose Company from Master Accounts --</option>
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.company_name} (Priority {a.priority} • Current: {a.account_bucket})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Commercial Supply Scope / Batch Details
                </label>
                <textarea
                  rows={3}
                  value={elevateNotes}
                  onChange={(e) => setElevateNotes(e.target.value)}
                  placeholder="e.g. Regular supply agreement confirmed; recurring deliveries of immersion fluid scheduled..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedElevateId}
                  className="px-5 py-2 rounded-xl bg-[#007A3D] hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Elevate to Active Supply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
