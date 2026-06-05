import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface MrisEntry {
  id: string
  for_site: string
  mris_number: string
  liters: number
  date_issued: string
  entry_date: string
  created_at: string
}
