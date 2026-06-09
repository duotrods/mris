'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MrisEntry } from '@/lib/supabase'
import { groupByDate } from '@/lib/groupByDate'
import { generateAllRecordsCsv, downloadCsv } from '@/lib/exportCsv'
import { deleteEntry } from '@/actions/deleteEntry'
import SiteTag from './SiteTag'
import TabNav from './TabNav'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function groupBySite(rows: MrisEntry[]): [string, MrisEntry[]][] {
  const map: Record<string, MrisEntry[]> = {}
  for (const row of rows) {
    if (!map[row.for_site]) map[row.for_site] = []
    map[row.for_site].push(row)
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
}

function fmtL(v: number | null | undefined) {
  return v != null ? `${v.toFixed(2)} L` : '—'
}

const TH = 'text-[10px] font-bold text-gray-500 uppercase tracking-wide px-3 py-2 text-left whitespace-nowrap'
const TD = 'text-xs text-gray-700 px-3 py-2 whitespace-nowrap'

export default function RecordsTable({ entries }: { entries: MrisEntry[] }) {
  const groups = groupByDate(entries)
  const [open, setOpen] = useState<Set<string>>(new Set(groups.length > 0 ? [groups[0][0]] : []))
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  function toggle(date: string) {
    setOpen(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    setDeletingId(id)
    await deleteEntry(id)
    setDeletingId(null)
    router.refresh()
  }

  const todayFile = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-5xl">
        <h1 className="text-xl font-extrabold text-green-900 text-center mb-2">MRIS Validation System</h1>
        <TabNav active="records" />

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-700">
            All Entries <span className="text-green-600">({entries.length} total)</span>
          </span>
          <button
            onClick={() => downloadCsv(generateAllRecordsCsv(entries), `mris-all-${todayFile}.csv`)}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg"
          >
            ⬇ Export All
          </button>
        </div>

        <div className="bg-white border border-green-200 rounded-xl overflow-hidden">
          {groups.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No entries yet.</div>
          )}
          {groups.map(([date, rows]) => (
            <div key={date} className="border-b border-green-100 last:border-b-0">

              {/* Date header */}
              <div className="flex justify-between items-center px-4 py-2 bg-green-50 border-b border-green-100">
                <button
                  onClick={() => toggle(date)}
                  className="flex items-center gap-2 text-xs font-bold text-green-900 hover:text-green-700"
                >
                  <span>{open.has(date) ? '▼' : '▶'}</span>
                  <span>{formatDate(date)}</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadCsv(generateAllRecordsCsv(rows), `mris-${date}.csv`)}
                    className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 text-[10px] font-bold rounded-md"
                  >
                    ⬇ Export Day
                  </button>
                  <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
              </div>

              {open.has(date) && (
                <div>
                  {groupBySite(rows).map(([site, siteRows]) => (
                    <div key={site} className="border-b border-gray-100 last:border-b-0">

                      {/* Site sub-header */}
                      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <SiteTag site={site} />
                          <span className="text-xs text-gray-400">{siteRows.length} {siteRows.length === 1 ? 'entry' : 'entries'}</span>
                        </div>
                        <button
                          onClick={() => downloadCsv(generateAllRecordsCsv(siteRows), `mris-${site}-${date}.csv`)}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold rounded-md"
                        >
                          ⬇ Export {site}
                        </button>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-215">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className={TH}>Beg. Balance</th>
                              <th className={TH}>Rcv. Date</th>
                              <th className={TH}>MD #</th>
                              <th className={TH}>Rcv. Liters</th>
                              <th className={TH}>MRIS #</th>
                              <th className={TH}>Iss. Liters</th>
                              <th className={TH}>Date Issued</th>
                              <th className={TH}>Entry Date</th>
                              <th className={TH}>End. Balance</th>
                              <th className={TH}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {siteRows.map((entry, i) => (
                              <tr key={entry.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}>
                                <td className={TD}>{fmtL(entry.beginning_balance)}</td>
                                <td className={TD}>{entry.receiving_date ?? '—'}</td>
                                <td className={TD}>{entry.md_number ?? '—'}</td>
                                <td className={TD}>{fmtL(entry.receiving_liters)}</td>
                                <td className={`${TD} font-medium text-gray-900`}>{entry.mris_number}</td>
                                <td className={TD}>{fmtL(entry.liters)}</td>
                                <td className={`${TD} text-gray-500`}>{entry.date_issued}</td>
                                <td className={`${TD} text-gray-500`}>{entry.entry_date}</td>
                                <td className={`${TD} font-semibold text-green-700`}>{fmtL(entry.ending_balance)}</td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => handleDelete(entry.id)}
                                    disabled={deletingId === entry.id}
                                    className="text-red-400 hover:text-red-600 disabled:opacity-40 text-sm font-bold"
                                    title="Delete entry"
                                  >
                                    {deletingId === entry.id ? '…' : '×'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

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
