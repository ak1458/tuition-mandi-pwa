import { isLocalMode } from '@/lib/env'
import { getLocalState, makeLocalId, setLocalState } from '@/lib/local-data'
import { supabase } from '@/lib/supabase-client'
import type { Batch } from '@/types/domain'

export interface CreateBatchInput {
  teacherId: string
  name: string
  classLabel: string
  subject: string
}

export async function listBatches(teacherId: string): Promise<Batch[]> {
  if (isLocalMode) {
    const state = getLocalState(teacherId)
    return state.batches
      .filter((batch) => batch.teacher_id === teacherId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Batch[]
}

export async function createBatch(input: CreateBatchInput): Promise<Batch> {
  if (isLocalMode) {
    const state = getLocalState(input.teacherId)
    const now = new Date().toISOString()
    const batch: Batch = {
      id: makeLocalId('batch'),
      teacher_id: input.teacherId,
      name: input.name,
      class_label: input.classLabel,
      subject: input.subject,
      is_active: true,
      created_at: now,
      updated_at: now,
    }
    state.batches.push(batch)
    setLocalState(input.teacherId, state)
    return batch
  }

  const { data, error } = await supabase
    .from('batches')
    .insert({
      teacher_id: input.teacherId,
      name: input.name,
      class_label: input.classLabel,
      subject: input.subject,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Batch
}
