export interface SignupAcademicContext {
  activePeriodName?: string
  batchMaps: { batchYear: number; semester: number }[]
}

export function computeDefaultSemesterForBatch(batchYear: number): number {
  if (batchYear >= 2026) return 1
  if (batchYear === 2025) return 2
  if (batchYear === 2024) return 4
  if (batchYear === 2023) return 6
  if (batchYear <= 2022) return 8
  return 1
}
