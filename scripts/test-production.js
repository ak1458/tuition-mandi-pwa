import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually parse .env.local without external dotenv package
function loadEnv() {
  const envPath = 'd:/gravity/tution teacher site/takhti app/.env.local'
  if (!fs.existsSync(envPath)) return {}
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const index = trimmed.indexOf('=')
    if (index === -1) return
    const key = trimmed.slice(0, index).trim()
    const val = trimmed.slice(index + 1).trim()
    env[key] = val
  })
  return env
}

const envVars = loadEnv()
const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('FAIL: Supabase credentials missing in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSuite() {
  console.log('================================================')
  console.log('  TAKHTI AUTOMATED BACKEND & DATABASE TEST SUITE')
  console.log('================================================')
  console.log(`Connecting to: ${supabaseUrl}\n`)

  const testTeacherId = '00000000-0000-0000-0000-000000000000' // Using a clean, static GUID for testing
  let testStudentId = null
  let testBatchId = null

  try {
    // 1. Check Profiles table
    console.log('[1/6] Verifying profiles table...')
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (profileErr) throw new Error(`Profiles table error: ${profileErr.message}`)
    console.log('  SUCCESS: Profiles table is accessible.\n')

    // 2. Create test Batch
    console.log('[2/6] Testing Batch creation...')
    const { data: batch, error: batchErr } = await supabase
      .from('batches')
      .insert({
        teacher_id: testTeacherId,
        name: 'Test Class 10 Maths',
        class_label: 'Class 10',
        subject: 'Mathematics',
        is_active: true
      })
      .select()
      .single()

    if (batchErr) throw new Error(`Batch creation failed: ${batchErr.message}`)
    testBatchId = batch.id
    console.log(`  SUCCESS: Created Batch "${batch.name}" with ID: ${testBatchId}\n`)

    // 3. Create test Student
    console.log('[3/6] Testing Student creation...')
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .insert({
        teacher_id: testTeacherId,
        full_name: 'Rahul Kumar (Test Student)',
        class_label: 'Class 10',
        subject: 'Mathematics',
        monthly_fee: 800.00,
        guardian_phone: '9453878422',
        is_active: true
      })
      .select()
      .single()

    if (studentErr) throw new Error(`Student creation failed: ${studentErr.message}`)
    testStudentId = student.id
    console.log(`  SUCCESS: Created Student "${student.full_name}" with ID: ${testStudentId}\n`)

    // 4. Assign Student to Batch
    console.log('[4/6] Testing Batch-Student assignment...')
    const { error: assignErr } = await supabase
      .from('batch_students')
      .insert({
        teacher_id: testTeacherId,
        batch_id: testBatchId,
        student_id: testStudentId
      })
    
    if (assignErr) throw new Error(`Batch assignment failed: ${assignErr.message}`)
    console.log('  SUCCESS: Student assigned to Batch successfully.\n')

    // 5. Test Attendance records
    console.log('[5/6] Testing Attendance Session & Record creation...')
    const today = new Date().toISOString().slice(0, 10)
    
    const { data: session, error: sessionErr } = await supabase
      .from('attendance_sessions')
      .insert({
        teacher_id: testTeacherId,
        batch_id: testBatchId,
        session_date: today
      })
      .select()
      .single()

    if (sessionErr) throw new Error(`Attendance session creation failed: ${sessionErr.message}`)

    const { error: recordErr } = await supabase
      .from('attendance_records')
      .insert({
        teacher_id: testTeacherId,
        session_id: session.id,
        student_id: testStudentId,
        status: 'present'
      })

    if (recordErr) throw new Error(`Attendance record insertion failed: ${recordErr.message}`)
    console.log(`  SUCCESS: Marked Rahul Kumar as "present" for session on ${today}.\n`)

    // 6. Test Fee record insertion
    console.log('[6/6] Testing Fee record creation...')
    const feeMonth = `${today.slice(0, 7)}-01`
    
    const { data: feeRecord, error: feeErr } = await supabase
      .from('fee_records')
      .insert({
        teacher_id: testTeacherId,
        student_id: testStudentId,
        fee_month: feeMonth,
        amount_due: 800.00,
        amount_paid: 800.00,
        status: 'paid',
        paid_on: today
      })
      .select()
      .single()

    if (feeErr) throw new Error(`Fee record creation failed: ${feeErr.message}`)
    console.log(`  SUCCESS: Fee record marked as "paid" for month ${feeMonth.slice(0, 7)}.\n`)

    console.log('================================================')
    console.log('  ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉')
    console.log('================================================')

  } catch (err) {
    console.error(`\n❌ TEST FAILURE: ${err.message}`)
  } finally {
    // Clean up test data
    console.log('\nStarting database clean-up...')
    if (testStudentId) {
      await supabase.from('students').delete().eq('id', testStudentId)
      console.log('  Cleaned up test Student.')
    }
    if (testBatchId) {
      await supabase.from('batches').delete().eq('id', testBatchId)
      console.log('  Cleaned up test Batch.')
    }
    console.log('Clean-up complete. Database is in initial state.\n')
  }
}

testSuite()
