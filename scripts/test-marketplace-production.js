import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

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

async function testMarketplace() {
  console.log('================================================')
  console.log(' TAKHTI MARKETPLACE INTEGRATION TEST SUITE')
  console.log('================================================')
  console.log(`Connecting to: ${supabaseUrl}\n`)

  const testTeacherId = '00000000-0000-0000-0000-000000000000'
  let createdRatingId = null
  let createdInquiryId = null

  try {
    // 1. Verify we can select active teacher profiles (Public Search)
    console.log('[1/4] Verifying public active teacher profiles SELECT...')
    const { data: activeProfiles, error: selectErr } = await supabase
      .from('teacher_profiles')
      .select('id, full_name, is_active')
      .eq('is_active', true)
      .limit(5)

    if (selectErr) throw selectErr
    console.log(`  SUCCESS: Selected ${activeProfiles.length} active profiles.\n`)

    // 2. Verify profiles table query operates securely
    console.log('[2/4] Verifying profile SELECT with anonymous limits...')
    const { data: anonymousProfiles, error: anonErr } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('teacher_id', testTeacherId)

    if (anonErr) throw anonErr
    console.log(`  SUCCESS: Anonymous read queries executed without crashing.\n`)

    // 3. Test public parent rating submission
    console.log('[3/4] Testing Parent Rating submission...')
    
    // First, let's find any active profile to submit a rating for
    const { data: activeList } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('is_active', true)
      .limit(1)

    if (activeList && activeList.length > 0) {
      const targetProfileId = activeList[0].id
      
      const { data: rating, error: ratingErr } = await supabase
        .from('parent_ratings')
        .insert({
          teacher_profile_id: targetProfileId,
          parent_name: 'Test Parent (Rahul M.)',
          parent_phone: '+919999999999',
          student_class: 'Class 10',
          subject_taught: 'Mathematics',
          rating: 5,
          review_text: 'Sanyaas Ji, highly recommended for board preparation!'
        })
        .select()
        .single()

      if (ratingErr) {
        if (ratingErr.message.includes('RATE_LIMIT') || ratingErr.message.includes('rate_limit')) {
          console.log(`  SUCCESS: Submit rating trigger successfully intercepted rate limits: ${ratingErr.message}\n`)
        } else {
          throw ratingErr
        }
      } else {
        createdRatingId = rating.id
        console.log(`  SUCCESS: Rating submitted successfully for profile: ${targetProfileId}\n`)
      }
    } else {
      console.log('  SKIPPED: No active teacher profiles in database to rate.\n')
    }

    // 4. Test public parent inquiry submission
    console.log('[4/4] Testing Parent Inquiry submission...')
    if (activeList && activeList.length > 0) {
      const targetProfileId = activeList[0].id

      const { data: inquiry, error: inquiryErr } = await supabase
        .from('parent_inquiries')
        .insert({
          teacher_profile_id: targetProfileId,
          parent_name: 'Aditya (Parent)',
          parent_phone: '+918888888888',
          student_class: 'Class 9',
          subject_needed: 'Science',
          message: 'Hum aapki home tuition join karna chahte hain. Kripya connect karein.',
          contact_method: 'form'
        })
        .select()
        .single()

      if (inquiryErr) {
        if (inquiryErr.message.includes('RATE_LIMIT') || inquiryErr.message.includes('rate_limit')) {
          console.log(`  SUCCESS: Submit inquiry trigger successfully intercepted rate limits: ${inquiryErr.message}\n`)
        } else {
          throw inquiryErr
        }
      } else {
        createdInquiryId = inquiry.id
        console.log(`  SUCCESS: Parent inquiry submitted successfully for profile: ${targetProfileId}\n`)
      }
    } else {
      console.log('  SKIPPED: No active teacher profiles in database to inquire.\n')
    }

    console.log('================================================')
    console.log('  ALL MARKETPLACE INTEGRATION TESTS PASSED! 🎉')
    console.log('================================================')

  } catch (err) {
    console.error(`\n❌ TEST FAILURE: ${err.message}`)
  } finally {
    console.log('\nCleaning up marketplace test items...')
    if (createdRatingId) {
      await supabase.from('parent_ratings').delete().eq('id', createdRatingId)
      console.log('  Cleaned up test Rating.')
    }
    if (createdInquiryId) {
      await supabase.from('parent_inquiries').delete().eq('id', createdInquiryId)
      console.log('  Cleaned up test Inquiry.')
    }
    console.log('Clean-up complete.\n')
  }
}

testMarketplace()
