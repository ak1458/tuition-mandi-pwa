import {
    pgTable,
    uuid,
    text,
    timestamp,
    boolean,
    date,
    numeric,
    integer,
    pgEnum,
    unique,
    index,
    vector, // Note: For tsvector, Drizzle uses custom types or just text if not fully supported, but we can define custom type.
    customType
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent']);
export const feeStatusEnum = pgEnum('fee_status', ['pending', 'partial', 'paid']);

// Custom TSVector Type for Search Optimization
const tsvector = customType<{ data: string }>({
    dataType() {
        return 'tsvector';
    },
});

// -----------------------------------------------------------------------------
// V1 Core Schema
// -----------------------------------------------------------------------------

export const profiles = pgTable('profiles', {
    // Clerk user IDs are strings, so replacing UUID with text for teacher_id where it referred to auth.users
    id: text('id').primaryKey(),
    fullName: text('full_name').notNull(),
    phoneE164: text('phone_e164').unique(),
    email: text('email'),
    locale: text('locale').default('hi-IN').notNull(),
    timezone: text('timezone').default('Asia/Kolkata').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const batches = pgTable('batches', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    classLabel: text('class_label').notNull(),
    subject: text('subject').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const students = pgTable('students', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    classLabel: text('class_label').notNull(),
    subject: text('subject').notNull(),
    monthlyFee: numeric('monthly_fee', { precision: 10, scale: 2 }).notNull(),
    guardianPhone: text('guardian_phone'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const batchStudents = pgTable('batch_students', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id').notNull().references(() => batches.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.batchId, t.studentId)
}));

export const attendanceSessions = pgTable('attendance_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id').notNull().references(() => batches.id, { onDelete: 'cascade' }),
    sessionDate: date('session_date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.batchId, t.sessionDate),
}));

export const attendanceRecords = pgTable('attendance_records', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').notNull().references(() => attendanceSessions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull(),
    markedAt: timestamp('marked_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.sessionId, t.studentId),
}));

export const feeRecords = pgTable('fee_records', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    feeMonth: date('fee_month').notNull(),
    amountDue: numeric('amount_due', { precision: 10, scale: 2 }).notNull(),
    amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }).default('0').notNull(),
    status: feeStatusEnum('status').default('pending').notNull(),
    paidOn: date('paid_on'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.studentId, t.feeMonth),
}));

export const assessments = pgTable('assessments', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    assessmentDate: date('assessment_date').notNull(),
    title: text('title').notNull(),
    score: numeric('score', { precision: 5, scale: 2 }).notNull(),
    maxScore: numeric('max_score', { precision: 5, scale: 2 }).default('100').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const progressReports = pgTable('progress_reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    reportMonth: date('report_month').notNull(),
    attendancePercent: numeric('attendance_percent', { precision: 5, scale: 2 }).default('0').notNull(),
    avgScore: numeric('avg_score', { precision: 5, scale: 2 }).default('0').notNull(),
    testsDone: integer('tests_done').default(0).notNull(),
    language: text('language').default('hi').notNull(),
    reportText: text('report_text').notNull(),
    generatedBy: text('generated_by').default('gemini_flash').notNull(),
    sharedViaWhatsapp: boolean('shared_via_whatsapp').default(false).notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// V2 Marketplace Schema
// -----------------------------------------------------------------------------

export const teacherProfiles = pgTable('teacher_profiles', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),

    fullName: text('full_name').notNull(),
    phoneE164: text('phone_e164').notNull(),
    profilePhotoUrl: text('profile_photo_url'),
    bio: text('bio'),

    city: text('city').notNull(),
    district: text('district').notNull(),
    state: text('state').default('Uttar Pradesh').notNull(),
    areaMohalla: text('area_mohalla'),
    pincode: text('pincode'),

    subjects: text('subjects').array().notNull(),
    classesTaught: text('classes_taught').array().notNull(),
    medium: text('medium').default('Hindi'),
    experienceYears: integer('experience_years').default(0),
    timeSlots: text('time_slots').array(),
    homeTuition: boolean('home_tuition').default(true),
    onlineTuition: boolean('online_tuition').default(false),

    feeMin: integer('fee_min'),
    feeMax: integer('fee_max'),
    feeNegotiable: boolean('fee_negotiable').default(true),

    isVerified: boolean('is_verified').default(false),
    isActive: boolean('is_active').default(true),
    isOpenToSchool: boolean('is_open_to_school').default(false),
    plan: text('plan').default('free'), // Enforced via code or check constraint
    planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),

    searchVector: tsvector('search_vector'),
    totalStudentsTaught: integer('total_students_taught').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    teacherUnq: unique().on(t.teacherId),
    cityIdx: index('teacher_profiles_city_idx').on(t.city),
    districtIdx: index('teacher_profiles_district_idx').on(t.district),
    // Note: GIN indexes for arrays/tsvector typically defined via SQL in migrations
}));

export const parentRatings = pgTable('parent_ratings', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherProfileId: uuid('teacher_profile_id').notNull().references(() => teacherProfiles.id, { onDelete: 'cascade' }),

    parentName: text('parent_name').notNull(),
    parentPhone: text('parent_phone').notNull(),
    studentClass: text('student_class').notNull(),
    subjectTaught: text('subject_taught').notNull(),

    rating: integer('rating').notNull(),
    reviewText: text('review_text'),

    isVerified: boolean('is_verified').default(false),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    teacherProfileIdx: index('parent_ratings_teacher_idx').on(t.teacherProfileId)
}));

export const teacherOutcomes = pgTable('teacher_outcomes', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherProfileId: uuid('teacher_profile_id').notNull().references(() => teacherProfiles.id, { onDelete: 'cascade' }),
    teacherId: text('teacher_id').notNull().references(() => profiles.id),

    academicYear: text('academic_year').notNull(),
    totalStudents: integer('total_students').notNull(),
    studentsAbove75Percent: integer('students_above_75_percent').default(0),
    studentsAbove90Percent: integer('students_above_90_percent').default(0),
    boardToppers: integer('board_toppers').default(0),

    subject: text('subject').notNull(),
    classLevel: text('class_level').notNull(),

    isVerified: boolean('is_verified').default(false),
    verificationNote: text('verification_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    teacherProfileIdx: index('teacher_outcomes_profile_idx').on(t.teacherProfileId)
}));

export const parentInquiries = pgTable('parent_inquiries', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherProfileId: uuid('teacher_profile_id').notNull().references(() => teacherProfiles.id, { onDelete: 'cascade' }),

    parentName: text('parent_name'),
    parentPhone: text('parent_phone'),
    studentClass: text('student_class'),
    subjectNeeded: text('subject_needed'),
    message: text('message'),
    contactMethod: text('contact_method').default('whatsapp'),
    status: text('status').default('new'), // 'new', 'contacted', 'enrolled', 'not_interested'

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    teacherProfileIdx: index('parent_inquiries_teacher_idx').on(t.teacherProfileId)
}));

export const profileBoosts = pgTable('profile_boosts', {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherProfileId: uuid('teacher_profile_id').notNull().references(() => teacherProfiles.id, { onDelete: 'cascade' }),
    teacherId: text('teacher_id').notNull().references(() => profiles.id),

    boostType: text('boost_type').default('7day'),
    amountPaid: integer('amount_paid'),
    startsAt: timestamp('starts_at', { withTimezone: true }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    razorpayPaymentId: text('razorpay_payment_id'),
    isActive: boolean('is_active').default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    teacherProfileIdx: index('profile_boosts_teacher_idx').on(t.teacherProfileId),
    activeIdx: index('profile_boosts_active_idx').on(t.isActive, t.expiresAt)
}));
