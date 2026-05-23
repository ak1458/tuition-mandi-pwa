/**
 * Vercel Edge Function: dynamic OpenGraph meta-tag injection for teacher profiles.
 *
 * WhatsApp/Facebook crawlers don't run JS, so a normal SPA can't show link
 * previews. This function intercepts requests for /profile/<id> and rewrites
 * the index.html shell with profile-specific <title> and <meta og:*> tags.
 *
 * Wired in vercel.json:
 *   - /profile/:id  -> /api/og?id=:id
 *
 * Real users (browsers) follow the same path; we serve the same SPA shell so
 * client-side React still hydrates and runs normally.
 */

export const config = {
  runtime: 'edge',
}

interface TeacherSummary {
  full_name: string
  bio: string | null
  city: string
  area_mohalla: string | null
  subjects: string[]
  classes_taught: string[]
  is_verified: boolean
  profile_photo_url: string | null
}

const ABSOLUTE_OG_IMAGE = 'https://takhti.app/og-image.png'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildSubtitle(teacher: TeacherSummary): string {
  const subjects = teacher.subjects.slice(0, 3).join(', ')
  const classes = teacher.classes_taught.slice(0, 2).join(' & ')
  const location = teacher.area_mohalla
    ? `${teacher.area_mohalla}, ${teacher.city}`
    : teacher.city
  const bits = [subjects, classes, location].filter(Boolean)
  return bits.join(' \u2022 ')
}

function buildDescription(teacher: TeacherSummary): string {
  const bio = teacher.bio?.trim()
  if (bio && bio.length > 0) return bio.slice(0, 200)
  const subtitle = buildSubtitle(teacher)
  return `${teacher.full_name} - ${subtitle}. Trusted private tuition teacher on Takhti.`
}

async function fetchTeacher(
  supabaseUrl: string,
  anonKey: string,
  profileId: string,
): Promise<TeacherSummary | null> {
  const url = new URL(`${supabaseUrl}/rest/v1/teacher_profiles`)
  url.searchParams.set(
    'select',
    'full_name,bio,city,area_mohalla,subjects,classes_taught,is_verified,profile_photo_url',
  )
  url.searchParams.set('id', `eq.${profileId}`)
  url.searchParams.set('is_active', 'eq.true')
  url.searchParams.set('limit', '1')

  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
    },
    // Cache at the edge for 5 minutes; teachers' public details rarely change.
    cf: { cacheTtl: 300 },
  } as RequestInit)

  if (!response.ok) return null
  const rows = (await response.json()) as TeacherSummary[]
  return rows[0] ?? null
}

function injectMetaTags(html: string, teacher: TeacherSummary, pageUrl: string): string {
  const title = teacher.is_verified
    ? `${teacher.full_name} (Verified) - ${teacher.subjects.slice(0, 2).join(', ')} Teacher | Takhti`
    : `${teacher.full_name} - ${teacher.subjects.slice(0, 2).join(', ')} Teacher | Takhti`

  const description = buildDescription(teacher)
  const image = teacher.profile_photo_url || ABSOLUTE_OG_IMAGE

  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeImage = escapeHtml(image)
  const safeUrl = escapeHtml(pageUrl)

  const tags = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDescription}" />`,
    `<link rel="canonical" href="${safeUrl}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDescription}" />`,
    `<meta property="og:image" content="${safeImage}" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    `<meta property="og:site_name" content="Takhti" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDescription}" />`,
    `<meta name="twitter:image" content="${safeImage}" />`,
  ].join('\n    ')

  // Replace any existing <title> + the description meta with the dynamic ones,
  // and append OG tags inside <head>.
  let next = html.replace(/<title>[^<]*<\/title>/i, '')
  next = next.replace(/<meta\s+name="description"[^>]*>/i, '')
  // Strip static OG/Twitter/canonical tags so we don't emit duplicates.
  next = next.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
  next = next.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
  next = next.replace(/<link\s+rel="canonical"[^>]*>/gi, '')
  next = next.replace('</head>', `    ${tags}\n  </head>`)
  return next
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const profileId = url.searchParams.get('id')

  // Build the canonical SPA shell URL (without our /api prefix).
  const shellUrl = `${url.origin}/index.html`
  const pageUrl = profileId ? `${url.origin}/profile/${profileId}` : url.origin

  let html: string
  try {
    const shellResponse = await fetch(shellUrl, {
      headers: { Accept: 'text/html' },
    })
    if (!shellResponse.ok) {
      return new Response('Shell not found', { status: 502 })
    }
    html = await shellResponse.text()
  } catch {
    return new Response('Shell fetch failed', { status: 502 })
  }

  if (!profileId) {
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  // Validate profileId is a valid UUID before querying the database
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(profileId)) {
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''

  if (!supabaseUrl || !anonKey) {
    // Misconfigured - serve plain shell rather than crashing.
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  let teacher: TeacherSummary | null = null
  try {
    teacher = await fetchTeacher(supabaseUrl, anonKey, profileId)
  } catch {
    teacher = null
  }

  const finalHtml = teacher ? injectMetaTags(html, teacher, pageUrl) : html

  return new Response(finalHtml, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Crawlers can cache for 5 min; users get fresh content via SPA hydration.
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  })
}
