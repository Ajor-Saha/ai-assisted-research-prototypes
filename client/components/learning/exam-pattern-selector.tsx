"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Hash,
  ListChecks,
  Loader2,
  Play,
  Sparkles,
  Target,
  Trash2,
  WandSparkles,
} from "lucide-react"
import {
  getExamPatternById,
  getExamPatterns,
  type ExamPattern,
  type ExamPatternListItem,
} from "@/services/exam-pattern-service"
import {
  deleteGeneratedExam,
  generateExam,
  getGeneratedExams,
  type GeneratedExamListItem,
} from "@/services/generated-exam-service"

const getPatternFeatureTags = (pattern: ExamPatternListItem): string[] => {
  const tags: string[] = []
  if (pattern.hasMCQ) tags.push("MCQ")
  if (pattern.hasBroadQuestions) tags.push("Broad")
  if (pattern.hasShortQuestions) tags.push("Short")
  if (pattern.hasSections) tags.push("Sections")
  return tags
}

const TAG_COLORS: Record<string, string> = {
  MCQ: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  Broad: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  Short: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  Sections: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
}

const renderConfigValue = (value: unknown): ReactElement | string => {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground italic">empty</span>
    return (
      <div className="flex flex-wrap gap-1 justify-end">
        {value.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs font-normal">
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </Badge>
        ))}
      </div>
    )
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return <span className="text-muted-foreground italic">—</span>
    return (
      <div className="space-y-1 text-right">
        {entries.map(([k, v]) => (
          <div key={k} className="text-xs">
            <span className="text-muted-foreground">{k}: </span>
            <span>{String(v)}</span>
          </div>
        ))}
      </div>
    )
  }
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

const formatRelativeDate = (value: string): string => {
  const date = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface ExamPatternSelectorProps {
  courseId: string
}

export function ExamPatternSelector({ courseId }: ExamPatternSelectorProps): ReactElement {
  const [patterns, setPatterns] = useState<ExamPatternListItem[]>([])
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null)
  const [selectedPattern, setSelectedPattern] = useState<ExamPattern | null>(null)
  const [generatedExams, setGeneratedExams] = useState<GeneratedExamListItem[]>([])
  const [isListLoading, setIsListLoading] = useState<boolean>(true)
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false)
  const [isGeneratedListLoading, setIsGeneratedListLoading] = useState<boolean>(false)
  const [isGenerateLoading, setIsGenerateLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadGeneratedExams = useCallback(async (patternId?: string): Promise<void> => {
    setIsGeneratedListLoading(true)
    try {
      const exams = await getGeneratedExams({ courseId, patternId })
      setGeneratedExams(exams)
    } catch {
      setErrorMessage("Could not load generated exams.")
    } finally {
      setIsGeneratedListLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    const loadPatterns = async (): Promise<void> => {
      setIsListLoading(true)
      setErrorMessage(null)
      try {
        const response = await getExamPatterns()
        setPatterns(response)
        if (response.length > 0) setSelectedPatternId(response[0].examPatternId)
      } catch {
        setErrorMessage("Could not load exam patterns. Please try again.")
      } finally {
        setIsListLoading(false)
      }
    }
    void loadPatterns()
  }, [])

  useEffect(() => {
    void loadGeneratedExams(selectedPatternId ?? undefined)
  }, [selectedPatternId, loadGeneratedExams])

  useEffect(() => {
    if (!selectedPatternId) { setSelectedPattern(null); return }
    const loadPatternDetails = async (): Promise<void> => {
      setIsDetailLoading(true)
      setErrorMessage(null)
      try {
        const response = await getExamPatternById(selectedPatternId)
        setSelectedPattern(response)
      } catch {
        setErrorMessage("Could not load selected pattern details.")
        setSelectedPattern(null)
      } finally {
        setIsDetailLoading(false)
      }
    }
    void loadPatternDetails()
  }, [selectedPatternId])

  const selectedPatternFeatures = useMemo(() => {
    if (!selectedPattern) return []
    return getPatternFeatureTags(selectedPattern)
  }, [selectedPattern])

  const handleGenerateExam = async (): Promise<void> => {
    if (!selectedPatternId || !selectedPattern) {
      setErrorMessage("Select a pattern before generating an exam.")
      return
    }
    setIsGenerateLoading(true)
    setErrorMessage(null)
    try {
      const createdExam = await generateExam({
        courseId,
        examPatternId: selectedPatternId,
        title: `${selectedPattern.name} Practice Exam`,
        difficulty: "medium",
      })
      await loadGeneratedExams(selectedPatternId)
      if (createdExam.generatedExamId) {
        window.location.href = `/dashboard/course/${courseId}/exams/${createdExam.generatedExamId}`
      }
    } catch {
      setErrorMessage("Could not generate exam. Please try again.")
    } finally {
      setIsGenerateLoading(false)
    }
  }

  const handleDeleteExam = async (generatedExamId: string): Promise<void> => {
    setErrorMessage(null)
    try {
      await deleteGeneratedExam(generatedExamId)
      await loadGeneratedExams(selectedPatternId ?? undefined)
    } catch {
      setErrorMessage("Could not delete generated exam.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <BrainCircuit className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Practice Exams</h2>
          <p className="text-sm text-muted-foreground">Choose an exam pattern and generate AI-powered practice tests</p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pattern List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Exam Patterns</span>
          </div>
          {isListLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : patterns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-8 pb-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No exam patterns available</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-105 pr-1">
              <div className="space-y-2 pr-2">
                {patterns.map((pattern) => {
                  const isSelected = pattern.examPatternId === selectedPatternId
                  const tags = getPatternFeatureTags(pattern)
                  return (
                    <button
                      type="button"
                      key={pattern.examPatternId}
                      onClick={() => setSelectedPatternId(pattern.examPatternId)}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm leading-tight">{pattern.name}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold shrink-0 ${isSelected ? "border-primary text-primary" : ""}`}
                        >
                          {pattern.patternCode}
                        </Badge>
                      </div>
                      {pattern.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{pattern.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <span
                            key={`${pattern.examPatternId}-${tag}`}
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${TAG_COLORS[tag] ?? "bg-muted text-muted-foreground"}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Selected</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Pattern Detail + Exam Generation */}
        <div className="lg:col-span-2 space-y-4">
          {isDetailLoading ? (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-28 w-full" />
              </CardContent>
            </Card>
          ) : selectedPattern ? (
            <>
              {/* Pattern Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {selectedPattern.name}
                  </CardTitle>
                  {selectedPattern.description && (
                    <p className="text-sm text-muted-foreground">{selectedPattern.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-linear-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/10 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-1">
                        <Target className="h-3.5 w-3.5" />
                        <span>Total Marks</span>
                      </div>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{selectedPattern.defaultMarks}</p>
                    </div>
                    <div className="rounded-xl border bg-linear-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/30 dark:to-purple-950/10 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 mb-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>Duration</span>
                      </div>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                        {selectedPattern.defaultTimeMinutes ? `${selectedPattern.defaultTimeMinutes}m` : "Flexible"}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-linear-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10 p-3 col-span-2 sm:col-span-1">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                        <ListChecks className="h-3.5 w-3.5" />
                        <span>Question Types</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPatternFeatures.length > 0 ? (
                          selectedPatternFeatures.map((tag) => (
                            <span
                              key={tag}
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${TAG_COLORS[tag] ?? "bg-muted text-muted-foreground"}`}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {Object.entries(selectedPattern.config).length > 0 && (
                    <div className="rounded-xl border bg-muted/20 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pattern Configuration</span>
                      </div>
                      <div className="divide-y">
                        {Object.entries(selectedPattern.config).map(([key, value]) => (
                          <div key={key} className="flex items-start justify-between gap-4 px-4 py-2.5">
                            <span className="text-sm font-medium capitalize text-foreground">{key.replace(/_/g, " ")}</span>
                            <div className="text-sm text-muted-foreground min-w-0">
                              {renderConfigValue(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generate + Exam History */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <WandSparkles className="h-4 w-4 text-primary" />
                        AI Generated Exams
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {generatedExams.length > 0 ? `${generatedExams.length} exam${generatedExams.length > 1 ? "s" : ""} generated` : "No exams yet for this pattern"}
                      </p>
                    </div>
                    <Button
                      onClick={() => void handleGenerateExam()}
                      disabled={isGenerateLoading || !selectedPatternId}
                      className="bg-linear-to-r from-primary to-primary/80 shadow-sm gap-2"
                    >
                      {isGenerateLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                      ) : (
                        <><WandSparkles className="h-4 w-4" /> Generate Exam</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-4" />
                  {isGeneratedListLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full rounded-xl" />
                      <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                  ) : generatedExams.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <WandSparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No exams generated yet</p>
                      <p className="text-xs mt-1">Click &ldquo;Generate Exam&rdquo; to create your first practice test</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {generatedExams.map((exam, index) => (
                        <div
                          key={exam.generatedExamId}
                          className="group rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all p-4"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                                  {index + 1}
                                </span>
                                <p className="font-semibold text-sm truncate">{exam.title}</p>
                              </div>
                              <p className="text-xs text-muted-foreground ml-7">{formatRelativeDate(exam.createdAt)}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {exam.aiModel ?? "gemini"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/dashboard/course/${courseId}/exams/${exam.generatedExamId}/take`}>
                              <Button size="sm" className="gap-1.5 h-8">
                                <Play className="h-3.5 w-3.5" />
                                Take Exam
                              </Button>
                            </Link>
                            <Link href={`/dashboard/course/${courseId}/exams/${exam.generatedExamId}`}>
                              <Button size="sm" variant="outline" className="gap-1.5 h-8">
                                <FileText className="h-3.5 w-3.5" />
                                Questions
                              </Button>
                            </Link>
                            <Link href={`/dashboard/course/${courseId}/exams/${exam.generatedExamId}?mode=full`}>
                              <Button size="sm" variant="outline" className="gap-1.5 h-8">
                                <Eye className="h-3.5 w-3.5" />
                                With Answers
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5 h-8 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                              onClick={() => void handleDeleteExam(exam.generatedExamId)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed h-full min-h-60">
              <CardContent className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <BrainCircuit className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Select an exam pattern</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Choose from the list on the left to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
