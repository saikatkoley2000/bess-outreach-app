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
import { getCompanyWebsiteUrl, getCompanyDisplayDomain } from '../utils/companyUtils';

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
  const [sortBy, setSortBy] = useState('PRIORITY_DEFAULT');

  const PRIORITY_RANK = {
    'A': 1,
    'B': 2,
    'C': 3,
    'Excluded': 4
  };

  const getAccNum = (id) => {
    if (!id) return 9999;
    const m = String(id).match(/\d+/);
    return m ? parseInt(m[0], 10) : 9999;
  };

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    const list = accounts.filter(acc => {
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
          (acc.address && acc.address.toLowerCase().includes(query)) ||
          (acc.discussion_points_to_track && acc.discussion_points_to_track.toLowerCase().includes(query));
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

      // Product / Coolant Fit
      const fit = acc.coolant_fit_type || 'Both';
      if (selectedProductFit !== 'ALL') {
        if (selectedProductFit === 'Both' && fit !== 'Both') return false;
        if (selectedProductFit === 'EG50' && fit !== 'EG50' && fit !== 'Both') return false;
        if (selectedProductFit === 'EG50_ONLY' && fit !== 'EG50') return false;
        if (selectedProductFit === 'Immersion' && fit !== 'Immersion' && fit !== 'Both') return false;
        if (selectedProductFit === 'Immersion_ONLY' && fit !== 'Immersion') return false;
        if (selectedProductFit === 'Others' && fit !== 'Others') return false;
      }

      // Met / Connected Status
      if (selectedMetStatus === 'CONNECTED_Y' || selectedMetStatus === 'MET') {
        if (acc.connected_yn !== 'Y') return false;
      } else if (selectedMetStatus === 'CONNECTED_N' || selectedMetStatus === 'NOT_MET') {
        if (acc.connected_yn === 'Y') return false;
      }

      // Research Score
      if (minResearchScore > 0 && (Number(acc.research_score_100) || 0) < minResearchScore) {
        return false;
      }

      return true;
    });

    // Sort serially: Category A serially, then B serially, then C serially, then Excluded serially
    return list.sort((a, b) => {
      if (sortBy === 'PRIORITY_DEFAULT') {
        const pA = PRIORITY_RANK[a.priority] || 99;
        const pB = PRIORITY_RANK[b.priority] || 99;
        if (pA !== pB) return pA - pB;
        // As per record: arranged serially by record ID
        return getAccNum(a.account_id) - getAccNum(b.account_id);
      }
      if (sortBy === 'CONNECTED_Y_FIRST') {
        const cA = a.connected_yn === 'Y' ? 0 : 1;
        const cB = b.connected_yn === 'Y' ? 0 : 1;
        if (cA !== cB) return cA - cB;
        const pA = PRIORITY_RANK[a.priority] || 99;
        const pB = PRIORITY_RANK[b.priority] || 99;
        if (pA !== pB) return pA - pB;
        return getAccNum(a.account_id) - getAccNum(b.account_id);
      }
      if (sortBy === 'SCORE_DESC') {
        const sA = Number(a.research_score_100) || 0;
        const sB = Number(b.research_score_100) || 0;
        if (sB !== sA) return sB - sA;
        const pA = PRIORITY_RANK[a.priority] || 99;
        const pB = PRIORITY_RANK[b.priority] || 99;
        if (pA !== pB) return pA - pB;
        return getAccNum(a.account_id) - getAccNum(b.account_id);
      }
      if (sortBy === 'NAME_ASC') {
        return (a.company_name || '').localeCompare(b.company_name || '');
      }
      if (sortBy === 'FOLLOWUP_ASC') {
        if (!a.followup_due_date_edit) return 1;
        if (!b.followup_due_date_edit) return -1;
        return a.followup_due_date_edit.localeCompare(b.followup_due_date_edit);
      }
      return 0;
    });
  }, [accounts, searchTerm, selectedBucket, selectedPriority, selectedProductFit, selectedMetStatus, minResearchScore, sortBy]);

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
  const connectedCount = accounts.filter(a => a.connected_yn === 'Y').length;
  const unconnectedCount = accounts.filter(a => a.connected_yn !== 'Y').length;

  const eg50Count = accounts.filter(a => (a.coolant_fit_type || 'Both') === 'EG50' || (a.coolant_fit_type || 'Both') === 'Both').length;
  const immersionCount = accounts.filter(a => (a.coolant_fit_type || 'Both') === 'Immersion' || (a.coolant_fit_type || 'Both') === 'Both').length;
  const bothCount = accounts.filter(a => (a.coolant_fit_type || 'Both') === 'Both').length;
  const othersCount = accounts.filter(a => (a.coolant_fit_type || 'Both') === 'Others').length;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBucket('ALL');
    setSelectedPriority('ALL');
    setSelectedProductFit('ALL');
    setSelectedMetStatus('ALL');
    setMinResearchScore(0);
    setSortBy('PRIORITY_DEFAULT');
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
      case 'Excluded':
        return <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">Excl</span>;
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
              onClick={() => setSelectedMetStatus(selectedMetStatus === 'CONNECTED_N' ? 'ALL' : 'CONNECTED_N')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                selectedMetStatus === 'CONNECTED_N'
                  ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
              title="Show targets not yet connected (Connected: N)"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100 text-xs">
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
              Category / Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
            >
              <option value="ALL">All Categories</option>
              <option value="A">Category A (High Impact)</option>
              <option value="B">Category B</option>
              <option value="C">Category C</option>
              <option value="Excluded">Excluded</option>
            </select>
          </div>

          {/* Coolant Fit Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Coolant Fit Filter
            </label>
            <select
              value={selectedProductFit}
              onChange={(e) => setSelectedProductFit(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
            >
              <option value="ALL">All Coolant Fits ({accounts.length})</option>
              <option value="Both">Both (EG50 & Immersion) ({bothCount})</option>
              <option value="EG50">EG50 Fit ({eg50Count})</option>
              <option value="EG50_ONLY">EG50 Only ({accounts.filter(a => (a.coolant_fit_type || 'Both') === 'EG50').length})</option>
              <option value="Immersion">Immersion Fit ({immersionCount})</option>
              <option value="Immersion_ONLY">Immersion Only ({accounts.filter(a => (a.coolant_fit_type || 'Both') === 'Immersion').length})</option>
              <option value="Others">Others ({othersCount})</option>
            </select>
          </div>

          {/* Connected Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Connected Status (Y/N)
            </label>
            <select
              value={selectedMetStatus}
              onChange={(e) => setSelectedMetStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
            >
              <option value="ALL">All Statuses ({accounts.length})</option>
              <option value="CONNECTED_Y">Connected: Yes ({connectedCount})</option>
              <option value="CONNECTED_N">Not Connected: No ({unconnectedCount})</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#007A3D] mb-1">
              Sort Sequence
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 rounded-lg border border-emerald-300 bg-emerald-50/50 text-xs font-bold text-[#007A3D] focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
            >
              <option value="PRIORITY_DEFAULT">A → B → C → Excluded (Serial)</option>
              <option value="CONNECTED_Y_FIRST">Connected Status (Y → N)</option>
              <option value="SCORE_DESC">Highest Score (100 → 0)</option>
              <option value="NAME_ASC">Company Name (A–Z)</option>
              <option value="FOLLOWUP_ASC">Follow-up Due Date</option>
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
            <span className="ml-2 font-normal text-slate-500 text-[11px]">
              • Sequence: <span className="font-semibold text-slate-700">{sortBy === 'PRIORITY_DEFAULT' ? 'Category A → B → C → Excluded' : sortBy === 'SCORE_DESC' ? 'Highest Score First' : sortBy === 'NAME_ASC' ? 'Company Name (A–Z)' : 'Follow-up Due'}</span>
            </span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Click any company row or 360° button for complete linked contacts & opportunities
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-1.5 text-center w-8">#</th>
                <th
                  onClick={() => setSortBy('PRIORITY_DEFAULT')}
                  className="py-2.5 px-1 text-center w-12 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                  title="Arranged serially: Category A → B → C → Excluded"
                >
                  <span className="inline-flex items-center gap-0.5 justify-center">
                    Cat {sortBy === 'PRIORITY_DEFAULT' && <span className="text-[#007A3D]">▼</span>}
                  </span>
                </th>
                <th
                  onClick={() => setSortBy(sortBy === 'NAME_ASC' ? 'PRIORITY_DEFAULT' : 'NAME_ASC')}
                  className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 select-none transition-colors min-w-[130px] max-w-[170px]"
                  title="Click to sort by Company Name"
                >
                  <span className="inline-flex items-center gap-1">
                    Company Name {sortBy === 'NAME_ASC' && <span className="text-[#007A3D]">▲</span>}
                  </span>
                </th>
                <th className="py-2.5 px-1.5 w-26">Bucket</th>
                <th className="py-2.5 px-2 min-w-[120px] max-w-[150px]">Primary Contact</th>
                <th className="py-2.5 px-2 min-w-[110px] max-w-[140px]">Segment / Role</th>
                <th className="py-2.5 px-1.5 w-22">Coolant Fit</th>
                <th
                  onClick={() => setSortBy(sortBy === 'SCORE_DESC' ? 'PRIORITY_DEFAULT' : 'SCORE_DESC')}
                  className="py-2.5 px-1 text-center w-12 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                  title="Click to sort by Research Score"
                >
                  <span className="inline-flex items-center gap-0.5 justify-center">
                    Score {sortBy === 'SCORE_DESC' && <span className="text-[#007A3D]">▼</span>}
                  </span>
                </th>
                <th
                  onClick={() => setSortBy(sortBy === 'CONNECTED_Y_FIRST' ? 'PRIORITY_DEFAULT' : 'CONNECTED_Y_FIRST')}
                  className="py-2.5 px-1 text-center w-14 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                  title="Click to sort by Connected status (Y / N)"
                >
                  <span className="inline-flex items-center gap-0.5 justify-center">
                    Conn {sortBy === 'CONNECTED_Y_FIRST' && <span className="text-[#007A3D]">▼</span>}
                  </span>
                </th>
                <th className="py-2.5 px-2 min-w-[150px] max-w-[200px]">Discussion Points to Track</th>
                <th
                  onClick={() => setSortBy(sortBy === 'FOLLOWUP_ASC' ? 'PRIORITY_DEFAULT' : 'FOLLOWUP_ASC')}
                  className="py-2.5 px-1 cursor-pointer hover:bg-slate-100 select-none transition-colors w-24"
                  title="Click to sort by Follow-up Due Date"
                >
                  <span className="inline-flex items-center gap-0.5">
                    Follow-up {sortBy === 'FOLLOWUP_ASC' && <span className="text-[#007A3D]">▲</span>}
                  </span>
                </th>
                <th className="py-2.5 px-1.5 text-right w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAccounts.map((acc, index) => {
                const score = acc.research_score_100 !== undefined && acc.research_score_100 !== '' ? Number(acc.research_score_100) : 0;
                return (
                  <tr
                    key={acc.account_id}
                    className="hover:bg-emerald-50/30 transition-colors group"
                  >
                    {/* Serial # */}
                    <td className="py-2 px-1 text-center text-slate-400 font-mono text-[10px] font-bold">
                      {index + 1}
                    </td>

                    {/* Interactive Category Selector (A, B, C, Excluded) */}
                    <td className="py-2 px-1 text-center">
                      <select
                        value={acc.priority || 'A'}
                        onChange={(e) => updateAccount(acc.account_id, { priority: e.target.value })}
                        className={`font-black text-[10px] px-1 py-0.5 rounded border cursor-pointer focus:outline-none transition-all shadow-2xs ${
                          acc.priority === 'A'
                            ? 'bg-emerald-100 text-[#007A3D] border-emerald-300'
                            : acc.priority === 'B'
                            ? 'bg-blue-100 text-[#005A9C] border-blue-300'
                            : acc.priority === 'C'
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                        title="Category (A, B, C, Excluded)"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="Excluded">Excl</option>
                      </select>
                    </td>

                    {/* Company & ID with Direct Website Link */}
                    <td className="py-2 px-2 max-w-[170px]">
                      <div className="font-bold text-slate-900 group-hover:text-[#007A3D] transition-colors leading-tight flex items-center justify-between gap-1">
                        <button
                          onClick={() => setSelectedAccountId(acc.account_id)}
                          className="hover:underline text-left cursor-pointer truncate"
                          title={`Open 360° profile for ${acc.company_name}`}
                        >
                          {acc.company_name}
                        </button>
                        <a
                          href={getCompanyWebsiteUrl(acc)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-[#007A3D] hover:bg-emerald-50 p-0.5 rounded transition-colors shrink-0"
                          title={`Visit official website: ${getCompanyWebsiteUrl(acc)}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5 flex items-center gap-1 truncate">
                        <span className="truncate">{acc.event || 'Battery Show India'}</span>
                        {(!acc.met_status || !acc.met_status.toLowerCase().includes('met')) && (
                          <span className="text-[8px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1 py-0.2 rounded shrink-0">
                            Unmet
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Bucket */}
                    <td className="py-2 px-1.5 w-26">
                      <select
                        value={acc.account_bucket}
                        onChange={(e) => updateAccount(acc.account_id, { account_bucket: e.target.value })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none w-26 truncate shadow-2xs ${
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
                        title={acc.account_bucket}
                      >
                        <option value="Prospect">Prospect</option>
                        <option value="Samples supplied">Testing</option>
                        <option value="Existing customer">Active</option>
                        <option value="Conditional / watch">Watch</option>
                        <option value="Excluded">Excluded</option>
                      </select>
                    </td>

                    {/* Primary Contact */}
                    <td className="py-2 px-2 max-w-[150px]">
                      {acc.primary_contact_name ? (
                        <div className="leading-tight">
                          <div className="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1" title={acc.primary_contact_name}>
                            <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{acc.primary_contact_name}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 truncate" title={acc.primary_contact_title}>
                            {acc.primary_contact_title || '-'}
                          </div>
                          {acc.primary_mobile && (
                            <div className="text-[9px] text-emerald-800 flex items-center gap-0.5 font-mono truncate">
                              <Phone className="w-2 h-2 shrink-0" />
                              <span className="truncate">{acc.primary_mobile}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">No contact</span>
                      )}
                    </td>

                    {/* Segment / Role */}
                    <td className="py-2 px-2 max-w-[140px]">
                      <div className="font-semibold text-slate-800 text-[10px] leading-tight truncate" title={acc.business_role}>
                        {acc.business_role || 'Specialty OEM'}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate mt-0.5" title={acc.application_segments}>
                        {acc.application_segments || 'BESS / EV'}
                      </div>
                    </td>

                    {/* Coolant Fit */}
                    <td className="py-2 px-1.5 w-22">
                      <select
                        value={acc.coolant_fit_type || 'Both'}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateAccount(acc.account_id, {
                            coolant_fit_type: val,
                            eg50_fit: (val === 'EG50' || val === 'Both') ? 'Suitable / Candidate' : 'Not applicable',
                            immersion_fit: (val === 'Immersion' || val === 'Both') ? 'Suitable / Candidate' : 'Not applicable'
                          });
                        }}
                        className={`w-full text-[10px] font-black px-1.5 py-0.5 rounded border cursor-pointer focus:outline-none transition-colors shadow-2xs ${
                          (acc.coolant_fit_type || 'Both') === 'EG50'
                            ? 'bg-emerald-50 text-[#007A3D] border-emerald-300'
                            : (acc.coolant_fit_type || 'Both') === 'Immersion'
                            ? 'bg-purple-50 text-purple-700 border-purple-300'
                            : (acc.coolant_fit_type || 'Both') === 'Both'
                            ? 'bg-gradient-to-r from-emerald-50 to-purple-50 text-slate-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                        title="Coolant Fit: EG50, Immersion, Both, or Others"
                      >
                        <option value="EG50">EG50</option>
                        <option value="Immersion">Immersion</option>
                        <option value="Both">Both</option>
                        <option value="Others">Others</option>
                      </select>
                    </td>

                    {/* Editable Research Score */}
                    <td className="py-2 px-1 text-center w-12">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={acc.research_score_100 !== undefined && acc.research_score_100 !== '' ? acc.research_score_100 : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                            updateAccount(acc.account_id, { research_score_100: val });
                          }}
                          placeholder="0"
                          className={`w-10 text-center font-black text-[11px] py-0.5 px-0.5 rounded border focus:outline-none ${
                            score >= 80
                              ? 'bg-emerald-100 text-[#007A3D] border-emerald-300 font-black'
                              : score >= 60
                              ? 'bg-blue-100 text-[#005A9C] border-blue-300 font-bold'
                              : score > 0
                              ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                              : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}
                          title="Score (0-100)"
                        />
                      </div>
                    </td>

                    {/* Connected (Y/N) Switch */}
                    <td className="py-2 px-1 text-center w-14">
                      <div className="inline-flex items-center rounded border border-slate-200 bg-slate-100 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateAccount(acc.account_id, { connected_yn: 'Y' })}
                          className={`px-1.5 py-0.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                            acc.connected_yn === 'Y'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title="Connected: Yes"
                        >
                          Y
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAccount(acc.account_id, { connected_yn: 'N' })}
                          className={`px-1.5 py-0.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                            acc.connected_yn !== 'Y'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title="Connected: No"
                        >
                          N
                        </button>
                      </div>
                    </td>

                    {/* Discussion Points to Track in future */}
                    <td className="py-2 px-2 min-w-[150px] max-w-[200px]">
                      <textarea
                        rows={1}
                        value={acc.discussion_points_to_track || ''}
                        onChange={(e) => updateAccount(acc.account_id, { discussion_points_to_track: e.target.value })}
                        placeholder="Add discussion notes..."
                        className="w-full p-1 text-[10px] leading-tight rounded border border-slate-200 hover:border-slate-300 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] bg-white transition-all placeholder:text-slate-400 text-slate-800 resize-y focus:h-14 shadow-2xs"
                        title={acc.discussion_points_to_track || 'Click to edit discussion points'}
                      />
                    </td>

                    {/* Editable Due Date */}
                    <td className="py-2 px-1 w-24">
                      <input
                        type="date"
                        value={acc.followup_due_date_edit || ''}
                        onChange={(e) => updateAccount(acc.account_id, { followup_due_date_edit: e.target.value })}
                        className="w-24 px-1 py-0.5 rounded border border-slate-200 hover:border-slate-300 focus:border-[#007A3D] text-[9px] bg-white text-slate-700 font-mono"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-1.5 text-right w-16">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openAccountDetail(acc.account_id, false)}
                          className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-[#007A3D] text-[#007A3D] hover:text-white font-black text-[9px] transition-colors cursor-pointer"
                          title="Open 360° linked profile"
                        >
                          360°
                        </button>
                        <button
                          onClick={() => openAccountDetail(acc.account_id, true)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          title="Edit all fields of this company"
                        >
                          <Edit3 className="w-2.5 h-2.5 text-slate-500" />
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
