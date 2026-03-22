"use client"

import { useState, useEffect } from "react"
import { Calendar, Target, TrendingUp, CheckCircle2, Circle, Sparkles, RefreshCw, Clock3, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getLatestStudyPath,
  regenerateStudyPath,
  type StudyPath,
  type StudyPathTask,
} from "@/services/study-path-service"

interface StudyPathRecommendationsProps {
  courseId: string
  courseName: string
  examDate?: string
}

export function StudyPathRecommendations({
  courseId,
  courseName,
  examDate,
}: StudyPathRecommendationsProps) {
  const [studyPath, setStudyPath] = useState<StudyPath | null>(null)
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tasks = studyPath?.tasks ?? []

  const fetchStudyPath = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const path = await getLatestStudyPath(courseId, examDate)
      setStudyPath(path)
      setCompletedTaskIds(new Set())
    } catch (fetchError) {
      console.error(fetchError)
      setError("Failed to load study path. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchStudyPath()
  }, [courseId, examDate])

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setError(null)

    try {
      const regeneratedPath = await regenerateStudyPath(courseId, examDate)
      setStudyPath(regeneratedPath)
      setCompletedTaskIds(new Set())
    } catch (regenerateError) {
      console.error(regenerateError)
      setError("Failed to regenerate study path. Please try again.")
    } finally {
      setIsRegenerating(false)
    }
  }

  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((previousIds) => {
      const nextIds = new Set(previousIds)
      if (nextIds.has(taskId)) {
        nextIds.delete(taskId)
      } else {
        nextIds.add(taskId)
      }
      return nextIds
    })
  }

  const completedCount = tasks.filter((task) => completedTaskIds.has(task.id)).length
  const progress = tasks.length === 0 ? 0 : (completedCount / tasks.length) * 100

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const resolvedExamDate = studyPath?.examDate ?? examDate
  const daysUntilExam = resolvedExamDate
    ? Math.ceil((new Date(resolvedExamDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const getInsightIcon = (type: string) => {
    if (type === "focus") {
      return <Target className="h-4 w-4 text-blue-500" />
    }
    if (type === "pace") {
      return <Calendar className="h-4 w-4 text-green-500" />
    }
    return <Sparkles className="h-4 w-4 text-amber-500" />
  }

  const getInsightBg = (type: string) => {
    if (type === "focus") return "bg-blue-500/10"
    if (type === "pace") return "bg-green-500/10"
    return "bg-amber-500/10"
  }

  const isBusy = isLoading || isRegenerating

  if (isLoading && !studyPath) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-2 w-full" />
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-none bg-linear-to-br from-cyan-500/10 via-sky-500/5 to-background shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {studyPath?.title ?? "Personalized Study Path"}
              </CardTitle>
              <CardDescription>
                AI-generated recommendations based on your learning needs and exam timeline
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {daysUntilExam !== null && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {daysUntilExam} days until exam
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="gap-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                Re-generate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {studyPath?.summary && (
            <div className="rounded-lg border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
              {studyPath.summary}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">
                {completedCount} of {tasks.length} tasks completed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid gap-3 mt-6">
            {tasks.map((task: StudyPathTask) => {
              const isCompleted = completedTaskIds.has(task.id)

              return (
              <div
                key={task.id}
                className={`border rounded-lg p-4 transition-all ${
                  isCompleted ? "bg-muted/50" : "hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    disabled={isBusy}
                    className="mt-1 shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4
                        className={`font-medium ${
                          isCompleted ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </h4>
                      <Badge variant={getPriorityColor(task.priority)} className="shrink-0">
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {task.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )})}

            {!isLoading && tasks.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No tasks available yet. Click Re-generate to create a fresh study path for {courseName}.
              </div>
            )}
          </div>

          {studyPath?.generatedAt && (
            <p className="text-xs text-muted-foreground">
              Last generated: {format(new Date(studyPath.generatedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Study Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(studyPath?.insights ?? []).map((insight, index) => (
            <div key={`${insight.title}-${index}`} className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${getInsightBg(insight.type)}`}>
                {getInsightIcon(insight.type)}
              </div>
              <div>
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          ))}

          {!isLoading && (studyPath?.insights ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No insights available yet. Re-generate to refresh recommendations.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
