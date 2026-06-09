'use server'

import { supabase } from '@/lib/supabase'

export async function getPreviousEndingBalance(site: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('mris_entries')
    .select('ending_balance')
    .eq('for_site', site)
    .not('ending_balance', 'is', null)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data.ending_balance as number
}
