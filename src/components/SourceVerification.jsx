import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  History,
  Building,
  CheckCircle,
  XCircle,
  Filter,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SourceVerification() {
  const {
    evidence,
    exclusions,
    corrections,
    expo41,
    setSelectedAccountId
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('evidence');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered Evidence
  const filteredEvidence = useMemo(() => {
    if (!searchTerm) return evidence;
    const q = searchTerm.toLowerCase();
    return evidence.filter(e =>
      (e.company && e.company.toLowerCase().includes(q)) ||
      (e.account_id && e.account_id.toLowerCase().includes(q)) ||
      (e.evidence_summary && e.evidence_summary.toLowerCase().includes(q)) ||
      (e.verification_grade && e.verification_grade.toLowerCase().includes(q)) ||
      (e.claim_limit && e.claim_limit.toLowerCase().includes(q))
    );
  }, [evidence, searchTerm]);

  // Filtered Exclusions
  const filteredExclusions = useMemo(() => {
    if (!searchTerm) return exclusions;
    const q = searchTerm.toLowerCase();
    return exclusions.filter(e =>
      (e.company_name && e.company_name.toLowerCase().includes(q)) ||
      (e.account_id && e.account_id.toLowerCase().includes(q)) ||
      (e.reason && e.reason.toLowerCase().includes(q)) ||
      (e.classification && e.classification.toLowerCase().includes(q)) ||
      (e.reopen_trigger && e.reopen_trigger.toLowerCase().includes(q))
    );
  }, [exclusions, searchTerm]);

  // Filtered Corrections
  const filteredCorrections = useMemo(() => {
    if (!searchTerm) return corrections;
    const q = searchTerm.toLowerCase();
    return corrections.filter(c =>
      (c.company_name && c.company_name.toLowerCase().includes(q)) ||
      (c.account_id && c.account_id.toLowerCase().includes(q)) ||
      (c.previous_issue && c.previous_issue.toLowerCase().includes(q)) ||
      (c.corrected_treatment && c.corrected_treatment.toLowerCase().includes(q))
    );
  }, [corrections, searchTerm]);

  // Filtered Expo 41
  const filteredExpo = useMemo(() => {
    if (!searchTerm) return expo41;
    const q = searchTerm.toLowerCase();
    return expo41.filter(item => {
      const name = item['Additional exhibitors not in 138 contacts'] || '';
      return (
        name.toLowerCase().includes(q) ||
        (item.account_id && item.account_id.toLowerCase().includes(q)) ||
        (item['Application segments'] && item['Application segments'].toLowerCase().includes(q)) ||
        (item['Cooling/product evidence'] && item['Cooling/product evidence'].toLowerCase().includes(q))
      );
    });
  }, [expo41, searchTerm]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#007A3D]" />
              Data Provenance & Audit Trail
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Source Verification, Exclusions & Research Provenance
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Transparent evidence auditing ensuring no unverified prospect is recorded as a confirmed coolant buyer. Includes 128 verified web sources, 78 exclusions & watch triggers, 7 research updates, and 41 Battery Show/REI exhibitors.
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex space-x-2 border-b border-slate-200 pt-5 mt-2">
          <button
            onClick={() => setActiveSubTab('evidence')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'evidence'
                ? 'border-[#007A3D] text-[#007A3D]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Evidence Database</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-[#007A3D]">
              {evidence.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('exclusions')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'exclusions'
                ? 'border-[#007A3D] text-[#007A3D]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Exclusions & Watch</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
              {exclusions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('corrections')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'corrections'
                ? 'border-[#007A3D] text-[#007A3D]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Corrections Audit Log</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-[#005A9C]">
              {corrections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('expo')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'expo'
                ? 'border-[#007A3D] text-[#007A3D]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Expo 41 Exhibitors</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {expo41.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search across ${activeSubTab}...`}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {activeSubTab === 'evidence' ? filteredEvidence.length : activeSubTab === 'exclusions' ? filteredExclusions.length : activeSubTab === 'corrections' ? filteredCorrections.length : filteredExpo.length} items
        </span>
      </div>

      {/* Sub Tab 1: Evidence Database */}
      {activeSubTab === 'evidence' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Company Name</th>
                  <th className="py-2.5 px-3">Evidence Type</th>
                  <th className="py-2.5 px-3">Evidence Summary</th>
                  <th className="py-2.5 px-3">Verification Grade</th>
                  <th className="py-2.5 px-3">Claim Limitation</th>
                  <th className="py-2.5 px-3 text-right">Source Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEvidence.map((ev, idx) => (
                  <tr key={ev.evidence_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 text-center">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => setSelectedAccountId(ev.account_id)}
                        className="font-bold text-slate-900 hover:text-[#007A3D] text-left hover:underline cursor-pointer"
                      >
                        {ev.company}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {ev.evidence_type}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs text-slate-800">
                      {ev.evidence_summary}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {ev.verification_grade || 'Public source checked'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-semibold text-amber-800">
                      {ev.claim_limit}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {ev.source_url ? (
                        <a
                          href={ev.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005A9C] hover:underline"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab 2: Exclusions & Watch */}
      {activeSubTab === 'exclusions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Company Name</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Reason for Exclusion / Watch</th>
                  <th className="py-2.5 px-3">Trigger to Reopen</th>
                  <th className="py-2.5 px-3">Source Event</th>
                  <th className="py-2.5 px-3 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredExclusions.map((ex, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => setSelectedAccountId(ex.account_id)}
                        className="font-bold text-slate-900 hover:text-[#007A3D] text-left hover:underline cursor-pointer"
                      >
                        {ex.company_name}
                      </button>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ex.classification?.includes('watch')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ex.classification}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-sm text-slate-800 leading-normal">
                      {ex.reason}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs text-emerald-900 text-[11px] font-medium leading-normal">
                      {ex.reopen_trigger}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {ex.source_event}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {ex.supporting_url ? (
                        <a
                          href={ex.supporting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005A9C] hover:underline"
                        >
                          <span>URL</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Corrections Audit Log */}
      {activeSubTab === 'corrections' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
            <strong>Audit Provenance:</strong> The following revisions were recorded on 25 October 2026 based on direct Savita management inputs, preventing mischaracterization of live customer relationships.
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {filteredCorrections.map((corr, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedAccountId(corr.account_id)}
                      className="font-bold text-slate-900 text-sm hover:text-[#007A3D] hover:underline cursor-pointer"
                    >
                      {corr.company_name}
                    </button>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {corr.date}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200">
                    <span className="text-[10px] font-bold uppercase text-rose-700 block mb-0.5">
                      Previous Raw Issue
                    </span>
                    <p className="text-rose-950 text-[11px]">{corr.previous_issue}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-0.5">
                      Corrected Treatment & Status
                    </span>
                    <p className="text-emerald-950 text-[11px] font-semibold">{corr.corrected_treatment}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Confirmed by: <strong className="text-slate-700">{corr.confirmed_by}</strong></span>
                  {corr.evidence_url && (
                    <a href={corr.evidence_url} target="_blank" rel="noreferrer" className="text-[#005A9C] font-bold flex items-center gap-1">
                      <span>Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tab 4: Expo 41 Exhibitors */}
      {activeSubTab === 'expo' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Company Name</th>
                  <th className="py-2.5 px-3">Expo & Segment</th>
                  <th className="py-2.5 px-3">Cooling / Product Evidence</th>
                  <th className="py-2.5 px-3">Commercial Role</th>
                  <th className="py-2.5 px-3">First Action</th>
                  <th className="py-2.5 px-3 text-right">Directories</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredExpo.map((ex, idx) => {
                  const name = ex['Additional exhibitors not in 138 contacts'];
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setSelectedAccountId(ex.account_id)}
                          className="font-bold text-slate-900 hover:text-[#007A3D] text-left hover:underline cursor-pointer"
                        >
                          {name}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{ex['Expo 2026']}</div>
                        <div className="text-[10px] text-slate-500 max-w-xs">{ex['Application segments']}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs text-slate-700">
                        {ex['Cooling/product evidence']}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {ex['Commercial role']}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs text-slate-800 font-medium">
                        {ex['First account action']}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          {ex['Product / corporate evidence URL'] && (
                            <a
                              href={ex['Product / corporate evidence URL']}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-[#005A9C] hover:underline flex items-center gap-0.5"
                            >
                              <span>Product</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {ex['Official exhibitor directory URL'] && (
                            <a
                              href={ex['Official exhibitor directory URL']}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                            >
                              <span>Exhibitor</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
