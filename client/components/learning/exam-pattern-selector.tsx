"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock3, FileText, ListChecks, Loader2, Target, Trash2, WandSparkles } from "lucide-react"
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
  if (pattern.hasSections) tags.push("Section-based")

  return tags
}

const renderConfigValue = (value: unknown): string => {
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return JSON.stringify(value)
  }

  return String(value)
}

interface ExamPatternSelectorProps {
  courseId: string
}

const formatDateTime = (value: string): string => {
  return new Date(value).toLocaleString()
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
      const exams = await getGeneratedExams({
        courseId,
        patternId,
      })
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

        if (response.length > 0) {
          setSelectedPatternId(response[0].examPatternId)
        }
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
    if (!selectedPatternId) {
      setSelectedPattern(null)
      return
    }

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
    if (!selectedPattern) {
      return []
    }

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Exam Patterns</CardTitle>
          <CardDescription>Select a pattern to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {isListLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : patterns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exam patterns available right now.</p>
          ) : (
            <ScrollArea className="h-80 pr-3">
              <div className="space-y-3">
                {patterns.map((pattern) => {
                  const isSelected = pattern.examPatternId === selectedPatternId

                  return (
                    <button
                      type="button"
                      key={pattern.examPatternId}
                      onClick={() => setSelectedPatternId(pattern.examPatternId)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium truncate">{pattern.name}</p>
                        <Badge variant="outline">{pattern.patternCode}</Badge>
                      </div>

                      {pattern.description ? (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{pattern.description}</p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {getPatternFeatureTags(pattern).map((tag) => (
                          <Badge key={`${pattern.examPatternId}-${tag}`} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Selected Pattern</CardTitle>
          <CardDescription>
            {selectedPattern ? selectedPattern.name : "Pick a pattern from the list"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isDetailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : selectedPattern ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Default Marks
                  </p>
                  <p className="text-lg font-semibold">{selectedPattern.defaultMarks}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    Default Time
                  </p>
                  <p className="text-lg font-semibold">
                    {selectedPattern.defaultTimeMinutes ? `${selectedPattern.defaultTimeMinutes} mins` : "Not fixed"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <ListChecks className="h-3 w-3" />
                  Available Question Types
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedPatternFeatures.length > 0 ? (
                    selectedPatternFeatures.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No question types configured</span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Pattern Config
                </p>
                <div className="space-y-2 text-sm">
                  {Object.entries(selectedPattern.config).length > 0 ? (
                    Object.entries(selectedPattern.config).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between gap-4 rounded-md bg-muted/30 p-2">
                        <span className="font-medium capitalize">{key}</span>
                        <span className="text-muted-foreground text-right break-all">
                          {renderConfigValue(value)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No extra config found.</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">AI Generated Exams</p>
                    <p className="text-xs text-muted-foreground">Uses your generated exam endpoints</p>
                  </div>
                  <Button onClick={() => void handleGenerateExam()} disabled={isGenerateLoading || !selectedPatternId}>
                    {isGenerateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                    Generate Exam
                  </Button>
                </div>

                {isGeneratedListLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : generatedExams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No generated exams yet for this pattern.</p>
                ) : (
                  <div className="space-y-2">
                    {generatedExams.map((exam) => (
                      <div key={exam.generatedExamId} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{exam.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(exam.createdAt)}</p>
                          </div>
                          <Badge variant="outline">{exam.aiModel ?? "gemini"}</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link href={`/dashboard/course/${courseId}/exams/${exam.generatedExamId}/take`}>
                            <Button size="sm">Take Exam</Button>
                          </Link>
                          <Link href={`/dashboard/course/${courseId}/exams/${exam.generatedExamId}`}>
                            <Button size="sm" variant="outline">View Details</Button>
                          </Link>
                          <Link href={`/dashboard/course/${courseId}/exams/${exam.generatedExamId}?mode=full`}>
                            <Button size="sm" variant="outline">View With Answers</Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleDeleteExam(exam.generatedExamId)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Full questions now open in a dedicated details page with markdown rendering.</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select an exam pattern to view details.</p>
          )}

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
