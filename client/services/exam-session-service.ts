import { Axios } from "@/config/axios"

interface ApiResponse<T> {
  statusCode: number
  data: T
  message: string
  success: boolean
}

export interface ExamSession {
  examSessionId: string
  userId: string
  generatedExamId: string
  status: "in_progress" | "submitted" | "abandoned"
  startedAt: string
  submittedAt: string | null
  expiresAt: string
  selectedQuestions: string[] | null
  answers: Record<string, unknown>
  createdAt: string
  updatedAt: string | null
}

export interface ExamSessionTime {
  examSessionId: string
  status: "in_progress" | "submitted" | "abandoned"
  remainingSeconds: number
  expiresAt: string
}

export const startExamSession = async (generatedExamId: string): Promise<ExamSession> => {
  const response = await Axios.post<ApiResponse<ExamSession>>("/api/exam-sessions", {
    generatedExamId,
  })

  return response.data.data
}

export const getExamSessions = async (): Promise<ExamSession[]> => {
  const response = await Axios.get<ApiResponse<ExamSession[]>>("/api/exam-sessions")
  return response.data.data
}

export const getExamSessionById = async (examSessionId: string): Promise<ExamSession> => {
  const response = await Axios.get<ApiResponse<ExamSession>>(`/api/exam-sessions/${examSessionId}`)
  return response.data.data
}

export const getExamSessionRemainingTime = async (examSessionId: string): Promise<ExamSessionTime> => {
  const response = await Axios.get<ApiResponse<ExamSessionTime>>(`/api/exam-sessions/${examSessionId}/time`)
  return response.data.data
}

export const saveExamSessionAnswers = async (
  examSessionId: string,
  answers: Record<string, unknown>
): Promise<ExamSession> => {
  const response = await Axios.put<ApiResponse<ExamSession>>(`/api/exam-sessions/${examSessionId}/answers`, {
    answers,
  })

  return response.data.data
}

export const submitExamSession = async (examSessionId: string): Promise<ExamSession> => {
  const response = await Axios.post<ApiResponse<ExamSession>>(`/api/exam-sessions/${examSessionId}/submit`)
  return response.data.data
}

export const abandonExamSession = async (examSessionId: string): Promise<ExamSession> => {
  const response = await Axios.post<ApiResponse<ExamSession>>(`/api/exam-sessions/${examSessionId}/abandon`)
  return response.data.data
}
