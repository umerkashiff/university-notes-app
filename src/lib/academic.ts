export interface SignupAcademicContext {
  hasActivePeriod: boolean
  activePeriodName?: string
  batchMaps: { batchYear: number; semester: number }[]
}
