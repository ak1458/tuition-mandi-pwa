import { supabase } from '@/lib/supabase-client'
import type { TeacherProfile, SearchFilters, ParentRating, ProfileBoost } from '@/types/marketplace'
import { isLocalMode } from '@/lib/env'

const MOCK_TEACHERS: TeacherProfile[] = [
    {
        id: 'mock-teacher-suresh',
        teacher_id: 'mock-teacher-id-suresh',
        full_name: 'Suresh Mishra',
        phone_e164: '+919876543210',
        profile_photo_url: null,
        bio: 'Maths padhana mera passion hai. Concepts clear karne aur result improve karne par focus.',
        city: 'Gonda',
        district: 'Gonda',
        state: 'Uttar Pradesh',
        area_mohalla: 'Civil Lines',
        pincode: '271001',
        subjects: ['Maths', 'Physics'],
        classes_taught: ['Class 9', 'Class 10'],
        medium: 'Both',
        experience_years: 5,
        time_slots: ['04:00 PM - 05:00 PM', '05:30 PM - 06:30 PM'],
        home_tuition: true,
        online_tuition: false,
        fee_min: 1200,
        fee_max: 1800,
        fee_negotiable: true,
        is_verified: true,
        is_active: true,
        is_open_to_school: true,
        plan: 'pro',
        plan_expires_at: null,
        total_students_taught: 120,
        parent_ratings: [
            {
                id: 'mock-rating-suresh-1',
                teacher_profile_id: 'mock-teacher-suresh',
                parent_name: 'Ramesh Gupta',
                student_class: 'Class 10',
                subject_taught: 'Maths',
                rating: 5,
                review_text: 'Bahut accha padhate hain, mere bete ke maths 72% se badhkar 93% ho gaye.',
                is_verified: true,
                verified_at: null,
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
            },
            {
                id: 'mock-rating-suresh-2',
                teacher_profile_id: 'mock-teacher-suresh',
                parent_name: 'Anita Singh',
                student_class: 'Class 9',
                subject_taught: 'Physics',
                rating: 4,
                review_text: 'Regular updates dete hain aur doubts patiently clear karte hain.',
                is_verified: true,
                verified_at: null,
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString()
            },
        ],
        teacher_outcomes: [
            {
                id: 'mock-outcome-suresh',
                teacher_profile_id: 'mock-teacher-suresh',
                teacher_id: 'mock-teacher-id-suresh',
                academic_year: '2025-26',
                total_students: 120,
                students_above_75_percent: 95,
                students_above_90_percent: 15,
                board_toppers: 3,
                subject: 'Maths',
                class_level: 'Class 10',
                is_verified: true,
                verification_note: 'Demo verified outcome',
                created_at: new Date().toISOString()
            }
        ],
        profile_boosts: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-teacher-anjali',
        teacher_id: 'mock-teacher-id-anjali',
        full_name: 'Anjali Verma',
        phone_e164: '+919988776655',
        profile_photo_url: null,
        bio: 'Maths aur Science ke basics ko simple examples se clear karwati hoon.',
        city: 'Gonda',
        district: 'Gonda',
        state: 'Uttar Pradesh',
        area_mohalla: 'Civil Lines',
        pincode: '271001',
        subjects: ['Maths', 'Science'],
        classes_taught: ['Class 8', 'Class 9', 'Class 10'],
        medium: 'Both',
        experience_years: 4,
        time_slots: ['03:00 PM - 04:00 PM', '06:00 PM - 07:00 PM'],
        home_tuition: true,
        online_tuition: true,
        fee_min: 1000,
        fee_max: 1600,
        fee_negotiable: true,
        is_verified: false,
        is_active: true,
        is_open_to_school: false,
        plan: 'free',
        plan_expires_at: null,
        total_students_taught: 60,
        parent_ratings: [
            {
                id: 'mock-rating-anjali',
                teacher_profile_id: 'mock-teacher-anjali',
                parent_name: 'Kavita Pandey',
                student_class: 'Class 8',
                subject_taught: 'Science',
                rating: 5,
                review_text: 'Meri beti ko science se dar lagta tha, ab confidence aa gaya hai.',
                is_verified: true,
                verified_at: null,
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
            }
        ],
        teacher_outcomes: [],
        profile_boosts: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-teacher-rohit',
        teacher_id: 'mock-teacher-id-rohit',
        full_name: 'Rohit Tiwari',
        phone_e164: '+917654321098',
        profile_photo_url: null,
        bio: 'Board preparation, weekly practice aur parents ko clear feedback.',
        city: 'Gonda',
        district: 'Gonda',
        state: 'Uttar Pradesh',
        area_mohalla: 'Gandhi Nagar',
        pincode: '271001',
        subjects: ['Maths'],
        classes_taught: ['Class 9', 'Class 10'],
        medium: 'Hindi',
        experience_years: 6,
        time_slots: ['05:00 PM - 06:00 PM'],
        home_tuition: false,
        online_tuition: true,
        fee_min: 900,
        fee_max: 1500,
        fee_negotiable: false,
        is_verified: true,
        is_active: true,
        is_open_to_school: true,
        plan: 'free',
        plan_expires_at: null,
        total_students_taught: 85,
        parent_ratings: [
            {
                id: 'mock-rating-rohit',
                teacher_profile_id: 'mock-teacher-rohit',
                parent_name: 'Manoj Yadav',
                student_class: 'Class 10',
                subject_taught: 'Maths',
                rating: 4,
                review_text: 'Practice bahut karwate hain, exam se pehle revision helpful raha.',
                is_verified: true,
                verified_at: null,
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString()
            }
        ],
        teacher_outcomes: [],
        profile_boosts: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'mock-teacher-neha',
        teacher_id: 'mock-teacher-id-neha',
        full_name: 'Neha Pandey',
        phone_e164: '+919112233445',
        profile_photo_url: null,
        bio: 'Junior classes ke liye friendly teaching, reading aur writing practice par focus.',
        city: 'Gonda',
        district: 'Gonda',
        state: 'Uttar Pradesh',
        area_mohalla: 'Station Road',
        pincode: '271001',
        subjects: ['Maths', 'English'],
        classes_taught: ['Class 6', 'Class 7', 'Class 8'],
        medium: 'English',
        experience_years: 4,
        time_slots: ['04:30 PM - 05:30 PM'],
        home_tuition: true,
        online_tuition: true,
        fee_min: 800,
        fee_max: 1400,
        fee_negotiable: true,
        is_verified: false,
        is_active: true,
        is_open_to_school: false,
        plan: 'free',
        plan_expires_at: null,
        total_students_taught: 42,
        parent_ratings: [
            {
                id: 'mock-rating-neha',
                teacher_profile_id: 'mock-teacher-neha',
                parent_name: 'Rekha Srivastava',
                student_class: 'Class 6',
                subject_taught: 'English',
                rating: 5,
                review_text: 'Bachche ko comfortable feel karwati hain. Homework bhi regular check hota hai.',
                is_verified: true,
                verified_at: null,
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString()
            }
        ],
        teacher_outcomes: [],
        profile_boosts: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
]

// ----------------------------------------------------------
// Teacher Profile CRUD
// ----------------------------------------------------------

export async function getTeacherProfile(teacherId: string) {
    if (isLocalMode) {
        return MOCK_TEACHERS.find(t => t.teacher_id === teacherId) || MOCK_TEACHERS[0]
    }
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
    if (isLocalMode) {
        // Return filtered mock list
        let filtered = MOCK_TEACHERS.filter(t => t.city.toLowerCase() === (filters.city || '').toLowerCase())
        if (filtered.length === 0) {
            filtered = MOCK_TEACHERS // default fallback so search never looks completely empty in mock mode
        }
        if (filters.subject) {
            filtered = filtered.filter(t => t.subjects.includes(filters.subject!))
        }
        if (filters.class_level) {
            filtered = filtered.filter(t => t.classes_taught.includes(filters.class_level!))
        }
        return sortTeachers(filtered)
    }

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
    if (isLocalMode) {
        return MOCK_TEACHERS.find(t => t.id === profileId) || MOCK_TEACHERS[0]
    }
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
    if (isLocalMode) {
        const teacher = MOCK_TEACHERS.find(t => t.id === data.teacher_profile_id)
        if (teacher) {
            teacher.parent_ratings = teacher.parent_ratings || []
            teacher.parent_ratings.push({
                id: `mock-r-${Date.now()}`,
                teacher_profile_id: data.teacher_profile_id,
                parent_name: data.parent_name,
                student_class: data.student_class,
                subject_taught: data.subject_taught,
                rating: data.rating,
                review_text: data.review_text || null,
                is_verified: false,
                verified_at: null,
                created_at: new Date().toISOString()
            })
        }
        return
    }
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
    if (isLocalMode) {
        const existing = localStorage.getItem('takhti_local_inquiries')
        const inquiries = existing ? JSON.parse(existing) : []
        inquiries.push({
            id: `mock-inq-${Date.now()}`,
            teacher_profile_id: data.teacher_profile_id,
            parent_name: data.parent_name || null,
            parent_phone: data.parent_phone || null,
            student_class: data.student_class || null,
            subject_needed: data.subject_needed || null,
            message: data.message || null,
            contact_method: 'form',
            status: 'new',
            created_at: new Date().toISOString()
        })
        localStorage.setItem('takhti_local_inquiries', JSON.stringify(inquiries))
        window.dispatchEvent(new CustomEvent('takhti:local-inquiries:change'))
        return
    }
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

