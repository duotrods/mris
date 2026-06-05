import { MrisEntry } from './supabase'

export function groupByDate(entries: MrisEntry[]): [string, MrisEntry[]][] {
  const map: Record<string, MrisEntry[]> = {}
  for (const entry of entries) {
    if (!map[entry.entry_date]) map[entry.entry_date] = []
    map[entry.entry_date].push(entry)
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
}
