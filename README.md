# BESS Outreach Tracker (QuantiCool)

A high-density industrial telemetry web application for BESS manufacturer outreach, commercial qualification, and dielectric fluid market intelligence — built directly on top of your `BESS_Company_Contacts_Updated1.xlsx` file.

**Design System:** Built faithfully to match the [Stitch Industrial Engineering Precision design](https://stitch.withgoogle.com/projects/12796647182430103776).

**How it connects to your Excel file:** this is not a one-time import. The
app reads and writes your actual `BESS_Company_Contacts_Updated1.xlsx` workbook
every time you load the page or make an edit. Your original reference sheets
(`Contacts + Details (Existing)`, `New Mfrs - Operational`, `New Mfrs - Announced Planned`,
`BESS Project Developers`) remain intact as reference records. The app maintains
one live sheet, `App Data`, which serves as its database: every status change,
priority update, edit, or new company you add in the browser is saved straight
into that sheet, in that file, on disk.

## Running the App

1. Open a terminal in `D:\BESS MARKET INDIA\bess-outreach-app`:
   ```powershell
   npm install
   npm start
   ```
2. Open `http://localhost:3000` in your web browser.
3. The app connects directly to `D:\BESS MARKET INDIA\BESS_Company_Contacts_Updated1.xlsx`
   with all 59 tracked accounts ready.

You can also ask the Antigravity agent to extend this further ("add a column
for X", "change the color scheme", "add email as a field") — it's a plain
Node/Express + HTML/CSS/JS project with no build step, so the agent can edit
any file directly and you'll see changes on refresh.

## What the app does

- **Table of every tracked company** — existing contacts, newly researched
  manufacturers (operational and announced/planned), and BESS project
  developers, all in one place, with type, location, liquid-cooling
  evidence, priority, and status.
- **Inline status & priority updates** — change either directly in the
  table; it saves immediately to the Excel file.
- **Add / edit / delete companies** — click "+ Add company" or the ✎ icon
  on any row to open the full form (contact person, mobile, capacity,
  notes, source, next action + date, etc.).
- **Search & filter** — by type, status, priority, or liquid-cooling
  evidence, plus free-text search.
- **Sync from source sheets** — if you regenerate or edit the four
  reference sheets later (e.g. after another research pass) and drop an
  updated file into `data/`, click "⟳ Sync from source sheets" to pull in
  only the new companies. Anything you're already tracking is left alone.
- **Export for management** — pick just the columns that matter (defaults
  to Company / Type / Status / Priority / Next action / Next action date)
  and download a separate, simplified `.xlsx`. Your working file is never
  overwritten by this.

## Cooling type field

The "Liquid Cooling" column is really a cooling-*type* field, because the
distinction matters commercially: **Immersion Cooled** means the coolant
bathes the cells directly — a direct fit for a dielectric fluid like
QuantiCool. **DLC / Cold Plate** means coolant runs through a sealed loop
against the outside of the cells — these usually run plain water-glycol,
so it's a weaker fit unless the company is exploring a two-phase or hybrid
design. Options: Immersion Cooled, DLC / Cold Plate, Liquid Cooled - Type
Not Specified, Air Cooled, Not Stated, Unknown, Indirect (via their OEM).

None of the researched manufacturers currently have a confirmed sub-type —
public sources only said "liquid cooled" generically, so they're seeded as
"Liquid Cooled - Type Not Specified." Update this field to Immersion Cooled
or DLC / Cold Plate as soon as you confirm it on a call; that one field is
arguably the single best signal for who to prioritize.

## Priority defaults (you can change any of these in the app)

- **High** — new manufacturers with *confirmed* liquid-cooled products in
  production now (currently: Cygni Energy, Gautam Solar).
- **Medium** — other operational or announced/planned manufacturers, and
  all existing WhatsApp-sourced contacts (their engagement history isn't
  tracked yet, so they start neutral).
- **Low** — BESS project developers (e.g. Adani) — they buy and deploy
  BESS rather than manufacture it, so the coolant decision sits with
  their OEM supplier, not with them directly.

These are starting points, not verdicts — re-prioritize freely as you learn
more from actual conversations.

## Pointing the app at a different file

By default the app reads/writes `data/BESS_Company_Contacts_Updated.xlsx`
next to `server.js`. To use a file somewhere else (e.g. a shared drive),
set an environment variable before starting:

```
BESS_XLSX_PATH="/path/to/your/file.xlsx" npm start
```

## Project structure

```
server.js              Express server + API routes
lib/excelStore.js       All Excel read/write logic (the only file that
                        touches the .xlsx — read this first if you want
                        to change how data is stored)
public/index.html       Page structure
public/style.css        Styling
public/app.js           Frontend logic (fetches the API, renders the
                        table, handles the add/edit/export modals)
data/                   Your live Excel file lives here
```
