interface PromptInput {
  studentName: string
  classLabel: string
  subject: string
  month: string
  attendancePercent: number
  avgScore: number
  testsDone: number
}

export function buildReportPrompt(input: PromptInput): string {
  return `
Role: Aap tuition teacher assistant ho. Hindi me parent-friendly report likhni hai.

Rules:
1. Sirf diye gaye data ka use karo. Koi nayi numbers ya facts mat banao.
2. Tone warm, respectful, professional ho.
3. 80-120 words ki concise report do.
4. Agar attendance 50 se kam ho to direct harsh line na do; "thodi aur mehnat ki zaroorat hai" phrase use karo.
5. Output plain Hindi text ho, bullet points na ho.

Student Data:
- Name: ${input.studentName}
- Class: ${input.classLabel}
- Subject: ${input.subject}
- Month: ${input.month}
- Attendance: ${input.attendancePercent}%
- Average Score: ${input.avgScore}%
- Tests Done: ${input.testsDone}
`.trim()
}
