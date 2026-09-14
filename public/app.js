// app.js — QuantiCool BESS Outreach Tracker & Commercial Intelligence
// High-Density Industrial Telemetry Workbench

let META = {
  dataFile: '',
  statusOptions: [],
  priorityOptions: [],
  coolingOptions: [],
  fields: [],
};

let companies = [];
let expandedId = null;
let sortKey = 'priority';
let sortDir = 1;
let selectedIds = new Set();
let activeTab = 'tab-companies';
let exportScope = 'filtered'; // 'filtered' or 'all'

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

const el = (id) => document.getElementById(id);

// ---------------------------------------------------------------------
// API Wrapper & Toast
// ---------------------------------------------------------------------

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

function showToast(message, isError = false) {
  const t = el('toast');
  const msgEl = el('toastMessage');
  const iconEl = el('toastIcon');
  if (!t) return;
  msgEl.textContent = message;
  iconEl.textContent = isError ? 'warning' : 'check_circle';
  t.className = `fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold text-white flex items-center gap-2 transition-all ${
    isError ? 'bg-error border border-error-container' : 'bg-primary border border-secondary'
  }`;
  t.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    t.classList.add('hidden');
  }, 3500);
}

function escapeHtml(str) {
  return (str ?? '')
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return dateStr;
  const now = new Date();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return `<span class="text-amber-700 font-semibold">Today (${dateStr})</span>`;
  if (diffDays === 1) return `<span class="text-secondary font-semibold">Tomorrow (${dateStr})</span>`;
  if (diffDays > 1 && diffDays <= 5) return `<span class="text-secondary font-semibold">In ${diffDays} days (${dateStr})</span>`;
  if (diffDays < 0) return `<span class="text-error font-semibold">Overdue by ${Math.abs(diffDays)}d (${dateStr})</span>`;
  return `<span class="text-on-surface-variant">${dateStr}</span>`;
}

function cleanPhoneForWhatsApp(phoneStr) {
  if (!phoneStr) return '';
  // match first valid sequence of numbers
  const digits = phoneStr.replace(/\D/g, '');
  if (digits.length >= 10) {
    if (digits.length === 10) return '91' + digits; // default to India code if 10 digits
    return digits;
  }
  return '';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_OPTIONS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

function parseStartTime(val) {
  if (!val) return { month: 'Oct', year: '2025', isAlreadyActive: false };
  const s = String(val).trim();
  if (s.toLowerCase().includes('active') || s.toLowerCase().includes('immediate')) {
    return { month: 'Already Active', year: '2025', isAlreadyActive: true };
  }
  // Check ISO format like "2026-12" or "2025-08"
  const mIso = /^(\d{4})-(\d{1,2})/.exec(s);
  if (mIso) {
    const y = mIso[1];
    const mIdx = Math.max(0, Math.min(11, parseInt(mIso[2], 10) - 1));
    return { month: MONTH_NAMES[mIdx] || 'Jan', year: y, isAlreadyActive: false };
  }
  // Check text format like "Dec 2026" or "DEC'26" or "Dec 26" or "DEC-26"
  const mText = /([a-zA-Z]{3,})[ '\-_/]*(\d{2,4})/.exec(s);
  if (mText) {
    const mName = mText[1].slice(0, 3).toLowerCase();
    const matchedMonth = MONTH_NAMES.find((m) => m.toLowerCase() === mName) || 'Jan';
    let y = mText[2];
    if (y.length === 2) y = '20' + y;
    return { month: matchedMonth, year: y, isAlreadyActive: false };
  }
  return { month: 'Oct', year: '2025', isAlreadyActive: false };
}

function formatStartTime(month, year) {
  if (!month || month === 'Already Active') return 'Already Active';
  const cleanYear = year || '2025';
  return `${month} ${cleanYear}`;
}

function formatDisplayStartTime(val) {
  const p = parseStartTime(val);
  if (p.isAlreadyActive) return 'Already Active';
  return `${p.month} ${p.year}`;
}

function getCompanyContacts(c) {
  if (!c) return [];
  if (Array.isArray(c.contacts) && c.contacts.length > 0) {
    return c.contacts;
  }
  if (typeof c.contacts === 'string' && c.contacts.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(c.contacts);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  const rawPersons = String(c.contactPerson || '').trim();
  const rawMobiles = String(c.mobile || '').trim();
  if (rawPersons || rawMobiles) {
    const persons = rawPersons.split(';').map((s) => s.trim()).filter(Boolean);
    const mobiles = rawMobiles.split(';').map((s) => s.trim()).filter(Boolean);

    if (persons.length > 1) {
      return persons.map((p, i) => {
        let name = p;
        let designation = '';
        if (p.includes('—')) {
          const parts = p.split('—');
          name = parts[0].trim();
          designation = parts.slice(1).join('—').trim();
        } else if (p.includes('-')) {
          const parts = p.split('-');
          name = parts[0].trim();
          designation = parts.slice(1).join('-').trim();
        } else if (p.includes('(') && p.includes(')')) {
          const m = /^(.*?)\s*\((.*?)\)$/.exec(p);
          if (m) {
            name = m[1].trim();
            designation = m[2].trim();
          }
        }
        return {
          name,
          designation,
          mobile: mobiles[i] || '',
          isPrimary: i === 0,
        };
      });
    }

    let name = rawPersons;
    let designation = c.categoryOrRole || '';
    if (rawPersons.includes('—')) {
      const parts = rawPersons.split('—');
      name = parts[0].trim();
      designation = parts.slice(1).join('—').trim();
    } else if (rawPersons.includes('-')) {
      const parts = rawPersons.split('-');
      name = parts[0].trim();
      designation = parts.slice(1).join('-').trim();
    } else if (rawPersons.includes('(') && rawPersons.includes(')')) {
      const m = /^(.*?)\s*\((.*?)\)$/.exec(rawPersons);
      if (m) {
        name = m[1].trim();
        designation = m[2].trim();
      }
    }
    return [
      {
        name,
        designation,
        mobile: rawMobiles,
        isPrimary: true,
      },
    ];
  }
  return [];
}

// ---------------------------------------------------------------------
// Initialization & Meta Loading
// ---------------------------------------------------------------------

async function init() {
  try {
    await loadMeta();
    await loadCompanies();
    setupEventListeners();
    setupActionCommandCenter();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function loadMeta() {
  META = await api('/api/meta');
  
  // Header badge
  const shortName = META.dataFile.split(/[\\/]/).pop() || 'BESS_Company_Contacts_Updated1.xlsx';
  el('syncStatusBadge').textContent = `Live Connected • ${shortName}`;
  el('syncStatusBadge').parentElement.title = `Reading/writing from: ${META.dataFile}`;

  // Fill Drawer select fields
  fillSelect(el('field_status'), META.statusOptions);
  fillSelect(el('field_priority'), META.priorityOptions);
  fillSelect(el('field_liquidCooling'), META.coolingOptions);
  fillSelect(el('field_productionStage'), META.productionStageOptions);

  // Fill Filter select fields
  fillFilterSelect(el('statusFilter'), META.statusOptions, 'Status: All Statuses');
  fillFilterSelect(el('priorityFilter'), META.priorityOptions, 'Priority: All');
  fillFilterSelect(el('coolingFilter'), META.coolingOptions, 'Cooling: All Types');
  fillFilterSelect(el('monthlyStageFilter'), META.productionStageOptions, 'All Production Stages');
}

function fillSelect(select, options) {
  if (!select) return;
  select.innerHTML = options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
}

function fillFilterSelect(select, options, defaultLabel) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${defaultLabel}</option>` +
    options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
  if (options.includes(current)) select.value = current;
}

async function loadCompanies() {
  companies = await api('/api/companies');
  
  // Update distinct type options in filter
  const distinctTypes = [...new Set(companies.map((c) => c.type).filter(Boolean))].sort();
  fillFilterSelect(el('typeFilter'), distinctTypes, 'Type: All Types');

  el('hardwareScopeCount').textContent = `${companies.length} BESS Accounts Monitored`;

  renderAllViews();
}

function renderAllViews() {
  renderStats();
  renderThermalMixGauge();
  renderActiveScopeTags();
  renderTable();
  if (activeTab === 'tab-agenda') renderActionAgendaTab();
  if (activeTab === 'tab-export-mfrs') renderExportManufacturers();
  if (activeTab === 'tab-kanban') renderKanban();
  if (activeTab === 'tab-monthly-demand') renderMonthlyDemand();
  if (activeTab === 'tab-analytics') renderAnalytics();
  if (activeTab === 'tab-reports') renderReports();

  // Always keep Agenda navigation badges updated
  const { overdueAndToday, upcoming, urgentUnscheduled, totalActive } = categorizeNextActions();
  const agendaCount = overdueAndToday.length > 0 ? overdueAndToday.length : totalActive;
  if (el('agendaBadgeCount')) el('agendaBadgeCount').textContent = agendaCount;
  if (el('tabAgendaNavBadge')) el('tabAgendaNavBadge').textContent = agendaCount;

  const exportCount = companies.filter((c) => c.type === 'Export Manufacturer').length;
  if (el('exportMfrNavBadge')) el('exportMfrNavBadge').textContent = exportCount;
  if (el('exportTotalCount')) el('exportTotalCount').textContent = exportCount;
}

// ---------------------------------------------------------------------
// Telemetry & KPI Ribbon
// ---------------------------------------------------------------------

function renderStats() {
  const total = companies.length;
  const highUncontacted = companies.filter((c) => c.priority === 'High' && c.status === 'Not Contacted');
  const activePipeline = companies.filter((c) => !['Not Contacted', 'Won', 'Lost', 'On Hold'].includes(c.status));
  const won = companies.filter((c) => c.status === 'Won');

  // Breakdown by type
  const operational = companies.filter((c) => c.type === 'New Mfr - Operational').length;
  const planned = companies.filter((c) => c.type === 'New Mfr - Announced/Planned').length;
  const exportMfr = companies.filter((c) => c.type === 'Export Manufacturer').length;
  const dev = companies.filter((c) => c.type === 'Project Developer').length;
  const existing = companies.filter((c) => c.type === 'Existing Contact').length;

  el('statTotalCount').textContent = total;
  el('statTypeBreakdown').innerHTML = `
    <span class="font-semibold text-on-surface">${operational}</span> Mfrs Ops •
    <span class="font-semibold text-on-surface">${planned}</span> Planned •
    <span class="font-semibold text-sky-700">${exportMfr}</span> Export •
    <span class="font-semibold text-on-surface">${dev}</span> Devs •
    <span class="font-semibold text-on-surface">${existing}</span> Contacts
  `;

  el('statHighOpenCount').textContent = highUncontacted.length;
  const immersionHigh = highUncontacted.filter((c) => c.liquidCooling && c.liquidCooling.toLowerCase().includes('immersion')).length;
  el('statHighOpenSub').innerHTML = `
    <span class="font-semibold text-error">${immersionHigh > 0 ? immersionHigh : highUncontacted.length}</span> Urgent Outreach Targets
  `;

  el('statActiveCount').textContent = activePipeline.length;
  const activePercent = total > 0 ? ((activePipeline.length / total) * 100).toFixed(1) : 0;
  el('statActiveRatio').textContent = `${activePercent}% in motion`;
  const trials = companies.filter((c) => c.status === 'Sample / Trial Sent').length;
  const evals = companies.filter((c) => c.status === 'Technical Evaluation').length;
  const comm = companies.filter((c) => c.status === 'Commercial Discussion').length;
  el('statActiveSub').innerHTML = `
    <span class="font-semibold text-on-surface">${trials}</span> Trials •
    <span class="font-semibold text-on-surface">${evals}</span> Eval •
    <span class="font-semibold text-on-surface">${comm}</span> Comm
  `;

  el('statWonCount').textContent = won.length;
  const convRate = total > 0 ? ((won.length / total) * 100).toFixed(1) : 0;
  el('statWonConversion').textContent = `${convRate}% Conversion`;
  el('statFluidDemand').textContent = won.length > 0 ? `${(won.length * 22000).toLocaleString()} L/yr Est.` : 'QuantiCool-Immersion';

  // Monthly Coolant Requirement Telemetry
  const totalMonthlyLiters = companies.reduce((sum, c) => sum + (Number(c.monthlyCoolantLiters) || 0), 0);
  const dlcMonthlyLiters = companies
    .filter((c) => {
      const l = (c.liquidCooling || '').toLowerCase();
      return l.includes('cold') || l.includes('dlc');
    })
    .reduce((sum, c) => sum + (Number(c.monthlyCoolantLiters) || 0), 0);
  const immersionMonthlyLiters = Math.max(0, totalMonthlyLiters - dlcMonthlyLiters);
  const annualizedLiters = totalMonthlyLiters * 12;
  const totalMonthlyTons = Math.round((totalMonthlyLiters * 0.9) / 1000);

  const dashMonthly = el('dashboardMonthlyLiters');
  if (dashMonthly) {
    dashMonthly.textContent = `${totalMonthlyLiters.toLocaleString()} Liters / month`;
    el('dashboardMonthlyTons').textContent = `(~${totalMonthlyTons.toLocaleString()} MT/mo)`;
    el('dashboardMonthlyBreakdown').textContent = `QuantiCool-Immersion: ${immersionMonthlyLiters.toLocaleString()} L • QuantiCool-DLC: ${dlcMonthlyLiters.toLocaleString()} L • Annualized Run-Rate: ${annualizedLiters.toLocaleString()} L/yr`;
  }
}

function renderThermalMixGauge() {
  const filtered = getFilteredCompanies();
  const count = filtered.length || 1;

  let immersion = 0;
  let coldPlate = 0;
  let liquidUnspec = 0;
  let airOther = 0;

  filtered.forEach((c) => {
    const l = (c.liquidCooling || '').toLowerCase();
    if (l.includes('immersion')) immersion++;
    else if (l.includes('cold') || l.includes('dlc')) coldPlate++;
    else if (l.includes('liquid') || l.includes('unspecified')) liquidUnspec++;
    else airOther++;
  });

  const pImm = Math.round((immersion / count) * 100);
  const pCold = Math.round((coldPlate / count) * 100);
  const pUnspec = Math.round((liquidUnspec / count) * 100);
  const pAir = Math.max(0, 100 - (pImm + pCold + pUnspec));

  el('pctImmersion').textContent = `${pImm}%`;
  el('pctColdPlate').textContent = `${pCold}%`;
  el('pctLiquidUnspec').textContent = `${pUnspec}%`;
  el('pctAir').textContent = `${pAir}%`;

  el('barImmersion').style.width = `${pImm}%`;
  el('barColdPlate').style.width = `${pCold}%`;
  el('barLiquidUnspec').style.width = `${pUnspec}%`;
  el('barAir').style.width = `${pAir}%`;
}

// ---------------------------------------------------------------------
// Filter & Sort Logic
// ---------------------------------------------------------------------

let quickFilterImmersion = false;
let quickFilterExportMfr = false;

function getFilteredCompanies() {
  const q = el('searchInput').value.trim().toLowerCase();
  const type = el('typeFilter').value;
  const status = el('statusFilter').value;
  const priority = el('priorityFilter').value;
  const cooling = el('coolingFilter').value;

  return companies.filter((c) => {
    if (type && c.type !== type) return false;
    if (status && c.status !== status) return false;
    if (priority && c.priority !== priority) return false;
    if (cooling && c.liquidCooling !== cooling) return false;
    if (quickFilterImmersion) {
      const cl = (c.liquidCooling || '').toLowerCase();
      if (!cl.includes('immersion') && !cl.includes('liquid')) return false;
    }
    if (quickFilterExportMfr && c.type !== 'Export Manufacturer') {
      return false;
    }
    if (q) {
      const hay = [
        c.company,
        c.type,
        c.location,
        c.contactPerson,
        c.mobile,
        c.capacityOrScale,
        c.categoryOrRole,
        c.liquidCooling,
        c.notes,
        c.source,
        c.nextAction,
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function sortCompanies(list) {
  return list.slice().sort((a, b) => {
    let av = a[sortKey];
    let bv = b[sortKey];
    if (sortKey === 'priority') {
      av = PRIORITY_RANK[av] ?? 9;
      bv = PRIORITY_RANK[bv] ?? 9;
    } else {
      av = (av || '').toString().toLowerCase();
      bv = (bv || '').toString().toLowerCase();
    }
    if (av < bv) return -1 * sortDir;
    if (av > bv) return 1 * sortDir;
    return 0;
  });
}

function renderActiveScopeTags() {
  const container = el('activeScopeTags');
  if (!container) return;
  const tags = [];

  const type = el('typeFilter').value;
  const status = el('statusFilter').value;
  const priority = el('priorityFilter').value;
  const cooling = el('coolingFilter').value;

  if (quickFilterImmersion) {
    tags.push({ label: 'Immersion & Liquid Targets', clear: () => { quickFilterImmersion = false; renderAllViews(); } });
  }
  if (quickFilterExportMfr) {
    tags.push({ label: 'Export Mfrs (Non-India Base)', clear: () => { quickFilterExportMfr = false; renderAllViews(); } });
  }
  if (type) {
    tags.push({ label: `Type: ${type}`, clear: () => { el('typeFilter').value = ''; renderAllViews(); } });
  }
  if (status) {
    tags.push({ label: `Status: ${status}`, clear: () => { el('statusFilter').value = ''; renderAllViews(); } });
  }
  if (priority) {
    tags.push({ label: `Priority: ${priority}`, clear: () => { el('priorityFilter').value = ''; renderAllViews(); } });
  }
  if (cooling) {
    tags.push({ label: `Cooling: ${cooling}`, clear: () => { el('coolingFilter').value = ''; renderAllViews(); } });
  }

  if (tags.length === 0) {
    container.innerHTML = `<span class="text-outline italic text-[11px]">All data scopes active</span>`;
    return;
  }

  container.innerHTML = tags.map((t, idx) => `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px] font-medium border border-outline-variant/40">
      ${escapeHtml(t.label)}
      <button type="button" data-tag-idx="${idx}" class="hover:text-error ml-0.5"><span class="material-symbols-outlined text-[13px] leading-none">close</span></button>
    </span>
  `).join('');

  container.querySelectorAll('button[data-tag-idx]').forEach((btn) => {
    const idx = parseInt(btn.dataset.tagIdx, 10);
    btn.addEventListener('click', () => tags[idx].clear());
  });
}

// ---------------------------------------------------------------------
// Dense Industrial Data Table
// ---------------------------------------------------------------------

function renderTable() {
  const filtered = getFilteredCompanies();
  const sorted = sortCompanies(filtered);

  el('resultCount').textContent = `Showing ${sorted.length} of ${companies.length} accounts`;
  el('emptyState').classList.toggle('hidden', sorted.length > 0);

  // Update export modal scope text
  el('exportScopeText').textContent = `Scope: ${filtered.length} Filtered Companies`;

  const tbody = el('tableBody');
  tbody.innerHTML = sorted.map((c) => createTableRow(c)).join('');

  // Update Sort Icons
  document.querySelectorAll('.sort-icon').forEach((icon) => {
    icon.textContent = 'unfold_more';
    icon.classList.remove('text-secondary', 'font-bold');
  });
  const activeSortIcon = el(`sortIcon_${sortKey}`);
  if (activeSortIcon) {
    activeSortIcon.textContent = sortDir === 1 ? 'arrow_upward' : 'arrow_downward';
    activeSortIcon.classList.add('text-secondary', 'font-bold');
  }

  // Bind row events
  bindTableEvents(tbody);
  updateBulkActionBar();
}

function coolingBadgeHtml(val) {
  const v = (val || 'Unknown').trim();
  const low = v.toLowerCase();
  if (low.includes('immersion')) {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-immersion"><span class="w-1.5 h-1.5 rounded-full bg-[#0E7C82]"></span>Immersion Cooled</span>`;
  }
  if (low.includes('cold') || low.includes('dlc')) {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-coldplate"><span class="w-1.5 h-1.5 rounded-full bg-[#2B4A8E]"></span>DLC / Cold Plate</span>`;
  }
  if (low.includes('liquid') || low.includes('unspecified')) {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-liquid-unspec"><span class="w-1.5 h-1.5 rounded-full bg-[#B45309]"></span>Liquid (Unspecified)</span>`;
  }
  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium badge-air">${escapeHtml(v)}</span>`;
}

function priorityBadgeHtml(p) {
  if (p === 'High') {
    return `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-bold uppercase"><span class="material-symbols-outlined text-[12px]">bolt</span>HIGH</span>`;
  }
  if (p === 'Low') {
    return `<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-[10px] font-semibold uppercase">LOW</span>`;
  }
  return `<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">MED</span>`;
}

function inlinePrioritySelectHtml(c) {
  const p = c.priority || 'Medium';
  const colorClass =
    p === 'High'
      ? 'bg-red-50 text-red-700 border-red-200 font-bold'
      : p === 'Low'
      ? 'bg-slate-100 text-slate-600 border-slate-200 font-semibold'
      : 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
  return `
    <select class="inline-priority-select h-7 px-1.5 rounded text-[10px] border cursor-pointer focus:ring-1 focus:ring-secondary ${colorClass}" data-id="${c.id}" title="Change priority (auto-saves to Excel)">
      <option value="High" ${p === 'High' ? 'selected' : ''}>⚡ HIGH</option>
      <option value="Medium" ${p === 'Medium' ? 'selected' : ''}>MED</option>
      <option value="Low" ${p === 'Low' ? 'selected' : ''}>LOW</option>
    </select>
  `;
}

function createTableRow(c) {
  const isExpanded = expandedId === c.id;
  const isChecked = selectedIds.has(c.id);
  const initial = (c.company || 'C').trim().charAt(0).toUpperCase();

  const statusOptionsHtml = META.statusOptions
    .map((s) => `<option value="${escapeHtml(s)}" ${s === c.status ? 'selected' : ''}>${escapeHtml(s)}</option>`)
    .join('');

  const mainRow = `
    <tr class="data-table-row border-b border-outline-variant/30 cursor-pointer transition-colors ${isChecked ? 'selected' : ''}" data-id="${c.id}">
      <td class="pl-3 py-2 text-center" onclick="event.stopPropagation()">
        <input type="checkbox" class="row-checkbox w-3.5 h-3.5 rounded bg-surface-container text-secondary focus:ring-0 cursor-pointer align-middle" data-id="${c.id}" ${isChecked ? 'checked' : ''} />
      </td>
      <td class="py-2 px-1 text-center text-outline">
        <span class="material-symbols-outlined text-[16px] transition-transform duration-200 ${isExpanded ? 'rotate-90 text-secondary' : ''}">chevron_right</span>
      </td>
      <td class="py-2 px-3">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-primary-container text-secondary-fixed flex items-center justify-center font-bold text-[11px] shrink-0">
            ${initial}
          </div>
          <div class="flex flex-col">
            <span class="font-semibold text-on-surface flex items-center gap-1.5">
              ${escapeHtml(c.company)}
              ${c.categoryOrRole ? `<span class="px-1 py-0.2 rounded bg-surface-container text-on-surface-variant text-[10px] font-medium truncate max-w-[140px]">${escapeHtml(c.categoryOrRole)}</span>` : ''}
            </span>
            <span class="text-[11px] text-on-surface-variant truncate max-w-[280px]" title="${escapeHtml(c.capacityOrScale || '')}">${escapeHtml(c.capacityOrScale || c.notes || '—')}</span>
          </div>
        </div>
      </td>
      <td class="py-2 px-3 whitespace-nowrap text-[11px] text-on-surface-variant font-medium">
        ${c.type === 'Export Manufacturer'
          ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300 inline-flex items-center gap-1 shadow-sm"><span class="material-symbols-outlined text-[12px] text-sky-600">travel_explore</span> Export Mfr</span>`
          : escapeHtml(c.type)}
      </td>
      <td class="py-2 px-3 whitespace-nowrap text-[11px] text-on-surface-variant">
        <div class="flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px] text-outline">location_on</span>
          <span class="truncate max-w-[160px]" title="${escapeHtml(c.location)}">${escapeHtml(c.location || '—')}</span>
        </div>
      </td>
      <td class="py-2 px-3 whitespace-nowrap">
        ${coolingBadgeHtml(c.liquidCooling)}
      </td>
      <td class="py-2 px-3 whitespace-nowrap" onclick="event.stopPropagation()">
        ${(() => {
          const contacts = getCompanyContacts(c);
          if (contacts.length === 0) {
            return `
              <button type="button" class="quick-contact-btn px-2 py-0.5 rounded border border-dashed border-outline-variant/60 hover:border-secondary hover:bg-secondary-container/20 text-secondary text-[10px] font-medium flex items-center gap-1 transition-colors" data-id="${c.id}" title="Add Contact Details">
                <span class="material-symbols-outlined text-[12px]">person_add</span>
                <span>+ Contact</span>
              </button>
            `;
          }
          const primary = contacts.find((ct) => ct.isPrimary) || contacts[0];
          const moreCount = contacts.length - 1;
          const othersTooltip = contacts.slice(1).map((ct) => ct.designation ? `${ct.name} (${ct.designation})` : ct.name).join(', ');
          return `
            <div class="flex items-center gap-1.5 group">
              <div class="flex flex-col">
                <div class="flex items-center gap-1">
                  <span class="font-semibold text-[11px] text-on-surface">
                    ${escapeHtml(primary.name || 'Unnamed Contact')}
                  </span>
                  ${
                    moreCount > 0
                      ? `
                    <span class="quick-contact-btn px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 hover:bg-cyan-200 text-[9px] font-bold cursor-pointer transition-colors" data-id="${c.id}" title="Additional contacts: ${escapeHtml(othersTooltip)}">
                      +${moreCount} more
                    </span>
                    `
                      : ''
                  }
                </div>
                <div class="flex items-center gap-1 text-[10px] text-on-surface-variant">
                  ${primary.designation ? `<span class="truncate max-w-[130px]">${escapeHtml(primary.designation)}</span>` : ''}
                  ${primary.mobile ? `<span class="flex items-center gap-0.5"><span class="material-symbols-outlined text-[10px] text-outline">call</span>${escapeHtml(primary.mobile)}</span>` : ''}
                </div>
              </div>
              <button type="button" class="quick-contact-btn p-1 rounded hover:bg-surface-container-high text-secondary transition-colors opacity-70 group-hover:opacity-100" data-id="${c.id}" title="Manage All Contacts">
                <span class="material-symbols-outlined text-[14px]">edit</span>
              </button>
            </div>
          `;
        })()}
      </td>
      <td class="py-2 px-2 text-center whitespace-nowrap" onclick="event.stopPropagation()">
        ${inlinePrioritySelectHtml(c)}
      </td>
      <td class="py-2 px-3 whitespace-nowrap" onclick="event.stopPropagation()">
        <select class="inline-status-select h-7 px-1.5 rounded bg-surface-container text-on-surface text-[11px] font-medium border border-outline-variant/40 focus:ring-1 focus:ring-secondary cursor-pointer" data-id="${c.id}">
          ${statusOptionsHtml}
        </select>
      </td>
      <td class="py-2 px-3 max-w-[240px]">
        <div class="flex flex-col">
          <span class="text-[11px]">${formatRelativeDate(c.nextActionDate)}</span>
          <span class="text-[11px] text-on-surface-variant truncate" title="${escapeHtml(c.nextAction || '')}">${escapeHtml(c.nextAction || '—')}</span>
        </div>
      </td>
      <td class="py-2 px-3 text-right pr-3 whitespace-nowrap" onclick="event.stopPropagation()">
        <div class="flex items-center justify-end gap-1">
          <button type="button" class="row-edit-btn w-7 h-7 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center" data-id="${c.id}" title="Edit Company Details">
            <span class="material-symbols-outlined text-[16px]">edit_note</span>
          </button>
        </div>
      </td>
    </tr>
  `;

  if (!isExpanded) return mainRow;

  // 3-Column Expandable Drawer
  const contacts = getCompanyContacts(c);

  const drawerRow = `
    ${mainRow}
    <tr class="bg-surface-container-low border-b border-outline-variant/50">
      <td class="p-3 pl-8 border-l-4 border-secondary" colspan="11">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-surface-container-lowest p-4 rounded-lg shadow-sm border border-outline-variant/30">
          
          <!-- Col 1: Technical Stakeholders & Multiple Contacts -->
          <div class="lg:col-span-4 space-y-2 pr-2 border-b lg:border-b-0 lg:border-r border-outline-variant/30 pb-3 lg:pb-0 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between pb-1 border-b border-outline-variant/20">
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] uppercase font-bold text-on-surface-variant">Technical Stakeholders</span>
                  <span class="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface text-[10px] font-semibold">${contacts.length} Contact${contacts.length === 1 ? '' : 's'}</span>
                </div>
                <button type="button" class="quick-contact-btn text-[10px] text-secondary hover:underline flex items-center gap-0.5 font-bold" data-id="${c.id}">
                  <span class="material-symbols-outlined text-[14px]">person_add</span>
                  <span>+ Add / Edit Contacts</span>
                </button>
              </div>

              <!-- Stacked Contacts Cards -->
              <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                ${
                  contacts.length === 0
                    ? `
                  <div class="p-3 text-center rounded-lg bg-surface-container-low border border-dashed border-outline-variant/40 space-y-1.5">
                    <span class="text-xs text-outline italic block">No contacts logged yet for this account.</span>
                    <button type="button" class="quick-contact-btn px-2.5 py-1 rounded bg-secondary text-on-secondary text-[11px] font-bold mx-auto flex items-center gap-1" data-id="${c.id}">
                      <span class="material-symbols-outlined text-[13px]">person_add</span> + Add First Contact
                    </button>
                  </div>
                `
                    : contacts
                        .map((ct) => {
                          const ctInitial = (ct.name || 'C').trim().charAt(0).toUpperCase();
                          const ctWa = cleanPhoneForWhatsApp(ct.mobile);
                          const ctWaLink = ctWa ? `https://wa.me/${ctWa}` : '';
                          return `
                    <div class="p-2.5 rounded-lg bg-surface-container-low/90 border ${ct.isPrimary ? 'border-secondary/40 shadow-xs' : 'border-outline-variant/30'} flex items-start gap-2.5">
                      <div class="w-8 h-8 rounded-full ${ct.isPrimary ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface'} flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        ${ctInitial}
                      </div>
                      <div class="flex-1 min-w-0 space-y-0.5">
                        <div class="flex items-center justify-between gap-1">
                          <span class="text-xs font-bold text-on-surface truncate">${escapeHtml(ct.name || 'Unnamed Contact')}</span>
                          ${ct.isPrimary ? `<span class="px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 text-[9px] font-bold shrink-0">Primary</span>` : ''}
                        </div>
                        <div class="text-[11px] text-on-surface-variant truncate">${escapeHtml(ct.designation || 'Stakeholder')}</div>
                        <div class="flex items-center gap-3 pt-0.5 flex-wrap text-[11px]">
                          ${
                            ct.mobile
                              ? `
                            <div class="text-secondary font-medium flex items-center gap-1">
                              <span class="material-symbols-outlined text-[13px]">call</span>
                              <span>${escapeHtml(ct.mobile)}</span>
                            </div>
                            `
                              : ''
                          }
                          ${
                            ctWaLink
                              ? `
                            <a href="${ctWaLink}" target="_blank" rel="noopener" class="inline-flex items-center gap-0.5 text-emerald-600 font-semibold hover:underline">
                              <span class="material-symbols-outlined text-[13px]">chat</span> WhatsApp
                            </a>
                            `
                              : ''
                          }
                        </div>
                      </div>
                    </div>
                  `;
                        })
                        .join('')
                }
              </div>
            </div>

            <div class="pt-2 flex items-center justify-between border-t border-outline-variant/20 mt-1">
              <button type="button" class="quick-contact-btn text-[11px] text-secondary hover:underline flex items-center gap-1 font-semibold" data-id="${c.id}">
                <span class="material-symbols-outlined text-[15px]">edit</span>
                <span>Manage All Contacts in Modal</span>
              </button>
            </div>
          </div>

          <!-- Col 2: Engineering & Capacity Specs -->
          <div class="lg:col-span-4 space-y-2 px-0 lg:px-2 border-b lg:border-b-0 lg:border-r border-outline-variant/30 pb-3 lg:pb-0">
            <span class="text-[11px] uppercase font-bold text-on-surface-variant">Production &amp; Fluid Demands</span>
            <div class="grid grid-cols-2 gap-2 pt-1">
              <div class="p-2 rounded bg-surface-container-low">
                <span class="text-[10px] text-on-surface-variant uppercase font-semibold block">Factory Capacity</span>
                <span class="text-xs font-bold text-on-surface block truncate" title="${escapeHtml(c.capacityOrScale || 'Not stated')}">${escapeHtml(c.capacityOrScale || 'Not stated')}</span>
              </div>
              <div class="p-2 rounded bg-surface-container-low">
                <span class="text-[10px] text-on-surface-variant uppercase font-semibold block">Coolant Target</span>
                <span class="text-xs font-bold text-secondary block truncate">${(c.liquidCooling || '').toLowerCase().includes('cold') || (c.liquidCooling || '').toLowerCase().includes('dlc') ? 'QuantiCool-DLC' : 'QuantiCool-Immersion'}</span>
              </div>
              <div class="col-span-2 p-2 rounded bg-teal-50/70 border border-teal-200/50 flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-teal-800 uppercase font-semibold block">Monthly Coolant Requirement</span>
                  <span class="text-xs font-bold text-secondary tabular-nums">${(Number(c.monthlyCoolantLiters) || 0).toLocaleString()} Liters / month</span>
                </div>
                <span class="text-[10px] text-teal-700 bg-teal-100/60 px-1.5 py-0.5 rounded font-mono">~${(((Number(c.monthlyCoolantLiters) || 0) * 12) / 18000).toFixed(1)} Containers/yr</span>
              </div>
              <div class="col-span-2 grid grid-cols-2 gap-2">
                <div class="p-2 rounded bg-surface-container-low">
                  <span class="text-[10px] text-on-surface-variant uppercase font-semibold block">Production Stage</span>
                  <span class="text-xs font-semibold text-emerald-800 block truncate" title="${escapeHtml(c.productionStage || 'Pilot / Prototype Stage')}">${escapeHtml(c.productionStage || 'Pilot / Prototype Stage')}</span>
                </div>
                <div class="p-2 rounded bg-surface-container-low">
                  <span class="text-[10px] text-on-surface-variant uppercase font-semibold block">Requirement Start Time</span>
                  <span class="text-xs font-semibold text-amber-800 block truncate" title="${escapeHtml(formatDisplayStartTime(c.coolantStartDate))}">${escapeHtml(formatDisplayStartTime(c.coolantStartDate))}</span>
                </div>
              </div>
            </div>
            <div class="text-xs text-on-surface-variant">
              <strong class="text-on-surface">Location:</strong> ${escapeHtml(c.location || 'Not stated in record')}
            </div>
          </div>

          <!-- Col 3: Field Engineering Notes & Lead Context -->
          <div class="lg:col-span-4 space-y-2 pl-0 lg:pl-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] uppercase font-bold text-on-surface-variant">Engineering Log &amp; Notes</span>
              <span class="text-[10px] text-on-surface-variant font-mono">ID: ${escapeHtml(c.id)}</span>
            </div>
            <p class="text-xs text-on-surface bg-surface-container-low p-2.5 rounded italic leading-relaxed max-h-28 overflow-y-auto">
              "${escapeHtml(c.notes || 'No engineering outreach angle logged yet.')}"
            </p>
            <div class="text-[10px] text-on-surface-variant">
              <strong>Source:</strong> ${escapeHtml(c.source || 'Direct entry')}
            </div>
            <div class="flex items-center justify-end gap-2 pt-1">
              <button type="button" class="drawer-edit-full-btn h-7 px-2.5 rounded bg-primary text-on-primary text-[11px] font-medium hover:bg-primary/80 transition-colors flex items-center gap-1" data-id="${c.id}">
                <span class="material-symbols-outlined text-[14px]">edit</span> Edit Full Record
              </button>
            </div>
          </div>

        </div>
      </td>
    </tr>
  `;

  return drawerRow;
}

function bindTableEvents(tbody) {
  // Row expansion on click
  tbody.querySelectorAll('tr.data-table-row').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      const id = tr.dataset.id;
      expandedId = expandedId === id ? null : id;
      renderTable();
    });
  });

  // Checkbox row toggle
  tbody.querySelectorAll('.row-checkbox').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const id = cb.dataset.id;
      if (cb.checked) selectedIds.add(id);
      else selectedIds.delete(id);
      updateBulkActionBar();
      // Keep row highlight
      const tr = cb.closest('tr');
      if (tr) tr.classList.toggle('selected', cb.checked);
    });
  });

  // Select all checkbox
  const selectAll = el('selectAllCheckbox');
  if (selectAll) {
    selectAll.checked = selectedIds.size > 0 && selectedIds.size === getFilteredCompanies().length;
    selectAll.onchange = () => {
      const filtered = getFilteredCompanies();
      if (selectAll.checked) {
        filtered.forEach((c) => selectedIds.add(c.id));
      } else {
        selectedIds.clear();
      }
      renderTable();
    };
  }

  // Inline status updates
  tbody.querySelectorAll('.inline-status-select').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const id = sel.dataset.id;
      const newStatus = sel.value;
      try {
        const updated = await api(`/api/companies/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus }),
        });
        companies = companies.map((c) => (c.id === id ? updated : c));
        renderStats();
        showToast(`Updated status to "${newStatus}"`);
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  // Inline priority updates
  tbody.querySelectorAll('.inline-priority-select').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const id = sel.dataset.id;
      const newPriority = sel.value;
      try {
        const updated = await api(`/api/companies/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ priority: newPriority }),
        });
        companies = companies.map((c) => (c.id === id ? updated : c));
        renderStats();
        sel.className = `inline-priority-select h-7 px-1.5 rounded text-[10px] border cursor-pointer focus:ring-1 focus:ring-secondary ${
          newPriority === 'High'
            ? 'bg-red-50 text-red-700 border-red-200 font-bold'
            : newPriority === 'Low'
            ? 'bg-slate-100 text-slate-600 border-slate-200 font-semibold'
            : 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
        }`;
        showToast(`Updated ${updated.company} priority to "${newPriority}"`);
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  // Quick contact add/edit buttons
  tbody.querySelectorAll('.quick-contact-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const company = companies.find((c) => c.id === id);
      if (company) openQuickContactModal(company);
    });
  });

  // Edit full buttons
  tbody.querySelectorAll('.row-edit-btn, .drawer-edit-full-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const company = companies.find((c) => c.id === id);
      if (company) openDrawer(company);
    });
  });
}

function updateBulkActionBar() {
  const bar = el('bulkActionBar');
  if (!bar) return;
  if (selectedIds.size > 0) {
    bar.classList.remove('hidden');
    el('selectedRowsCount').textContent = `${selectedIds.size} companies selected`;
  } else {
    bar.classList.add('hidden');
  }
}

// ---------------------------------------------------------------------
// Kanban Board Matrix (Tab 2)
// ---------------------------------------------------------------------

function renderKanban() {
  const container = el('kanbanContainer');
  if (!container) return;

  const stages = [
    { key: 'Not Contacted', label: 'Not Contacted', color: 'border-slate-400', headerBg: 'bg-slate-100 text-slate-800' },
    { key: 'Contacted', label: 'Contacted', color: 'border-blue-400', headerBg: 'bg-blue-50 text-blue-800' },
    { key: 'In Discussion', label: 'In Discussion', color: 'border-indigo-400', headerBg: 'bg-indigo-50 text-indigo-800' },
    { key: 'Sample / Trial Sent', label: 'Sample / Trial', color: 'border-amber-400', headerBg: 'bg-amber-50 text-amber-800' },
    { key: 'Technical Evaluation', label: 'Technical Eval', color: 'border-teal-400', headerBg: 'bg-teal-50 text-teal-800' },
    { key: 'Commercial Discussion', label: 'Commercial Terms', color: 'border-purple-400', headerBg: 'bg-purple-50 text-purple-800' },
    { key: 'Won', label: 'Won / Specified', color: 'border-emerald-500', headerBg: 'bg-emerald-50 text-emerald-800' },
    { key: 'On Hold', label: 'On Hold / Lost', color: 'border-gray-300', headerBg: 'bg-gray-100 text-gray-700' },
  ];

  const kanbanQ = (el('kanbanSearchInput')?.value || '').trim().toLowerCase();
  let filtered = getFilteredCompanies();
  if (kanbanQ) {
    filtered = filtered.filter((c) => {
      const hay = [
        c.company,
        c.type,
        c.location,
        c.contactPerson,
        c.mobile,
        c.capacityOrScale,
        c.categoryOrRole,
        c.liquidCooling,
        c.notes,
      ].join(' ').toLowerCase();
      return hay.includes(kanbanQ);
    });
  }

  const badge = el('kanbanCountBadge');
  if (badge) {
    badge.textContent = `${filtered.length} Accounts Displayed`;
  }

  container.innerHTML = stages.map((stage) => {
    const list = filtered.filter((c) => {
      if (stage.key === 'On Hold') return c.status === 'On Hold' || c.status === 'Lost';
      return c.status === stage.key;
    });

    return `
      <div class="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-2 min-w-[240px] border-t-4 ${stage.color} shadow-sm">
        <div class="flex items-center justify-between px-1 py-0.5">
          <span class="text-xs font-bold text-on-surface">${stage.label}</span>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${stage.headerBg}">${list.length}</span>
        </div>

        <div class="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
          ${
            list.length === 0
              ? `<div class="p-4 text-center text-outline text-[11px] italic">No accounts in this phase</div>`
              : list.map((c) => createKanbanCard(c, stages)).join('')
          }
        </div>
      </div>
    `;
  }).join('');

  // Bind card actions
  container.querySelectorAll('.kanban-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const company = companies.find((c) => c.id === id);
      if (company) openDrawer(company);
    });
  });

  // Advance stage
  container.querySelectorAll('.kanban-advance-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const targetStage = btn.dataset.stage;
      try {
        const updated = await api(`/api/companies/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: targetStage }),
        });
        companies = companies.map((c) => (c.id === id ? updated : c));
        renderAllViews();
        showToast(`Advanced to ${targetStage}`);
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  // Kanban inline priority
  container.querySelectorAll('.inline-priority-select').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      e.stopPropagation();
      const id = sel.dataset.id;
      const newPriority = sel.value;
      try {
        const updated = await api(`/api/companies/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ priority: newPriority }),
        });
        companies = companies.map((c) => (c.id === id ? updated : c));
        renderStats();
        sel.className = `inline-priority-select h-7 px-1.5 rounded text-[10px] border cursor-pointer focus:ring-1 focus:ring-secondary ${
          newPriority === 'High'
            ? 'bg-red-50 text-red-700 border-red-200 font-bold'
            : newPriority === 'Low'
            ? 'bg-slate-100 text-slate-600 border-slate-200 font-semibold'
            : 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
        }`;
        showToast(`Updated ${updated.company} priority to "${newPriority}"`);
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  // Kanban quick contact buttons
  container.querySelectorAll('.quick-contact-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const company = companies.find((c) => c.id === id);
      if (company) openQuickContactModal(company);
    });
  });
}

function createKanbanCard(c, stages) {
  const currentIndex = stages.findIndex((s) => s.key === c.status);
  const nextStage = currentIndex >= 0 && currentIndex < stages.length - 2 ? stages[currentIndex + 1].key : null;

  return `
    <div class="kanban-card bg-surface-container-lowest p-2.5 rounded shadow-sm hover:shadow border border-outline-variant/30 cursor-pointer space-y-1.5 transition-all" data-id="${c.id}">
      <div class="flex items-start justify-between gap-1">
        <span class="font-bold text-xs text-on-surface leading-tight hover:text-secondary">${escapeHtml(c.company)}</span>
        <div onclick="event.stopPropagation()">
          ${inlinePrioritySelectHtml(c)}
        </div>
      </div>

      <div class="flex items-center gap-1 flex-wrap">
        <span class="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-medium">${escapeHtml(c.type)}</span>
        ${c.liquidCooling && c.liquidCooling.includes('Immersion') ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 font-semibold">Immersion</span>` : ''}
      </div>

      <div class="flex items-center justify-between text-[11px] text-on-surface-variant pt-0.5" onclick="event.stopPropagation()">
        <div class="truncate max-w-[150px]">
          ${(() => {
            const contacts = getCompanyContacts(c);
            if (contacts.length === 0) return '<span class="italic text-outline">No contact</span>';
            const primary = contacts.find((ct) => ct.isPrimary) || contacts[0];
            return `
              <div class="flex items-center gap-1">
                <strong class="text-on-surface truncate">${escapeHtml(primary.name)}</strong>
                ${contacts.length > 1 ? `<span class="text-[9px] px-1 rounded bg-cyan-100 text-cyan-800 font-bold shrink-0">+${contacts.length - 1}</span>` : ''}
              </div>
              ${primary.designation ? `<span class="text-[10px] text-on-surface-variant block truncate">${escapeHtml(primary.designation)}</span>` : ''}
              ${primary.mobile ? `<span class="block text-[10px] text-secondary font-medium">${escapeHtml(primary.mobile)}</span>` : ''}
            `;
          })()}
        </div>
        <button type="button" class="quick-contact-btn p-1 rounded hover:bg-surface-container text-secondary text-[10px] shrink-0" data-id="${c.id}" title="Manage Contacts">
          <span class="material-symbols-outlined text-[15px]">contacts</span>
        </button>
      </div>

      ${c.nextActionDate ? `<div class="text-[10px] text-secondary font-medium truncate">${formatRelativeDate(c.nextActionDate)}</div>` : ''}

      <div class="flex items-center justify-between pt-1 border-t border-outline-variant/20" onclick="event.stopPropagation()">
        <span class="text-[10px] text-outline font-mono">#${escapeHtml(c.id)}</span>
        ${
          nextStage
            ? `<button type="button" class="kanban-advance-btn text-[10px] px-2 py-0.5 rounded bg-secondary text-on-secondary font-semibold hover:bg-secondary/90 flex items-center gap-0.5" data-id="${c.id}" data-stage="${nextStage}">
                Advance →
              </button>`
            : ''
        }
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------
// Monthly Requirement of Coolant (Tab 3)
// ---------------------------------------------------------------------

function renderMonthlyDemand() {
  const q = (el('monthlySearchInput')?.value || '').trim().toLowerCase();
  const archFilter = el('monthlyCoolingFilter')?.value || '';
  const stageFilter = el('monthlyStageFilter')?.value || '';

  // 1. KPI Calculations
  const activeProdAccounts = companies.filter((c) => c.productionStage === 'Already in Production');
  const activeProdMonthly = activeProdAccounts.reduce((s, c) => s + (Number(c.monthlyCoolantLiters) || 0), 0);

  const startingSoonAccounts = companies.filter((c) =>
    ['Commercial Production Starting Soon', 'Pilot / Prototype Stage', 'Under Setup / Plant Commissioning'].includes(c.productionStage)
  );
  const startingSoonMonthly = startingSoonAccounts.reduce((s, c) => s + (Number(c.monthlyCoolantLiters) || 0), 0);

  const totalMonthly = companies.reduce((s, c) => s + (Number(c.monthlyCoolantLiters) || 0), 0);
  const annualized = totalMonthly * 12;

  if (el('monthlyActiveLiters')) el('monthlyActiveLiters').textContent = `${activeProdMonthly.toLocaleString()} L`;
  if (el('monthlyActiveTons')) el('monthlyActiveTons').textContent = `~${Math.round((activeProdMonthly * 0.9) / 1000).toLocaleString()} MT/mo`;
  if (el('monthlyActiveAccountsCount')) el('monthlyActiveAccountsCount').textContent = activeProdAccounts.length;

  if (el('monthlyStartingSoonLiters')) el('monthlyStartingSoonLiters').textContent = `${startingSoonMonthly.toLocaleString()} L`;
  if (el('monthlyStartingSoonCount')) el('monthlyStartingSoonCount').textContent = `${startingSoonAccounts.length} accounts`;

  if (el('monthlyTotalLiters')) el('monthlyTotalLiters').textContent = `${totalMonthly.toLocaleString()} L`;
  if (el('monthlyTotalTons')) el('monthlyTotalTons').textContent = `~${Math.round((totalMonthly * 0.9) / 1000).toLocaleString()} MT/mo`;
  if (el('monthlyTotalAccountsCount')) el('monthlyTotalAccountsCount').textContent = companies.length;

  if (el('annualizedTotalLiters')) el('annualizedTotalLiters').textContent = `${annualized.toLocaleString()} L / yr`;
  if (el('annualizedTons')) el('annualizedTons').textContent = `~${Math.round((annualized * 0.9) / 1000).toLocaleString()} MT`;
  if (el('containerEquivalentCount')) el('containerEquivalentCount').textContent = Math.round(annualized / 18000).toLocaleString();

  // 2. Production Stage Ribbon Pills
  const pillsContainer = el('productionStagePills');
  if (pillsContainer) {
    const stageDefs = [
      { key: 'Already in Production', label: 'Already in Production', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
      { key: 'Commercial Production Starting Soon', label: 'Starting Soon', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
      { key: 'Pilot / Prototype Stage', label: 'Pilot / Prototype', bg: 'bg-blue-50 text-blue-800 border-blue-300' },
      { key: 'Under Setup / Plant Commissioning', label: 'Plant Setup', bg: 'bg-purple-50 text-purple-800 border-purple-300' },
      { key: 'R&D / Qualification Stage', label: 'R&D / Qualification', bg: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
      { key: 'Announced / Feasibility Planned', label: 'Announced / Planned', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
    ];
    pillsContainer.innerHTML = stageDefs.map((st) => {
      const count = companies.filter((c) => c.productionStage === st.key).length;
      const vol = companies.filter((c) => c.productionStage === st.key).reduce((s, c) => s + (Number(c.monthlyCoolantLiters) || 0), 0);
      const isSelected = stageFilter === st.key;
      return `
        <button type="button" class="stage-pill-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${st.bg} ${isSelected ? 'ring-2 ring-secondary ring-offset-1 font-bold shadow-sm' : 'hover:opacity-85'} transition-all" data-stage="${st.key}">
          <span>${st.label}:</span>
          <span class="font-bold tabular-nums">${count}</span>
          <span class="text-[10px] opacity-80 tabular-nums">(${vol.toLocaleString()} L)</span>
        </button>
      `;
    }).join('');

    pillsContainer.querySelectorAll('.stage-pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const stage = btn.dataset.stage;
        const filterSelect = el('monthlyStageFilter');
        if (filterSelect) {
          filterSelect.value = filterSelect.value === stage ? '' : stage;
          renderMonthlyDemand();
        }
      });
    });
  }

  // 3. SKU Mix
  const dlcMonthly = companies
    .filter((c) => {
      const l = (c.liquidCooling || '').toLowerCase();
      return l.includes('cold') || l.includes('dlc');
    })
    .reduce((s, c) => s + (Number(c.monthlyCoolantLiters) || 0), 0);
  const immersionMonthly = Math.max(0, totalMonthly - dlcMonthly);
  const pImmersion = totalMonthly > 0 ? Math.round((immersionMonthly / totalMonthly) * 100) : 70;
  const pDlc = 100 - pImmersion;

  const immEl = el('skuImmersionLiters');
  const immBar = el('skuImmersionBar');
  const dlcEl = el('skuDlcLiters');
  const dlcBar = el('skuDlcBar');

  if (immEl) immEl.textContent = `${immersionMonthly.toLocaleString()} L/mo (${pImmersion}%)`;
  if (immBar) immBar.style.width = `${pImmersion}%`;
  if (dlcEl) dlcEl.textContent = `${dlcMonthly.toLocaleString()} L/mo (${pDlc}%)`;
  if (dlcBar) dlcBar.style.width = `${pDlc}%`;

  // 4. Dynamic 12-Month Projected Procurement Ramp based on Start Dates
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const curDate = new Date();
  const curYear = curDate.getFullYear();
  const curMonthIdx = curDate.getMonth();
  const barsContainer = el('monthlyForecastBars');

  if (barsContainer) {
    let barsHtml = '';
    for (let m = 0; m < 12; m++) {
      const targetMonthDate = new Date(curYear, curMonthIdx + m, 1);
      const label = monthNames[targetMonthDate.getMonth()];
      const yearLabel = String(targetMonthDate.getFullYear()).slice(-2);
      const targetYm = `${targetMonthDate.getFullYear()}-${String(targetMonthDate.getMonth() + 1).padStart(2, '0')}`;

      // Sum accounts operational by this month
      let projectedLiters = 0;
      let activeAccountsInMonth = 0;

      companies.forEach((c) => {
        const vol = Number(c.monthlyCoolantLiters) || 0;
        if (vol <= 0) return;
        const stage = c.productionStage || '';
        const parsed = parseStartTime(c.coolantStartDate);

        if (stage === 'Already in Production' || parsed.isAlreadyActive) {
          projectedLiters += vol;
          activeAccountsInMonth++;
        } else {
          const monthIdx = MONTH_NAMES.indexOf(parsed.month);
          const startYear = parseInt(parsed.year, 10);
          if (!isNaN(startYear) && monthIdx !== -1) {
            const startDate = new Date(startYear, monthIdx, 1);
            if (targetMonthDate >= startDate) {
              projectedLiters += vol;
              activeAccountsInMonth++;
            }
          } else {
            // Fallback based on stage ramp
            let rampMonth = 3;
            if (stage.includes('Starting Soon')) rampMonth = 2;
            else if (stage.includes('Pilot')) rampMonth = 4;
            else if (stage.includes('Setup')) rampMonth = 6;
            else rampMonth = 8;

            if (m >= rampMonth) {
              projectedLiters += vol;
              activeAccountsInMonth++;
            }
          }
        }
      });

      const maxChartLiters = Math.max(1000, totalMonthly);
      const heightPct = Math.max(12, Math.min(100, Math.round((projectedLiters / maxChartLiters) * 95)));

      barsHtml += `
        <div class="flex flex-col items-center justify-end h-full group relative">
          <div class="absolute -top-9 hidden group-hover:flex flex-col items-center px-2 py-1 rounded bg-primary text-white text-[10px] whitespace-nowrap z-20 shadow-lg pointer-events-none">
            <span class="font-bold">${label} '${yearLabel}: ${projectedLiters.toLocaleString()} L</span>
            <span class="text-[9px] text-teal-200">${activeAccountsInMonth} accounts online</span>
          </div>
          <div class="w-full rounded-t bg-secondary hover:bg-secondary/90 transition-all cursor-pointer" style="height: ${heightPct}%;"></div>
          <span class="text-[10px] text-on-surface-variant font-medium mt-1">${label} '${yearLabel}</span>
        </div>
      `;
    }
    barsContainer.innerHTML = barsHtml;
  }

  // 5. Filter Company Table
  const filteredRows = companies.filter((c) => {
    if (archFilter && c.liquidCooling !== archFilter) return false;
    if (stageFilter && c.productionStage !== stageFilter) return false;
    if (q) {
      const hay = [
        c.company,
        c.type,
        c.location,
        c.capacityOrScale,
        c.notes,
        c.productionStage,
        c.coolantStartDate,
        c.contactPerson,
        c.mobile,
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  el('monthlyTableCount').textContent = `${filteredRows.length} accounts`;

  const tbody = el('monthlyTableBody');
  const stageClassMap = {
    'Already in Production': 'bg-emerald-50 text-emerald-800 border-emerald-300',
    'Commercial Production Starting Soon': 'bg-amber-50 text-amber-800 border-amber-300',
    'Pilot / Prototype Stage': 'bg-blue-50 text-blue-800 border-blue-300',
    'Under Setup / Plant Commissioning': 'bg-purple-50 text-purple-800 border-purple-300',
    'R&D / Qualification Stage': 'bg-indigo-50 text-indigo-800 border-indigo-300',
    'Announced / Feasibility Planned': 'bg-slate-100 text-slate-700 border-slate-300',
    'Air Cooled / Not Applicable': 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const stageOptions = [
    'Already in Production',
    'Commercial Production Starting Soon',
    'Pilot / Prototype Stage',
    'Under Setup / Plant Commissioning',
    'R&D / Qualification Stage',
    'Announced / Feasibility Planned',
    'Air Cooled / Not Applicable',
  ];

  tbody.innerHTML = filteredRows.map((c) => {
    const monthlyVal = Number(c.monthlyCoolantLiters) || 0;
    const annualVal = monthlyVal * 12;
    const containers = (annualVal / 18000).toFixed(1);
    const isDlc = (c.liquidCooling || '').toLowerCase().includes('cold') || (c.liquidCooling || '').toLowerCase().includes('dlc');
    const isImmersion = !isDlc;
    const sku = isDlc ? 'QuantiCool-DLC' : 'QuantiCool-Immersion';
    const currentStage = c.productionStage || 'Pilot / Prototype Stage';
    const stageClass = stageClassMap[currentStage] || 'bg-slate-100 text-slate-700 border-slate-300';
    const parsedTime = parseStartTime(c.coolantStartDate || (currentStage === 'Already in Production' ? 'Already Active' : 'Oct 2025'));

    return `
      <tr class="hover:bg-surface-container-low transition-colors" data-id="${c.id}">
        <td class="py-2.5 px-3">
          <div class="font-bold text-on-surface hover:text-secondary cursor-pointer monthly-company-name" data-id="${c.id}">${escapeHtml(c.company)}</div>
          <div class="text-[10px] text-on-surface-variant flex items-center gap-1.5">
            <span>${escapeHtml(c.type)}</span>
            ${c.location ? `<span class="text-outline">• ${escapeHtml(c.location)}</span>` : ''}
          </div>
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          ${coolingBadgeHtml(c.liquidCooling)}
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          <select data-id="${c.id}" class="monthly-stage-select h-7 px-2 rounded text-[11px] font-semibold border ${stageClass} focus:outline-none focus:ring-1 focus:ring-secondary transition-all">
            ${stageOptions.map((st) => `<option value="${escapeHtml(st)}" ${st === currentStage ? 'selected' : ''}>${escapeHtml(st)}</option>`).join('')}
          </select>
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          <div class="flex items-center gap-1">
            <select data-id="${c.id}" class="monthly-start-month-select h-7 px-1.5 rounded bg-surface-container-low text-[11px] font-semibold text-amber-950 border border-outline-variant/40 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none" title="Select Requirement Start Month">
              <option value="Already Active" ${parsedTime.isAlreadyActive ? 'selected' : ''}>Already Active</option>
              ${MONTH_NAMES.map((m) => `<option value="${m}" ${!parsedTime.isAlreadyActive && parsedTime.month === m ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
            <select data-id="${c.id}" class="monthly-start-year-select h-7 px-1.5 rounded bg-surface-container-low text-[11px] font-semibold text-amber-950 border border-outline-variant/40 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none ${parsedTime.isAlreadyActive ? 'opacity-35 pointer-events-none' : ''}" title="Select Requirement Start Year">
              ${YEAR_OPTIONS.map((y) => `<option value="${y}" ${parsedTime.year === y ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          <div class="flex items-center gap-1.5">
            <input type="number" step="500" min="0" value="${monthlyVal}" data-id="${c.id}" class="monthly-inline-input w-24 h-7 px-2 rounded bg-surface-container-low text-xs font-bold text-secondary tabular-nums border border-outline-variant/40 focus:bg-white focus:ring-1 focus:ring-secondary focus:outline-none" />
            <button type="button" data-id="${c.id}" class="save-monthly-inline-btn h-7 px-1.5 rounded hover:bg-surface-container text-secondary" title="Save monthly requirement to Excel">
              <span class="material-symbols-outlined text-[15px]">save</span>
            </button>
          </div>
        </td>
        <td class="py-2.5 px-3 text-right font-semibold tabular-nums text-on-surface whitespace-nowrap">
          ${annualVal.toLocaleString()} L
        </td>
        <td class="py-2.5 px-3 text-center tabular-nums text-on-surface-variant font-medium whitespace-nowrap">
          ${containers}
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${isImmersion ? 'bg-teal-50 text-teal-800' : 'bg-indigo-50 text-indigo-800'}">
            ${sku}
          </span>
        </td>
        <td class="py-2.5 px-3 text-right pr-3 whitespace-nowrap">
          <button type="button" class="monthly-row-edit-btn h-7 px-2 rounded bg-surface-container hover:bg-surface-container-high text-xs font-medium" data-id="${c.id}">
            Edit
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // 6. Bind Event Listeners
  // Stage change
  tbody.querySelectorAll('.monthly-stage-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const id = sel.dataset.id;
      const newStage = sel.value;
      await saveCompanyStage(id, newStage);
    });
  });

  // Start Month change
  tbody.querySelectorAll('.monthly-start-month-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const id = sel.dataset.id;
      const month = sel.value;
      const yearSel = tbody.querySelector(`.monthly-start-year-select[data-id="${id}"]`);
      if (yearSel) {
        const isAct = month === 'Already Active';
        yearSel.classList.toggle('opacity-35', isAct);
        yearSel.classList.toggle('pointer-events-none', isAct);
      }
      const year = yearSel ? yearSel.value : '2025';
      const formatted = formatStartTime(month, year);
      await saveCompanyStartTime(id, formatted);
    });
  });

  // Start Year change
  tbody.querySelectorAll('.monthly-start-year-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const id = sel.dataset.id;
      const year = sel.value;
      const monthSel = tbody.querySelector(`.monthly-start-month-select[data-id="${id}"]`);
      const month = monthSel ? monthSel.value : 'Oct';
      const formatted = formatStartTime(month, year);
      await saveCompanyStartTime(id, formatted);
    });
  });

  // Volume save
  tbody.querySelectorAll('.save-monthly-inline-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const input = tbody.querySelector(`.monthly-inline-input[data-id="${id}"]`);
      if (!input) return;
      await saveMonthlyInline(id, input.value);
    });
  });

  tbody.querySelectorAll('.monthly-inline-input').forEach((inp) => {
    inp.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const id = inp.dataset.id;
        await saveMonthlyInline(id, inp.value);
      }
    });
  });

  // Drawer trigger
  tbody.querySelectorAll('.monthly-row-edit-btn, .monthly-company-name').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const comp = companies.find((c) => c.id === id);
      if (comp) openDrawer(comp);
    });
  });
}

async function saveCompanyStage(id, stage) {
  try {
    const comp = companies.find((c) => c.id === id);
    const patch = { productionStage: stage };
    if (stage === 'Already in Production' && (!comp.coolantStartDate || comp.coolantStartDate.includes('2025') || comp.coolantStartDate.includes('2026'))) {
      patch.coolantStartDate = 'Already Active';
    }
    const updated = await api(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    companies = companies.map((c) => (c.id === id ? updated : c));
    renderAllViews();
    showToast(`Updated production stage for ${updated.company} to "${stage}"`);
  } catch (err) {
    showToast(err.message, true);
  }
}

async function saveCompanyStartTime(id, timeVal) {
  try {
    const cleanTime = (timeVal || '').trim();
    const updated = await api(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ coolantStartDate: cleanTime }),
    });
    companies = companies.map((c) => (c.id === id ? updated : c));
    renderAllViews();
    showToast(`Saved start time for ${updated.company}: "${cleanTime}"`);
  } catch (err) {
    showToast(err.message, true);
  }
}

async function saveMonthlyInline(id, val) {
  const numVal = Number(val) || 0;
  try {
    const updated = await api(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ monthlyCoolantLiters: numVal }),
    });
    companies = companies.map((c) => (c.id === id ? updated : c));
    renderAllViews();
    showToast(`Saved monthly requirement for ${updated.company}: ${numVal.toLocaleString()} L/mo`);
  } catch (err) {
    showToast(err.message, true);
  }
}

// ---------------------------------------------------------------------
// Export Manufacturers Workspace (Non-India Manufacturing Base)
// ---------------------------------------------------------------------

function getExportOriginInfo(company) {
  const name = (company.company || '').toLowerCase();
  const loc = (company.location || '').toLowerCase();
  if (name.includes('hithium') || name.includes('catl') || name.includes('rept') || name.includes('full top source') || name.includes('deye') || name.includes('lux power')) {
    return { flag: '🇨🇳', country: 'China', role: 'OEM / Cell & System Exporter' };
  }
  if (name.includes('saft') || name.includes('totalenergies')) {
    return { flag: '🇫🇷', country: 'France / Europe', role: 'Container BESS OEM (Saft)' };
  }
  if (name.includes('samsung')) {
    return { flag: '🇰🇷', country: 'South Korea', role: 'Global EPC & BESS Supply' };
  }
  if (name.includes('sardar') || loc.includes('hungary')) {
    return { flag: '🇭🇺', country: 'Hungary / Europe', role: 'European BESS Integrator' };
  }
  return { flag: '🌐', country: 'International', role: 'Overseas OEM' };
}

function renderExportManufacturers() {
  const exportList = companies.filter((c) => c.type === 'Export Manufacturer');

  if (el('exportMfrNavBadge')) {
    el('exportMfrNavBadge').textContent = exportList.length;
  }
  if (el('exportTotalCount')) {
    el('exportTotalCount').textContent = exportList.length;
  }

  const q = (el('exportMfrSearchInput')?.value || '').trim().toLowerCase();
  const cooling = el('exportMfrCoolingFilter')?.value || '';
  const status = el('exportMfrStatusFilter')?.value || '';
  const priority = el('exportMfrPriorityFilter')?.value || '';

  let filtered = exportList.filter((c) => {
    if (cooling && c.liquidCooling !== cooling) return false;
    if (status && c.status !== status) return false;
    if (priority && c.priority !== priority) return false;
    if (q) {
      const match = [
        c.company,
        c.location,
        c.categoryOrRole,
        c.capacityOrScale,
        c.notes,
        c.contactPerson,
        c.mobile,
      ].some((val) => (val || '').toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  if (el('exportTableCountBadge')) {
    el('exportTableCountBadge').textContent = `Showing ${filtered.length} of ${exportList.length} Export Manufacturers`;
  }

  const tbody = el('exportMfrTableBody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-8 text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
          <p class="text-sm font-medium">No export manufacturers match your current filter.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((c) => {
    const origin = getExportOriginInfo(c);
    const contacts = getCompanyContacts(c);
    const primary = contacts.length > 0 ? (contacts.find((ct) => ct.isPrimary) || contacts[0]) : null;
    const moreCount = contacts.length > 1 ? contacts.length - 1 : 0;
    const waPhone = primary ? cleanPhoneForWhatsApp(primary.mobile) : '';
    const waLink = waPhone ? `https://wa.me/${waPhone}` : '';

    return `
      <tr class="hover:bg-surface-container-low transition-colors">
        <td class="py-2.5 px-3">
          <div class="flex items-center gap-2">
            <span class="text-xl" title="${origin.country}">${origin.flag}</span>
            <div class="flex flex-col">
              <span class="font-bold text-on-surface flex items-center gap-1.5">
                <span class="export-company-name hover:text-sky-600 cursor-pointer" data-id="${c.id}">${escapeHtml(c.company)}</span>
                <span class="px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-semibold">${origin.country}</span>
              </span>
              <span class="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px] text-outline">location_on</span>
                ${escapeHtml(c.location || 'HQ Overseas (Export to India)')}
              </span>
            </div>
          </div>
        </td>
        <td class="py-2.5 px-3">
          <div class="flex flex-col">
            <span class="font-medium text-on-surface text-[11px]">${escapeHtml(c.categoryOrRole || origin.role)}</span>
            <span class="text-[10px] text-on-surface-variant truncate max-w-[200px]" title="${escapeHtml(c.capacityOrScale || '')}">${escapeHtml(c.capacityOrScale || 'Grid-scale export supply')}</span>
          </div>
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          ${coolingBadgeHtml(c.liquidCooling)}
        </td>
        <td class="py-2.5 px-3">
          ${primary ? `
            <div class="flex flex-col">
              <div class="flex items-center gap-1">
                <span class="font-semibold text-on-surface text-[11px]">${escapeHtml(primary.name)}</span>
                ${moreCount > 0 ? `<span class="export-contact-btn px-1 rounded bg-cyan-100 text-cyan-800 text-[9px] font-bold cursor-pointer" data-id="${c.id}">+${moreCount}</span>` : ''}
              </div>
              <span class="text-[10px] text-on-surface-variant truncate max-w-[150px]">${escapeHtml(primary.designation || 'India Channel / Technical Rep')}</span>
              <div class="flex items-center gap-2 mt-0.5 text-[10px]">
                ${primary.mobile ? `<a href="tel:${escapeHtml(primary.mobile)}" class="text-secondary hover:underline flex items-center gap-0.5"><span class="material-symbols-outlined text-[10px]">call</span>${escapeHtml(primary.mobile)}</a>` : ''}
                ${waLink ? `<a href="${waLink}" target="_blank" rel="noopener" class="text-emerald-600 hover:underline flex items-center gap-0.5 font-semibold"><span class="material-symbols-outlined text-[10px]">chat</span>WA</a>` : ''}
              </div>
            </div>
          ` : `
            <button type="button" class="export-contact-btn px-2 py-0.5 rounded border border-dashed border-outline-variant/60 hover:border-secondary hover:bg-secondary-container/20 text-secondary text-[10px] font-medium flex items-center gap-1" data-id="${c.id}">
              <span class="material-symbols-outlined text-[12px]">person_add</span>
              <span>+ Contact</span>
            </button>
          `}
        </td>
        <td class="py-2.5 px-2 text-center whitespace-nowrap">
          <select data-id="${c.id}" class="export-priority-select h-7 px-1.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
            c.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : c.priority === 'Low' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }">
            <option value="High" ${c.priority === 'High' ? 'selected' : ''}>⚡ HIGH</option>
            <option value="Medium" ${c.priority === 'Medium' || !c.priority ? 'selected' : ''}>MED</option>
            <option value="Low" ${c.priority === 'Low' ? 'selected' : ''}>LOW</option>
          </select>
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          <select data-id="${c.id}" class="export-status-select h-7 px-1.5 rounded bg-surface-container text-on-surface text-[11px] font-medium border border-outline-variant/40 focus:ring-1 focus:ring-secondary cursor-pointer">
            ${(META.statusOptions || []).map((opt) => `<option value="${opt}" ${c.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </td>
        <td class="py-2.5 px-3 text-[11px]">
          <p class="line-clamp-2 italic text-on-surface-variant max-w-[240px]" title="${escapeHtml(c.notes || '')}">
            "${escapeHtml(c.notes || 'Qualify port-of-entry coolant fill vs factory pre-fill.')}"
          </p>
        </td>
        <td class="py-2.5 px-3 text-right pr-3 whitespace-nowrap">
          <button type="button" class="export-edit-btn h-7 px-2.5 rounded bg-primary text-on-primary hover:bg-primary-container text-[11px] font-semibold flex items-center gap-1 ml-auto shadow-sm" data-id="${c.id}">
            <span class="material-symbols-outlined text-[13px]">edit</span>
            <span>Edit</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Bind Export Table Listeners
  tbody.querySelectorAll('.export-priority-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const id = sel.dataset.id;
      const newPri = sel.value;
      try {
        showToast(`Updating priority for ${id}...`);
        const updated = await api(`/api/companies/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ priority: newPri }),
        });
        companies = companies.map((c) => (c.id === id ? updated : c));
        renderAllViews();
        showToast(`Updated ${updated.company} to ${newPri} Priority`);
      } catch (e) {
        showToast(e.message, true);
      }
    });
  });

  tbody.querySelectorAll('.export-status-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const id = sel.dataset.id;
      const newStatus = sel.value;
      try {
        showToast(`Updating status for ${id}...`);
        const updated = await api(`/api/companies/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus }),
        });
        companies = companies.map((c) => (c.id === id ? updated : c));
        renderAllViews();
        showToast(`Updated ${updated.company} status to ${newStatus}`);
      } catch (e) {
        showToast(e.message, true);
      }
    });
  });

  tbody.querySelectorAll('.export-edit-btn, .export-company-name').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const comp = companies.find((c) => c.id === id);
      if (comp) openDrawer(comp);
    });
  });

  tbody.querySelectorAll('.export-contact-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const comp = companies.find((c) => c.id === id);
      if (comp) openQuickContactModal(comp);
    });
  });
}

// ---------------------------------------------------------------------
// Market Intel & Cooling Analytics (Tab 4)
// ---------------------------------------------------------------------

function renderAnalytics() {
  const filtered = getFilteredCompanies();
  const total = filtered.length || 1;

  // Immersion count
  const immersionCount = filtered.filter((c) => (c.liquidCooling || '').toLowerCase().includes('immersion')).length;
  el('analyticsImmersionCount').textContent = `${immersionCount} of ${total}`;

  // Operational vs planned
  const operational = filtered.filter((c) => c.type === 'New Mfr - Operational').length;
  const planned = filtered.filter((c) => c.type === 'New Mfr - Announced/Planned').length;
  el('analyticsMfrBreakdown').textContent = `${operational} Ops / ${planned} Plan`;

  // Cooling breakdown list
  const coolingMap = {};
  filtered.forEach((c) => {
    const k = c.liquidCooling || 'Unknown';
    coolingMap[k] = (coolingMap[k] || 0) + 1;
  });

  const coolingList = el('coolingTechList');
  coolingList.innerHTML = Object.entries(coolingMap)
    .sort((a, b) => b[1] - a[1])
    .map(([key, cnt]) => {
      const pct = Math.round((cnt / total) * 100);
      let colorClass = 'bg-slate-400';
      if (key.includes('Immersion')) colorClass = 'bg-secondary';
      else if (key.includes('DLC') || key.includes('Cold')) colorClass = 'bg-on-tertiary-fixed-variant';
      else if (key.includes('Liquid')) colorClass = 'bg-amber-500';

      return `
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-on-surface">${escapeHtml(key)}</span>
            <span class="font-bold text-on-surface tabular-nums">${cnt} accounts (${pct}%)</span>
          </div>
          <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div class="${colorClass} h-full" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');

  // Priority targets list
  const targets = filtered.filter((c) => c.priority === 'High').slice(0, 6);
  const targetList = el('priorityTargetList');
  targetList.innerHTML = targets.length === 0
    ? `<div class="text-xs text-outline italic">No High Priority targets currently in this filtered view.</div>`
    : targets.map((t) => `
        <div class="p-2.5 rounded bg-surface-container-low flex items-center justify-between gap-2 text-xs hover:bg-surface-container cursor-pointer priority-target-item" data-id="${t.id}">
          <div>
            <div class="font-bold text-on-surface hover:text-secondary">${escapeHtml(t.company)}</div>
            <div class="text-[11px] text-on-surface-variant">${escapeHtml(t.type)} • ${escapeHtml(t.location || 'Location tbd')}</div>
          </div>
          <div class="text-right">
            ${coolingBadgeHtml(t.liquidCooling)}
            <div class="text-[10px] text-secondary font-semibold mt-0.5">${escapeHtml(t.status)}</div>
          </div>
        </div>
      `).join('');

  targetList.querySelectorAll('.priority-target-item').forEach((item) => {
    item.addEventListener('click', () => {
      const comp = companies.find((c) => c.id === item.dataset.id);
      if (comp) openDrawer(comp);
    });
  });

  // Dedicated Analytics Search Results
  const analyticsQ = (el('analyticsSearchInput')?.value || '').trim().toLowerCase();
  const searchResultsEl = el('analyticsSearchResults');
  if (searchResultsEl) {
    if (analyticsQ) {
      const matches = companies.filter((c) => {
        const hay = [
          c.company,
          c.type,
          c.location,
          c.capacityOrScale,
          c.categoryOrRole,
          c.liquidCooling,
          c.notes,
          c.contactPerson,
          c.mobile,
        ].join(' ').toLowerCase();
        return hay.includes(analyticsQ);
      });
      searchResultsEl.classList.remove('hidden');
      if (matches.length === 0) {
        searchResultsEl.innerHTML = `<div class="text-xs text-purple-200 italic p-2">No companies matching "${escapeHtml(analyticsQ)}" in thermal intelligence database.</div>`;
      } else {
        searchResultsEl.innerHTML = `
          <div class="flex items-center justify-between text-xs text-purple-200 font-semibold px-1 pb-1 border-b border-purple-500/30">
            <span>Found ${matches.length} matching company thermal profiles for "${escapeHtml(analyticsQ)}"</span>
            <span class="text-[10px] text-purple-300 font-normal">Click any card to open full specs</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1.5">
            ${matches.map((m) => `
              <div class="analytics-search-card p-2.5 rounded bg-slate-900/90 border border-purple-400/40 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all space-y-1.5" data-id="${m.id}">
                <div class="flex items-center justify-between gap-1">
                  <span class="font-bold text-xs text-white truncate max-w-[170px]">${escapeHtml(m.company)}</span>
                  ${coolingBadgeHtml(m.liquidCooling)}
                </div>
                <div class="text-[11px] text-slate-300 truncate">${escapeHtml(m.capacityOrScale || m.type)}</div>
                <div class="text-[10px] text-purple-300 flex items-center justify-between pt-1 border-t border-purple-500/20">
                  <span class="truncate max-w-[140px]">${m.contactPerson ? `👤 ${escapeHtml(m.contactPerson)}` : '<em class="text-slate-400">No contact</em>'}</span>
                  <span class="font-semibold text-emerald-300 tabular-nums">${(Number(m.monthlyCoolantLiters) || 0).toLocaleString()} L/mo</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
        searchResultsEl.querySelectorAll('.analytics-search-card').forEach((card) => {
          card.addEventListener('click', () => {
            const comp = companies.find((c) => c.id === card.dataset.id);
            if (comp) openDrawer(comp);
          });
        });
      }
    } else {
      searchResultsEl.classList.add('hidden');
      searchResultsEl.innerHTML = '';
    }
  }
}

// ---------------------------------------------------------------------
// Management Reports (Tab 5)
// ---------------------------------------------------------------------

function renderReports() {
  el('reportDate').textContent = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const total = companies.length;
  const operational = companies.filter((c) => c.type === 'New Mfr - Operational').length;
  const planned = companies.filter((c) => c.type === 'New Mfr - Announced/Planned').length;
  const immersionReady = companies.filter((c) => (c.liquidCooling || '').toLowerCase().includes('immersion')).length;
  const activePipeline = companies.filter((c) => !['Not Contacted', 'Won', 'Lost', 'On Hold'].includes(c.status)).length;

  el('reportSummaryText').textContent = `
    The commercial intelligence tracker currently monitors ${total} key BESS accounts in India across existing supply-chain contacts (${companies.filter(c => c.type === 'Existing Contact').length}), active operational gigafactories (${operational}), announced/under-construction facilities (${planned}), and grid-scale developers (${companies.filter(c => c.type === 'Project Developer').length}). A total of ${activePipeline} accounts are engaged in active commercial/technical dialogues. Dielectric immersion cooling represents the premier strategic vector for QuantiCool-Immersion synthetic ester, with ${immersionReady} manufacturers confirmed or actively evaluating immersion configurations.
  `;

  el('reportMetricGrid').innerHTML = `
    <div class="p-3 bg-surface-container-low rounded">
      <div class="text-xl font-bold text-primary">${total}</div>
      <div class="text-[11px] text-on-surface-variant uppercase font-semibold">Total Accounts</div>
    </div>
    <div class="p-3 bg-surface-container-low rounded">
      <div class="text-xl font-bold text-secondary">${activePipeline}</div>
      <div class="text-[11px] text-on-surface-variant uppercase font-semibold">Active Discussions</div>
    </div>
    <div class="p-3 bg-surface-container-low rounded">
      <div class="text-xl font-bold text-error">${companies.filter(c => c.priority === 'High' && c.status === 'Not Contacted').length}</div>
      <div class="text-[11px] text-on-surface-variant uppercase font-semibold">Urgent Uncontacted</div>
    </div>
    <div class="p-3 bg-surface-container-low rounded">
      <div class="text-xl font-bold text-on-tertiary-fixed-variant">${companies.filter(c => c.status === 'Won').length}</div>
      <div class="text-[11px] text-on-surface-variant uppercase font-semibold">Won / Specified</div>
    </div>
  `;

  const reportQ = (el('reportSearchInput')?.value || '').trim().toLowerCase();
  let priorityAccounts = companies.filter((c) => c.priority === 'High');
  if (reportQ) {
    priorityAccounts = companies.filter((c) => {
      const hay = [
        c.company,
        c.type,
        c.location,
        c.liquidCooling,
        c.status,
        c.contactPerson,
        c.mobile,
        c.notes,
        c.nextAction,
      ].join(' ').toLowerCase();
      return hay.includes(reportQ);
    });
  } else {
    priorityAccounts = priorityAccounts.slice(0, 10);
  }

  el('reportAccountsBody').innerHTML = priorityAccounts.length === 0
    ? `<tr><td colspan="6" class="p-4 text-center text-outline italic">No accounts matching "${escapeHtml(reportQ)}" in report</td></tr>`
    : priorityAccounts.map((a) => `
    <tr class="hover:bg-surface-container-low/50 cursor-pointer report-account-row" data-id="${a.id}">
      <td class="p-2 font-semibold text-on-surface hover:text-secondary">${escapeHtml(a.company)}</td>
      <td class="p-2 text-on-surface-variant">${escapeHtml(a.type)}</td>
      <td class="p-2">${coolingBadgeHtml(a.liquidCooling)}</td>
      <td class="p-2 font-semibold text-secondary">${escapeHtml(a.status)}</td>
      <td class="p-2 text-on-surface-variant">${escapeHtml(a.contactPerson || a.mobile || '—')}</td>
      <td class="p-2">${escapeHtml(a.nextAction || a.nextActionDate || '—')}</td>
    </tr>
  `).join('');

  el('reportAccountsBody').querySelectorAll('.report-account-row').forEach((row) => {
    row.addEventListener('click', () => {
      const comp = companies.find((c) => c.id === row.dataset.id);
      if (comp) openDrawer(comp);
    });
  });
}

// ---------------------------------------------------------------------
// Daily Commercial Action Command Center & Proactive Follow-Up Agenda
// ---------------------------------------------------------------------

function getTodayIsoString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOffsetIsoString(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateOnly(str) {
  if (!str) return null;
  const parts = String(str).trim().split('-');
  if (parts.length !== 3) return new Date(str);
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

function getDayDifference(targetStr) {
  if (!targetStr) return null;
  const target = parseDateOnly(targetStr);
  if (!target || isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function categorizeNextActions(list = companies) {
  const todayStr = getTodayIsoString();
  const next14DaysStr = getOffsetIsoString(14);

  const activeCandidates = list.filter((c) => c.status !== 'Won' && c.status !== 'Lost');

  const overdue = [];
  const today = [];
  const upcoming = [];
  let urgentUnscheduled = [];

  for (const c of activeCandidates) {
    if (c.nextActionDate) {
      if (c.nextActionDate < todayStr) {
        overdue.push(c);
      } else if (c.nextActionDate === todayStr) {
        today.push(c);
      } else if (c.nextActionDate > todayStr && c.nextActionDate <= next14DaysStr) {
        upcoming.push(c);
      }
    } else if (c.priority === 'High') {
      urgentUnscheduled.push(c);
    }
  }

  // Sort overdue by oldest date first
  overdue.sort((a, b) => (a.nextActionDate || '').localeCompare(b.nextActionDate || ''));
  // Sort upcoming by earliest date first
  upcoming.sort((a, b) => (a.nextActionDate || '').localeCompare(b.nextActionDate || ''));

  // If fewer than 4 high priority unscheduled, suggest active operational BESS manufacturers
  if (urgentUnscheduled.length < 4) {
    const extraSuggestions = activeCandidates.filter((c) => 
      !c.nextActionDate && c.priority !== 'High' &&
      (c.type === 'New Mfr - Operational' || (c.capacityOrScale && c.capacityOrScale.toLowerCase().includes('gwh')))
    ).slice(0, 4 - urgentUnscheduled.length);
    urgentUnscheduled = [...urgentUnscheduled, ...extraSuggestions];
  }

  const overdueAndToday = [...overdue, ...today];
  const totalActive = overdue.length + today.length + upcoming.length;

  return { overdue, today, overdueAndToday, upcoming, urgentUnscheduled, totalActive, todayStr };
}

function renderAgendaItemCard(c, category) {
  const diffDays = getDayDifference(c.nextActionDate);
  const cleanPhone = cleanPhoneForWhatsApp(c.mobile);
  
  let badgeHtml = '';
  if (diffDays === null) {
    badgeHtml = `<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">No Date Set</span>`;
  } else if (diffDays < 0) {
    badgeHtml = `<span class="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Overdue ${Math.abs(diffDays)}d</span>`;
  } else if (diffDays === 0) {
    badgeHtml = `<span class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black animate-pulse flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>🔥 Due Today</span>`;
  } else if (diffDays === 1) {
    badgeHtml = `<span class="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">Tomorrow</span>`;
  } else {
    badgeHtml = `<span class="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-bold">In ${diffDays}d (${c.nextActionDate})</span>`;
  }

  const priorityColor = c.priority === 'High' ? 'text-red-700 bg-red-50 border-red-200' : c.priority === 'Medium' ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-slate-600 bg-slate-100 border-slate-200';

  return `
    <div class="p-2.5 rounded-lg bg-surface-container-lowest border ${diffDays !== null && diffDays <= 0 ? 'border-red-300 shadow-sm' : 'border-outline-variant/30 shadow-xs'} hover:border-secondary transition-all space-y-2 text-xs" data-company-id="${c.id}">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-on-surface hover:text-secondary cursor-pointer truncate open-company-drawer-trigger" data-id="${c.id}" title="Click to view details in drawer">${escapeHtml(c.company)}</span>
            <span class="px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase ${priorityColor}">${escapeHtml(c.priority || 'Medium')}</span>
          </div>
          <div class="text-[10px] text-on-surface-variant truncate mt-0.5 flex items-center gap-1">
            <span class="text-secondary font-semibold">${escapeHtml(c.status || 'Not Contacted')}</span>
            ${c.location ? `<span>• ${escapeHtml(c.location)}</span>` : ''}
          </div>
        </div>
        <div class="shrink-0">
          ${badgeHtml}
        </div>
      </div>

      <!-- Action Note / Target -->
      <div class="p-2 rounded bg-surface-container-low/60 border border-outline-variant/30 text-[11px] text-on-surface">
        <div class="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold flex items-center justify-between">
          <span>Target Next Action</span>
          <span class="text-on-surface font-mono font-semibold">${c.nextActionDate || 'Unscheduled'}</span>
        </div>
        <div class="mt-0.5 font-semibold text-on-surface text-[11px] leading-tight break-words">
          ${escapeHtml(c.nextAction || 'No action note specified. Click to schedule next outreach.')}
        </div>
      </div>

      <!-- Contact Stakeholder & Direct Execution Links -->
      <div class="flex items-center justify-between gap-2 pt-0.5">
        <div class="text-[11px] text-on-surface-variant truncate flex items-center gap-1 min-w-0">
          <span class="material-symbols-outlined text-[14px] text-teal-600 shrink-0">person</span>
          <span class="truncate text-on-surface font-medium">${escapeHtml(c.contactPerson || 'No contact assigned')}</span>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          ${cleanPhone ? `
            <a href="https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(c.contactPerson || c.company)}%2C%20following%20up%20regarding%20QuantiCool%20immersion%20cooling%20for%20BESS..." target="_blank" rel="noopener noreferrer" class="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors" title="Chat on WhatsApp (${c.mobile})">
              <span class="material-symbols-outlined text-[13px]">chat</span>
              <span>WhatsApp</span>
            </a>
            <a href="tel:${c.mobile}" class="w-6 h-6 rounded bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 flex items-center justify-center transition-colors shadow-xs" title="Call Mobile (${c.mobile})">
              <span class="material-symbols-outlined text-[13px]">call</span>
            </a>
          ` : ''}
          <button type="button" class="agenda-manage-contacts-btn w-6 h-6 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/40 flex items-center justify-center transition-colors" data-id="${c.id}" title="Manage Stakeholders & Contacts">
            <span class="material-symbols-outlined text-[13px]">contacts</span>
          </button>
        </div>
      </div>

      <!-- 1-Click Quick Reschedule Bar -->
      <div class="flex items-center justify-between gap-1 pt-1.5 border-t border-outline-variant/30 text-[10px]">
        <span class="text-on-surface-variant font-semibold shrink-0">Reschedule:</span>
        <div class="flex items-center gap-1 flex-wrap justify-end">
          <button type="button" class="quick-reschedule-btn px-1.5 py-0.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/40 hover:border-secondary transition-colors font-medium" data-id="${c.id}" data-offset="1" title="Reschedule to Tomorrow">
            Tomorrow
          </button>
          <button type="button" class="quick-reschedule-btn px-1.5 py-0.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/40 hover:border-secondary transition-colors font-medium" data-id="${c.id}" data-offset="3" title="Reschedule in +3 Days">
            +3d
          </button>
          <button type="button" class="quick-reschedule-btn px-1.5 py-0.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/40 hover:border-secondary transition-colors font-medium" data-id="${c.id}" data-offset="7" title="Reschedule Next Week (+7 Days)">
            +1w
          </button>
          <input type="date" class="quick-custom-date-picker h-5 px-1 rounded bg-surface-container-lowest text-on-surface border border-outline-variant/40 text-[10px] focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer" data-id="${c.id}" value="${c.nextActionDate || ''}" title="Pick custom date" />
        </div>
      </div>

      <!-- Inline Quick Note Logger -->
      <div class="relative mt-1">
        <input type="text" class="quick-action-input w-full h-6 pl-2 pr-6 rounded bg-surface-container-lowest border border-outline-variant/40 hover:border-outline-variant focus:border-secondary text-on-surface text-[10px] placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="Type next step & hit Enter..." data-id="${c.id}" />
        <button type="button" class="quick-action-save-btn absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant hover:text-secondary flex items-center justify-center" data-id="${c.id}" title="Save Action Note to Excel">
          <span class="material-symbols-outlined text-[13px]">check</span>
        </button>
      </div>
    </div>
  `;
}

function renderActionAgendaTab() {
  const searchTerm = el('agendaSearchInput')?.value.toLowerCase().trim() || '';

  let filteredCompanies = companies;
  if (searchTerm) {
    filteredCompanies = companies.filter((c) => {
      const text = [
        c.company,
        c.type,
        c.status,
        c.priority,
        c.nextAction,
        c.nextActionDate,
        c.contactPerson,
        c.mobile,
        c.location,
        c.notes,
      ].join(' ').toLowerCase();
      return text.includes(searchTerm);
    });
  }

  const { overdueAndToday, upcoming, urgentUnscheduled, totalActive } = categorizeNextActions(filteredCompanies);
  const totalAgendaActive = overdueAndToday.length + upcoming.length + urgentUnscheduled.length;

  // Date stamp on tab
  const d = new Date();
  const dateOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  if (el('agendaTabDateStamp')) el('agendaTabDateStamp').textContent = d.toLocaleDateString('en-IN', dateOptions);

  // Top header button badge & navigation tab badge
  const badgeCountEl = el('agendaBadgeCount');
  if (badgeCountEl) {
    const badgeNum = overdueAndToday.length > 0 ? overdueAndToday.length : totalAgendaActive;
    badgeCountEl.textContent = badgeNum;
    if (overdueAndToday.length > 0) {
      badgeCountEl.className = 'px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse';
    } else {
      badgeCountEl.className = 'px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black';
    }
  }

  if (el('tabAgendaNavBadge')) {
    el('tabAgendaNavBadge').textContent = overdueAndToday.length > 0 ? overdueAndToday.length : totalAgendaActive;
  }

  // Header banner badge
  if (el('agendaTotalActionBadge')) {
    el('agendaTotalActionBadge').textContent = `${totalAgendaActive} Active Action${totalAgendaActive === 1 ? '' : 's'}`;
  }

  // Top 4 KPI tiles for Agenda
  if (el('countOverdueTodayKpi')) el('countOverdueTodayKpi').textContent = overdueAndToday.length;
  if (el('countUpcomingKpi')) el('countUpcomingKpi').textContent = upcoming.length;
  if (el('countUrgentKpi')) el('countUrgentKpi').textContent = urgentUnscheduled.length;
  const directWhatsAppCount = companies.filter((c) => cleanPhoneForWhatsApp(c.mobile)).length;
  if (el('countWhatsAppReadyKpi')) el('countWhatsAppReadyKpi').textContent = directWhatsAppCount;

  // Swimlane counts
  if (el('countOverdueToday')) el('countOverdueToday').textContent = overdueAndToday.length;
  if (el('countUpcoming')) el('countUpcoming').textContent = upcoming.length;
  if (el('countUrgentUnscheduled')) el('countUrgentUnscheduled').textContent = urgentUnscheduled.length;

  // Swimlane 1: Overdue & Today
  const listOverdueToday = el('listOverdueToday');
  if (listOverdueToday) {
    if (overdueAndToday.length === 0) {
      listOverdueToday.innerHTML = `
        <div class="p-6 rounded-xl bg-surface-container-low/40 border border-outline-variant/30 text-center text-on-surface-variant text-xs space-y-1.5">
          <span class="material-symbols-outlined text-2xl text-emerald-600">task_alt</span>
          <div class="font-bold text-on-surface">No overdue actions!</div>
          <div class="text-[11px]">All scheduled milestones are on track.</div>
        </div>
      `;
    } else {
      listOverdueToday.innerHTML = overdueAndToday.map((c) => renderAgendaItemCard(c, 'due')).join('');
    }
  }

  // Swimlane 2: Upcoming Next 14 Days
  const listUpcoming = el('listUpcoming');
  if (listUpcoming) {
    if (upcoming.length === 0) {
      listUpcoming.innerHTML = `
        <div class="p-6 rounded-xl bg-surface-container-low/40 border border-outline-variant/30 text-center text-on-surface-variant text-xs space-y-1.5">
          <span class="material-symbols-outlined text-2xl text-outline">event_available</span>
          <div class="font-bold text-on-surface">No upcoming milestones</div>
          <div class="text-[11px]">Schedule actions below to build your pipeline.</div>
        </div>
      `;
    } else {
      listUpcoming.innerHTML = upcoming.map((c) => renderAgendaItemCard(c, 'upcoming')).join('');
    }
  }

  // Swimlane 3: High Priority Radar
  const listUrgentUnscheduled = el('listUrgentUnscheduled');
  if (listUrgentUnscheduled) {
    if (urgentUnscheduled.length === 0) {
      listUrgentUnscheduled.innerHTML = `
        <div class="p-6 rounded-xl bg-surface-container-low/40 border border-outline-variant/30 text-center text-on-surface-variant text-xs space-y-1.5">
          <span class="material-symbols-outlined text-2xl text-emerald-600">radar</span>
          <div class="font-bold text-on-surface">All targets scheduled!</div>
          <div class="text-[11px]">Every high-priority account has an assigned next milestone.</div>
        </div>
      `;
    } else {
      listUrgentUnscheduled.innerHTML = urgentUnscheduled.map((c) => renderAgendaItemCard(c, 'unscheduled')).join('');
    }
  }

  // Master Chronological Schedule Table
  const tableBody = el('agendaScheduleTableBody');
  const tableCount = el('agendaScheduleTableCount');
  if (tableBody) {
    const scheduledAccounts = filteredCompanies
      .filter((c) => c.nextActionDate && c.status !== 'Won' && c.status !== 'Lost')
      .sort((a, b) => (a.nextActionDate || '').localeCompare(b.nextActionDate || ''));

    if (tableCount) tableCount.textContent = `${scheduledAccounts.length} Scheduled Account${scheduledAccounts.length === 1 ? '' : 's'}`;

    if (scheduledAccounts.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="p-6 text-center text-on-surface-variant text-xs">
            No accounts currently scheduled. Use the swimlanes above to assign next actions.
          </td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = scheduledAccounts.map((c) => renderAgendaScheduleTableRow(c)).join('');
    }
  }
}

function renderAgendaScheduleTableRow(c) {
  const diffDays = getDayDifference(c.nextActionDate);
  const cleanPhone = cleanPhoneForWhatsApp(c.mobile);
  
  let dateBadge = '';
  if (diffDays === null) {
    dateBadge = `<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">Unscheduled</span>`;
  } else if (diffDays < 0) {
    dateBadge = `<span class="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">Overdue ${Math.abs(diffDays)}d</span>`;
  } else if (diffDays === 0) {
    dateBadge = `<span class="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black animate-pulse">🔥 Due Today</span>`;
  } else if (diffDays === 1) {
    dateBadge = `<span class="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">Tomorrow</span>`;
  } else {
    dateBadge = `<span class="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-bold">In ${diffDays}d</span>`;
  }

  const priorityColor = c.priority === 'High' ? 'text-red-700 bg-red-50 border-red-200' : c.priority === 'Medium' ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-slate-600 bg-slate-100 border-slate-200';

  return `
    <tr class="hover:bg-surface-container-low/50 transition-colors" data-company-id="${c.id}">
      <td class="py-2.5 px-3 whitespace-nowrap">
        <div class="flex items-center gap-2">
          ${dateBadge}
          <span class="font-mono text-[11px] text-on-surface font-medium">${c.nextActionDate || '—'}</span>
        </div>
      </td>
      <td class="py-2.5 px-3 font-semibold text-on-surface">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="hover:text-secondary cursor-pointer open-company-drawer-trigger truncate" data-id="${c.id}">${escapeHtml(c.company)}</span>
          <span class="px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase ${priorityColor}">${escapeHtml(c.priority || 'Medium')}</span>
        </div>
        ${c.location ? `<div class="text-[10px] text-on-surface-variant font-normal truncate">${escapeHtml(c.location)}</div>` : ''}
      </td>
      <td class="py-2.5 px-3 whitespace-nowrap">
        <span class="text-secondary text-xs font-semibold">${escapeHtml(c.status || 'Not Contacted')}</span>
      </td>
      <td class="py-2.5 px-3 max-w-[280px]">
        <span class="text-on-surface text-xs font-medium">${escapeHtml(c.nextAction || '—')}</span>
      </td>
      <td class="py-2.5 px-3">
        <div class="flex items-center gap-1 text-on-surface font-medium">
          <span class="material-symbols-outlined text-[13px] text-teal-600">person</span>
          <span class="truncate">${escapeHtml(c.contactPerson || '—')}</span>
        </div>
        ${c.mobile ? `<div class="text-[10px] font-mono text-on-surface-variant">${escapeHtml(c.mobile)}</div>` : ''}
      </td>
      <td class="py-2.5 px-3 text-right whitespace-nowrap">
        <div class="flex items-center justify-end gap-1.5 flex-wrap">
          ${cleanPhone ? `
            <a href="https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(c.contactPerson || c.company)}%2C%20following%20up%20regarding%20QuantiCool%20immersion%20cooling%20for%20BESS..." target="_blank" rel="noopener noreferrer" class="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors" title="Chat on WhatsApp">
              <span class="material-symbols-outlined text-[13px]">chat</span>
              <span class="hidden sm:inline">WhatsApp</span>
            </a>
            <a href="tel:${c.mobile}" class="p-1 rounded bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 flex items-center justify-center transition-colors" title="Call Mobile">
              <span class="material-symbols-outlined text-[13px]">call</span>
            </a>
          ` : ''}
          <button type="button" class="quick-reschedule-btn px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 hover:border-secondary text-[10px] font-semibold transition-colors" data-id="${c.id}" data-offset="1" title="Reschedule to Tomorrow">+1d</button>
          <button type="button" class="quick-reschedule-btn px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 hover:border-secondary text-[10px] font-semibold transition-colors" data-id="${c.id}" data-offset="3" title="Reschedule in +3 Days">+3d</button>
          <button type="button" class="quick-reschedule-btn px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 hover:border-secondary text-[10px] font-semibold transition-colors" data-id="${c.id}" data-offset="7" title="Reschedule Next Week">+1w</button>
          <button type="button" class="briefing-complete-checkbox p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-colors" data-id="${c.id}" title="Mark milestone complete">
            <span class="material-symbols-outlined text-[13px]">check</span>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderActionCommandCenter() {
  renderActionAgendaTab();
}

function renderDailyBriefingModal() {
  const modal = el('dailyBriefingModalBackdrop');
  if (!modal) return;

  const { overdueAndToday, upcoming, urgentUnscheduled } = categorizeNextActions();

  // Date banner
  const d = new Date();
  const dateOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
  const formattedToday = d.toLocaleDateString('en-IN', dateOptions);
  if (el('briefingDateStamp')) el('briefingDateStamp').textContent = formattedToday;

  // KPI cards
  if (el('modalKpiOverdue')) el('modalKpiOverdue').textContent = overdueAndToday.length;
  if (el('modalKpiUpcoming')) el('modalKpiUpcoming').textContent = upcoming.length;
  if (el('modalKpiUrgent')) el('modalKpiUrgent').textContent = urgentUnscheduled.length;

  const listContainer = el('modalActionItemsList');
  if (!listContainer) return;

  if (overdueAndToday.length === 0 && upcoming.length === 0 && urgentUnscheduled.length === 0) {
    listContainer.innerHTML = `
      <div class="p-6 rounded-xl bg-surface-container-low/40 border border-outline-variant/30 text-center space-y-2">
        <span class="material-symbols-outlined text-3xl text-emerald-600">task_alt</span>
        <div class="text-sm font-bold text-on-surface">You are completely caught up!</div>
        <div class="text-xs text-on-surface-variant">No overdue milestones or urgent follow-ups pending right now.</div>
      </div>
    `;
    return;
  }

  let html = '';

  if (overdueAndToday.length > 0) {
    html += `
      <div class="space-y-1.5 pt-1">
        <div class="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
          <span>🚨 Immediate Attention: Due Today &amp; Overdue (${overdueAndToday.length})</span>
        </div>
        ${overdueAndToday.map((c) => renderBriefingItemRow(c, 'due')).join('')}
      </div>
    `;
  }

  if (upcoming.length > 0) {
    html += `
      <div class="space-y-1.5 pt-2">
        <div class="text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">calendar_month</span>
          <span>📅 Upcoming Scheduled Milestones (${upcoming.length})</span>
        </div>
        ${upcoming.map((c) => renderBriefingItemRow(c, 'upcoming')).join('')}
      </div>
    `;
  }

  if (urgentUnscheduled.length > 0) {
    html += `
      <div class="space-y-1.5 pt-2">
        <div class="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">radar</span>
          <span>⚡ High-Priority Accounts To Contact Today (${urgentUnscheduled.length})</span>
        </div>
        ${urgentUnscheduled.map((c) => renderBriefingItemRow(c, 'unscheduled')).join('')}
      </div>
    `;
  }

  listContainer.innerHTML = html;
}

function renderBriefingItemRow(c, type) {
  const diffDays = getDayDifference(c.nextActionDate);
  const cleanPhone = cleanPhoneForWhatsApp(c.mobile);

  let dateBadge = '';
  if (diffDays === null) {
    dateBadge = `<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">Unscheduled</span>`;
  } else if (diffDays < 0) {
    dateBadge = `<span class="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">Overdue ${Math.abs(diffDays)}d</span>`;
  } else if (diffDays === 0) {
    dateBadge = `<span class="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black animate-pulse">🔥 Due Today</span>`;
  } else if (diffDays === 1) {
    dateBadge = `<span class="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">Tomorrow</span>`;
  } else {
    dateBadge = `<span class="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-bold">In ${diffDays}d (${c.nextActionDate})</span>`;
  }

  const priorityColor = c.priority === 'High' ? 'text-red-700 bg-red-50 border-red-200' : c.priority === 'Medium' ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-slate-600 bg-slate-100 border-slate-200';

  return `
    <div class="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-secondary/50 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs" data-company-id="${c.id}">
      <div class="flex items-start gap-2.5 min-w-0 flex-1">
        <button type="button" class="briefing-complete-checkbox mt-0.5 w-5 h-5 rounded border border-outline-variant/60 hover:border-emerald-600 bg-surface-container-low text-transparent hover:text-emerald-600 flex items-center justify-center transition-colors shrink-0" data-id="${c.id}" title="Mark milestone complete">
          <span class="material-symbols-outlined text-[15px]">check</span>
        </button>

        <div class="min-w-0 space-y-1 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold text-sm text-on-surface hover:text-secondary cursor-pointer truncate open-company-drawer-trigger" data-id="${c.id}" title="Click to view details in drawer">${escapeHtml(c.company)}</span>
            <span class="px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase ${priorityColor}">${escapeHtml(c.priority || 'Medium')}</span>
            <span class="text-[10px] text-secondary font-semibold">${escapeHtml(c.status || 'Not Contacted')}</span>
            ${dateBadge}
          </div>
          
          <div class="text-[11px] text-on-surface font-medium">
            <span class="text-on-surface-variant font-normal">Action: </span>${escapeHtml(c.nextAction || 'Outreach required (direct contact & QuantiCool pitch)')}
          </div>

          <div class="flex items-center gap-3 text-[10px] text-on-surface-variant flex-wrap">
            <span class="flex items-center gap-1 text-on-surface">
              <span class="material-symbols-outlined text-[13px] text-teal-600">person</span>
              ${escapeHtml(c.contactPerson || 'No contact assigned')}
            </span>
            ${c.mobile ? `<span class="font-mono text-on-surface font-medium">${escapeHtml(c.mobile)}</span>` : ''}
            ${c.liquidCooling ? `<span class="text-secondary font-medium">• ${escapeHtml(c.liquidCooling)}</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Action & Execution Buttons -->
      <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
        ${cleanPhone ? `
          <a href="https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(c.contactPerson || c.company)}%2C%20following%20up%20regarding%20QuantiCool%20immersion%20cooling%20for%20BESS..." target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-all shadow-xs" title="Chat on WhatsApp">
            <span class="material-symbols-outlined text-[14px]">chat</span>
            <span>WhatsApp</span>
          </a>
          <a href="tel:${c.mobile}" class="px-2.5 py-1 rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-semibold flex items-center gap-1 transition-all shadow-xs" title="Call Mobile">
            <span class="material-symbols-outlined text-[14px]">call</span>
            <span>Call</span>
          </a>
        ` : ''}

        <button type="button" class="agenda-manage-contacts-btn p-1.5 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/40 transition-colors" data-id="${c.id}" title="Manage Contacts">
          <span class="material-symbols-outlined text-[15px]">contacts</span>
        </button>

        <div class="relative flex items-center gap-1">
          <button type="button" class="quick-reschedule-btn px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 hover:border-secondary text-[11px] font-semibold transition-colors" data-id="${c.id}" data-offset="1" title="Reschedule to Tomorrow">
            Tomorrow
          </button>
          <button type="button" class="quick-reschedule-btn px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 hover:border-secondary text-[11px] font-semibold transition-colors" data-id="${c.id}" data-offset="3" title="Reschedule in +3 Days">
            +3d
          </button>
          <button type="button" class="quick-reschedule-btn px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 hover:border-secondary text-[11px] font-semibold transition-colors" data-id="${c.id}" data-offset="7" title="Reschedule Next Week">
            +1w
          </button>
        </div>
      </div>
    </div>
  `;
}

async function rescheduleAction(companyId, daysOffsetOrDateStr) {
  const company = companies.find((c) => c.id === companyId);
  if (!company) return;

  const newDate = typeof daysOffsetOrDateStr === 'number'
    ? getOffsetIsoString(daysOffsetOrDateStr)
    : daysOffsetOrDateStr;

  try {
    const updated = await api(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify({ nextActionDate: newDate }),
    });
    companies = companies.map((c) => (c.id === companyId ? updated : c));
    renderAllViews();
    renderDailyBriefingModal();
    showToast(`Rescheduled ${company.company} to ${newDate}`);
  } catch (err) {
    showToast(err.message, true);
  }
}

async function updateCompanyNextAction(companyId, nextActionText) {
  const company = companies.find((c) => c.id === companyId);
  if (!company) return;

  try {
    const updated = await api(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify({ nextAction: nextActionText }),
    });
    companies = companies.map((c) => (c.id === companyId ? updated : c));
    renderAllViews();
    renderDailyBriefingModal();
    showToast(`Updated next action for ${company.company}`);
  } catch (err) {
    showToast(err.message, true);
  }
}

async function markActionCompleted(companyId) {
  const company = companies.find((c) => c.id === companyId);
  if (!company) return;

  const todayStr = getTodayIsoString();
  try {
    const updated = await api(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify({
        notes: company.notes ? `${company.notes}\n[Completed on ${todayStr}]: ${company.nextAction || 'Milestone achieved'}` : `[Completed on ${todayStr}]: ${company.nextAction || 'Milestone achieved'}`,
        nextAction: `Completed on ${todayStr}`,
        nextActionDate: '',
      }),
    });
    companies = companies.map((c) => (c.id === companyId ? updated : c));
    renderAllViews();
    renderDailyBriefingModal();
    showToast(`Marked milestone complete for ${company.company}!`);
  } catch (err) {
    showToast(err.message, true);
  }
}

function openDailyBriefingModal() {
  renderDailyBriefingModal();
  const modal = el('dailyBriefingModalBackdrop');
  if (modal) modal.classList.remove('hidden');

  const chk = el('chkDontShowStartup');
  if (chk) {
    chk.checked = localStorage.getItem('bess_hide_briefing_startup') === 'true';
  }
}

function closeDailyBriefingModal() {
  const modal = el('dailyBriefingModalBackdrop');
  if (modal) modal.classList.add('hidden');
}

function setupActionCommandCenter() {
  // Header button switches to dedicated Agenda Tab
  el('openAgendaBtn')?.addEventListener('click', () => {
    document.querySelector('#mainNav button[data-tab="tab-agenda"]')?.click();
  });

  // Action center button for opening briefing modal
  el('openDailyBriefingModalBtn')?.addEventListener('click', () => {
    openDailyBriefingModal();
  });

  // Close modal buttons
  el('closeDailyBriefingModalBtn')?.addEventListener('click', closeDailyBriefingModal);
  el('dismissDailyBriefingBtn')?.addEventListener('click', closeDailyBriefingModal);
  el('dailyBriefingModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'dailyBriefingModalBackdrop') closeDailyBriefingModal();
  });

  // Checkbox for don't show on startup
  el('chkDontShowStartup')?.addEventListener('change', (e) => {
    localStorage.setItem('bess_hide_briefing_startup', e.target.checked ? 'true' : 'false');
    showToast(e.target.checked ? 'Daily briefing will not pop up automatically.' : 'Daily briefing will open on startup.');
  });

  // Agenda search input listener
  el('agendaSearchInput')?.addEventListener('input', () => {
    renderActionAgendaTab();
  });

  // Unified delegated click handlers for all agenda containers
  const agendaContainers = [
    el('listOverdueToday'),
    el('listUpcoming'),
    el('listUrgentUnscheduled'),
    el('modalActionItemsList'),
    el('agendaScheduleTableBody'),
  ];

  agendaContainers.forEach((container) => {
    if (!container) return;

    container.addEventListener('click', (e) => {
      // 1. Open drawer
      const trigger = e.target.closest('.open-company-drawer-trigger');
      if (trigger) {
        const comp = companies.find((c) => c.id === trigger.dataset.id);
        if (comp) openDrawer(comp);
        return;
      }

      // 2. Manage contacts
      const contactBtn = e.target.closest('.agenda-manage-contacts-btn');
      if (contactBtn) {
        const comp = companies.find((c) => c.id === contactBtn.dataset.id);
        if (comp) openQuickContactModal(comp);
        return;
      }

      // 3. Quick reschedule
      const reschedBtn = e.target.closest('.quick-reschedule-btn');
      if (reschedBtn) {
        const id = reschedBtn.dataset.id;
        const offset = parseInt(reschedBtn.dataset.offset, 10);
        rescheduleAction(id, offset);
        return;
      }

      // 4. Quick action save button
      const saveBtn = e.target.closest('.quick-action-save-btn');
      if (saveBtn) {
        const card = saveBtn.closest('[data-company-id]');
        const input = card?.querySelector('.quick-action-input');
        if (input && input.value.trim()) {
          updateCompanyNextAction(saveBtn.dataset.id, input.value.trim());
          input.value = '';
        }
        return;
      }

      // 5. Briefing complete checkbox
      const completeBtn = e.target.closest('.briefing-complete-checkbox');
      if (completeBtn) {
        markActionCompleted(completeBtn.dataset.id);
        return;
      }
    });

    // Keydown handler (for quick action input Enter key)
    container.addEventListener('keydown', (e) => {
      if (e.target.classList.contains('quick-action-input') && e.key === 'Enter') {
        const id = e.target.dataset.id;
        const text = e.target.value.trim();
        if (id && text) {
          updateCompanyNextAction(id, text);
          e.target.value = '';
        }
      }
    });

    // Change handler (for custom date picker)
    container.addEventListener('change', (e) => {
      if (e.target.classList.contains('quick-custom-date-picker')) {
        const id = e.target.dataset.id;
        const dateVal = e.target.value;
        if (id && dateVal) {
          rescheduleAction(id, dateVal);
        }
      }
    });
  });

  // Check auto-open on startup
  const hideOnStartup = localStorage.getItem('bess_hide_briefing_startup') === 'true';
  if (!hideOnStartup) {
    const { overdueAndToday, upcoming, urgentUnscheduled } = categorizeNextActions();
    if (overdueAndToday.length > 0 || upcoming.length > 0 || urgentUnscheduled.length > 0) {
      setTimeout(() => {
        openDailyBriefingModal();
      }, 600);
    }
  }
}

// ---------------------------------------------------------------------
// Quick Contact Modal Helper Functions
// ---------------------------------------------------------------------

let currentModalCompany = null;
let currentModalContacts = [];

function openQuickContactModal(company) {
  if (!company) return;
  currentModalCompany = company;
  const rawContacts = getCompanyContacts(company);
  currentModalContacts = rawContacts.length > 0
    ? JSON.parse(JSON.stringify(rawContacts))
    : [{ name: '', designation: '', mobile: '', isPrimary: true }];

  el('quickContactCompanyId').value = company.id || '';
  el('quickContactCompanyName').textContent = company.company || '';
  el('quickContactCompanyType').textContent = company.type || 'BESS Account';
  el('quickContactModalSubtitle').textContent = `Manage multiple key contacts for ${company.company} (#${company.id})`;

  renderQuickContactRows();
  el('quickContactModalBackdrop').classList.remove('hidden');
}

function renderQuickContactRows() {
  const container = el('quickContactsList');
  if (!container) return;

  el('quickContactCount').textContent = currentModalContacts.length;
  el('saveContactsBtnText').textContent = `Save ${currentModalContacts.length} Contact${currentModalContacts.length === 1 ? '' : 's'}`;

  container.innerHTML = currentModalContacts.map((ct, index) => {
    const isPrimary = Boolean(ct.isPrimary || (index === 0 && !currentModalContacts.some((c) => c.isPrimary)));
    const wa = cleanPhoneForWhatsApp(ct.mobile);
    const waLink = wa ? `https://wa.me/${wa}` : '';

    return `
      <div class="p-3 rounded-lg border ${isPrimary ? 'border-secondary/60 bg-surface-container-low/70' : 'border-outline-variant/40 bg-surface-container-lowest'} space-y-2 relative group" data-index="${index}">
        <div class="flex items-center justify-between pb-1 border-b border-outline-variant/20">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full ${isPrimary ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface'} flex items-center justify-center text-[10px] font-bold">
              ${index + 1}
            </span>
            <span class="font-bold text-xs text-on-surface">
              ${escapeHtml(ct.name || `Contact #${index + 1}`)}
            </span>
            ${isPrimary ? `<span class="px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center gap-0.5">★ Primary</span>` : ''}
          </div>

          <div class="flex items-center gap-1.5">
            ${
              !isPrimary
                ? `
              <button type="button" class="make-primary-btn text-[10px] text-secondary hover:underline px-1.5 py-0.5 rounded hover:bg-secondary-container/20 font-semibold" data-index="${index}">
                Set as Primary
              </button>
            `
                : ''
            }
            ${
              waLink
                ? `
              <a href="${waLink}" target="_blank" rel="noopener" class="text-emerald-600 hover:text-emerald-700 p-0.5" title="Chat on WhatsApp">
                <span class="material-symbols-outlined text-[16px]">chat</span>
              </a>
            `
                : ''
            }
            <button type="button" class="remove-contact-btn p-1 rounded hover:bg-error-container text-outline hover:text-error transition-colors" data-index="${index}" title="Remove this contact">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
          <div class="sm:col-span-4 space-y-1">
            <label class="text-[10px] font-semibold text-on-surface-variant uppercase">Full Name</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-outline">person</span>
              <input type="text" class="contact-name-input w-full h-8 pl-7 pr-2 rounded bg-surface-container text-on-surface text-xs focus:bg-white focus:ring-1 focus:ring-secondary border border-outline-variant/30" placeholder="e.g. Kishorsinh Zala" value="${escapeHtml(ct.name || '')}" data-index="${index}" />
            </div>
          </div>

          <div class="sm:col-span-4 space-y-1">
            <label class="text-[10px] font-semibold text-on-surface-variant uppercase">Designation / Role</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-outline">badge</span>
              <input type="text" class="contact-desig-input w-full h-8 pl-7 pr-2 rounded bg-surface-container text-on-surface text-xs focus:bg-white focus:ring-1 focus:ring-secondary border border-outline-variant/30" placeholder="e.g. Chairman / CTO / VP" value="${escapeHtml(ct.designation || '')}" data-index="${index}" />
            </div>
          </div>

          <div class="sm:col-span-4 space-y-1">
            <label class="text-[10px] font-semibold text-on-surface-variant uppercase">Phone / WhatsApp</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-outline">call</span>
              <input type="tel" class="contact-mobile-input w-full h-8 pl-7 pr-2 rounded bg-surface-container text-on-surface text-xs font-mono focus:bg-white focus:ring-1 focus:ring-secondary border border-outline-variant/30" placeholder="e.g. +91 99099 54615" value="${escapeHtml(ct.mobile || '')}" data-index="${index}" />
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind input sync
  container.querySelectorAll('.contact-name-input').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      currentModalContacts[idx].name = e.target.value;
    });
  });

  container.querySelectorAll('.contact-desig-input').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      currentModalContacts[idx].designation = e.target.value;
    });
  });

  container.querySelectorAll('.contact-mobile-input').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      currentModalContacts[idx].mobile = e.target.value;
    });
  });

  // Make primary button
  container.querySelectorAll('.make-primary-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.index, 10);
      currentModalContacts.forEach((ct, i) => {
        ct.isPrimary = i === idx;
      });
      renderQuickContactRows();
    });
  });

  // Remove contact button
  container.querySelectorAll('.remove-contact-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.index, 10);
      currentModalContacts.splice(idx, 1);
      if (currentModalContacts.length === 0) {
        currentModalContacts.push({ name: '', designation: '', mobile: '', isPrimary: true });
      } else if (!currentModalContacts.some((ct) => ct.isPrimary)) {
        currentModalContacts[0].isPrimary = true;
      }
      renderQuickContactRows();
    });
  });
}

function closeQuickContactModal() {
  el('quickContactModalBackdrop').classList.add('hidden');
  currentModalCompany = null;
  currentModalContacts = [];
}

// ---------------------------------------------------------------------
// Slide-Over Drawer: Add & Edit Company (Screen 2)
// ---------------------------------------------------------------------

function openDrawer(company = null) {
  const isEdit = !!company;
  el('drawerTitle').textContent = isEdit ? `Edit Account: ${company.company}` : 'Add New Account';
  el('drawerTypeBadge').textContent = isEdit ? (company.type || 'Operational Mfr') : 'New Account Record';
  el('drawerMetaSub').textContent = isEdit
    ? `Record ID: #${company.id} • Last updated ${company.lastUpdated || 'recently'}`
    : 'Will be appended directly to BESS_Company_Contacts_Updated1.xlsx';

  el('field_id').value = isEdit ? company.id : '';
  el('field_company').value = isEdit ? (company.company || '') : '';
  el('field_type').value = isEdit ? (company.type || 'New Mfr - Operational') : 'New Mfr - Operational';
  el('field_location').value = isEdit ? (company.location || '') : '';
  el('field_capacityOrScale').value = isEdit ? (company.capacityOrScale || '') : '';
  el('field_liquidCooling').value = isEdit ? (company.liquidCooling || 'Liquid Cooled - Type Not Specified') : 'Liquid Cooled - Type Not Specified';
  if (el('field_productionStage')) {
    el('field_productionStage').value = isEdit ? (company.productionStage || 'Pilot / Prototype Stage') : 'Pilot / Prototype Stage';
  }
  const parsedTime = parseStartTime(isEdit ? company.coolantStartDate : 'Oct 2025');
  if (el('field_coolantStartMonth')) {
    el('field_coolantStartMonth').value = parsedTime.isAlreadyActive ? 'Already Active' : parsedTime.month;
  }
  if (el('field_coolantStartYear')) {
    el('field_coolantStartYear').value = parsedTime.year || '2025';
    el('field_coolantStartYear').classList.toggle('opacity-35', parsedTime.isAlreadyActive);
    el('field_coolantStartYear').classList.toggle('pointer-events-none', parsedTime.isAlreadyActive);
  }
  if (el('field_coolantStartDate')) {
    el('field_coolantStartDate').value = formatStartTime(parsedTime.month, parsedTime.year);
  }
  el('field_monthlyCoolantLiters').value = isEdit ? (company.monthlyCoolantLiters ?? '') : '';
  el('field_notes').value = isEdit ? (company.notes || '') : '';
  el('field_contactPerson').value = isEdit ? (company.contactPerson || '') : '';
  el('field_mobile').value = isEdit ? (company.mobile || '') : '';
  el('field_source').value = isEdit ? (company.source || '') : '';
  el('field_status').value = isEdit ? (company.status || 'Not Contacted') : 'Not Contacted';
  el('field_priority').value = isEdit ? (company.priority || 'Medium') : 'Medium';
  el('field_nextAction').value = isEdit ? (company.nextAction || '') : '';
  el('field_nextActionDate').value = isEdit ? (company.nextActionDate || '') : '';

  el('drawerDeleteBtn').classList.toggle('hidden', !isEdit);

  el('drawerBackdrop').classList.remove('hidden');
  el('drawerPanel').classList.remove('translate-x-full');
}

function closeDrawer() {
  el('drawerPanel').classList.add('translate-x-full');
  setTimeout(() => {
    el('drawerBackdrop').classList.add('hidden');
  }, 250);
}

// ---------------------------------------------------------------------
// Export for Management Dialog (Screen 3)
// ---------------------------------------------------------------------

function openExportModal() {
  el('exportModalBackdrop').classList.remove('hidden');
  updateSelectedColCount();
}

function closeExportModal() {
  el('exportModalBackdrop').classList.add('hidden');
}

function updateSelectedColCount() {
  const checkboxes = document.querySelectorAll('#exportConfigForm input[name="column_select"], #exportConfigForm .col-checkbox');
  const checked = [...checkboxes].filter((cb) => cb.checked).length + 1; // +1 for locked Company Name
  el('selectedColCountBadge').textContent = `${checked} active columns`;
}

function setColumnPreset(presetName) {
  const checkboxes = document.querySelectorAll('#exportConfigForm .col-checkbox');
  let targetCols = [];

  if (presetName === 'exec') {
    targetCols = ['type', 'priority', 'status', 'nextAction', 'nextActionDate'];
  } else if (presetName === 'all') {
    targetCols = ['type', 'location', 'capacityOrScale', 'categoryOrRole', 'liquidCooling', 'monthlyCoolantLiters', 'notes', 'source', 'priority', 'status', 'nextAction', 'nextActionDate', 'contactPerson', 'mobile'];
  } else if (presetName === 'immersion') {
    targetCols = ['type', 'location', 'capacityOrScale', 'liquidCooling', 'monthlyCoolantLiters', 'notes', 'priority', 'status'];
  }

  checkboxes.forEach((cb) => {
    cb.checked = targetCols.includes(cb.value);
  });
  updateSelectedColCount();
}

// ---------------------------------------------------------------------
// Setup Event Listeners
// ---------------------------------------------------------------------

function setupEventListeners() {
  const TAB_THEMES = {
    'tab-companies': {
      activeNav: 'nav-tab active px-3.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
      inactiveNav: 'nav-tab px-3.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 whitespace-nowrap transition-all text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 border border-transparent hover:border-cyan-500/30',
      activeSidebar: 'sidebar-btn active w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_14px_rgba(6,182,212,0.4)]',
      inactiveSidebar: 'sidebar-btn w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition-all'
    },
    'tab-agenda': {
      activeNav: 'nav-tab active px-3.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all text-amber-300 bg-amber-950/80 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      inactiveNav: 'nav-tab px-3.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 whitespace-nowrap transition-all text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 border border-transparent hover:border-amber-500/30',
      activeSidebar: 'sidebar-btn active w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_0_14px_rgba(245,158,11,0.4)]',
      inactiveSidebar: 'sidebar-btn w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition-all'
    },
    'tab-export-mfrs': {
      activeNav: 'nav-tab active px-3.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all text-sky-300 bg-sky-950/80 border border-sky-500/50 shadow-[0_0_12px_rgba(14,165,233,0.25)]',
      inactiveNav: 'nav-tab px-3.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 whitespace-nowrap transition-all text-slate-300 hover:text-sky-300 hover:bg-slate-800/60 border border-transparent hover:border-sky-500/30',
      activeSidebar: 'sidebar-btn active w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_0_14px_rgba(14,165,233,0.4)]',
      inactiveSidebar: 'sidebar-btn w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-sky-300 transition-all'
    },
    'tab-kanban': {
      activeNav: 'nav-tab active px-3.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all text-amber-300 bg-amber-950/80 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      inactiveNav: 'nav-tab px-3.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 whitespace-nowrap transition-all text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 border border-transparent hover:border-amber-500/30',
      activeSidebar: 'sidebar-btn active w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_0_14px_rgba(245,158,11,0.4)]',
      inactiveSidebar: 'sidebar-btn w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition-all'
    },
    'tab-monthly-demand': {
      activeNav: 'nav-tab active px-3.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
      inactiveNav: 'nav-tab px-3.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 whitespace-nowrap transition-all text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60 border border-transparent hover:border-emerald-500/30',
      activeSidebar: 'sidebar-btn active w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_0_14px_rgba(16,185,129,0.4)]',
      inactiveSidebar: 'sidebar-btn w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-emerald-300 transition-all'
    },
    'tab-analytics': {
      activeNav: 'nav-tab active px-3.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all text-purple-300 bg-purple-950/80 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
      inactiveNav: 'nav-tab px-3.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 whitespace-nowrap transition-all text-slate-300 hover:text-purple-300 hover:bg-slate-800/60 border border-transparent hover:border-purple-500/30',
      activeSidebar: 'sidebar-btn active w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-[0_0_14px_rgba(168,85,247,0.4)]',
      inactiveSidebar: 'sidebar-btn w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-purple-300 transition-all'
    },
    'tab-reports': {
      activeNav: 'nav-tab active px-3.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all text-rose-300 bg-rose-950/80 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
      inactiveNav: 'nav-tab px-3.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 whitespace-nowrap transition-all text-slate-300 hover:text-rose-300 hover:bg-slate-800/60 border border-transparent hover:border-rose-500/30',
      activeSidebar: 'sidebar-btn active w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_0_14px_rgba(244,63,94,0.4)]',
      inactiveSidebar: 'sidebar-btn w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-rose-300 transition-all'
    }
  };

  const updateTabNav = (tabId) => {
    document.querySelectorAll('#mainNav .nav-tab').forEach((t) => {
      const id = t.dataset.tab;
      const theme = TAB_THEMES[id] || TAB_THEMES['tab-companies'];
      t.className = (id === tabId) ? theme.activeNav : theme.inactiveNav;
    });

    document.querySelectorAll('#sidebarNav .sidebar-btn').forEach((s) => {
      const id = s.dataset.tab;
      const theme = TAB_THEMES[id] || TAB_THEMES['tab-companies'];
      s.className = (id === tabId) ? theme.activeSidebar : theme.inactiveSidebar;
    });
  };

  // Initial tab style sync
  updateTabNav(activeTab);

  // Navigation Tabs (Top bar + sidebar)
  const navButtons = document.querySelectorAll('#mainNav .nav-tab, #sidebarNav .sidebar-btn');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      if (!tabId) return;
      activeTab = tabId;
      updateTabNav(tabId);

      // Toggle views
      document.querySelectorAll('.workspace-tab').forEach((view) => {
        view.classList.toggle('hidden', view.id !== tabId);
        view.classList.toggle('block', view.id === tabId);
      });

      if (tabId === 'tab-agenda') renderActionAgendaTab();
      if (tabId === 'tab-export-mfrs') renderExportManufacturers();
      if (tabId === 'tab-kanban') renderKanban();
      if (tabId === 'tab-monthly-demand') renderMonthlyDemand();
      if (tabId === 'tab-analytics') renderAnalytics();
      if (tabId === 'tab-reports') renderReports();
    });
  });

  // Table vs Kanban switchers in table toolbar
  el('switchTableViewBtn')?.addEventListener('click', () => {
    document.querySelector('#mainNav button[data-tab="tab-companies"]')?.click();
  });
  el('switchKanbanViewBtn')?.addEventListener('click', () => {
    document.querySelector('#mainNav button[data-tab="tab-kanban"]')?.click();
  });
  el('jumpToMonthlyDemandBtn')?.addEventListener('click', () => {
    document.querySelector('#mainNav button[data-tab="tab-monthly-demand"]')?.click();
  });

  // Global Header Company Search (Tier 1 Header)
  el('globalCompanySearch')?.addEventListener('input', (e) => {
    const val = e.target.value;
    // Route search string to active tab or sync across inputs
    if (activeTab === 'tab-companies') {
      if (el('searchInput')) el('searchInput').value = val;
      renderAllViews();
    } else if (activeTab === 'tab-export-mfrs') {
      if (el('exportMfrSearchInput')) el('exportMfrSearchInput').value = val;
      renderExportManufacturers();
    } else if (activeTab === 'tab-kanban') {
      if (el('kanbanSearchInput')) el('kanbanSearchInput').value = val;
      renderKanban();
    } else if (activeTab === 'tab-monthly-demand') {
      if (el('monthlySearchInput')) el('monthlySearchInput').value = val;
      renderMonthlyDemand();
    } else if (activeTab === 'tab-analytics') {
      if (el('analyticsSearchInput')) el('analyticsSearchInput').value = val;
      renderAnalytics();
    } else if (activeTab === 'tab-reports') {
      if (el('reportSearchInput')) el('reportSearchInput').value = val;
      renderReports();
    }
  });

  // Export Manufacturers Search & Filter listeners
  el('exportMfrSearchInput')?.addEventListener('input', renderExportManufacturers);
  el('exportMfrCoolingFilter')?.addEventListener('change', renderExportManufacturers);
  el('exportMfrStatusFilter')?.addEventListener('change', renderExportManufacturers);
  el('exportMfrPriorityFilter')?.addEventListener('change', renderExportManufacturers);
  el('exportMfrResetBtn')?.addEventListener('click', () => {
    if (el('exportMfrSearchInput')) el('exportMfrSearchInput').value = '';
    if (el('exportMfrCoolingFilter')) el('exportMfrCoolingFilter').value = '';
    if (el('exportMfrStatusFilter')) el('exportMfrStatusFilter').value = '';
    if (el('exportMfrPriorityFilter')) el('exportMfrPriorityFilter').value = '';
    renderExportManufacturers();
  });

  // Kanban Search Input listener
  el('kanbanSearchInput')?.addEventListener('input', () => {
    renderKanban();
  });

  // Monthly Demand Search & Filter listeners
  el('monthlySearchInput')?.addEventListener('input', () => {
    renderMonthlyDemand();
  });
  el('monthlyCoolingFilter')?.addEventListener('change', () => {
    renderMonthlyDemand();
  });
  el('monthlyStageFilter')?.addEventListener('change', () => {
    renderMonthlyDemand();
  });

  // Analytics Search Input listener
  el('analyticsSearchInput')?.addEventListener('input', () => {
    renderAnalytics();
  });

  // Management Report Search Input listener
  el('reportSearchInput')?.addEventListener('input', () => {
    renderReports();
  });

  // Quick Contact Modal listeners
  el('closeQuickContactModalBtn')?.addEventListener('click', closeQuickContactModal);
  el('quickContactCancelBtn')?.addEventListener('click', closeQuickContactModal);
  el('quickContactModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'quickContactModalBackdrop') closeQuickContactModal();
  });

  // Open full drawer from quick contact modal
  el('quickContactFullDrawerBtn')?.addEventListener('click', () => {
    const id = el('quickContactCompanyId').value;
    const company = companies.find((c) => c.id === id);
    closeQuickContactModal();
    if (company) openDrawer(company);
  });

  // Add contact row button
  el('addContactRowBtn')?.addEventListener('click', () => {
    currentModalContacts.push({
      name: '',
      designation: '',
      mobile: '',
      isPrimary: currentModalContacts.length === 0,
    });
    renderQuickContactRows();
    const inputs = el('quickContactsList')?.querySelectorAll('.contact-name-input');
    if (inputs && inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  });

  // Save all contacts button
  el('saveAllContactsBtn')?.addEventListener('click', async () => {
    const id = el('quickContactCompanyId').value;
    if (!id) return;

    // Filter out rows where both name and mobile are empty
    const valid = currentModalContacts
      .map((c) => ({
        name: (c.name || '').trim(),
        designation: (c.designation || '').trim(),
        mobile: (c.mobile || '').trim(),
        isPrimary: Boolean(c.isPrimary),
      }))
      .filter((c) => c.name || c.mobile);

    if (valid.length === 0) {
      showToast('Please enter at least one contact name or phone number.', true);
      return;
    }

    if (!valid.some((c) => c.isPrimary)) {
      valid[0].isPrimary = true;
    }

    try {
      showToast(`Saving ${valid.length} contact${valid.length === 1 ? '' : 's'} to Excel...`);
      const updated = await api(`/api/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ contacts: valid }),
      });

      companies = companies.map((c) => (c.id === id ? updated : c));
      closeQuickContactModal();
      renderAllViews();
      showToast(`Saved ${valid.length} contact${valid.length === 1 ? '' : 's'} for ${updated.company}`);
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // Drawer Liters Presets
  document.querySelectorAll('.preset-liters-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      if (val !== undefined && el('field_monthlyCoolantLiters')) {
        el('field_monthlyCoolantLiters').value = val;
      }
    });
  });

  // Drawer Start Time Month/Year & Presets
  const updateDrawerStartTimeState = () => {
    const month = el('field_coolantStartMonth')?.value;
    const yearSel = el('field_coolantStartYear');
    const isAct = month === 'Already Active';
    if (yearSel) {
      yearSel.classList.toggle('opacity-35', isAct);
      yearSel.classList.toggle('pointer-events-none', isAct);
    }
    const year = yearSel ? yearSel.value : '2025';
    if (el('field_coolantStartDate')) {
      el('field_coolantStartDate').value = formatStartTime(month, year);
    }
  };

  el('field_coolantStartMonth')?.addEventListener('change', updateDrawerStartTimeState);
  el('field_coolantStartYear')?.addEventListener('change', updateDrawerStartTimeState);

  document.querySelectorAll('.preset-time-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.month;
      const y = btn.dataset.year;
      if (m && el('field_coolantStartMonth')) {
        el('field_coolantStartMonth').value = m;
      }
      if (y && el('field_coolantStartYear')) {
        el('field_coolantStartYear').value = y;
      }
      updateDrawerStartTimeState();
    });
  });

  // Table Sorting
  document.querySelectorAll('#companyTable th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) {
        sortDir = sortDir * -1;
      } else {
        sortKey = key;
        sortDir = 1;
      }
      renderTable();
    });
  });

  // Search & Filter change
  ['searchInput', 'typeFilter', 'statusFilter', 'priorityFilter', 'coolingFilter'].forEach((id) => {
    el(id).addEventListener('input', () => {
      renderAllViews();
    });
    el(id).addEventListener('change', () => {
      renderAllViews();
    });
  });

  // Quick filter Immersion
  el('quickImmersionBtn')?.addEventListener('click', () => {
    quickFilterImmersion = !quickFilterImmersion;
    el('quickImmersionBtn').classList.toggle('bg-secondary', quickFilterImmersion);
    el('quickImmersionBtn').classList.toggle('text-on-secondary', quickFilterImmersion);
    renderAllViews();
  });

  // Quick filter Export Manufacturers
  el('quickExportMfrBtn')?.addEventListener('click', () => {
    quickFilterExportMfr = !quickFilterExportMfr;
    el('quickExportMfrBtn').classList.toggle('bg-sky-600', quickFilterExportMfr);
    el('quickExportMfrBtn').classList.toggle('text-white', quickFilterExportMfr);
    el('quickExportMfrBtn').classList.toggle('bg-sky-100', !quickFilterExportMfr);
    el('quickExportMfrBtn').classList.toggle('text-sky-900', !quickFilterExportMfr);
    renderAllViews();
  });

  // Quick reset
  const resetFilters = () => {
    el('searchInput').value = '';
    el('typeFilter').value = '';
    el('statusFilter').value = '';
    el('priorityFilter').value = '';
    el('coolingFilter').value = '';
    quickFilterImmersion = false;
    quickFilterExportMfr = false;
    el('quickImmersionBtn')?.classList.remove('bg-secondary', 'text-on-secondary');
    el('quickExportMfrBtn')?.classList.remove('bg-sky-600', 'text-white');
    el('quickExportMfrBtn')?.classList.add('bg-sky-100', 'text-sky-900');
    renderAllViews();
  };
  el('quickResetBtn')?.addEventListener('click', resetFilters);
  el('emptyResetBtn')?.addEventListener('click', resetFilters);

  // Add Account Buttons (Header, Table toolbar, Kanban, Monthly demand)
  document.querySelectorAll('#openAddBtn, #tableAddAccountBtn, #kanbanAddAccountBtn, #monthlyAddAccountBtn, .add-account-btn').forEach((btn) => {
    btn.addEventListener('click', () => openDrawer(null));
  });
  el('closeDrawerBtn').addEventListener('click', closeDrawer);
  el('drawerCancelBtn').addEventListener('click', closeDrawer);
  el('drawerBackdrop').addEventListener('click', closeDrawer);

  el('openExportBtn').addEventListener('click', openExportModal);
  el('closeExportModalBtn').addEventListener('click', closeExportModal);
  el('exportCancelBtn').addEventListener('click', closeExportModal);
  el('exportModalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'exportModalBackdrop') closeExportModal();
  });

  // Spec modal
  el('openSpecModalBtn').addEventListener('click', () => {
    el('specModalBackdrop').classList.remove('hidden');
  });
  el('closeSpecModalBtn').addEventListener('click', () => {
    el('specModalBackdrop').classList.add('hidden');
  });
  el('specModalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'specModalBackdrop') el('specModalBackdrop').classList.add('hidden');
  });

  // Sync Sheets
  el('topSyncBtn').addEventListener('click', async () => {
    try {
      showToast('Syncing reference sheets from Excel...');
      const res = await api('/api/sync', { method: 'POST' });
      await loadCompanies();
      showToast(res.added > 0 ? `Synced! Added ${res.added} new companies.` : 'Database is up to date.');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // Bulk actions
  el('bulkClearBtn').addEventListener('click', () => {
    selectedIds.clear();
    renderTable();
  });
  el('bulkExportBtn').addEventListener('click', () => {
    openExportModal();
  });

  // Export Modal Presets & Radio Cards
  el('presetExecBtn').addEventListener('click', () => setColumnPreset('exec'));
  el('presetAllBtn').addEventListener('click', () => setColumnPreset('all'));
  el('presetImmersionBtn').addEventListener('click', () => setColumnPreset('immersion'));

  document.querySelectorAll('#exportConfigForm .col-checkbox').forEach((cb) => {
    cb.addEventListener('change', updateSelectedColCount);
  });

  document.querySelectorAll('.export-format-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.export-format-card').forEach((c) => {
        c.className = 'export-format-card relative flex flex-col p-3 rounded-lg cursor-pointer transition-all bg-surface-container-low hover:bg-surface-container text-left border border-outline-variant/40';
        c.querySelector('input').checked = false;
      });
      card.className = 'export-format-card relative flex flex-col p-3 rounded-lg cursor-pointer transition-all bg-surface-container-high ring-2 ring-secondary shadow-sm text-left';
      card.querySelector('input').checked = true;
    });
  });

  // Scope toggle in export modal
  el('exportScopeFilteredBtn').addEventListener('click', () => {
    exportScope = 'filtered';
    el('exportScopeFilteredBtn').className = 'px-2.5 py-1 rounded bg-primary text-on-primary text-[11px] font-semibold transition-all';
    el('exportScopeAllBtn').className = 'px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface text-[11px] font-semibold transition-all';
  });
  el('exportScopeAllBtn').addEventListener('click', () => {
    exportScope = 'all';
    el('exportScopeAllBtn').className = 'px-2.5 py-1 rounded bg-primary text-on-primary text-[11px] font-semibold transition-all';
    el('exportScopeFilteredBtn').className = 'px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface text-[11px] font-semibold transition-all';
  });

  // Export Form Submit
  el('exportConfigForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const format = document.querySelector('input[name="exportFormat"]:checked')?.value || 'xlsx';
    const checkboxes = document.querySelectorAll('#exportConfigForm .col-checkbox:checked');
    const cols = ['company', ...[...checkboxes].map((cb) => cb.value)];

    let ids = null;
    if (exportScope === 'filtered') {
      const filtered = getFilteredCompanies();
      ids = selectedIds.size > 0 ? [...selectedIds] : filtered.map((c) => c.id);
    }

    try {
      showToast('Generating report file...');
      const res = await fetch('/api/export-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: cols, format, ids }),
      });
      if (!res.ok) throw new Error('Export generation failed.');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? 'BESS_Outreach_Summary.csv' : 'BESS_Outreach_Summary.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      closeExportModal();
      showToast('Downloaded report successfully.');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // Drawer Form Submit (Add / Edit)
  el('companyDrawerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = el('field_id').value;
    const startMonth = el('field_coolantStartMonth')?.value || 'Oct';
    const startYear = el('field_coolantStartYear')?.value || '2025';
    const formattedStartTime = formatStartTime(startMonth, startYear);
    const payload = {
      company: el('field_company').value.trim(),
      type: el('field_type').value,
      location: el('field_location').value.trim(),
      capacityOrScale: el('field_capacityOrScale').value.trim(),
      categoryOrRole: el('field_categoryOrRole').value.trim(),
      liquidCooling: el('field_liquidCooling').value,
      productionStage: el('field_productionStage')?.value || 'Pilot / Prototype Stage',
      coolantStartDate: formattedStartTime,
      monthlyCoolantLiters: Number(el('field_monthlyCoolantLiters').value) || 0,
      notes: el('field_notes').value.trim(),
      contactPerson: el('field_contactPerson').value.trim(),
      mobile: el('field_mobile').value.trim(),
      source: el('field_source').value.trim(),
      status: el('field_status').value,
      priority: el('field_priority').value,
      nextAction: el('field_nextAction').value.trim(),
      nextActionDate: el('field_nextActionDate').value,
    };

    if (!payload.company) {
      showToast('Company name is required.', true);
      return;
    }

    try {
      if (id) {
        const updated = await api(`/api/companies/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        companies = companies.map((c) => (c.id === id ? updated : c));
        showToast(`Saved changes for ${payload.company}`);
      } else {
        const created = await api('/api/companies', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        companies.push(created);
        showToast(`Added ${payload.company} to database`);
      }
      closeDrawer();
      renderAllViews();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // Drawer Delete Record
  el('drawerDeleteBtn').addEventListener('click', async () => {
    const id = el('field_id').value;
    const company = companies.find((c) => c.id === id);
    if (!id || !company) return;
    if (!confirm(`Are you sure you want to remove "${company.company}" from the tracker? This updates the Excel file.`)) return;

    try {
      await api(`/api/companies/${id}`, { method: 'DELETE' });
      companies = companies.filter((c) => c.id !== id);
      selectedIds.delete(id);
      closeDrawer();
      renderAllViews();
      showToast('Company removed from database.');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // Management Report Print & Copy
  el('printReportBtn').addEventListener('click', () => {
    window.print();
  });
  el('copyReportBtn').addEventListener('click', () => {
    const text = el('reportContent').innerText;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied summary memo to clipboard.');
    }).catch(() => {
      showToast('Failed to copy text.', true);
    });
  });
}

// ---------------------------------------------------------------------
// Boot Application
// ---------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', init);
