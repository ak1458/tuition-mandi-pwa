/**
 * Bookmarked / saved teachers store for parent-side users.
 * Cached as JSON in localStorage; supports cross-tab sync.
 */

import type { TeacherProfile } from '@/types/marketplace'

const KEY = 'takhti_saved_teachers_v1'
const CHANGE_EVENT = 'takhti:saved-teachers:change'

export interface SavedTeacher {
  id: string
  full_name: string
  city: string
  area_mohalla: string | null
  subjects: string[]
  classes_taught: string[]
  is_verified: boolean
  saved_at: string
}

function readAll(): SavedTeacher[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedTeacher[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: SavedTeacher[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function listSavedTeachers(): SavedTeacher[] {
  return readAll().sort((a, b) => b.saved_at.localeCompare(a.saved_at))
}

export function isTeacherSaved(teacherId: string): boolean {
  return readAll().some((teacher) => teacher.id === teacherId)
}

export function toggleSavedTeacher(teacher: TeacherProfile): boolean {
  const items = readAll()
  const existingIndex = items.findIndex((entry) => entry.id === teacher.id)
  if (existingIndex >= 0) {
    items.splice(existingIndex, 1)
    writeAll(items)
    return false
  }
  items.unshift({
    id: teacher.id,
    full_name: teacher.full_name,
    city: teacher.city,
    area_mohalla: teacher.area_mohalla ?? null,
    subjects: teacher.subjects,
    classes_taught: teacher.classes_taught,
    is_verified: teacher.is_verified,
    saved_at: new Date().toISOString(),
  })
  writeAll(items)
  return true
}

export function removeSavedTeacher(teacherId: string) {
  writeAll(readAll().filter((entry) => entry.id !== teacherId))
}

export function onSavedTeachersChange(callback: () => void) {
  const local = () => callback()
  const cross = (event: StorageEvent) => {
    if (event.key === KEY) callback()
  }
  window.addEventListener(CHANGE_EVENT, local)
  window.addEventListener('storage', cross)
  return () => {
    window.removeEventListener(CHANGE_EVENT, local)
    window.removeEventListener('storage', cross)
  }
}
