import { groupByDate } from '@/lib/groupByDate'
import { MrisEntry } from '@/lib/supabase'

const mk = (mris_number: string, entry_date: string): MrisEntry => ({
  id: mris_number, for_site: 'TR-11', mris_number,
  liters: 100, date_issued: '2026-01-01', entry_date,
  created_at: `${entry_date}T10:00:00Z`,
  beginning_balance: null, receiving_date: null, md_number: null,
  receiving_liters: null, ending_balance: null,
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
