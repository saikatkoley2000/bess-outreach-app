// excelStore.js
//
// This is the only file that touches the Excel workbook. Everything else
// (server.js, the frontend) goes through the functions exported at the
// bottom of this file.
//
// How it works:
//  - Your original four data sheets ("Contacts + Details (Existing)",
//    "New Mfrs - Operational", "New Mfrs - Announced Planned",
//    "BESS Project Developers") are treated as READ-ONLY reference data.
//    The app never edits them.
//  - The first time the app runs, it reads those four sheets and builds a
//    new sheet called "App Data" inside the SAME workbook. That sheet is
//    the app's live database: every add/edit/status-update from the web
//    app is written back into "App Data" in this file, on disk, so the
//    Excel file always reflects the current state of the app.
//  - You can open the .xlsx file directly in Excel at any time; you'll see
//    your original sheets untouched, plus the "App Data" sheet the app
//    manages.

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function resolveDataFile() {
  if (process.env.BESS_XLSX_PATH && fs.existsSync(process.env.BESS_XLSX_PATH)) {
    return process.env.BESS_XLSX_PATH;
  }
  const candidates = [
    path.resolve(__dirname, '..', 'data', 'BESS_Company_Contacts_Updated1.xlsx'),
    path.resolve(__dirname, '..', '..', 'BESS_Company_Contacts_Updated1.xlsx'),
    path.resolve(__dirname, '..', 'BESS_Company_Contacts_Updated1.xlsx'),
    path.resolve(__dirname, '..', 'data', 'BESS_Company_Contacts_Updated.xlsx'),
    path.resolve(__dirname, '..', '..', 'BESS_Company_Contacts_Updated.xlsx'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

const DATA_FILE = resolveDataFile();

const APP_SHEET = 'App Data';

const FIELDS = [
  ['id', 'ID'],
  ['company', 'Company'],
  ['type', 'Type'],
  ['location', 'Location'],
  ['contactPerson', 'Contact Person'],
  ['mobile', 'Mobile / WhatsApp'],
  ['capacityOrScale', 'Capacity / Scale'],
  ['categoryOrRole', 'Category / Role'],
  ['liquidCooling', 'Liquid Cooling'],
  ['monthlyCoolantLiters', 'Monthly Coolant Req (Liters)'],
  ['coolantStartDate', 'Coolant Req Start Time (Tentative)'],
  ['productionStage', 'Production / Commercial Stage'],
  ['notes', 'Notes'],
  ['source', 'Source'],
  ['status', 'Status'],
  ['priority', 'Priority'],
  ['nextAction', 'Next Action'],
  ['nextActionDate', 'Next Action Date'],
  ['contacts', 'All Contacts (JSON)'],
  ['activities', 'All Activities (JSON)'],
  ['lastUpdated', 'Last Updated'],
];
const COL_WIDTHS = [8, 28, 24, 20, 20, 20, 34, 26, 16, 26, 22, 28, 40, 26, 16, 10, 30, 16, 30, 30, 14];

function normalizeActivities(rec) {
  if (Array.isArray(rec.activities) && rec.activities.length > 0) {
    return rec.activities.map((a, i) => ({
      id: a.id || `act_${Date.now()}_${i}`,
      date: a.date || today(),
      type: a.type || 'Note / Update',
      text: (a.text || a.comment || '').trim(),
      timestamp: a.timestamp || new Date().toISOString(),
    })).filter((a) => a.text);
  }
  if (typeof rec.activities === 'string' && rec.activities.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(rec.activities);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((a, i) => ({
          id: a.id || `act_${Date.now()}_${i}`,
          date: a.date || today(),
          type: a.type || 'Note / Update',
          text: (a.text || a.comment || '').trim(),
          timestamp: a.timestamp || new Date().toISOString(),
        })).filter((a) => a.text);
      }
    } catch (e) {}
  }
  const items = [];
  const existingNotes = String(rec.notes || '').trim();
  if (existingNotes) {
    items.push({
      id: `act_init_${rec.id || '0'}`,
      date: rec.lastUpdated || today(),
      type: 'Note / Update',
      text: existingNotes,
      timestamp: new Date().toISOString(),
    });
  }
  return items;
}

function normalizeContacts(rec) {
  if (Array.isArray(rec.contacts) && rec.contacts.length > 0) {
    return rec.contacts.map((c, i) => ({
      name: (c.name || '').trim(),
      designation: (c.designation || '').trim(),
      mobile: (c.mobile || '').trim(),
      isPrimary: c.isPrimary !== undefined ? Boolean(c.isPrimary) : i === 0,
    })).filter((c) => c.name || c.mobile);
  }
  if (typeof rec.contacts === 'string' && rec.contacts.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(rec.contacts);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c, i) => ({
          name: (c.name || '').trim(),
          designation: (c.designation || '').trim(),
          mobile: (c.mobile || '').trim(),
          isPrimary: c.isPrimary !== undefined ? Boolean(c.isPrimary) : i === 0,
        })).filter((c) => c.name || c.mobile);
      }
    } catch (e) {}
  }
  // Fallback from legacy contactPerson & mobile
  const rawPersons = String(rec.contactPerson || '').trim();
  const rawMobiles = String(rec.mobile || '').trim();
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
    let designation = rec.categoryOrRole || '';
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

function estimateMonthlyLiters(rec) {
  const name = (rec.company || '').toLowerCase();
  // Preserve user-specified volumes
  if (name.includes('lineage')) return 40000;
  if (name.includes('power trac') || name.includes('powertrac')) return 10000;
  if (name.includes('amperehour') || name.includes('ampere hour')) return 2000;
  // All other accounts reset to 1 in initial stage per user specification
  return 1;
}

function defaultProductionStage(rec) {
  const name = (rec.company || '').toLowerCase();
  const source = (rec.source || '').toLowerCase();
  const type = (rec.type || '').toLowerCase();
  if (name.includes('lineage') || name.includes('power trac') || name.includes('powertrac') || name.includes('amperehour') || name.includes('ampere hour')) {
    return 'Already in Production';
  }
  if (source.includes('operational') || type.includes('operational')) {
    return 'Already in Production';
  }
  if (source.includes('announced') || source.includes('planned') || type.includes('announced') || type.includes('planned')) {
    return 'Commercial Production Starting Soon';
  }
  return 'Pilot / Prototype Stage';
}

function defaultCoolantStartDate(rec, stage) {
  if (stage === 'Already in Production') return 'Already Active';
  const source = (rec.source || '').toLowerCase();
  const type = (rec.type || '').toLowerCase();
  if (source.includes('announced') || source.includes('planned') || type.includes('announced') || type.includes('planned')) {
    return '2025-08';
  }
  return '2025-10';
}

const STATUS_OPTIONS = [
  'Not Contacted', 'Contacted', 'In Discussion', 'Sample / Trial Sent',
  'Technical Evaluation', 'Commercial Discussion', 'Won', 'Lost', 'On Hold',
];
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

const PRODUCTION_STAGE_OPTIONS = [
  'Already in Production',
  'Commercial Production Starting Soon',
  'Pilot / Prototype Stage',
  'Under Setup / Plant Commissioning',
  'R&D / Qualification Stage',
  'Announced / Feasibility Planned',
  'Air Cooled / Not Applicable',
];

const TYPE_OPTIONS = [
  'New Mfr - Operational',
  'New Mfr - Announced/Planned',
  'Existing Contact',
  'Export Manufacturer',
  'Project Developer',
  'Other / Custom',
];

// Cooling-type taxonomy. This is the field that actually decides whether a
// dielectric coolant fluid is relevant at all: Immersion Cooled means the
// fluid bathes the cells directly (a direct fit for QuantiCool); DLC / Cold
// Plate means coolant runs through a sealed cold-plate loop that usually
// uses plain water-glycol, not a dielectric fluid (a weaker fit unless
// they're exploring a two-phase/hybrid design). "Type Not Specified" means
// a source confirmed "liquid cooled" generically without saying which —
// that's exactly what a first call should nail down.
const COOLING_OPTIONS = [
  'Immersion Cooled',
  'DLC / Cold Plate',
  'Liquid Cooled - Type Not Specified',
  'Air Cooled',
  'Not Stated',
  'Unknown',
  'Indirect (via their OEM)',
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------
// Low-level workbook helpers
// ---------------------------------------------------------------------

function loadWorkbook() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(
      `Excel file not found at ${DATA_FILE}. Place your BESS_Company_Contacts_Updated.xlsx there, ` +
      `or set the BESS_XLSX_PATH environment variable to point at it.`
    );
  }
  return XLSX.readFile(DATA_FILE);
}

function saveWorkbook(wb) {
  try {
    XLSX.writeFile(wb, DATA_FILE);
  } catch (err) {
    console.warn(`Could not save to ${DATA_FILE}:`, err.message);
  }
  // If a secondary copy exists in parent workspace, keep it synchronized
  try {
    const parentCopy = path.resolve(__dirname, '..', '..', 'BESS_Company_Contacts_Updated1.xlsx');
    if (parentCopy !== DATA_FILE && fs.existsSync(parentCopy)) {
      XLSX.writeFile(wb, parentCopy);
    }
  } catch (e) {}
}

// Your reference sheets have a title banner + notice rows above the real
// header row, so we scan for the row whose first cell is literally "No."
function findHeaderRowIndex(sheet) {
  if (!sheet || !sheet['!ref']) return 0;
  const range = XLSX.utils.decode_range(sheet['!ref']);
  for (let r = range.s.r; r <= range.e.r; r++) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    if (cell && String(cell.v).trim() === 'No.') return r;
  }
  return 0;
}

function sheetToRecords(sheet) {
  if (!sheet) return [];
  const headerRow = findHeaderRowIndex(sheet);
  return XLSX.utils.sheet_to_json(sheet, { range: headerRow, defval: '' });
}

function nextId(existingRecords) {
  let max = 0;
  existingRecords.forEach((r) => {
    const m = /^C(\d+)$/.exec(r.id || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return 'C' + String(max + 1).padStart(4, '0');
}

// ---------------------------------------------------------------------
// One-time migration: build unified records from your four reference sheets
// ---------------------------------------------------------------------

function migrateFromSourceSheets(wb) {
  const records = [];
  const push = (rec) => {
    rec.id = nextId(records);
    rec.status = rec.status || 'Not Contacted';
    rec.nextAction = rec.nextAction || '';
    rec.nextActionDate = rec.nextActionDate || '';
    rec.monthlyCoolantLiters = rec.monthlyCoolantLiters !== undefined ? rec.monthlyCoolantLiters : estimateMonthlyLiters(rec);
    rec.lastUpdated = today();
    records.push(rec);
  };

  // 1. Existing 48 contacts + descriptions
  sheetToRecords(wb.Sheets['Contacts + Details (Existing)']).forEach((row) => {
    if (!row['Company']) return;
    push({
      company: row['Company'] || '',
      type: 'Existing Contact',
      location: row['Address / location in chat'] || '',
      contactPerson: row['Concerned person / role'] || '',
      mobile: row['Mobile / WhatsApp'] || '',
      capacityOrScale: [row['Capacity / size stated'], row['Capacity status / meaning']]
        .filter(Boolean).join(' — '),
      categoryOrRole: [row['Business category'], row['Lead origin']].filter(Boolean).join(' | '),
      liquidCooling: 'Unknown',
      notes: row['Description / possible coolant discussion'] || '',
      source: [row['Source messages / contact card'], row['Phone identity evidence']]
        .filter(Boolean).join(' | '),
      priority: 'Medium',
    });
  });

  // 2. New manufacturers - operational
  sheetToRecords(wb.Sheets['New Mfrs - Operational']).forEach((row) => {
    if (!row['Company (Parent/Group)']) return;
    const confirmed = /^\s*confirmed\b/i.test(row['Liquid-cooling evidence'] || '');
    push({
      company: row['Company (Parent/Group)'] || '',
      type: 'New Mfr - Operational',
      location: row['Location'] || '',
      contactPerson: '',
      mobile: '',
      capacityOrScale: row['What is operational now'] || '',
      categoryOrRole: row['Type'] || '',
      // Sources confirmed "liquid cooled" generically, not which sub-type —
      // leave that for the app's cooling-type field to be set once you
      // confirm DLC vs immersion directly with the company.
      liquidCooling: confirmed ? 'Liquid Cooled - Type Not Specified' : 'Not Stated',
      notes: row['Coolant outreach angle'] || '',
      source: row['Source / date'] || '',
      priority: confirmed ? 'High' : 'Medium',
    });
  });

  // 3. New manufacturers - announced / planned
  sheetToRecords(wb.Sheets['New Mfrs - Announced Planned']).forEach((row) => {
    if (!row['Company (Parent/Group)']) return;
    push({
      company: row['Company (Parent/Group)'] || '',
      type: 'New Mfr - Announced/Planned',
      location: row['Location'] || '',
      contactPerson: '',
      mobile: '',
      capacityOrScale: [
        row['Announced plan / capacity'],
        row['Target start / commissioning'] ? `Target: ${row['Target start / commissioning']}` : '',
      ].filter(Boolean).join(' | '),
      categoryOrRole: row['Type'] || '',
      liquidCooling: /^\s*confirmed\b/i.test(row['Liquid-cooling evidence'] || '')
        ? 'Liquid Cooled - Type Not Specified' : 'Not Stated',
      notes: row['Coolant outreach angle'] || '',
      source: row['Source / date'] || '',
      priority: 'Medium',
    });
  });

  // 4. BESS project developers (kept as a distinct type, not a manufacturer)
  sheetToRecords(wb.Sheets['BESS Project Developers']).forEach((row) => {
    if (!row['Company (Parent/Group)']) return;
    push({
      company: row['Company (Parent/Group)'] || '',
      type: 'Project Developer',
      location: row['Location'] || '',
      contactPerson: '',
      mobile: '',
      capacityOrScale: [row['Project / deployment details'], row['Status / timeline']]
        .filter(Boolean).join(' | '),
      categoryOrRole: row['Role'] || '',
      liquidCooling: 'Indirect (via their OEM)',
      notes: row['Coolant relevance'] || '',
      source: row['Source / date'] || '',
      priority: 'Low',
    });
  });

  return records;
}

// ---------------------------------------------------------------------
// App Data sheet read/write
// ---------------------------------------------------------------------

function readAppDataSheet(wb) {
  const ws = wb.Sheets[APP_SHEET];
  if (!ws) return null;
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  let needsSave = false;
  const records = rows.map((row) => {
    const rec = {};
    FIELDS.forEach(([key, header]) => { rec[key] = row[header] ?? ''; });
    if (!rec.coolantStartDate && row['Coolant Req Start Date (Tentative)']) {
      rec.coolantStartDate = row['Coolant Req Start Date (Tentative)'];
      needsSave = true;
    }
    if (rec.monthlyCoolantLiters === '' || rec.monthlyCoolantLiters === undefined || isNaN(Number(rec.monthlyCoolantLiters))) {
      rec.monthlyCoolantLiters = estimateMonthlyLiters(rec);
      needsSave = true;
    } else {
      rec.monthlyCoolantLiters = Number(rec.monthlyCoolantLiters);
    }
    if (!rec.productionStage) {
      rec.productionStage = defaultProductionStage(rec);
      needsSave = true;
    }
    if (!rec.coolantStartDate) {
      rec.coolantStartDate = defaultCoolantStartDate(rec, rec.productionStage);
      needsSave = true;
    }
    const EXPORT_KEYS = ['hithium', 'catl', 'saft', 'rept', 'full top source', 'samsung c&t', 'sardar bahadori', 'deye', 'lux power'];
    const lowerName = (rec.company || '').toLowerCase();
    if (EXPORT_KEYS.some((k) => lowerName.includes(k)) && rec.type !== 'Export Manufacturer') {
      rec.type = 'Export Manufacturer';
      needsSave = true;
    }
    rec.contacts = normalizeContacts(rec);
    rec.activities = normalizeActivities(rec);
    return rec;
  });

  // Deduplicate records by company name (preserving first/canonical entry with populated contacts)
  const seenCompanies = new Map();
  const dedupedRecords = [];
  for (const rec of records) {
    const norm = (rec.company || '').trim().toLowerCase();
    if (!norm) continue;
    if (!seenCompanies.has(norm)) {
      seenCompanies.set(norm, rec);
      dedupedRecords.push(rec);
    } else {
      // Duplicate encountered
      needsSave = true;
      const existing = seenCompanies.get(norm);
      // Merge any richer data from the duplicate if the existing is missing it
      if ((!existing.contacts || existing.contacts.length === 0) && rec.contacts && rec.contacts.length > 0) {
        existing.contacts = rec.contacts;
        existing.contactPerson = rec.contactPerson;
        existing.mobile = rec.mobile;
      }
      if ((!existing.activities || existing.activities.length === 0) && rec.activities && rec.activities.length > 0) {
        existing.activities = rec.activities;
      }
      if (!existing.nextActionDate && rec.nextActionDate) {
        existing.nextActionDate = rec.nextActionDate;
        existing.nextAction = rec.nextAction;
      }
      if (existing.priority === 'Medium' && rec.priority && rec.priority !== 'Medium') {
        existing.priority = rec.priority;
      }
    }
  }

  if (needsSave || dedupedRecords.length < records.length) {
    writeAppDataSheet(wb, dedupedRecords);
    saveWorkbook(wb);
  }
  return dedupedRecords;
}

function writeAppDataSheet(wb, records) {
  const headerRow = FIELDS.map((f) => f[1]);
  const dataRows = records.map((r) => {
    const obj = {};
    const contacts = normalizeContacts(r);
    if (contacts.length > 0) {
      r.contactPerson = contacts
        .map((c) => (c.designation ? `${c.name} — ${c.designation}` : c.name))
        .join('; ');
      r.mobile = contacts
        .map((c) => c.mobile)
        .filter(Boolean)
        .join('; ');
      r.contacts = JSON.stringify(contacts);
    } else {
      r.contacts = '';
    }
    const activities = normalizeActivities(r);
    r.activities = activities.length > 0 ? JSON.stringify(activities) : '';
    FIELDS.forEach(([key, header]) => {
      let val = r[key] ?? '';
      if ((key === 'contacts' || key === 'activities') && typeof val === 'object') {
        val = JSON.stringify(val);
      }
      obj[header] = val;
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(dataRows, { header: headerRow });
  ws['!cols'] = COL_WIDTHS.map((w) => ({ wch: w }));
  if (wb.Sheets[APP_SHEET]) {
    wb.Sheets[APP_SHEET] = ws;
  } else {
    XLSX.utils.book_append_sheet(wb, ws, APP_SHEET);
  }
}

let memoryRecords = null;
let cachedWb = null;

function ensureAppData() {
  if (memoryRecords) {
    return { wb: cachedWb || loadWorkbook(), records: memoryRecords };
  }
  const wb = loadWorkbook();
  let records = readAppDataSheet(wb);
  if (!records) {
    records = migrateFromSourceSheets(wb);
    writeAppDataSheet(wb, records);
    saveWorkbook(wb);
  }
  memoryRecords = records;
  cachedWb = wb;
  return { wb, records };
}

// ---------------------------------------------------------------------
// Public API used by server.js
// ---------------------------------------------------------------------

function getAll() {
  return ensureAppData().records;
}

function addCompany(input) {
  const { wb, records } = ensureAppData();
  const compName = (input.company || '').trim();
  if (!compName) throw new Error('Company name is required.');

  // If company already exists, update it rather than creating a duplicate row
  const existingIdx = records.findIndex((r) => (r.company || '').trim().toLowerCase() === compName.toLowerCase());
  if (existingIdx !== -1) {
    return updateCompany(records[existingIdx].id, input);
  }

  const contacts = normalizeContacts(input);
  const activities = normalizeActivities(input);
  const stage = input.productionStage || defaultProductionStage(input);
  const startDate = input.coolantStartDate || defaultCoolantStartDate(input, stage);
  const rec = {
    id: nextId(records),
    company: compName,
    type: input.type || 'Other / Custom',
    location: input.location || '',
    contactPerson: contacts.length > 0
      ? contacts.map((c) => (c.designation ? `${c.name} — ${c.designation}` : c.name)).join('; ')
      : (input.contactPerson || ''),
    mobile: contacts.length > 0
      ? contacts.map((c) => c.mobile).filter(Boolean).join('; ')
      : (input.mobile || ''),
    contacts,
    activities,
    capacityOrScale: input.capacityOrScale || '',
    categoryOrRole: input.categoryOrRole || '',
    liquidCooling: input.liquidCooling || 'Unknown',
    monthlyCoolantLiters: input.monthlyCoolantLiters !== undefined && input.monthlyCoolantLiters !== '' ? Number(input.monthlyCoolantLiters) : estimateMonthlyLiters(input),
    coolantStartDate: startDate,
    productionStage: stage,
    notes: input.notes || '',
    source: input.source || 'Added manually in app',
    status: input.status || 'Not Contacted',
    priority: input.priority || 'Medium',
    nextAction: input.nextAction || '',
    nextActionDate: input.nextActionDate || '',
    lastUpdated: today(),
  };
  records.push(rec);
  writeAppDataSheet(wb, records);
  saveWorkbook(wb);
  return rec;
}

function updateCompany(id, patch) {
  const { wb, records } = ensureAppData();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const clean = { ...patch };
  delete clean.id; // id is never editable via patch
  if (clean.activities !== undefined) {
    clean.activities = normalizeActivities(clean);
  }
  if (clean.contacts !== undefined) {
    clean.contacts = normalizeContacts(clean);
    if (clean.contacts.length > 0) {
      clean.contactPerson = clean.contacts
        .map((c) => (c.designation ? `${c.name} — ${c.designation}` : c.name))
        .join('; ');
      clean.mobile = clean.contacts
        .map((c) => c.mobile)
        .filter(Boolean)
        .join('; ');
    } else {
      clean.contactPerson = '';
      clean.mobile = '';
    }
  } else if (clean.contactPerson !== undefined || clean.mobile !== undefined) {
    clean.contacts = normalizeContacts({
      contactPerson: clean.contactPerson ?? records[idx].contactPerson,
      mobile: clean.mobile ?? records[idx].mobile,
      categoryOrRole: clean.categoryOrRole ?? records[idx].categoryOrRole,
      contacts: records[idx].contacts,
    });
  }
  records[idx] = { ...records[idx], ...clean, lastUpdated: today() };
  writeAppDataSheet(wb, records);
  saveWorkbook(wb);
  return records[idx];
}

function deleteCompany(id) {
  const { wb, records } = ensureAppData();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  records.splice(idx, 1);
  writeAppDataSheet(wb, records);
  saveWorkbook(wb);
  return true;
}

// Pulls in any companies that exist in the four reference sheets but are
// not yet in App Data (matched on company name + type). Never touches or
// overwrites rows you've already started tracking. Use this after you
// regenerate/update the reference sheets (e.g. a fresh research pass).
function syncFromSource() {
  const wb = loadWorkbook();
  let records = readAppDataSheet(wb);
  if (!records) {
    records = migrateFromSourceSheets(wb);
    writeAppDataSheet(wb, records);
    saveWorkbook(wb);
    return { added: records.length, total: records.length };
  }
  const existingKeys = new Set(records.map((r) => `${r.company}|${r.type}`.toLowerCase()));
  const fresh = migrateFromSourceSheets(wb);
  let added = 0;
  fresh.forEach((rec) => {
    const key = `${rec.company}|${rec.type}`.toLowerCase();
    if (!existingKeys.has(key)) {
      rec.id = nextId(records);
      records.push(rec);
      existingKeys.add(key);
      added += 1;
    }
  });
  if (added > 0) {
    writeAppDataSheet(wb, records);
    saveWorkbook(wb);
  }
  return { added, total: records.length };
}

function exportSimpleBuffer(options = {}) {
  // options can be an array of column keys, or an object { columns, format, ids }
  let columns = null;
  let format = 'xlsx';
  let ids = null;

  if (Array.isArray(options)) {
    columns = options;
  } else if (options && typeof options === 'object') {
    columns = options.columns;
    format = options.format || 'xlsx';
    ids = options.ids || null;
  }

  let records = (Array.isArray(options.customData) && options.customData.length > 0)
    ? options.customData
    : getAll();

  if (Array.isArray(ids) && ids.length > 0) {
    const idSet = new Set(ids);
    records = records.filter((r) => idSet.has(r.id));
  }

  const cols = (columns && columns.length) ? columns : [
    'company', 'type', 'status', 'priority', 'liquidCooling', 'productionStage', 'coolantStartDate', 'monthlyCoolantLiters', 'location', 'contactPerson', 'mobile', 'nextAction', 'nextActionDate',
  ];
  const labelMap = Object.fromEntries(FIELDS);
  const rows = records.map((r) => {
    const obj = {};
    cols.forEach((c) => { obj[labelMap[c] || c] = r[c] ?? ''; });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = cols.map((c) => ({ wch: c === 'notes' || c === 'nextAction' ? 40 : 22 }));

  if (format === 'csv') {
    const csvStr = XLSX.utils.sheet_to_csv(ws);
    return { buffer: Buffer.from(csvStr, 'utf8'), format: 'csv', mime: 'text/csv' };
  }

  const outWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(outWb, ws, 'Manufacturer Outreach Summary');
  const buffer = XLSX.write(outWb, { type: 'buffer', bookType: 'xlsx' });
  return {
    buffer,
    format: 'xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

function exportManagementBuffer(customData = null) {
  let records = (Array.isArray(customData) && customData.length > 0)
    ? customData
    : getAll();

  // 1. Executive Overview Sheet
  const execRows = records.map((r, i) => {
    const isConnected = (r.status === 'Connected' || r.status === 'Customer / Qualified')
      ? 'YES (Connected)'
      : (r.status === 'In Discussion' || r.status === 'Meeting Scheduled' || r.status === 'Sample / RFP')
      ? 'IN DISCUSSION'
      : (r.status === 'Contacted' || r.status === 'Outreach In Progress')
      ? 'CONTACTED (Follow Up)'
      : 'NO (Not Contacted)';

    let activityList = Array.isArray(r.activities) ? r.activities : [];
    if (typeof r.activities === 'string' && r.activities.trim().startsWith('[')) {
      try { activityList = JSON.parse(r.activities); } catch (e) {}
    }
    const formattedActivities = activityList
      .map((a) => `[${a.date || ''}] ${a.type || 'Activity'}: ${a.text || ''}`)
      .join('\n');

    const liters = Number(r.monthlyCoolantLiters) || 0;
    const annualLiters = liters * 12;
    const annualContainers = Math.round((annualLiters / 20000) * 10) / 10;

    return {
      'S.No': i + 1,
      'Company / Customer Name': r.company || '',
      'Category / Role': r.categoryOrRole || r.type || '',
      'Location / State': r.location || '',
      'Cooling Architecture': r.liquidCooling || 'Immersion Cooled',
      'Project / Production Status': r.productionStage || 'Pilot / Prototype Stage',
      'Connected Status': isConnected,
      'Detailed Outreach Status': r.status || 'Not Contacted',
      'Primary Contact Person': r.contactPerson || '—',
      'Best Contact Number / Mobile': r.mobile || '—',
      'Monthly Forecast (Liters/Mo)': liters,
      'Annual Forecast (Liters/Yr)': annualLiters,
      'Annual Est. Containers/Yr (~20kL)': annualContainers,
      'Coolant Start Date (Tentative)': r.coolantStartDate || '—',
      'Next Scheduled Work Plan': r.nextAction || '—',
      'Next Action Target Date': r.nextActionDate || '—',
      'Daily Course of Action & Activity Trail': formattedActivities || r.notes || '—',
      'Strategic Notes & Intel': r.notes || '—',
      'Priority': r.priority || 'Medium',
      'Last Updated': r.lastUpdated || '',
    };
  });

  const wsExec = XLSX.utils.json_to_sheet(execRows);
  wsExec['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 28 }, // Company
    { wch: 26 }, // Category
    { wch: 22 }, // Location
    { wch: 22 }, // Cooling
    { wch: 26 }, // Production Status
    { wch: 20 }, // Connected Status
    { wch: 18 }, // Detailed Status
    { wch: 26 }, // Contact Person
    { wch: 24 }, // Best Mobile
    { wch: 18 }, // Monthly Liters
    { wch: 18 }, // Annual Liters
    { wch: 18 }, // Containers
    { wch: 18 }, // Start Date
    { wch: 34 }, // Next Action
    { wch: 16 }, // Next Date
    { wch: 55 }, // Activity Trail
    { wch: 40 }, // Notes
    { wch: 12 }, // Priority
    { wch: 14 }, // Last Updated
  ];

  // 2. Daily Course of Action Trail Sheet
  const actionTrailRows = [];
  records.forEach((r) => {
    let activityList = Array.isArray(r.activities) ? r.activities : [];
    if (typeof r.activities === 'string' && r.activities.trim().startsWith('[')) {
      try { activityList = JSON.parse(r.activities); } catch (e) {}
    }
    activityList.forEach((a) => {
      actionTrailRows.push({
        'Date': a.date || '',
        'Company / Customer Name': r.company,
        'Activity Type': a.type || 'Activity',
        'Daily Course of Action & Discussion': a.text || '',
        'Next Scheduled Work Plan': r.nextAction || '—',
        'Next Action Target Date': r.nextActionDate || '—',
        'Connected?': r.status === 'Connected' ? 'YES' : r.status,
        'Key Contact Person': r.contactPerson || '—',
        'Best Phone / WhatsApp': r.mobile || '—',
        'Location': r.location || '',
        'Cooling Type': r.liquidCooling || 'Immersion Cooled',
      });
    });
  });
  actionTrailRows.sort((a, b) => (b.Date || '').localeCompare(a.Date || ''));
  const wsTrail = XLSX.utils.json_to_sheet(actionTrailRows);
  wsTrail['!cols'] = [
    { wch: 14 }, // Date
    { wch: 28 }, // Company
    { wch: 18 }, // Activity Type
    { wch: 55 }, // Discussion
    { wch: 34 }, // Next Action
    { wch: 16 }, // Next Date
    { wch: 16 }, // Connected
    { wch: 26 }, // Contact
    { wch: 24 }, // Phone
    { wch: 20 }, // Location
    { wch: 20 }, // Cooling Type
  ];

  // 3. Cooling Architecture & Forecast Summary Sheet
  const coolingSummary = {};
  records.forEach((r) => {
    const arch = r.liquidCooling || 'Unspecified';
    if (!coolingSummary[arch]) {
      coolingSummary[arch] = { count: 0, monthlyLiters: 0, annualLiters: 0 };
    }
    const l = Number(r.monthlyCoolantLiters) || 0;
    coolingSummary[arch].count += 1;
    coolingSummary[arch].monthlyLiters += l;
    coolingSummary[arch].annualLiters += (l * 12);
  });

  const summaryRows = Object.keys(coolingSummary).map((arch) => ({
    'Cooling Architecture': arch,
    'Total Indian Accounts': coolingSummary[arch].count,
    'Total Monthly Demand (Liters/Mo)': coolingSummary[arch].monthlyLiters,
    'Total Annual Demand (Liters/Yr)': coolingSummary[arch].annualLiters,
    'Annual ISO Containers (~20kL)': Math.round((coolingSummary[arch].annualLiters / 20000) * 10) / 10,
  }));
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 26 },
    { wch: 22 },
    { wch: 26 },
    { wch: 26 },
    { wch: 24 },
  ];

  const outWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(outWb, wsExec, 'Customer Overview & Forecast');
  XLSX.utils.book_append_sheet(outWb, wsTrail, 'Daily Action Trail');
  XLSX.utils.book_append_sheet(outWb, wsSummary, 'Coolant Demand by Architecture');

  const buffer = XLSX.write(outWb, { type: 'buffer', bookType: 'xlsx' });
  return {
    buffer,
    format: 'xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

module.exports = {
  getAll,
  addCompany,
  updateCompany,
  deleteCompany,
  syncFromSource,
  exportSimpleBuffer,
  exportManagementBuffer,
  FIELDS,
  TYPE_OPTIONS,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  COOLING_OPTIONS,
  PRODUCTION_STAGE_OPTIONS,
  DATA_FILE,
};
