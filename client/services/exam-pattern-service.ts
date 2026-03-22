import { Axios } from "@/config/axios"

export interface ExamPatternListItem {
  examPatternId: string
  patternCode: string
  name: string
  description: string | null
  defaultMarks: number
  defaultTimeMinutes: number | null
  allowCustomMarks: boolean
  allowCustomTime: boolean
  hasSections: boolean
  hasMCQ: boolean
  hasBroadQuestions: boolean
  hasShortQuestions: boolean
  createdAt: string
  updatedAt: string | null
}

export interface ExamPattern extends ExamPatternListItem {
  config: Record<string, unknown>
}

interface ApiResponse<T> {
  statusCode: number
  data: T
  message: string
  success: boolean
}

export const getExamPatterns = async (): Promise<ExamPatternListItem[]> => {
  const response = await Axios.get<ApiResponse<ExamPatternListItem[]>>("/api/exam-patterns")
  return response.data.data
}

export const getExamPatternById = async (examPatternId: string): Promise<ExamPattern> => {
  const response = await Axios.get<ApiResponse<ExamPattern>>(`/api/exam-patterns/${examPatternId}`)
  return response.data.data
}
