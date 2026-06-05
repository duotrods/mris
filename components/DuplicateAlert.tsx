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
