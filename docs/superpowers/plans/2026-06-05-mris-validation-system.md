# MRIS Number Validation System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-page Next.js 14 app for logging MRIS numbers per site, with duplicate detection, daily grouping in a records table, and CSV export.

**Architecture:** App Router with Server Actions for all DB writes (duplicate check + insert), Server Components for data fetching on the records page, and Client Components for interactive UI. Supabase PostgreSQL stores all entries. Tailwind CSS handles styling.

**Tech Stack:** Next.js 14 (App Router), Supabase (`@supabase/supabase-js`), Tailwind CSS, Jest

---

## File Map

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout — Inter font, green background |
| `app/page.tsx` | Entry form page (renders `EntryForm`) |
| `app/records/page.tsx` | Records page — fetches entries server-side, renders `RecordsTable` |
| `actions/submitEntry.ts` | Server Action: duplicate check + DB insert |
| `components/EntryForm.tsx` | `'use client'` — form state, calls `submitEntry` |
| `components/RecordsTable.tsx` | `'use client'` — collapsible date groups, CSV export button |
| `components/DuplicateAlert.tsx` | `'use client'` — red alert card, auto-downloads CSV on mount |
| `components/SiteTag.tsx` | Green badge for site codes (TR-11, B-4, etc.) |
| `components/TabNav.tsx` | Tab links between `/` and `/records` |
| `lib/supabase.ts` | Supabase client + `MrisEntry` type |
| `lib/exportCsv.ts` | `generateDuplicateCsv`, `generateAllRecordsCsv`, `downloadCsv`, `AttemptedEntry` |
| `lib/groupByDate.ts` | `groupByDate` — groups `MrisEntry[]` by `entry_date`, returns sorted desc |
| `__tests__/exportCsv.test.ts` | Tests for both CSV generators |
| `__tests__/groupByDate.test.ts` | Tests for date-grouping logic |

---

## Task 1: Project Scaffold

**Files:** `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `jest.config.ts`

- [ ] **Step 1: Scaffold Next.js app**

Run from `/Users/rodolinordu-ot/Documents/mris`:

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint
```

Accept all prompts.

- [ ] **Step 2: Install Supabase and Jest dependencies**

```bash
npm install @supabase/supabase-js
npm install --save-dev jest @types/jest
```

- [ ] **Step 3: Create jest.config.ts**

```typescript
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })

const config = {
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
}

module.exports = createJestConfig(config)
```

- [ ] **Step 4: Add test script to package.json**

In the `"scripts"` block of `package.json`, add:

```json
"test": "jest"
```

- [ ] **Step 5: Verify scaffold**

```bash
npm run dev
```

Expected: dev server starts at `http://localhost:3000`. Stop with Ctrl+C.

- [ ] **Step 6: Init git and commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 14 app with Tailwind and Jest"
```

---

## Task 2: Supabase Table + Env

**Files:** `.env.local` (never committed)

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → create a new project. From Settings → API, note your **Project URL** and **anon public key**.

- [ ] **Step 2: Create the table**

In the Supabase SQL editor, run:

```sql
create table mris_entries (
  id uuid primary key default gen_random_uuid(),
  for_site text not null,
  mris_number text not null,
  liters numeric not null,
  date_issued date not null,
  entry_date date not null,
  created_at timestamptz not null default now()
);

alter table mris_entries enable row level security;
create policy "Allow all" on mris_entries for all using (true) with check (true);
```

- [ ] **Step 3: Create .env.local**

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace both values with your actual credentials.

- [ ] **Step 4: Confirm .gitignore has .env.local**

Check `.gitignore` — Next.js adds it by default. If missing, add it manually.

---

## Task 3: Supabase Client + Types

**Files:**
- Create: `lib/supabase.ts`

- [ ] **Step 1: Create lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface MrisEntry {
  id: string
  for_site: string
  mris_number: string
  liters: number
  date_issued: string
  entry_date: string
  created_at: string
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add Supabase client and MrisEntry type"
```

---

## Task 4: CSV Export Utility (TDD)

**Files:**
- Create: `lib/exportCsv.ts`
- Create: `__tests__/exportCsv.test.ts`

- [ ] **Step 1: Write failing tests** — create `__tests__/exportCsv.test.ts`:

```typescript
import { generateDuplicateCsv, generateAllRecordsCsv } from '@/lib/exportCsv'
import { MrisEntry } from '@/lib/supabase'

const existing: MrisEntry = {
  id: 'uuid-1',
  for_site: 'TR-11',
  mris_number: '2026-0045',
  liters: 120,
  date_issued: '2026-06-03',
  entry_date: '2026-06-05',
  created_at: '2026-06-05T10:00:00Z',
}

const attempted = {
  for_site: 'TR-12',
  mris_number: '2026-0045',
  liters: 200,
  date_issued: '2026-06-05',
  entry_date: '2026-06-05',
}

describe('generateDuplicateCsv', () => {
  it('produces header, EXISTING row, ATTEMPTED row', () => {
    const lines = generateDuplicateCsv(existing, attempted).split('\n')
    expect(lines[0]).toBe('type,for_site,mris_number,liters,date_issued,entry_date')
    expect(lines[1]).toBe('EXISTING,TR-11,2026-0045,120,2026-06-03,2026-06-05')
    expect(lines[2]).toBe('ATTEMPTED,TR-12,2026-0045,200,2026-06-05,2026-06-05')
  })
})

describe('generateAllRecordsCsv', () => {
  it('produces header + one row per entry', () => {
    const lines = generateAllRecordsCsv([existing]).split('\n')
    expect(lines[0]).toBe('for_site,mris_number,liters,date_issued,entry_date')
    expect(lines[1]).toBe('TR-11,2026-0045,120,2026-06-03,2026-06-05')
  })

  it('returns only header for empty array', () => {
    expect(generateAllRecordsCsv([])).toBe('for_site,mris_number,liters,date_issued,entry_date')
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- --testPathPattern=exportCsv
```

Expected: `Cannot find module '@/lib/exportCsv'`

- [ ] **Step 3: Implement lib/exportCsv.ts**

```typescript
import { MrisEntry } from './supabase'

export type AttemptedEntry = {
  for_site: string
  mris_number: string
  liters: number
  date_issued: string
  entry_date: string
}

export function generateDuplicateCsv(existing: MrisEntry, attempted: AttemptedEntry): string {
  const header = 'type,for_site,mris_number,liters,date_issued,entry_date'
  const e = `EXISTING,${existing.for_site},${existing.mris_number},${existing.liters},${existing.date_issued},${existing.entry_date}`
  const a = `ATTEMPTED,${attempted.for_site},${attempted.mris_number},${attempted.liters},${attempted.date_issued},${attempted.entry_date}`
  return [header, e, a].join('\n')
}

export function generateAllRecordsCsv(entries: MrisEntry[]): string {
  const header = 'for_site,mris_number,liters,date_issued,entry_date'
  const rows = entries.map(e =>
    `${e.for_site},${e.mris_number},${e.liters},${e.date_issued},${e.entry_date}`
  )
  return [header, ...rows].join('\n')
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- --testPathPattern=exportCsv
```

Expected: `Tests: 3 passed, 3 total`

- [ ] **Step 5: Commit**

```bash
git add lib/exportCsv.ts __tests__/exportCsv.test.ts
git commit -m "feat: add CSV export utility with tests"
```

---

## Task 5: Date Grouping Utility (TDD)

**Files:**
- Create: `lib/groupByDate.ts`
- Create: `__tests__/groupByDate.test.ts`

- [ ] **Step 1: Write failing tests** — create `__tests__/groupByDate.test.ts`:

```typescript
import { groupByDate } from '@/lib/groupByDate'
import { MrisEntry } from '@/lib/supabase'

const mk = (mris_number: string, entry_date: string): MrisEntry => ({
  id: mris_number, for_site: 'TR-11', mris_number,
  liters: 100, date_issued: '2026-01-01', entry_date,
  created_at: `${entry_date}T10:00:00Z`,
})

describe('groupByDate', () => {
  it('groups entries by entry_date, most recent first', () => {
    const groups = groupByDate([mk('A', '2026-06-04'), mk('B', '2026-06-05'), mk('C', '2026-06-04')])
    expect(groups[0][0]).toBe('2026-06-05')
    expect(groups[1][0]).toBe('2026-06-04')
    expect(groups[1][1]).toHaveLength(2)
  })

  it('returns empty array for no entries', () => {
    expect(groupByDate([])).toEqual([])
  })

  it('preserves order within a date group', () => {
    const [[, rows]] = groupByDate([mk('X', '2026-06-05'), mk('Y', '2026-06-05')])
    expect(rows[0].mris_number).toBe('X')
    expect(rows[1].mris_number).toBe('Y')
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- --testPathPattern=groupByDate
```

Expected: `Cannot find module '@/lib/groupByDate'`

- [ ] **Step 3: Implement lib/groupByDate.ts**

```typescript
import { MrisEntry } from './supabase'

export function groupByDate(entries: MrisEntry[]): [string, MrisEntry[]][] {
  const map: Record<string, MrisEntry[]> = {}
  for (const entry of entries) {
    if (!map[entry.entry_date]) map[entry.entry_date] = []
    map[entry.entry_date].push(entry)
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- --testPathPattern=groupByDate
```

Expected: `Tests: 3 passed, 3 total`

- [ ] **Step 5: Commit**

```bash
git add lib/groupByDate.ts __tests__/groupByDate.test.ts
git commit -m "feat: add date grouping utility with tests"
```

---

## Task 6: Submit Entry Server Action

**Files:**
- Create: `actions/submitEntry.ts`

- [ ] **Step 1: Create actions/submitEntry.ts**

```typescript
'use server'

import { supabase, MrisEntry } from '@/lib/supabase'
import { AttemptedEntry } from '@/lib/exportCsv'

export type SubmitResult =
  | { status: 'success' }
  | { status: 'error'; message: string }
  | { status: 'duplicate'; existing: MrisEntry; attempted: AttemptedEntry }

export async function submitEntry(formData: FormData): Promise<SubmitResult> {
  const for_site = (formData.get('for_site') as string).trim()
  const mris_number = (formData.get('mris_number') as string).trim()
  const liters = parseFloat(formData.get('liters') as string)
  const date_issued = formData.get('date_issued') as string
  const entry_date = formData.get('entry_date') as string

  if (!for_site || !mris_number || isNaN(liters) || !date_issued || !entry_date) {
    return { status: 'error', message: 'All fields are required.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('mris_entries')
    .select('*')
    .eq('mris_number', mris_number)
    .maybeSingle()

  if (fetchError) return { status: 'error', message: fetchError.message }

  if (existing) {
    return {
      status: 'duplicate',
      existing: existing as MrisEntry,
      attempted: { for_site, mris_number, liters, date_issued, entry_date },
    }
  }

  const { error: insertError } = await supabase
    .from('mris_entries')
    .insert({ for_site, mris_number, liters, date_issued, entry_date })

  if (insertError) return { status: 'error', message: insertError.message }
  return { status: 'success' }
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/submitEntry.ts
git commit -m "feat: add submitEntry server action with duplicate detection"
```

---

## Task 7: SiteTag + TabNav Components

**Files:**
- Create: `components/SiteTag.tsx`
- Create: `components/TabNav.tsx`

- [ ] **Step 1: Create components/SiteTag.tsx**

```tsx
const COLORS: Record<string, string> = {
  'TR-11': 'bg-green-100 text-green-800',
  'TR-12': 'bg-green-100 text-green-800',
  'TR-14': 'bg-green-100 text-green-800',
  'TR-16': 'bg-green-100 text-green-800',
  'B-4':   'bg-teal-100 text-teal-800',
  'B-5':   'bg-teal-100 text-teal-800',
}

export default function SiteTag({ site }: { site: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${COLORS[site] ?? 'bg-gray-100 text-gray-700'}`}>
      {site}
    </span>
  )
}
```

- [ ] **Step 2: Create components/TabNav.tsx**

```tsx
import Link from 'next/link'

export default function TabNav({ active }: { active: 'entry' | 'records' }) {
  return (
    <div className="flex justify-center gap-6 border-b border-green-200 mb-6 pb-2">
      <Link
        href="/"
        className={`text-sm font-semibold pb-1 ${active === 'entry' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}
      >
        📝 New Entry
      </Link>
      <Link
        href="/records"
        className={`text-sm font-semibold pb-1 ${active === 'records' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}
      >
        📋 Records
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/SiteTag.tsx components/TabNav.tsx
git commit -m "feat: add SiteTag and TabNav components"
```

---

## Task 8: DuplicateAlert Component

**Files:**
- Create: `components/DuplicateAlert.tsx`

- [ ] **Step 1: Create components/DuplicateAlert.tsx**

```tsx
'use client'

import { useEffect } from 'react'
import { MrisEntry } from '@/lib/supabase'
import { AttemptedEntry, generateDuplicateCsv, downloadCsv } from '@/lib/exportCsv'

export default function DuplicateAlert({ existing, attempted }: { existing: MrisEntry; attempted: AttemptedEntry }) {
  useEffect(() => {
    const csv = generateDuplicateCsv(existing, attempted)
    downloadCsv(csv, `duplicate-mris-${existing.mris_number}-${Date.now()}.csv`)
  }, [])

  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="text-xs font-bold text-red-700 mb-2">⚠ Duplicate MRIS# Detected</div>
      <p className="text-xs text-red-600 mb-3">
        MRIS# <strong>{existing.mris_number}</strong> already exists. Entry blocked. A conflict report has been downloaded.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-red-100 rounded-lg p-2 text-xs text-red-800">
          <div className="font-bold mb-1">Existing Record</div>
          <div>Site: {existing.for_site}</div>
          <div>Liters: {existing.liters}</div>
          <div>Issued: {existing.date_issued}</div>
          <div>Entry: {existing.entry_date}</div>
        </div>
        <div className="bg-red-100 rounded-lg p-2 text-xs text-red-800">
          <div className="font-bold mb-1">Your Submission</div>
          <div>Site: {attempted.for_site}</div>
          <div>Liters: {attempted.liters}</div>
          <div>Issued: {attempted.date_issued}</div>
          <div>Entry: {attempted.entry_date}</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/DuplicateAlert.tsx
git commit -m "feat: add DuplicateAlert with auto CSV download on mount"
```

---

## Task 9: EntryForm Component

**Files:**
- Create: `components/EntryForm.tsx`

- [ ] **Step 1: Create components/EntryForm.tsx**

```tsx
'use client'

import { useState, useTransition, useRef } from 'react'
import { submitEntry, SubmitResult } from '@/actions/submitEntry'
import DuplicateAlert from './DuplicateAlert'
import TabNav from './TabNav'

const SITES = ['TR-11', 'TR-12', 'TR-14', 'TR-16', 'B-4', 'B-5']
const todayStr = () => new Date().toISOString().split('T')[0]

export default function EntryForm() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SubmitResult | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const entryDateRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await submitEntry(formData)
      setResult(res)
      if (res.status === 'success') {
        formRef.current?.reset()
        if (entryDateRef.current) entryDateRef.current.value = todayStr()
      }
    })
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-extrabold text-green-900 text-center mb-2">MRIS Validation System</h1>
        <TabNav active="entry" />

        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xs font-bold text-green-900 uppercase tracking-wide mb-4">New MRIS Entry</h2>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">For Site</label>
              <select name="for_site" required className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm text-gray-900">
                <option value="">-- Select Site --</option>
                {SITES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">MRIS #</label>
              <input name="mris_number" type="text" required placeholder="e.g. 2026-001"
                className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1"># of Liters</label>
              <input name="liters" type="number" step="0.01" min="0" required placeholder="0.00"
                className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Date Issued</label>
                <input name="date_issued" type="date" required
                  className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Date <span className="text-green-600 normal-case">(today)</span>
                </label>
                <input ref={entryDateRef} name="entry_date" type="date" required defaultValue={todayStr()}
                  className="w-full px-3 py-2 border border-green-100 rounded-md bg-green-50 text-sm" />
              </div>
            </div>

            <button type="submit" disabled={isPending}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-lg text-sm">
              {isPending ? 'Submitting...' : 'Submit Entry'}
            </button>
          </form>

          {result?.status === 'success' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
              ✓ Entry saved successfully.
            </div>
          )}
          {result?.status === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              Error: {result.message}
            </div>
          )}
        </div>

        {result?.status === 'duplicate' && (
          <DuplicateAlert existing={result.existing} attempted={result.attempted} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/EntryForm.tsx
git commit -m "feat: add EntryForm client component"
```

---

## Task 10: App Layout + Entry Page

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace app/globals.css entirely**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Replace app/layout.tsx entirely**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = { title: 'MRIS Validation System' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Replace app/page.tsx entirely**

```tsx
import EntryForm from '@/components/EntryForm'

export default function Home() {
  return <EntryForm />
}
```

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx app/page.tsx
git commit -m "feat: wire up layout and entry form page"
```

---

## Task 11: RecordsTable Component

**Files:**
- Create: `components/RecordsTable.tsx`

- [ ] **Step 1: Create components/RecordsTable.tsx**

```tsx
'use client'

import { useState } from 'react'
import { MrisEntry } from '@/lib/supabase'
import { groupByDate } from '@/lib/groupByDate'
import { generateAllRecordsCsv, downloadCsv } from '@/lib/exportCsv'
import SiteTag from './SiteTag'
import TabNav from './TabNav'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function RecordsTable({ entries }: { entries: MrisEntry[] }) {
  const groups = groupByDate(entries)
  const [open, setOpen] = useState<Set<string>>(new Set(groups.length > 0 ? [groups[0][0]] : []))

  function toggle(date: string) {
    setOpen(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-xl font-extrabold text-green-900 text-center mb-2">MRIS Validation System</h1>
        <TabNav active="records" />

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-700">
            All Entries <span className="text-green-600">({entries.length} total)</span>
          </span>
          <button
            onClick={() => downloadCsv(generateAllRecordsCsv(entries), `mris-records-${new Date().toISOString().split('T')[0]}.csv`)}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg"
          >
            ⬇ Export CSV
          </button>
        </div>

        <div className="bg-white border border-green-200 rounded-xl overflow-hidden">
          {groups.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No entries yet.</div>
          )}
          {groups.map(([date, rows]) => (
            <div key={date}>
              <button
                onClick={() => toggle(date)}
                className="w-full flex justify-between items-center px-4 py-2 bg-green-50 hover:bg-green-100 border-b border-green-100 text-left"
              >
                <span className="text-xs font-bold text-green-900">
                  {open.has(date) ? '▼' : '▶'}&nbsp;&nbsp;{formatDate(date)}
                </span>
                <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
                </span>
              </button>
              {open.has(date) && (
                <div>
                  <div className="grid grid-cols-5 px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                    {['For Site', 'MRIS #', 'Liters', 'Date Issued', 'Entry Date'].map(h => (
                      <span key={h} className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{h}</span>
                    ))}
                  </div>
                  {rows.map((entry, i) => (
                    <div key={entry.id} className={`grid grid-cols-5 px-4 py-2 border-b border-gray-50 items-center ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <span><SiteTag site={entry.for_site} /></span>
                      <span className="text-xs text-gray-900">{entry.mris_number}</span>
                      <span className="text-xs text-gray-900">{entry.liters} L</span>
                      <span className="text-xs text-gray-500">{entry.date_issued}</span>
                      <span className="text-xs text-gray-500">{entry.entry_date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/RecordsTable.tsx
git commit -m "feat: add RecordsTable with collapsible date groups and CSV export"
```

---

## Task 12: Records Page

**Files:**
- Create: `app/records/page.tsx`

- [ ] **Step 1: Create app/records/page.tsx**

```tsx
import { supabase } from '@/lib/supabase'
import RecordsTable from '@/components/RecordsTable'

export const dynamic = 'force-dynamic'

export default async function RecordsPage() {
  const { data: entries } = await supabase
    .from('mris_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  return <RecordsTable entries={entries ?? []} />
}
```

- [ ] **Step 2: Commit**

```bash
git add app/records/page.tsx
git commit -m "feat: add records page with server-side Supabase fetch"
```

---

## Task 13: End-to-End Verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: `Tests: 6 passed, 6 total`

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Open `http://localhost:3000`.

- [ ] **Step 3: Test valid submission**

Fill all fields, click Submit. Verify:
- Green success message appears
- Form clears (date resets to today)
- Row visible in Supabase dashboard → Table Editor → `mris_entries`

- [ ] **Step 4: Test duplicate detection**

Submit the same MRIS# again (different site is fine). Verify:
- Red duplicate alert appears below the form
- CSV file auto-downloads to Downloads folder
- CSV has header row + EXISTING row + ATTEMPTED row with correct values

- [ ] **Step 5: Check Records page**

Go to `http://localhost:3000/records`. Verify:
- Entries appear under today's date header (expanded by default)
- Count badge shows correct number
- Clicking date header toggles collapse/expand

- [ ] **Step 6: Test Records CSV export**

Click "Export CSV". Verify:
- File downloads
- Contains correct header and all entry rows

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "feat: complete MRIS Validation System"
```
