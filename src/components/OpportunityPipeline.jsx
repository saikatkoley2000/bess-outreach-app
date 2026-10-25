import React, { useState, useMemo } from 'react';
import {
  Flame,
  Search,
  Filter,
  Download,
  Sparkles,
  RotateCcw,
  Sliders,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Layers,
  ChevronRight,
  Info,
  Plus,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportOpportunitiesToExcel } from '../utils/exportToExcel';

export default function OpportunityPipeline() {
  const {
    opportunities,
    accounts,
    updateOpportunity,
    deleteOpportunity,
    addOpportunity,
    applyScenarioPreset,
    setSelectedAccountId
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [showScenarioPanel, setShowScenarioPanel] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Add Modal Form State
  const [addAccountId, setAddAccountId] = useState('');
  const [addProduct, setAddProduct] = useState('EG50');
  const [addStage, setAddStage] = useState('Technical specification needed');
  const [addLitres, setAddLitres] = useState('');
  const [addProb, setAddProb] = useState('');

  // Filtered list
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const match =
          (opp.company_name && opp.company_name.toLowerCase().includes(query)) ||
          (opp.opportunity_id && opp.opportunity_id.toLowerCase().includes(query)) ||
          (opp.account_id && opp.account_id.toLowerCase().includes(query)) ||
          (opp.application && opp.application.toLowerCase().includes(query)) ||
          (opp.commercial_route && opp.commercial_route.toLowerCase().includes(query));
        if (!match) return false;
      }

      if (selectedProduct !== 'ALL' && opp.product !== selectedProduct) {
        return false;
      }

      if (selectedPriority !== 'ALL' && opp.priority !== selectedPriority) {
        return false;
      }

      if (selectedStage !== 'ALL' && opp.opportunity_stage !== selectedStage) {
        return false;
      }

      return true;
    });
  }, [opportunities, searchTerm, selectedProduct, selectedPriority, selectedStage]);

  // Counts by product
  const eg50Count = opportunities.filter(o => o.product === 'EG50').length;
  const immersionCount = opportunities.filter(o => o.product === 'Dielectric immersion').length;

  // Totals across active dataset
  const totalLitres = filteredOpportunities.reduce((acc, o) => acc + (Number(o.estimated_annual_litres_edit) || 0), 0);
  const totalWeightedLitres = filteredOpportunities.reduce((acc, o) => acc + (Number(o.weighted_litres_formula) || 0), 0);

  const getProductColor = (product) => {
    switch (product) {
      case 'EG50':
        return 'bg-emerald-50 text-[#007A3D] border-emerald-300';
      case 'Dielectric immersion':
        return 'bg-purple-50 text-purple-700 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleAddNewOpportunity = (e) => {
    e.preventDefault();
    if (!addAccountId) return;

    const acc = accounts.find(a => a.account_id === addAccountId);
    if (!acc) return;

    addOpportunity({
      account_id: acc.account_id,
      company_name: acc.company_name,
      product: addProduct,
      opportunity_stage: addStage,
      priority: acc.priority || 'B',
      estimated_annual_litres_edit: addLitres,
      win_probability_pct_edit: addProb,
      sales_owner_edit: acc.account_owner_edit || ''
    });

    setToastMessage(`Added ${addProduct} opportunity for ${acc.company_name}`);
    setTimeout(() => setToastMessage(''), 3000);

    setShowAddModal(false);
    setAddAccountId('');
    setAddLitres('');
    setAddProb('');
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#007A3D] text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Scenario Modeling & Simulation Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-emerald-50/50 via-white to-blue-50/30 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#007A3D] text-white">
                <Flame className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Coolant Opportunity Pipeline & Volume Scenario Calculator
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Tailored thermal fluids pipeline across EG50 (cold plates) and Dielectric Immersion. You can change products, delete inapplicable cooling rows (e.g. for pure cold-plate OEMs like Gautam Solar / Tonfy), or add custom opportunities.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#007A3D] font-bold text-xs border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Opportunity Line</span>
            </button>
            <button
              onClick={() => setShowScenarioPanel(!showScenarioPanel)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>{showScenarioPanel ? 'Hide Scenarios' : 'Open Scenarios'}</span>
            </button>
            <button
              onClick={() => exportOpportunitiesToExcel(filteredOpportunities)}
              className="px-3.5 py-2 rounded-xl bg-[#007A3D] hover:bg-[#005f2f] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Pipeline</span>
            </button>
          </div>
        </div>

        {/* Management Scenario Controls */}
        {showScenarioPanel && (
          <div className="p-5 bg-slate-50/70 border-b border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#007A3D]" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Volume Forecasting Scenarios
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => applyScenarioPreset('base_case')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-[#007A3D] font-bold text-xs border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Base Commercial Case</span>
                  <span className="text-[10px] bg-white px-1.5 py-0.2 rounded text-emerald-800 font-semibold">Priority A</span>
                </button>
                <button
                  onClick={() => applyScenarioPreset('aggressive_growth')}
                  className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-[#005A9C] font-bold text-xs border border-blue-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Aggressive Growth</span>
                  <span className="text-[10px] bg-white px-1.5 py-0.2 rounded text-blue-800 font-semibold">Priority A+B</span>
                </button>
                <button
                  onClick={() => applyScenarioPreset('reset_blank')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-rose-500" />
                  <span>Reset to Blank State</span>
                </button>
              </div>
            </div>

            {/* Scenario Live Volume Totals Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white rounded-xl p-3.5 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Projected Volume</span>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  {totalLitres > 0 ? `${totalLitres.toLocaleString()} L` : '—'}
                </div>
                <div className="text-[10px] text-slate-400">Sum of unweighted annual litres</div>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-emerald-300 bg-emerald-50/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#007A3D]">Weighted Volume (Litres)</span>
                <div className="text-xl font-black text-[#007A3D] mt-0.5">
                  {totalWeightedLitres > 0 ? `${totalWeightedLitres.toLocaleString()} L` : '—'}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold">Litres × Win Probability %</div>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Volume Conversion Rate</span>
                <div className="text-xl font-black text-slate-800 mt-0.5">
                  {totalLitres > 0 ? `${Math.round((totalWeightedLitres / totalLitres) * 100)}%` : '—'}
                </div>
                <div className="text-[10px] text-slate-400">Weighted vs gross potential</div>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Opportunities</span>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  {filteredOpportunities.length}
                </div>
                <div className="text-[10px] text-slate-400">EG50 ({eg50Count}) • Immersion ({immersionCount})</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search opportunity by company name, application..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Product Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {['ALL', 'EG50', 'Dielectric immersion'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProduct(p)}
                  className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                    selectedProduct === p
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p === 'ALL' ? `All Products (${opportunities.length})` : `${p} (${p === 'EG50' ? eg50Count : immersionCount})`}
                </button>
              ))}
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Priorities</option>
              <option value="A">Priority A</option>
              <option value="B">Priority B</option>
              <option value="C">Priority C</option>
            </select>
          </div>
        </div>

        {/* Opportunity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">Pri</th>
                <th className="py-2.5 px-3">Company Name</th>
                <th className="py-2.5 px-3">Product (Click to Change)</th>
                <th className="py-2.5 px-3">Stage / Technical Fit</th>
                <th className="py-2.5 px-3 text-right">Est. Annual Volume (L)</th>
                <th className="py-2.5 px-3 text-right">Win Prob (%)</th>
                <th className="py-2.5 px-3 bg-emerald-50/70 text-[#007A3D] text-right font-black">Weighted Volume (L)</th>
                <th className="py-2.5 px-3">Sales Owner</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOpportunities.map((opp) => {
                return (
                  <tr
                    key={opp.opportunity_id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Priority */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded font-black text-[10px] ${
                        opp.priority === 'A' ? 'bg-emerald-100 text-[#007A3D]' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {opp.priority}
                      </span>
                    </td>

                    {/* Company */}
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => setSelectedAccountId(opp.account_id)}
                        className="font-bold text-slate-900 hover:text-[#007A3D] text-left hover:underline cursor-pointer"
                      >
                        {opp.company_name}
                      </button>
                      <div className="text-[10px] text-slate-400 font-medium truncate max-w-xs">
                        {opp.application || 'BESS / EV Storage'}
                      </div>
                    </td>

                    {/* Interactive Product Selector */}
                    <td className="py-2.5 px-3">
                      <select
                        value={opp.product}
                        onChange={(e) => {
                          const newProd = e.target.value;
                          updateOpportunity(opp.opportunity_id, { product: newProd });
                          setToastMessage(`Updated ${opp.company_name} to ${newProd}`);
                          setTimeout(() => setToastMessage(''), 2500);
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#007A3D] transition-all ${getProductColor(opp.product)}`}
                        title="Click to change product between EG50 and Dielectric Immersion"
                      >
                        <option value="EG50">EG50 (Cold Plate)</option>
                        <option value="Dielectric immersion">Dielectric immersion</option>
                      </select>
                    </td>

                    {/* Stage & Fit */}
                    <td className="py-2.5 px-3 max-w-[180px]">
                      <div className="font-semibold text-slate-800 truncate" title={opp.opportunity_stage}>
                        {opp.opportunity_stage}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate" title={opp.technical_fit_assessment}>
                        {opp.technical_fit_assessment}
                      </div>
                    </td>

                    {/* Est Litres (Volume Input) */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        value={opp.estimated_annual_litres_edit}
                        onChange={(e) => updateOpportunity(opp.opportunity_id, { estimated_annual_litres_edit: e.target.value })}
                        placeholder="0 L"
                        className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono text-[11px] focus:ring-1 focus:ring-[#007A3D] bg-white font-medium"
                      />
                    </td>

                    {/* Win Prob % (Input) */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={opp.win_probability_pct_edit}
                        onChange={(e) => updateOpportunity(opp.opportunity_id, { win_probability_pct_edit: e.target.value })}
                        placeholder="%"
                        className="w-16 px-1.5 py-1 rounded border border-slate-200 text-right font-mono text-[11px] focus:ring-1 focus:ring-[#007A3D] bg-white font-medium"
                      />
                    </td>

                    {/* Weighted Volume Formula (Calculated) */}
                    <td className="py-2.5 px-3 bg-emerald-50/40 font-mono font-black text-right text-[#007A3D] text-[11px]">
                      {opp.weighted_litres_formula ? `${Number(opp.weighted_litres_formula).toLocaleString()} L` : '—'}
                    </td>

                    {/* Sales Owner */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={opp.sales_owner_edit || ''}
                        onChange={(e) => updateOpportunity(opp.opportunity_id, { sales_owner_edit: e.target.value })}
                        placeholder="Owner..."
                        className="w-20 px-1.5 py-1 rounded border border-slate-200 text-[11px] bg-white"
                      />
                    </td>

                    {/* Actions: Delete & 360 */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete the ${opp.product} opportunity row for ${opp.company_name}? This will remove it from the pipeline.`)) {
                              deleteOpportunity(opp.opportunity_id);
                              setToastMessage(`Deleted ${opp.product} row for ${opp.company_name}`);
                              setTimeout(() => setToastMessage(''), 3000);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title={`Delete / Remove this inapplicable ${opp.product} opportunity`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedAccountId(opp.account_id)}
                          className="p-1.5 rounded-lg hover:bg-emerald-100 text-[#007A3D] transition-colors cursor-pointer"
                          title="View company 360°"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredOpportunities.length === 0 && (
            <div className="p-12 text-center text-slate-400 italic">
              No opportunities match the selected criteria.
            </div>
          )}
        </div>
      </div>

      {/* ADD OPPORTUNITY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-emerald-600 to-[#005A9C] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">Add Coolant Opportunity Line</h3>
                <p className="text-emerald-100 text-xs">Create a specific product opportunity for any company</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewOpportunity} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Select Company
                </label>
                <select
                  required
                  value={addAccountId}
                  onChange={(e) => setAddAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs"
                >
                  <option value="">-- Choose Company --</option>
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.company_name} (Priority {a.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Coolant Product
                </label>
                <select
                  value={addProduct}
                  onChange={(e) => setAddProduct(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs"
                >
                  <option value="EG50">EG50 (Ethylene Glycol 50% — Cold Plate Liquid Cooling)</option>
                  <option value="Dielectric immersion">Dielectric Immersion Fluid (Synthetic Ester / Natural Ester)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Opportunity Stage
                </label>
                <select
                  value={addStage}
                  onChange={(e) => setAddStage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="Technical specification needed">Technical specification needed</option>
                  <option value="R&D / compatibility qualification required">R&D / compatibility qualification required</option>
                  <option value="Testing / validation">Testing / validation</option>
                  <option value="Commercial supply">Commercial supply</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Est. Annual Volume (Litres)
                  </label>
                  <input
                    type="number"
                    value={addLitres}
                    onChange={(e) => setAddLitres(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Win Probability (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={addProb}
                    onChange={(e) => setAddProb(e.target.value)}
                    placeholder="e.g. 40"
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                  />
                </div>
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
                  disabled={!addAccountId}
                  className="px-5 py-2 rounded-xl bg-[#007A3D] hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Pipeline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
