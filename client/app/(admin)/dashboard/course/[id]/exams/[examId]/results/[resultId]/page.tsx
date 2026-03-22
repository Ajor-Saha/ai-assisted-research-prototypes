"use client"

import Link from "next/link"
import { use, useEffect, useMemo, useState, type ReactElement } from "react"
import { ArrowLeft, Brain, CircleCheckBig, Loader2, RefreshCw, Sparkles, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getExamResultById, type ExamResult } from "@/services/exam-result-service"

interface ExamResultPageProps {
  params: Promise<{ id: string; examId: string; resultId: string }>
}

const toSafeNumber = (value: string | number | null | undefined): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const getGradeTone = (percentage: number): "default" | "secondary" | "destructive" | "outline" => {
  if (percentage >= 85) {
    return "default"
  }

  if (percentage >= 70) {
    return "secondary"
  }

  if (percentage >= 50) {
    return "outline"
  }

  return "destructive"
}

export default function ExamResultPage({ params }: ExamResultPageProps): ReactElement {
  const { id: courseId, examId, resultId } = use(params)

  const [result, setResult] = useState<ExamResult | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadResult = async (): Promise<void> => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getExamResultById(resultId)
        setResult(response)
      } catch {
        setErrorMessage("Could not load evaluation result.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadResult()
  }, [resultId])

  const computedPercentage = useMemo<number>(() => {
    if (!result) {
      return 0
    }

    if (result.percentage) {
      return toSafeNumber(result.percentage)
    }

    const total = toSafeNumber(result.totalMarks)
    const obtained = toSafeNumber(result.obtainedMarks)

    if (total <= 0) {
      return 0
    }

    return Number(((obtained / total) * 100).toFixed(2))
  }, [result])

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!result || errorMessage) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <Link href={`/dashboard/course/${courseId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{errorMessage ?? "Result not found."}</CardContent>
        </Card>
      </div>
    )
  }

  const breakdown = Array.isArray(result.evaluation?.breakdown) ? result.evaluation.breakdown : []
  const overallFeedback = result.evaluation?.overallFeedback ?? "No overall feedback available."

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 dark:border-amber-900 bg-linear-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Exam Evaluation</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Performance Report</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">AI-evaluated feedback with per-question analysis</p>
          </div>
          <Badge variant={getGradeTone(computedPercentage)} className="px-3 py-1.5 text-sm">
            Grade: {result.grade ?? "N/A"}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-white/70 dark:bg-slate-900/50 p-3">
            <p className="text-xs text-muted-foreground">Obtained Marks</p>
            <p className="text-xl font-semibold">{toSafeNumber(result.obtainedMarks)} / {toSafeNumber(result.totalMarks)}</p>
          </div>
          <div className="rounded-lg border bg-white/70 dark:bg-slate-900/50 p-3">
            <p className="text-xs text-muted-foreground">Percentage</p>
            <p className="text-xl font-semibold">{computedPercentage.toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border bg-white/70 dark:bg-slate-900/50 p-3">
            <p className="text-xs text-muted-foreground">Evaluated At</p>
            <p className="text-sm font-medium">{new Date(result.evaluatedAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={Math.max(0, Math.min(100, computedPercentage))} className="h-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Feedback Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm leading-relaxed">{result.aiFeedback ?? "No AI summary available."}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Overall Feedback</p>
              <p className="text-sm leading-relaxed">{overallFeedback}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/dashboard/course/${courseId}/exams/${examId}/take`}>
              <Button className="w-full">
                <RefreshCw className="h-4 w-4" />
                Retake Exam
              </Button>
            </Link>
            <Link href={`/dashboard/course/${courseId}/exams/${examId}?mode=full`}>
              <Button className="w-full" variant="outline">
                <Sparkles className="h-4 w-4" />
                Review Answer Key
              </Button>
            </Link>
            <Link href={`/dashboard/course/${courseId}`}>
              <Button className="w-full" variant="ghost">
                <ArrowLeft className="h-4 w-4" />
                Back to Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleCheckBig className="h-5 w-5 text-emerald-500" />
            Question-wise Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No detailed breakdown was returned for this attempt.</p>
          ) : (
            <div className="space-y-3">
              {breakdown.map((item) => {
                const maxMarks = toSafeNumber(item.maxMarks)
                const awardedMarks = toSafeNumber(item.awardedMarks)
                const rowPercentage = maxMarks > 0 ? (awardedMarks / maxMarks) * 100 : 0

                return (
                  <div key={item.questionId} className="rounded-xl border p-4 space-y-2 bg-linear-to-r from-background to-muted/10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{item.questionId.toUpperCase()}</p>
                      <Badge variant={getGradeTone(rowPercentage)}>
                        {awardedMarks} / {maxMarks}
                      </Badge>
                    </div>
                    <Progress value={Math.max(0, Math.min(100, rowPercentage))} className="h-2" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.feedback}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
