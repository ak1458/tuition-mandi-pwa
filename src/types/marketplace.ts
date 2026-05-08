// =============================================================
// V2 Marketplace Types — Takhti Hyperlocal Teacher Discovery
// =============================================================

export type TeachingMedium = 'Hindi' | 'English' | 'Both';
export type PlanType = 'free' | 'pro';
export type InquiryStatus = 'new' | 'contacted' | 'enrolled' | 'not_interested';
export type BoostType = '7day' | '15day' | '30day';

// ----------------------------------------------------------
// teacher_profiles table
// ----------------------------------------------------------
export interface TeacherProfile {
    id: string;
    teacher_id: string;
    full_name: string;
    phone_e164: string;
    profile_photo_url: string | null;
    bio: string | null;

    // Location
    city: string;
    district: string;
    state: string;
    area_mohalla: string | null;
    pincode: string | null;

    // Teaching
    subjects: string[];
    classes_taught: string[];
    medium: TeachingMedium;
    experience_years: number;
    time_slots: string[];
    home_tuition: boolean;
    online_tuition: boolean;

    // Fees
    fee_min: number | null;
    fee_max: number | null;
    fee_negotiable: boolean;

    // Status
    is_verified: boolean;
    is_active: boolean;
    is_open_to_school: boolean;
    plan: PlanType;
    plan_expires_at: string | null;
    total_students_taught: number;

    // Computed (from joins)
    average_rating?: number;
    total_ratings?: number;
    outcomes?: TeacherOutcome[];
    teacher_outcomes?: TeacherOutcome[]; // Supabase join alias (table name)
    parent_ratings?: ParentRating[];
    profile_boosts?: ProfileBoost[];

    created_at: string;
    updated_at: string;
}

// ----------------------------------------------------------
// parent_ratings table
// ----------------------------------------------------------
export interface ParentRating {
    id: string;
    teacher_profile_id: string;
    parent_name: string;
    parent_phone?: string; // not exposed publicly
    student_class: string;
    subject_taught: string;
    rating: number;
    review_text: string | null;
    is_verified: boolean;
    verified_at: string | null;
    created_at: string;
}

// ----------------------------------------------------------
// teacher_outcomes table
// ----------------------------------------------------------
export interface TeacherOutcome {
    id: string;
    teacher_profile_id: string;
    teacher_id: string;
    academic_year: string;
    total_students: number;
    students_above_75_percent: number;
    students_above_90_percent: number;
    board_toppers: number;
    subject: string;
    class_level: string;
    is_verified: boolean;
    verification_note: string | null;
    created_at: string;
}

// ----------------------------------------------------------
// parent_inquiries table
// ----------------------------------------------------------
export interface ParentInquiry {
    id: string;
    teacher_profile_id: string;
    parent_name: string | null;
    parent_phone: string | null;
    student_class: string | null;
    subject_needed: string | null;
    message: string | null;
    contact_method: string;
    status: InquiryStatus;
    created_at: string;
}

// ----------------------------------------------------------
// profile_boosts table
// ----------------------------------------------------------
export interface ProfileBoost {
    id: string;
    teacher_profile_id: string;
    teacher_id: string;
    boost_type: BoostType;
    amount_paid: number | null;
    starts_at: string;
    expires_at: string;
    razorpay_payment_id: string | null;
    is_active: boolean;
    created_at: string;
}

// ----------------------------------------------------------
// Search filters for parent search page
// ----------------------------------------------------------
export interface SearchFilters {
    city: string;
    subject?: string;
    class_level?: string;
    fee_max?: number;
    medium?: TeachingMedium;
    home_tuition?: boolean;
    online_tuition?: boolean;
}
