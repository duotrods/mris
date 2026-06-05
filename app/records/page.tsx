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
