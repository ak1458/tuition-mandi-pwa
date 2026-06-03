import { appEnv } from '@/lib/env'
import { searchTeachers } from '@/lib/queries/teachers'
import { SUBJECTS, CLASSES, CITIES, AREAS } from '@/lib/taxonomy'
import type { TeacherProfile, SearchFilters } from '@/types/marketplace'

export interface AiSearchResponse {
  filters: SearchFilters & {
    subjects?: string[]
    classes_taught?: string[]
    area_mohalla?: string
  }
  responseText: string
  suggestions: string[]
  teachers: TeacherProfile[]
  isFallback: boolean
}

// Robust keyword extraction fallback if LLM is offline or API key is absent
function ruleBasedSearchFallback(query: string): Partial<SearchFilters> & { subjects?: string[]; classes_taught?: string[]; area_mohalla?: string } {
  const foundSubjects: string[] = []
  const foundClasses: string[] = []
  let homeTuition = false
  let onlineTuition = false

  const lowerQuery = query.toLowerCase()

  // Match subjects (e.g. Maths, Science, etc.)
  for (const sub of SUBJECTS) {
    if (lowerQuery.includes(sub.toLowerCase()) || 
        (sub === 'Mathematics' && (lowerQuery.includes('math') || lowerQuery.includes('ganit'))) || 
        (sub === 'Social Science' && (lowerQuery.includes('sst') || lowerQuery.includes('social')))) {
      foundSubjects.push(sub)
    }
  }

  // Match classes (e.g. Class 10, Class 9, etc.)
  for (const cls of CLASSES) {
    const num = cls.match(/\d+/)?.[0]
    if (lowerQuery.includes(cls.toLowerCase()) || 
        (num && lowerQuery.includes(`class ${num}`)) || 
        (num && lowerQuery.includes(`std ${num}`)) || 
        (num && lowerQuery.includes(`kaksha ${num}`))) {
      foundClasses.push(cls)
    }
  }

  if (lowerQuery.includes('home') || lowerQuery.includes('ghar') || lowerQuery.includes('offline') || lowerQuery.includes('personal')) {
    homeTuition = true
  }
  if (lowerQuery.includes('online') || lowerQuery.includes('computer') || lowerQuery.includes('internet') || lowerQuery.includes('zoom')) {
    onlineTuition = true
  }

  // Extract a known city from the query (proper casing comes from the list).
  let city: string | undefined
  const words = query.split(/\s+/)
  for (const w of words) {
    const cleaned = w.toLowerCase().replace(/[^a-z0-9]/g, '')
    const matchedCity = CITIES.find((c) => c.toLowerCase() === cleaned)
    if (matchedCity) city = matchedCity
  }

  // Extract a known neighbourhood / mohalla.
  const area = AREAS.find((a) => lowerQuery.includes(a.toLowerCase()))

  return {
    subjects: foundSubjects.length > 0 ? foundSubjects : undefined,
    classes_taught: foundClasses.length > 0 ? foundClasses : undefined,
    home_tuition: homeTuition || undefined,
    online_tuition: onlineTuition || undefined,
    city: city,
    area_mohalla: area,
  }
}

export async function searchTeachersWithAi(query: string): Promise<AiSearchResponse> {
  const cleanQuery = query.trim()
  if (!cleanQuery) {
    // Return standard active list
    const list = await searchTeachers({})
    return {
      filters: {},
      responseText: 'Namaste! Aap kis class ya subject ke liye verified home tutor dhoondh rahe hain? Jaise: "Class 10 science tutor Civil Lines mein".',
      suggestions: ['Class 10 Mathematics', 'Class 9 Science', 'English Speaking Gonda'],
      teachers: list,
      isFallback: false
    }
  }

  let filters: AiSearchResponse['filters'] = {}
  let responseText = ''
  let suggestions: string[] = ['Class 10 Mathematics', 'Class 9 Science', 'English Speaking Gonda']
  let usedLlm = false

  if (appEnv.openRouterApiKey) {
    try {
      const prompt = `You are an expert AI search assistant for Takhti (Aapka Digital Register).
A parent is searching for a private tutor using this query: "${cleanQuery}".

Analyze their query and extract:
1. subjects: Array of matching subjects. Available subjects: ${SUBJECTS.join(', ')}.
2. classes_taught: Array of matching classes. Available classes: ${CLASSES.join(', ')}.
3. city: String (extracted city name, e.g., "Gonda").
4. area_mohalla: String (extracted neighborhood or area name, e.g., "Civil Lines").
5. home_tuition: Boolean (true if they explicitly ask for home tuition or teacher coming home, "ghar pe", "home tutor").
6. online_tuition: Boolean (true if they explicitly ask for online classes, "computer pe", "online").
7. fee_max: Number (budget).
8. medium: String ("Hindi", "English", or "Both").

Also generate:
- responseText: A personalized, extremely helpful response in friendly Hinglish/Hindi confirming what you understood and what you are looking for. Keep it concise, professional, and positive.
- suggestions: Array of 2-3 quick follow-up query suggestions in Hinglish.

Return ONLY a valid JSON object matching this schema. Do not include markdown code block syntax (like \`\`\`json) or any extra text.

{
  "filters": {
    "subjects": string[] | null,
    "classes_taught": string[] | null,
    "city": string | null,
    "area_mohalla": string | null,
    "home_tuition": boolean | null,
    "online_tuition": boolean | null,
    "fee_max": number | null,
    "medium": string | null
  },
  "responseText": string,
  "suggestions": string[]
}`

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${appEnv.openRouterApiKey}`,
          'HTTP-Referer': appEnv.openRouterReferer,
          'X-Title': appEnv.openRouterTitle,
        },
        body: JSON.stringify({
          model: appEnv.openRouterModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        }),
      })

      if (res.ok) {
        const payload = await res.json()
        const text = payload.choices?.[0]?.message?.content?.trim() ?? ''
        
        // Strip markdown code fences if present
        const jsonText = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
        const parsed = JSON.parse(jsonText)
        filters = parsed.filters ?? {}
        responseText = parsed.responseText ?? ''
        suggestions = parsed.suggestions ?? suggestions
        usedLlm = true
      }
    } catch (e) {
      console.warn('[takhti] OpenRouter search call failed, using local keyword extractor fallback:', e)
    }
  }

  if (!usedLlm) {
    const rules = ruleBasedSearchFallback(cleanQuery)
    filters = rules
    const subjectNames = rules.subjects?.join(' + ') || 'Tutors'
    const classNames = rules.classes_taught?.join(', ') || ''
    const locationPart = rules.area_mohalla ? `${rules.area_mohalla}, ${rules.city || ''}` : (rules.city || '')
    responseText = `Zaroor! Hum ${classNames ? `${classNames} ke liye` : ''} ${subjectNames} ${locationPart ? `(${locationPart} area)` : ''} ke best tutors dhoondh rahe hain.`
  }

  // standard fields extraction
  const firstSubject = filters.subjects?.[0]
  const firstClass = filters.classes_taught?.[0]

  let matchingTutors = await searchTeachers({
    city: filters.city || undefined,
    subject: firstSubject,
    class_level: firstClass,
    fee_max: filters.fee_max || undefined,
    medium: filters.medium || undefined,
    home_tuition: filters.home_tuition || undefined,
    online_tuition: filters.online_tuition || undefined,
  })

  // Filter further by area_mohalla if present
  const area = filters.area_mohalla
  if (area && matchingTutors.length > 0) {
    const filtered = matchingTutors.filter(t => 
      t.area_mohalla?.toLowerCase().includes(area.toLowerCase())
    )
    if (filtered.length > 0) {
      matchingTutors = filtered
    }
  }

  let isFallback = false
  // If no exact match is found, broaden search filters to present intelligent recommendations!
  if (matchingTutors.length === 0) {
    isFallback = true
    
    // Broaden 1: Remove specific area & online/home constraints
    matchingTutors = await searchTeachers({
      city: filters.city || undefined,
      subject: firstSubject,
      class_level: firstClass,
    })

    // Broaden 2: Try city-wide generally
    if (matchingTutors.length === 0) {
      matchingTutors = await searchTeachers({
        city: filters.city || undefined,
      })
    }

    // Broaden 3: Try overall verified teachers
    if (matchingTutors.length === 0) {
      matchingTutors = await searchTeachers({})
    }

    if (matchingTutors.length > 0) {
      const subjectLabel = firstSubject || 'educational subjects'
      const areaLabel = filters.area_mohalla || filters.city || 'local area'
      responseText = `Aapke exact area (${areaLabel}) mein humein abhi matching ${subjectLabel} tutors nahi mile. Par humne city ke verified expert tutors niche recommend kiye hain jinhe aap directly message kar sakte hain.`
    } else {
      responseText = `Humein aapke city ya specified subjects ke teachers abhi nahi mile. Takhti team directly local level par teachers onboard kar rahi hai! Tab tak aap hamare online lessons ya guidance panel use kar sakte hain.`
    }
  }

  return {
    filters,
    responseText,
    suggestions,
    teachers: matchingTutors,
    isFallback
  }
}
