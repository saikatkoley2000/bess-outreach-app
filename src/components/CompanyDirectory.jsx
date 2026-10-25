import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  User,
  Calendar,
  CheckCircle,
  FlaskConical,
  AlertTriangle,
  X,
  SlidersHorizontal,
  Download,
  Edit3,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportAccountsToExcel } from '../utils/exportToExcel';

export default function CompanyDirectory() {
  const {
    accounts,
    updateAccount,
    setSelectedAccountId,
    openAccountDetail
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedProductFit, setSelectedProductFit] = useState('ALL');
  const [selectedMetStatus, setSelectedMetStatus] = useState('ALL');
  const [minResearchScore, setMinResearchScore] = useState(0);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      // Search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const match =
          (acc.company_name && acc.company_name.toLowerCase().includes(query)) ||
          (acc.account_id && acc.account_id.toLowerCase().includes(query)) ||
          (acc.primary_contact_name && acc.primary_contact_name.toLowerCase().includes(query)) ||
          (acc.primary_email && acc.primary_email.toLowerCase().includes(query)) ||
          (acc.primary_mobile && String(acc.primary_mobile).toLowerCase().includes(query)) ||
          (acc.application_segments && acc.application_segments.toLowerCase().includes(query)) ||
          (acc.address && acc.address.toLowerCase().includes(query));
        if (!match) return false;
      }

      // Bucket
      if (selectedBucket !== 'ALL' && acc.account_bucket !== selectedBucket) {
        return false;
      }

      // Priority
      if (selectedPriority !== 'ALL' && acc.priority !== selectedPriority) {
        return false;
      }

      // Product Fit
      if (selectedProductFit === 'EG50_CANDIDATE') {
        if (!acc.eg50_fit || acc.eg50_fit === 'Unverified' || acc.eg50_fit.toLowerCase().includes('not suitable')) return false;
      } else if (selectedProductFit === 'IMMERSION_FIT') {
        if (!acc.immersion_fit || acc.immersion_fit === 'Unverified' || acc.immersion_fit.toLowerCase().includes('not suitable')) return false;
      }

      // Met Status
      if (selectedMetStatus === 'MET') {
        if (!acc.met_status || !acc.met_status.toLowerCase().includes('met')) return false;
      } else if (selectedMetStatus === 'NOT_MET') {
        if (acc.met_status && acc.met_status.toLowerCase().includes('met')) return false;
      }

      // Research Score
      if (minResearchScore > 0 && (Number(acc.research_score_100) || 0) < minResearchScore) {
        return false;
      }

      return true;
    });
  }, [accounts, searchTerm, selectedBucket, selectedPriority, selectedProductFit, selectedMetStatus, minResearchScore]);

  const isSampleUnderTesting = (status) => {
    if (!status) return false;
    const s = status.toLowerCase();
    if (s.includes('no recorded') || s.includes('no sample') || s.includes('not applicable')) return false;
    return s.includes('sample supplied') || s.includes('under test') || s.includes('testing');
  };

  // Dynamic counts reflecting current live state
  const existingCount = accounts.filter(a => a.account_bucket === 'Existing customer' || a.regular_supply_status?.toLowerCase().includes('active regular')).length;
  const samplesSuppliedCount = accounts.filter(a =>
    a.account_bucket !== 'Existing customer' &&
    (a.account_bucket === 'Samples supplied' ||
     isSampleUnderTesting(a.eg50_sample_status) ||
     isSampleUnderTesting(a.immersion_sample_status) ||
     (a.relationship_stage && (a.relationship_stage.toLowerCase().includes('samples supplied') || a.relationship_stage.toLowerCase().includes('under testing'))))
  ).length;
  const prospectsCount = accounts.filter(a => a.account_bucket === 'Prospect').length;
  const watchCount = accounts.filter(a => a.account_bucket === 'Conditional / watch').length;
  const excludedCount = accounts.filter(a => a.account_bucket === 'Excluded').length;
  const unconnectedCount = accounts.filter(a => !a.met_status || !a.met_status.toLowerCase().includes('met')).length;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBucket('ALL');
    setSelectedPriority('ALL');
    setSelectedProductFit('ALL');
    setSelectedMetStatus('ALL');
    setMinResearchScore(0);
  };

  const getBucketBadge = (bucket) => {
    switch (bucket) {
      case 'Existing customer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Existing Customer
          </span>
        );
      case 'Samples supplied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#005A9C] border border-blue-300">
            <FlaskConical className="w-3 h-3 text-blue-600" />
            Samples Supplied
          </span>
        );
      case 'Prospect':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            Open Prospect
          </span>
        );
      case 'Conditional / watch':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Conditional Watch
          </span>
        );
      case 'Excluded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Excluded
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{bucket}</span>;
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'A':
        return <span className="px-2 py-0.5 rounded font-black text-xs bg-emerald-100 text-[#007A3D] border border-emerald-300">A</span>;
      case 'B':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-blue-100 text-[#005A9C] border border-blue-200">B</span>;
      case 'C':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-slate-600 border border-slate-200">C</span>;
      default:
        return <span className="text-xs text-slate-400">-</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Multi-Filters Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company name, contact person, email, phone, city, segment..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#007A3D] focus:border-transparent bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedBucket(selectedBucket === 'Samples supplied' ? 'ALL' : 'Samples supplied')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                selectedBucket === 'Samples supplied'
                  ? 'bg-blue-100 text-blue-950 border-blue-400 ring-2 ring-blue-300 shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-[#005A9C] border-blue-300'
              }`}
              title="Show accounts currently Under Testing / Samples Supplied"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Under Testing ({samplesSuppliedCount})</span>
            </button>
            <button
              onClick={() => setSelectedBucket(selectedBucket === 'Existing customer' ? 'ALL' : 'Existing customer')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                selectedBucket === 'Existing customer'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
              title="Show confirmed Active Supply accounts"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Active Supply ({existingCount})</span>
            </button>
            <button
              onClick={() => setSelectedMetStatus(selectedMetStatus === 'NOT_MET' ? 'ALL' : 'NOT_MET')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                selectedMetStatus === 'NOT_MET'
                  ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
              title="Show targets we missed connecting with at the show who need business attachment"
            >
              <span>Unconnected Targets ({unconnectedCount})</span>
            </button>
            <button
              onClick={() => exportAccountsToExcel(filteredAccounts)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export ({filteredAccounts.length})
            </button>
            {(selectedBucket !== 'ALL' || selectedPriority !== 'ALL' || selectedProductFit !== 'ALL' || selectedMetStatus !== 'ALL' || minResearchScore > 0 || searchTerm) && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Bucket */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Account Bucket
            </label>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
            >
              <option value="ALL">All Buckets ({accounts.length})</option>
              <option value="Existing customer">Existing Customer ({existingCount})</option>
              <option value="Samples supplied">Samples Supplied ({samplesSuppliedCount})</option>
              <option value="Prospect">Prospects ({prospectsCount})</option>
              <option value="Conditional / watch">Conditional / Watch ({watchCount})</option>
              <option value="Excluded">Excluded ({excludedCount})</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
            >
              <option value="ALL">All Priorities</option>
              <option value="A">Priority A (High Impact)</option>
              <option value="B">Priority B</option>
              <option value="C">Priority C</option>
            </select>
          </div>

          {/* Product Fit */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Coolant Fit
            </label>
            <select
              value={selectedProductFit}
              onChange={(e) => setSelectedProductFit(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
            >
              <option value="ALL">All Coolant Fits</option>
              <option value="EG50_CANDIDATE">EG50 Candidate / High Fit</option>
              <option value="IMMERSION_FIT">Dielectric Immersion Fit</option>
            </select>
          </div>

          {/* Met Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Expo Meeting Status
            </label>
            <select
              value={selectedMetStatus}
              onChange={(e) => setSelectedMetStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
            >
              <option value="ALL">All Statuses</option>
              <option value="MET">Met / Business Card Captured (128)</option>
              <option value="NOT_MET">Unconnected at Event • Future Attachment (44 Targets)</option>
            </select>
          </div>

          {/* Research Score Slider */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Min Score (0-100)
              </label>
              <span className="text-xs font-bold text-[#007A3D]">{minResearchScore}</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minResearchScore}
              onChange={(e) => setMinResearchScore(Number(e.target.value))}
              className="w-full accent-[#007A3D] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Accounts Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Summary */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <div className="font-bold text-slate-700">
            Showing <span className="text-[#007A3D]">{filteredAccounts.length}</span> of {accounts.length} Companies
          </div>
          <div className="text-slate-500 text-[11px]">
            Click any company row or 360° button for complete linked contacts & opportunities
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3.5 text-center w-14">Pri</th>
                <th className="py-3 px-3">Company Name</th>
                <th className="py-3 px-3">Bucket</th>
                <th className="py-3 px-3">Primary Contact</th>
                <th className="py-3 px-3">Segment / Role</th>
                <th className="py-3 px-3">Coolant Fit</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-3">Sales Owner (Edit)</th>
                <th className="py-3 px-3">Follow-up Due</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAccounts.map((acc) => {
                const score = Number(acc.research_score_100) || 0;
                return (
                  <tr
                    key={acc.account_id}
                    className="hover:bg-emerald-50/30 transition-colors group"
                  >
                    {/* Priority */}
                    <td className="py-3 px-3.5 text-center">
                      {getPriorityBadge(acc.priority)}
                    </td>

                    {/* Company & ID */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 group-hover:text-[#007A3D] transition-colors flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedAccountId(acc.account_id)}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {acc.company_name}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{acc.event || 'Battery Show India 2026'}</span>
                        {(!acc.met_status || !acc.met_status.toLowerCase().includes('met')) && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.2 rounded">
                            Needs Attachment
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Bucket (Interactive Quick Dropdown) */}
                    <td className="py-3 px-3">
                      <select
                        value={acc.account_bucket}
                        onChange={(e) => updateAccount(acc.account_id, { account_bucket: e.target.value })}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#007A3D] transition-colors ${
                          acc.account_bucket === 'Existing customer'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                            : acc.account_bucket === 'Samples supplied'
                            ? 'bg-blue-100 text-blue-950 border-blue-400'
                            : acc.account_bucket === 'Prospect'
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : acc.account_bucket === 'Conditional / watch'
                            ? 'bg-amber-100 text-amber-950 border-amber-400'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                        title="Quick-switch pipeline bucket: shifts company across Under Testing / Active Supply / Prospect"
                      >
                        <option value="Prospect">Prospect</option>
                        <option value="Samples supplied">Samples supplied (Under Testing)</option>
                        <option value="Existing customer">Existing customer (Active Supply)</option>
                        <option value="Conditional / watch">Conditional / watch</option>
                        <option value="Excluded">Excluded</option>
                      </select>
                    </td>

                    {/* Primary Contact */}
                    <td className="py-3 px-3">
                      {acc.primary_contact_name ? (
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {acc.primary_contact_name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                            {acc.primary_contact_title}
                          </div>
                          {(acc.primary_mobile || acc.primary_email) && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                              {acc.primary_mobile && (
                                <span className="flex items-center gap-0.5 text-emerald-800">
                                  <Phone className="w-2.5 h-2.5" /> {acc.primary_mobile}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No primary contact</span>
                      )}
                    </td>

                    {/* Segment / Role */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="font-semibold text-slate-800 truncate" title={acc.business_role}>
                        {acc.business_role || 'Specialty OEM'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate" title={acc.application_segments}>
                        {acc.application_segments || 'BESS / EV'}
                      </div>
                    </td>

                    {/* Coolant Fit Pills */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {acc.eg50_fit && !acc.eg50_fit.toLowerCase().includes('not') && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#007A3D] border border-emerald-200"
                            title={`EG50: ${acc.eg50_fit}`}
                          >
                            EG50
                          </span>
                        )}
                        {acc.immersion_fit && !acc.immersion_fit.toLowerCase().includes('not') && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200"
                            title={`Immersion: ${acc.immersion_fit}`}
                          >
                            Immersion
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Research Score */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-xs ${
                          score >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : score >= 60
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {score}
                      </span>
                    </td>

                    {/* Editable Owner */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={acc.account_owner_edit || ''}
                        onChange={(e) => updateAccount(acc.account_id, { account_owner_edit: e.target.value })}
                        placeholder="Assign BD..."
                        className="w-28 px-2 py-1 rounded border border-slate-200 hover:border-slate-300 focus:border-[#007A3D] text-[11px] bg-white"
                      />
                    </td>

                    {/* Editable Due Date */}
                    <td className="py-3 px-3">
                      <input
                        type="date"
                        value={acc.followup_due_date_edit || ''}
                        onChange={(e) => updateAccount(acc.account_id, { followup_due_date_edit: e.target.value })}
                        className="w-28 px-1.5 py-1 rounded border border-slate-200 hover:border-slate-300 focus:border-[#007A3D] text-[10px] bg-white text-slate-700"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openAccountDetail(acc.account_id, true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          title="Edit all fields of this company"
                        >
                          <Edit3 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => openAccountDetail(acc.account_id, false)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-[#007A3D] text-[#007A3D] hover:text-white font-bold text-xs transition-colors cursor-pointer"
                          title="Open 360° linked profile"
                        >
                          <span>360°</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAccounts.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm">No companies match your filters</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the search terms or filters above.</p>
              <button
                onClick={resetFilters}
                className="mt-3 px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
