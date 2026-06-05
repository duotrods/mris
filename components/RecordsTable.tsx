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
