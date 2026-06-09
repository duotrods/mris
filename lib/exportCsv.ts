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
  const header = 'for_site,beginning_balance,receiving_date,md_number,receiving_liters,mris_number,liters,date_issued,entry_date,ending_balance'
  const rows = entries.map(e =>
    [
      e.for_site,
      e.beginning_balance ?? '',
      e.receiving_date ?? '',
      e.md_number ?? '',
      e.receiving_liters ?? '',
      e.mris_number,
      e.liters,
      e.date_issued,
      e.entry_date,
      e.ending_balance ?? '',
    ].join(',')
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
