const express = require('express');
const cors = require('cors');
const path = require('path');
const store = require('./lib/excelStore');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/meta', (req, res) => {
  res.json({
    dataFile: store.DATA_FILE,
    typeOptions: store.TYPE_OPTIONS,
    statusOptions: store.STATUS_OPTIONS,
    priorityOptions: store.PRIORITY_OPTIONS,
    coolingOptions: store.COOLING_OPTIONS,
    productionStageOptions: store.PRODUCTION_STAGE_OPTIONS,
    fields: store.FIELDS,
  });
});

app.get('/api/companies', (req, res) => {
  try {
    res.json(store.getAll());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/companies', (req, res) => {
  try {
    res.status(201).json(store.addCompany(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/companies/:id', (req, res) => {
  try {
    const updated = store.updateCompany(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Company not found.' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/companies/:id', (req, res) => {
  try {
    const ok = store.deleteCompany(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Company not found.' });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/sync', (req, res) => {
  try {
    res.json(store.syncFromSource());
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/export-simple', (req, res) => {
  try {
    const options = req.body || {};
    const result = store.exportSimpleBuffer(options);
    const filename = result.format === 'csv' ? 'BESS_Outreach_Summary.csv' : 'BESS_Outreach_Summary.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', result.mime);
    res.send(result.buffer);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.all('/api/export-management', (req, res) => {
  try {
    const customData = req.method === 'POST' ? req.body?.customData : null;
    const result = store.exportManagementBuffer(customData);
    const today = new Date().toISOString().split('T')[0];
    const filename = `BESS_India_Management_Report_${today}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', result.mime);
    res.send(result.buffer);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BESS outreach tracker running at http://localhost:${PORT}`);
    console.log(`Reading/writing workbook at: ${store.DATA_FILE}`);
  });
}

module.exports = app;
