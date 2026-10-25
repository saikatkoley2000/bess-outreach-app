import React, { useState, useMemo } from 'react';
import {
  ListTodo,
  Search,
  Filter,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  ArrowUpRight,
  Kanban,
  Table as TableIcon,
  ChevronRight,
  Building,
  Check,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportActionsToExcel } from '../utils/exportToExcel';

export default function SalesActionPlanner() {
  const {
    actions,
    updateAction,
    addNewAction,
    setSelectedAccountId,
    accounts
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  const [showAddModal, setShowAddModal] = useState(false);

  // New action form state
  const [newActionForm, setNewActionForm] = useState({
    account_id: '',
    company: '',
    urgency: '0-30 days',
    priority: 'A',
    action_type: 'Technical sample follow-up',
    action_description: '',
    owner_edit: 'Savita BD Team',
    due_date_edit: '',
    success_criterion: '',
    notes: ''
  });

  // Filtered actions
  const filteredActions = useMemo(() => {
    return actions.filter(act => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          (act.company && act.company.toLowerCase().includes(q)) ||
          (act.action_id && act.action_id.toLowerCase().includes(q)) ||
          (act.action_description && act.action_description.toLowerCase().includes(q)) ||
          (act.owner_edit && act.owner_edit.toLowerCase().includes(q)) ||
          (act.action_type && act.action_type.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (selectedUrgency !== 'ALL' && act.urgency !== selectedUrgency) {
        return false;
      }

      if (selectedPriority !== 'ALL' && act.priority !== selectedPriority) {
        return false;
      }

      if (selectedStatus !== 'ALL') {
        const currentStatus = act.status_edit || 'Not started';
        if (currentStatus !== selectedStatus) return false;
      }

      return true;
    });
  }, [actions, searchTerm, selectedUrgency, selectedPriority, selectedStatus]);

  // Counts
  const completedCount = actions.filter(a => a.status_edit === 'Completed').length;
  const inProgressCount = actions.filter(a => a.status_edit === 'In progress').length;
  const notStartedCount = actions.filter(a => !a.status_edit || a.status_edit === 'Not started').length;
  const urgentCount = actions.filter(a => a.urgency === '0-30 days').length;

  const handleCreateAction = (e) => {
    e.preventDefault();
    if (!newActionForm.action_description) return;
    addNewAction(newActionForm);
    setShowAddModal(false);
    setNewActionForm({
      account_id: '',
      company: '',
      urgency: '0-30 days',
      priority: 'A',
      action_type: 'Technical sample follow-up',
      action_description: '',
      owner_edit: 'Savita BD Team',
      due_date_edit: '',
      success_criterion: '',
      notes: ''
    });
  };

  const getUrgencyBadge = (u) => {
    switch (u) {
      case '0-30 days':
        return <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800">0-30 days</span>;
      case '31-60 days':
        return <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">31-60 days</span>;
      case '61-90 days':
        return <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-[#005A9C]">61-90 days</span>;
      default:
        return <span className="text-xs text-slate-500">{u}</span>;
    }
  };

  const STATUS_OPTIONS = ['Not started', 'In progress', 'Completed', 'Deferred'];

  return (
    <div className="space-y-5">
      {/* KPI & Summary Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#007A3D] text-white">
              <ListTodo className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Sales Execution Action Planner
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritized 30/60/90-day BD roadmap across {actions.length} actionable sales and technical qualification tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kanban view"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#007A3D] hover:bg-[#005f2f] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          <button
            onClick={() => exportActionsToExcel(filteredActions)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Action Items</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{actions.length}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Urgent (0-30 Days)</span>
          <div className="text-xl font-black text-rose-700 mt-0.5">{urgentCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#005A9C]">In Progress</span>
          <div className="text-xl font-black text-[#005A9C] mt-0.5">{inProgressCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#007A3D]">Completed Tasks</span>
          <div className="text-xl font-black text-[#007A3D] mt-0.5">{completedCount}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action description, company, owner..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#007A3D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Urgency */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Horizons</option>
            <option value="0-30 days">0-30 Days</option>
            <option value="31-60 days">31-60 Days</option>
            <option value="61-90 days">61-90 Days</option>
          </select>

          {/* Priority */}
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

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Not started">Not started</option>
            <option value="In progress">In progress</option>
            <option value="Completed">Completed</option>
            <option value="Deferred">Deferred</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE: Table */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">Pri</th>
                  <th className="py-2.5 px-3">Company Name</th>
                  <th className="py-2.5 px-3">Urgency</th>
                  <th className="py-2.5 px-3">Action Description</th>
                  <th className="py-2.5 px-3">Success Criterion</th>
                  <th className="py-2.5 px-3">Status (Edit)</th>
                  <th className="py-2.5 px-3">Owner (Edit)</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">360°</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredActions.map((act) => {
                  const currentStatus = act.status_edit || 'Not started';
                  return (
                    <tr key={act.action_id} className="hover:bg-slate-50 transition-colors">
                      {/* Priority */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-black text-[10px] ${
                          act.priority === 'A' ? 'bg-emerald-100 text-[#007A3D]' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {act.priority}
                        </span>
                      </td>

                      {/* Company & ID */}
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setSelectedAccountId(act.account_id)}
                          className="font-bold text-slate-900 hover:text-[#007A3D] text-left hover:underline cursor-pointer"
                        >
                          {act.company}
                        </button>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {act.relationship_stage || 'BD Engagement'}
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="py-2.5 px-3">
                        {getUrgencyBadge(act.urgency)}
                      </td>

                      {/* Description */}
                      <td className="py-2.5 px-3 max-w-sm">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {act.action_description}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Type: {act.action_type}
                        </div>
                      </td>

                      {/* Success Criterion */}
                      <td className="py-2.5 px-3 max-w-xs text-slate-600 text-[11px] leading-normal font-medium">
                        {act.success_criterion}
                      </td>

                      {/* Editable Status */}
                      <td className="py-2.5 px-3">
                        <select
                          value={currentStatus}
                          onChange={(e) => updateAction(act.action_id, { status_edit: e.target.value })}
                          className={`p-1 rounded text-[11px] font-bold border focus:outline-none ${
                            currentStatus === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : currentStatus === 'In progress'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : currentStatus === 'Deferred'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>

                      {/* Editable Owner */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={act.owner_edit || ''}
                          onChange={(e) => updateAction(act.action_id, { owner_edit: e.target.value })}
                          placeholder="Assignee..."
                          className="w-24 px-1.5 py-1 rounded border border-slate-200 text-[11px] bg-white"
                        />
                      </td>

                      {/* Editable Due Date */}
                      <td className="py-2.5 px-3">
                        <input
                          type="date"
                          value={act.due_date_edit || ''}
                          onChange={(e) => updateAction(act.action_id, { due_date_edit: e.target.value })}
                          className="w-24 px-1 py-1 rounded border border-slate-200 text-[10px] bg-white text-slate-700"
                        />
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedAccountId(act.account_id)}
                          className="p-1 rounded hover:bg-emerald-100 text-[#007A3D] cursor-pointer"
                          title="Open 360°"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE: Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STATUS_OPTIONS.map((status) => {
            const statusTasks = filteredActions.filter(a => (a.status_edit || 'Not started') === status);
            return (
              <div key={status} className="bg-slate-100/70 rounded-2xl p-4 flex flex-col h-[700px] border border-slate-200">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      status === 'Completed' ? 'bg-[#007A3D]' : status === 'In progress' ? 'bg-[#005A9C]' : status === 'Deferred' ? 'bg-amber-500' : 'bg-slate-400'
                    }`}></span>
                    <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">{status}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-slate-600 font-bold text-xs shadow-xs border border-slate-200">
                    {statusTasks.length}
                  </span>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {statusTasks.map((act) => (
                    <div
                      key={act.action_id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-[#007A3D] hover:shadow-md transition-all text-xs space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          act.priority === 'A' ? 'bg-emerald-100 text-[#007A3D]' : 'bg-slate-100 text-slate-600'
                        }`}>
                          Pri {act.priority}
                        </span>
                        {getUrgencyBadge(act.urgency)}
                      </div>

                      <div>
                        <button
                          onClick={() => setSelectedAccountId(act.account_id)}
                          className="font-bold text-slate-900 group-hover:text-[#007A3D] text-left hover:underline block leading-tight cursor-pointer"
                        >
                          {act.company}
                        </button>
                        <p className="text-slate-600 text-[11px] mt-1 leading-snug line-clamp-3">
                          {act.action_description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate max-w-[120px] font-medium text-slate-700">
                          {act.owner_edit || 'Unassigned'}
                        </span>

                        <select
                          value={act.status_edit || 'Not started'}
                          onChange={(e) => updateAction(act.action_id, { status_edit: e.target.value })}
                          className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded px-1 py-0.5"
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}

                  {statusTasks.length === 0 && (
                    <div className="p-8 text-center text-slate-400 italic text-xs">
                      No tasks in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add New Task */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#007A3D] p-5 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Sales Action Task
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAction} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">Company</label>
                <input
                  type="text"
                  value={newActionForm.company}
                  onChange={(e) => setNewActionForm({ ...newActionForm, company: e.target.value })}
                  placeholder="Company name..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-[#007A3D]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">Urgency Horizon</label>
                  <select
                    value={newActionForm.urgency}
                    onChange={(e) => setNewActionForm({ ...newActionForm, urgency: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  >
                    <option value="0-30 days">0-30 days</option>
                    <option value="31-60 days">31-60 days</option>
                    <option value="61-90 days">61-90 days</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">Priority</label>
                  <select
                    value={newActionForm.priority}
                    onChange={(e) => setNewActionForm({ ...newActionForm, priority: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  >
                    <option value="A">Priority A</option>
                    <option value="B">Priority B</option>
                    <option value="C">Priority C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">Action Description</label>
                <textarea
                  value={newActionForm.action_description}
                  onChange={(e) => setNewActionForm({ ...newActionForm, action_description: e.target.value })}
                  placeholder="Specific follow-up, coolant specification audit, pilot pitch..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-[#007A3D]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">Success Criterion</label>
                <input
                  type="text"
                  value={newActionForm.success_criterion}
                  onChange={(e) => setNewActionForm({ ...newActionForm, success_criterion: e.target.value })}
                  placeholder="e.g. Approved BOM inclusion, test report delivery..."
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newActionForm.owner_edit}
                    onChange={(e) => setNewActionForm({ ...newActionForm, owner_edit: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newActionForm.due_date_edit}
                    onChange={(e) => setNewActionForm({ ...newActionForm, due_date_edit: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#007A3D] text-white font-bold hover:bg-[#005f2f]"
                >
                  Create Action Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
