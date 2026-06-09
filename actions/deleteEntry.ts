'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function deleteEntry(id: string): Promise<void> {
  await supabase.from('mris_entries').delete().eq('id', id)
  revalidatePath('/records')
}
