# MRIS Number Validation System — Design Spec

**Date:** 2026-06-05  
**Status:** Approved

---

## Overview

A web-based data entry and validation system for logging MRIS (Material Release Information Sheet) numbers per site. Users enter records one at a time; the system validates for duplicates, blocks re-entry, and groups all records by the day they were entered. A separate Records page shows the full history, grouped by date and exportable as CSV.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Pages

### 1. Entry Form (`/`)

**Layout:** Centered card, green/industrial style, tabs to switch between pages.

**Fields:**

| Field | Type | Notes |
|---|---|---|
| For Site | Dropdown | TR-11, TR-12, TR-14, TR-16, B-4, B-5 |
| MRIS # | Text input | Used for duplicate check |
| # of Liters | Number input | Decimal allowed |
| Date Issued | Date picker | Manual entry |
| Date | Date picker | Auto-fills today's date, editable |

**Submit behavior:**
1. Validate all fields are filled.
2. Call a Server Action that queries Supabase for an existing row with the same `mris_number`.
3. **If duplicate found:** Block save. Return conflict details to client. Client triggers a CSV download containing both the existing record and the attempted record side-by-side. Show an inline red warning card.
4. **If no duplicate:** Insert row into `mris_entries`. Show a green success message. Clear form (keep today's date pre-filled).

---

### 2. Records Table (`/records`)

**Layout:** Same centered card shell with tab nav, full-width table below.

**Features:**
- All entries fetched from Supabase, sorted by `entry_date` descending.
- Rows grouped under collapsible date headers (▼/▶ toggle). The most recent date is expanded by default; all others are collapsed.
- Entry count badge on each date group header.
- **Export CSV** button in toolbar — downloads all visible records as a `.csv` file, generated client-side.

**Columns:** For Site · MRIS # · Liters · Date Issued · Entry Date

---

## Data Model

**Table: `mris_entries`**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `for_site` | `text` | One of the 6 site codes |
| `mris_number` | `text` | Validated unique on submit |
| `liters` | `numeric` | Decimal allowed |
| `date_issued` | `date` | |
| `entry_date` | `date` | The "default date" field — groups records by day |
| `created_at` | `timestamptz` | Default `now()` |

> **Note:** No database-level UNIQUE constraint on `mris_number` — uniqueness is enforced in the Server Action so we can return rich conflict details instead of a generic DB error.

---

## Duplicate Report CSV Format

When a duplicate is detected, a CSV is auto-downloaded with this structure:

```
type,for_site,mris_number,liters,date_issued,entry_date
EXISTING,TR-11,2026-0045,120,2026-06-03,2026-06-05
ATTEMPTED,TR-12,2026-0045,200,2026-06-05,2026-06-05
```

Filename: `duplicate-mris-{mris_number}-{timestamp}.csv`

---

## Architecture

```
app/
  page.tsx               ← Entry Form (/)
  records/
    page.tsx             ← Records Table (/records)
  actions/
    submitEntry.ts       ← Server Action: duplicate check + insert
  components/
    EntryForm.tsx        ← Form with client-side state
    RecordsTable.tsx     ← Table with collapse state
    DuplicateAlert.tsx   ← Red warning card shown on duplicate
    SiteTag.tsx          ← Green badge for site codes
  lib/
    supabase.ts          ← Supabase client (server + browser)
    exportCsv.ts         ← CSV generation utility (used by both pages)
```

---

## Visual Design

- **Color palette:** Green/Industrial — `#059669` primary, `#ecfdf5` background, `#064e3b` headings, white cards with `#a7f3d0` borders.
- **Layout:** Centered card (max-width 480px for form, wider for table). Tab navigation at top.
- **Duplicate alert:** Red card (`#fef2f2` / `#fca5a5`) shown inline below the form with both record details side by side.

---

## Verification

1. `npm run dev` — app loads at localhost:3000, form renders with all 6 site options.
2. Submit a valid entry → row appears in Supabase `mris_entries` table.
3. Submit same MRIS# again → blocked, red alert shown, CSV auto-downloads with both records.
4. Navigate to `/records` → rows appear grouped by date, today's group expanded.
5. Click Export CSV → file downloads with all columns and rows.
6. Collapse/expand date groups → works correctly.
