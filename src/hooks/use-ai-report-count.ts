import { useCallback, useEffect, useState } from 'react'
import { hasSupabaseConfig, isLocalMode } from '@/lib/env'
import { getLocalState } from '@/lib/local-data'
import { supabase } from '@/lib/supabase-client'

interface AiReportCountState {
  count: number
  isLoading: boolean
  errorMessage: string
  refresh: () => Promise<void>
}

export function useAiReportCount(teacherId: string): AiReportCountState {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const refresh = useCallback(async () => {
    if (!teacherId) {
      setCount(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      if (isLocalMode || !hasSupabaseConfig) {
        const localState = getLocalState(teacherId)
        const localCount = localState.progress_reports.filter(
          (report) =>
            report.teacher_id === teacherId &&
            report.generated_by !== 'manual_template' &&
            report.generated_by !== 'seed_demo',
        ).length
        setCount(localCount)
        return
      }

      const { count: dbCount, error } = await supabase
        .from('progress_reports')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .neq('generated_by', 'manual_template')
        .neq('generated_by', 'seed_demo')

      if (error) {
        throw new Error(error.message)
      }

      setCount(dbCount ?? 0)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Report count load failed')
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  return {
    count,
    isLoading,
    errorMessage,
    refresh,
  }
}
