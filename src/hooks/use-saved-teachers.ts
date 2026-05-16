import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { listSavedTeachers, onSavedTeachersChange, type SavedTeacher } from '@/lib/saved-teachers'

const KEY = 'takhti_saved_teachers_v1'

export function useSavedTeachers(): SavedTeacher[] {
  const subscribe = useCallback((callback: () => void) => onSavedTeachersChange(callback), [])
  const getSnapshot = useCallback(() => localStorage.getItem(KEY) ?? '', [])
  const getServerSnapshot = useCallback(() => '', [])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => listSavedTeachers(), [snapshot])
}
