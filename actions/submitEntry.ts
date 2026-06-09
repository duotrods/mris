'use server'

import { supabase, MrisEntry } from '@/lib/supabase'
import { AttemptedEntry } from '@/lib/exportCsv'

export type SubmitResult =
  | { status: 'success' }
  | { status: 'error'; message: string }
  | { status: 'duplicate'; existing: MrisEntry; attempted: AttemptedEntry }

export async function submitEntry(formData: FormData): Promise<SubmitResult> {
  const for_site = ((formData.get('for_site') as string) ?? '').trim()
  const beginning_balance = parseFloat((formData.get('beginning_balance') as string) ?? '')
  const receiving_date = ((formData.get('receiving_date') as string) ?? '').trim()
  const md_number = ((formData.get('md_number') as string) ?? '').trim()
  const receiving_liters = parseFloat((formData.get('receiving_liters') as string) ?? '')
  const mris_number = ((formData.get('mris_number') as string) ?? '').trim()
  const liters = parseFloat((formData.get('liters') as string) ?? '')
  const date_issued = ((formData.get('date_issued') as string) ?? '').trim()
  const entry_date = ((formData.get('entry_date') as string) ?? '').trim()
  const ending_balance = parseFloat((formData.get('ending_balance') as string) ?? '')

  if (
    !for_site || isNaN(beginning_balance) ||
    !receiving_date || !md_number || isNaN(receiving_liters) ||
    !mris_number || isNaN(liters) || !date_issued || !entry_date ||
    isNaN(ending_balance)
  ) {
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
    .insert({
      for_site,
      beginning_balance,
      receiving_date,
      md_number,
      receiving_liters,
      mris_number,
      liters,
      date_issued,
      entry_date,
      ending_balance,
    })

  if (insertError) return { status: 'error', message: insertError.message }
  return { status: 'success' }
}
