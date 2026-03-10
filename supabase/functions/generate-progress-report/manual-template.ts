interface ManualTemplateInput {
  studentName: string
  attendancePercent: number
  avgScore: number
  testsDone: number
}

export function buildManualTemplate(input: ManualTemplateInput): string {
  return `${input.studentName} ke liye mahine ki progress: Attendance ${input.attendancePercent}% rahi, average score ${input.avgScore}% raha, aur ${input.testsDone} test complete huye. Regular practice aur revision continue rakhein.`
}
