import { Axios } from "@/config/axios"

export interface GeneratedExamQuestion {
  questionId: string
  questionType: "mcq" | "short" | "broad"
  prompt: string
  marks: number
  questionCategory?:
    | "direct"
    | "applied"
    | "calculation"
    | "coding"
    | "conceptual"
    | "conceptual-reasoning"
  passage?: string
  subQuestions?: Array<{
    subQuestionId: string
    prompt: string
    marks: number
    answer?: string
  }>
  options?: string[]
  answer?: string
}

export interface GeneratedExamPaper {
  title: string
  instructions: string[]
  estimatedDurationMinutes: number
  totalMarks: number
  questions: GeneratedExamQuestion[]
}

export interface GeneratedExamListItem {
  generatedExamId: string
  courseId: string
  examPatternId: string
  title: string
  aiModel: string | null
  createdAt: string
  updatedAt: string | null
}

export interface GeneratedExam extends GeneratedExamListItem {
  paper: GeneratedExamPaper
}

interface ApiResponse<T> {
  statusCode: number
  data: T
  message: string
  success: boolean
}

interface GenerateExamPayload {
  courseId: string
  examPatternId: string
  title?: string
  difficulty?: "easy" | "medium" | "hard"
  topicFocus?: string[]
}

interface ListGeneratedExamsFilters {
  courseId?: string
  patternId?: string
}

export const generateExam = async (payload: GenerateExamPayload): Promise<GeneratedExam> => {
  const response = await Axios.post<ApiResponse<GeneratedExam>>("/api/generated-exams/generate", payload)
  return response.data.data
}

export const getGeneratedExams = async (
  filters: ListGeneratedExamsFilters = {}
): Promise<GeneratedExamListItem[]> => {
  const response = await Axios.get<ApiResponse<GeneratedExamListItem[]>>("/api/generated-exams", {
    params: filters,
  })

  return response.data.data
}

export const getGeneratedExamById = async (generatedExamId: string): Promise<GeneratedExam> => {
  const response = await Axios.get<ApiResponse<GeneratedExam>>(`/api/generated-exams/${generatedExamId}`)
  return response.data.data
}

export const getGeneratedExamFullById = async (generatedExamId: string): Promise<GeneratedExam> => {
  const response = await Axios.get<ApiResponse<GeneratedExam>>(`/api/generated-exams/${generatedExamId}/full`)
  return response.data.data
}

export const deleteGeneratedExam = async (generatedExamId: string): Promise<void> => {
  await Axios.delete(`/api/generated-exams/${generatedExamId}`)
}
