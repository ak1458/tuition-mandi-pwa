import { supabase } from '@/lib/supabase-client'
import type { TeacherProfile, SearchFilters, ParentRating, ProfileBoost } from '@/types/marketplace'

// ----------------------------------------------------------
// Teacher Profile CRUD
// ----------------------------------------------------------

export async function getTeacherProfile(teacherId: string) {
    const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('teacher_id', teacherId)
        .maybeSingle()

    if (error) throw error
    return data as TeacherProfile | null
}

export async function upsertTeacherProfile(
    profile: Partial<TeacherProfile> & { teacher_id: string }
) {
    const { data, error } = await supabase
        .from('teacher_profiles')
        .upsert(profile, { onConflict: 'teacher_id' })
        .select()
        .single()

    if (error) throw error
    return data as TeacherProfile
}

export async function updateTeacherProfile(
    profileId: string,
    updates: Partial<TeacherProfile>
) {
    const { data, error } = await supabase
        .from('teacher_profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single()

    if (error) throw error
    return data as TeacherProfile
}

// ----------------------------------------------------------
// Search Teachers (Public — no auth)
// ----------------------------------------------------------

export async function searchTeachers(filters: SearchFilters) {
    let query = supabase
        .from('teacher_profiles')
        .select(`
      *,
      parent_ratings(rating),
      teacher_outcomes(*),
      profile_boosts(is_active, expires_at)
    `)
        .eq('is_active', true)
        .eq('city', filters.city)

    if (filters.subject) {
        query = query.contains('subjects', [filters.subject])
    }
    if (filters.class_level) {
        query = query.contains('classes_taught', [filters.class_level])
    }
    if (filters.fee_max) {
        query = query.lte('fee_min', filters.fee_max)
    }
    if (filters.medium) {
        query = query.eq('medium', filters.medium)
    }
    if (filters.home_tuition) {
        query = query.eq('home_tuition', true)
    }

    const { data, error } = await query
    if (error) throw error

    return sortTeachers(data || [])
}

function sortTeachers(teachers: TeacherProfile[]) {
    return teachers.sort((a, b) => {
        const aBoost = a.profile_boosts?.some(
            (boost: ProfileBoost) => boost.is_active && new Date(boost.expires_at) > new Date()
        )
        const bBoost = b.profile_boosts?.some(
            (boost: ProfileBoost) => boost.is_active && new Date(boost.expires_at) > new Date()
        )

        if (aBoost && !bBoost) return -1
        if (!aBoost && bBoost) return 1

        const aRating = avgRating(a.parent_ratings)
        const bRating = avgRating(b.parent_ratings)
        return bRating - aRating
    })
}

function avgRating(ratings: ParentRating[] | undefined): number {
    if (!ratings?.length) return 0
    return ratings.reduce((sum: number, r: ParentRating) => sum + r.rating, 0) / ratings.length
}

// ----------------------------------------------------------
// Get Teacher Public Profile (no auth)
// ----------------------------------------------------------

export async function getTeacherPublicProfile(profileId: string) {
    const { data, error } = await supabase
        .from('teacher_profiles')
        .select(`
      *,
      parent_ratings(
        id, rating, review_text, parent_name,
        student_class, subject_taught, created_at
      ),
      teacher_outcomes(*)
    `)
        .eq('id', profileId)
        .eq('is_active', true)
        .single()

    if (error) throw error
    return data
}

// ----------------------------------------------------------
// Submit Rating (no auth)
// ----------------------------------------------------------

export async function submitRating(data: {
    teacher_profile_id: string
    parent_name: string
    parent_phone: string
    student_class: string
    subject_taught: string
    rating: number
    review_text?: string
}) {
    const { error } = await supabase
        .from('parent_ratings')
        .insert(data)

    if (error) throw error
}

// ----------------------------------------------------------
// Submit Inquiry (no auth)
// ----------------------------------------------------------

export async function submitInquiry(data: {
    teacher_profile_id: string
    parent_name?: string
    parent_phone?: string
    student_class?: string
    subject_needed?: string
    message?: string
}) {
    const { error } = await supabase
        .from('parent_inquiries')
        .insert({ ...data, contact_method: 'form' })

    if (error) throw error
}

// ----------------------------------------------------------
// Boost Profile
// ----------------------------------------------------------

export async function activateBoost(teacherId: string, durationDays: number, paymentId?: string) {
    const { data: profile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('teacher_id', teacherId)
        .single()

    if (!profile) throw new Error('Teacher profile not found')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    const { error } = await supabase
        .from('profile_boosts')
        .insert({
            teacher_profile_id: profile.id,
            expires_at: expiresAt.toISOString(),
            is_active: true,
            payment_id: paymentId
        })

    if (error) throw error
}

export async function getActiveBoost(teacherId: string) {
    const { data: profile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('teacher_id', teacherId)
        .single()

    if (!profile) return null

    const { data, error } = await supabase
        .from('profile_boosts')
        .select('*')
        .eq('teacher_profile_id', profile.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error
    return data
}

