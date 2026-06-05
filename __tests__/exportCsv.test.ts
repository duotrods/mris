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
