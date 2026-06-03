/**
 * Single source of truth for the platform's teaching taxonomy.
 *
 * Subjects / classes / mediums were previously duplicated in
 * profile-setup-page.tsx and ai-search-service.ts. Keeping them here means the
 * teacher onboarding form, the search filters, and the AI query parser all stay
 * in sync — add a subject once and it appears everywhere.
 */

export const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi',
  'Social Science', 'Physics', 'Chemistry', 'Biology',
  'Accountancy', 'Economics', 'History', 'Geography',
] as const

export const CLASSES = [
  'Class 1-5', 'Class 6', 'Class 7', 'Class 8',
  'Class 9', 'Class 10', 'Class 11', 'Class 12',
] as const

export const MEDIUMS = ['Hindi', 'English', 'Both'] as const

/**
 * Cities and neighbourhoods TuitionMandi is actively onboarding in. Used by the AI
 * search rule-based fallback to pull a location out of free-text queries.
 * Extend these as the platform expands to new towns.
 */
export const CITIES = ['Gonda', 'Lucknow', 'Basti', 'Kanpur', 'Delhi', 'Noida'] as const
export const AREAS = ['Civil Lines', 'Gandhi Nagar', 'Pant Nagar'] as const
