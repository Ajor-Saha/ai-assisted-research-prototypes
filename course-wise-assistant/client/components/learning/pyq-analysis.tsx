"use client"

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BrainCircuit, Loader2, RefreshCw, TrendingUp } from "lucide-react"
import {
  getGeneratedExamFullById,
  getGeneratedExams,
  type GeneratedExam,
  type GeneratedExamQuestion,
} from "@/services/generated-exam-service"
import { getExamSessions, type ExamSession } from "@/services/exam-session-service"
import { getExamResults, type ExamResult } from "@/services/exam-result-service"

interface PYQAnalysisProps {
  courseId: string
}

interface TopicFrequencyRow {
  pattern: string
  total: number
  [year: string]: number | string
}

interface DifficultyTrendRow {
  year: string
  score: number
}

interface PredictionInsight {
  topic: string
  probability: number
  reason: string
}

const BAR_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"]

const FALLBACK_PREDICTIONS: PredictionInsight[] = [
  {
    topic: "Insufficient PYQ history",
    probability: 0,
    reason: "Generate and attempt more exams in Practice tab to unlock reliable predictions.",
  },
]

const getQuestionPatternLabel = (question: GeneratedExamQuestion): string => {
  if (question.questionCategory) {
    return question.questionCategory
      .split("-")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ")
  }

  if (question.questionType === "mcq") {
    return "MCQ"
  }

  if (question.questionType === "short") {
    return "Short"
  }

  return "Broad"
}

const getYearKey = (timestamp: string): string => {
  return new Date(timestamp).getFullYear().toString()
}

const buildTopicFrequencyRows = (generatedExams: GeneratedExam[]): TopicFrequencyRow[] => {
  if (generatedExams.length === 0) {
    return []
  }

  const yearSet = new Set<string>()
  const countByPattern = new Map<string, Map<string, number>>()

  generatedExams.forEach((exam) => {
    const year = getYearKey(exam.createdAt)
    yearSet.add(year)

    exam.paper.questions.forEach((question) => {
      const pattern = getQuestionPatternLabel(question)

      if (!countByPattern.has(pattern)) {
        countByPattern.set(pattern, new Map<string, number>())
      }

      const patternMap = countByPattern.get(pattern)
      if (!patternMap) {
        return
      }

      patternMap.set(year, (patternMap.get(year) ?? 0) + 1)
    })
  })

  const years = Array.from(yearSet).sort((first, second) => Number(first) - Number(second)).slice(-4)

  return Array.from(countByPattern.entries())
    .map(([pattern, counts]) => {
      const row: TopicFrequencyRow = {
        pattern,
        total: years.reduce((sum, year) => sum + (counts.get(year) ?? 0), 0),
      }

      years.forEach((year) => {
        row[year] = counts.get(year) ?? 0
      })

      return row
    })
    .sort((first, second) => second.total - first.total)
    .slice(0, 6)
}

const buildDifficultyRows = (
  examSessions: ExamSession[],
  examResults: ExamResult[],
  courseGeneratedExamIds: Set<string>
): DifficultyTrendRow[] => {
  if (examResults.length === 0) {
    return []
  }

  const sessionById = new Map<string, ExamSession>()
  examSessions.forEach((session) => {
    sessionById.set(session.examSessionId, session)
  })

  const yearScoreMap = new Map<string, { sum: number; count: number }>()

  examResults.forEach((result) => {
    const session = sessionById.get(result.examSessionId)
    if (!session) {
      return
    }

    if (!courseGeneratedExamIds.has(session.generatedExamId)) {
      return
    }

    const score = Number(result.percentage ?? 0)
    if (!Number.isFinite(score)) {
      return
    }

    const year = getYearKey(result.evaluatedAt)
    const aggregate = yearScoreMap.get(year) ?? { sum: 0, count: 0 }

    aggregate.sum += score
    aggregate.count += 1
    yearScoreMap.set(year, aggregate)
  })

  return Array.from(yearScoreMap.entries())
    .sort(([firstYear], [secondYear]) => Number(firstYear) - Number(secondYear))
    .map(([year, aggregate]) => ({
      year,
      score: Number((aggregate.sum / aggregate.count).toFixed(1)),
    }))
}

const buildPredictionInsights = (
  generatedExams: GeneratedExam[],
  courseId: string,
  examSessions: ExamSession[],
  examResults: ExamResult[]
): PredictionInsight[] => {
  const courseExams = generatedExams.filter((exam) => exam.courseId === courseId)

  if (courseExams.length === 0) {
    return FALLBACK_PREDICTIONS
  }

  const weightedPatternCounts = new Map<string, number>()
  let maxWeight = 0

  courseExams.forEach((exam) => {
    const ageInDays = Math.max(
      1,
      Math.floor((Date.now() - new Date(exam.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    )
    const recencyWeight = ageInDays <= 45 ? 1.3 : ageInDays <= 120 ? 1.15 : 1

    exam.paper.questions.forEach((question) => {
      const key = getQuestionPatternLabel(question)
      const next = (weightedPatternCounts.get(key) ?? 0) + recencyWeight
      weightedPatternCounts.set(key, next)
      maxWeight = Math.max(maxWeight, next)
    })
  })

  const sessionById = new Map<string, ExamSession>()
  examSessions.forEach((session) => {
    sessionById.set(session.examSessionId, session)
  })

  const resultCount = examResults.filter((result) => {
    const session = sessionById.get(result.examSessionId)
    return Boolean(session && courseExams.some((exam) => exam.generatedExamId === session.generatedExamId))
  }).length

  return Array.from(weightedPatternCounts.entries())
    .sort((first, second) => second[1] - first[1])
    .slice(0, 3)
    .map(([topic, count]) => {
      const normalized = maxWeight > 0 ? count / maxWeight : 0
      const probability = Math.min(95, Math.max(50, Math.round(52 + normalized * 42)))

      return {
        topic,
        probability,
        reason: `${topic} appears repeatedly in generated PYQ sets. Signal strength built from ${courseExams.length} exam papers and ${resultCount} evaluated attempts.`,
      }
    })
}

export function PYQAnalysis({ courseId }: PYQAnalysisProps): ReactElement {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [topicFrequencyRows, setTopicFrequencyRows] = useState<TopicFrequencyRow[]>([])
  const [difficultyRows, setDifficultyRows] = useState<DifficultyTrendRow[]>([])
  const [predictionRows, setPredictionRows] = useState<PredictionInsight[]>(FALLBACK_PREDICTIONS)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const chartYears = useMemo(() => {
    if (topicFrequencyRows.length === 0) {
      return []
    }

    return Object.keys(topicFrequencyRows[0]).filter((key) => key !== "pattern" && key !== "total")
  }, [topicFrequencyRows])

  const loadAnalytics = useCallback(async (isManualRefresh: boolean): Promise<void> => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setErrorMessage(null)

    try {
      const [generatedExamList, examSessions, examResults] = await Promise.all([
        getGeneratedExams({ courseId }),
        getExamSessions(),
        getExamResults(),
      ])

      const fullExamsRaw = await Promise.all(
        generatedExamList.map(async (exam) => {
          try {
            return await getGeneratedExamFullById(exam.generatedExamId)
          } catch {
            return null
          }
        })
      )

      const fullExams = fullExamsRaw.filter((exam): exam is GeneratedExam => exam !== null)

      const generatedExamById = new Map<string, GeneratedExam>()
      fullExams.forEach((exam) => {
        generatedExamById.set(exam.generatedExamId, exam)
      })

      const courseGeneratedExamIds = new Set<string>(
        generatedExamList.map((exam) => exam.generatedExamId)
      )

      setTopicFrequencyRows(buildTopicFrequencyRows(fullExams))
      setDifficultyRows(buildDifficultyRows(examSessions, examResults, courseGeneratedExamIds))
      setPredictionRows(buildPredictionInsights(fullExams, courseId, examSessions, examResults))
      setLastUpdated(new Date())
    } catch {
      setErrorMessage("Could not load PYQ analytics right now. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [courseId])

  useEffect(() => {
    void loadAnalytics(false)
  }, [loadAnalytics])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-95 w-full" />
          <Skeleton className="h-95 w-full" />
        </div>
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Exam Intelligence</h2>
          <p className="text-muted-foreground">Real PYQ analytics built from your generated exams and evaluated attempts.</p>
          {lastUpdated ? (
            <p className="text-xs text-muted-foreground mt-1">Updated {lastUpdated.toLocaleString()}</p>
          ) : null}
        </div>
        <Button variant="outline" onClick={() => void loadAnalytics(true)} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Analytics
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Question Pattern Frequency
            </CardTitle>
            <CardDescription>Pattern frequency across recent generated PYQ years</CardDescription>
          </CardHeader>
          <CardContent className="h-75">
            {topicFrequencyRows.length === 0 || chartYears.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No PYQ pattern data found yet for this course.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicFrequencyRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pattern" fontSize={12} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {chartYears.map((year, index) => (
                    <Bar
                      key={year}
                      dataKey={year}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Trend
            </CardTitle>
            <CardDescription>Average evaluated score trend (%) across PYQ attempts</CardDescription>
          </CardHeader>
          <CardContent className="h-75">
            {difficultyRows.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No evaluated exam attempts yet for trend analysis.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={difficultyRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Avg Score"]} />
                  <Line type="monotone" dataKey="score" stroke="var(--color-chart-3)" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Predicted Focus Areas
          </CardTitle>
          <CardDescription>Probability signal derived from recurring PYQ patterns and performance history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predictionRows.map((item) => (
              <div key={item.topic} className="bg-background p-4 rounded-lg border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h4 className="font-semibold line-clamp-2">{item.topic}</h4>
                    <Badge className={item.probability >= 80 ? "bg-red-500" : item.probability >= 60 ? "bg-yellow-500" : "bg-slate-500"}>
                      {item.probability}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
