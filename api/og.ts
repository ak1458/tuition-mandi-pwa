/**
 * Vercel Edge Function: dynamic OpenGraph + JSON-LD injection for teacher
 * profiles.
 *
 * WhatsApp/Facebook crawlers don't run JS, so a normal SPA can't show link
 * previews. This function intercepts requests for /profile/<id> and rewrites
 * the index.html shell with profile-specific <title>, <meta og:*> and
 * <script type="application/ld+json"> tags.
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
  state: string | null
  subjects: string[]
  classes_taught: string[]
  is_verified: boolean
  profile_photo_url: string | null
  fee_min: number | null
  fee_max: number | null
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

/**
 * Validate that a URL is safe to render in <meta og:image> / <link rel=icon>
 * etc. Only accept http(s) and data:image/* URIs. Anything else (javascript:,
 * file:, vbscript:, blob:, ftp:) is dropped to the fallback OG image.
 */
function safeImageUrl(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  if (trimmed.length > 2048) return fallback

  // Quick scheme allow-list
  if (/^https:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      if (url.protocol !== 'https:') return fallback
      return trimmed
    } catch {
      return fallback
    }
  }

  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed)) {
    // Data URLs are fine for og:image but very large ones are dropped above.
    return trimmed
  }

  return fallback
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
  return `${teacher.full_name} - ${subtitle}. Trusted private tuition teacher on TuitionMandi.`
}

async function fetchTeacher(
  supabaseUrl: string,
  anonKey: string,
  profileId: string,
): Promise<TeacherSummary | null> {
  const url = new URL(`${supabaseUrl}/rest/v1/teacher_profiles`)
  url.searchParams.set(
    'select',
    'full_name,bio,city,area_mohalla,state,subjects,classes_taught,is_verified,profile_photo_url,fee_min,fee_max',
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

function buildTeacherJsonLd(teacher: TeacherSummary, pageUrl: string, image: string): string {
  const subtitle = buildSubtitle(teacher)
  const description = buildDescription(teacher)

  // EducationalOrganization for the teacher as a tuition provider.
  // Wrapped in Person + offering relationship for richer search results.
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: teacher.full_name,
    url: pageUrl,
    description,
    image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: teacher.city,
      addressRegion: teacher.state || 'Uttar Pradesh',
      addressCountry: 'IN',
    },
    knowsAbout: teacher.subjects,
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
    },
    keywords: [...teacher.subjects, ...teacher.classes_taught, teacher.city, subtitle].join(', '),
  }

  if (teacher.fee_min || teacher.fee_max) {
    data.makesOffer = {
      '@type': 'Offer',
      priceCurrency: 'INR',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'INR',
        minPrice: teacher.fee_min ?? undefined,
        maxPrice: teacher.fee_max ?? undefined,
      },
    }
  }

  // Use JSON.stringify to escape HTML-unsafe chars; then close any </ that
  // could break out of the script tag.
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

function injectMetaTags(html: string, teacher: TeacherSummary, pageUrl: string): string {
  const title = teacher.is_verified
    ? `${teacher.full_name} (Verified) - ${teacher.subjects.slice(0, 2).join(', ')} Teacher | TuitionMandi`
    : `${teacher.full_name} - ${teacher.subjects.slice(0, 2).join(', ')} Teacher | TuitionMandi`

  const description = buildDescription(teacher)
  const image = safeImageUrl(teacher.profile_photo_url, ABSOLUTE_OG_IMAGE)

  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeImage = escapeHtml(image)
  const safeUrl = escapeHtml(pageUrl)

  const jsonLd = buildTeacherJsonLd(teacher, pageUrl, image)

  const tags = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDescription}" />`,
    `<link rel="canonical" href="${safeUrl}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDescription}" />`,
    `<meta property="og:image" content="${safeImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    `<meta property="og:site_name" content="TuitionMandi" />`,
    `<meta property="og:locale" content="hi_IN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDescription}" />`,
    `<meta name="twitter:image" content="${safeImage}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ')

  // Replace any existing <title> + the description meta with the dynamic ones,
  // and append OG/JSON-LD tags inside <head>.
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
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=300',
      },
    })
  }

  // Validate profileId is a valid UUID before querying the database
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(profileId)) {
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=60',
      },
    })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''

  if (!supabaseUrl || !anonKey) {
    // Misconfigured - serve plain shell rather than crashing.
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=60',
      },
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
      // Defense-in-depth: this response is always the SPA shell + meta, never
      // user-private data, so it is safe to be served from a shared cache.
      'x-robots-tag': 'index, follow, max-image-preview:large',
    },
  })
}
