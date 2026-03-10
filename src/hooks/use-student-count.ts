import { useCallback, useEffect, useState } from 'react'
import { hasSupabaseConfig, isLocalMode } from '@/lib/env'
import { getLocalState } from '@/lib/local-data'
import { supabase } from '@/lib/supabase-client'

interface StudentCountState {
  count: number
  isLoading: boolean
  errorMessage: string
  refresh: () => Promise<void>
}

export function useStudentCount(teacherId: string): StudentCountState {
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
        const localCount = localState.students.filter((student) => student.teacher_id === teacherId && student.is_active).length
        setCount(localCount)
        return
      }

      const { count: dbCount, error } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .eq('is_active', true)

      if (error) {
        throw new Error(error.message)
      }

      setCount(dbCount ?? 0)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Student count load failed')
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
