import { Axios } from "@/config/axios"

interface ApiResponse<T> {
  statusCode: number
  data: T
  message: string
  success: boolean
}

export interface ExamEvaluationBreakdownItem {
  questionId: string
  maxMarks: number
  awardedMarks: number
  feedback: string
}

export interface ExamEvaluation {
  overallFeedback?: string
  breakdown?: ExamEvaluationBreakdownItem[]
}

export interface ExamResult {
  examResultId: string
  examSessionId: string
  userId: string
  totalMarks: number
  obtainedMarks: string
  percentage: string | null
  grade: string | null
  evaluation: ExamEvaluation
  aiFeedback: string | null
  evaluatedAt: string
  createdAt: string
  updatedAt: string | null
}

export const getExamResults = async (): Promise<ExamResult[]> => {
  const response = await Axios.get<ApiResponse<ExamResult[]>>(`/api/exam-results`)
  return response.data.data
}

export const evaluateExamSession = async (examSessionId: string): Promise<ExamResult> => {
  const response = await Axios.post<ApiResponse<ExamResult>>(`/api/exam-results/${examSessionId}/evaluate`)
  return response.data.data
}

export const getExamResultById = async (examResultId: string): Promise<ExamResult> => {
  const response = await Axios.get<ApiResponse<ExamResult>>(`/api/exam-results/${examResultId}`)
  return response.data.data
}
