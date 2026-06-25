"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Loader2, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { getGeneratedExamById, type GeneratedExam, type GeneratedExamQuestion } from "@/services/generated-exam-service"
import {
  getExamSessionRemainingTime,
  saveExamSessionAnswers,
  startExamSession,
  submitExamSession,
} from "@/services/exam-session-service"
import { evaluateExamSession } from "@/services/exam-result-service"

interface TakeExamPageProps {
  params: Promise<{ id: string; examId: string }>
}

interface QuestionAnswerPayload {
  response?: string
  option?: string
  subAnswers?: Record<string, string>
}

type AnswerMap = Record<string, QuestionAnswerPayload>

const normalizeFragmentedLines = (content: string): string => {
  const lines = content.split("\n")
  const merged: string[] = []
  let buffer = ""

  const isSingleCharFragment = (line: string): boolean => {
    const trimmed = line.trim()
    return trimmed.length === 1 && /^[A-Za-z0-9_*'"=().,+\-/]$/.test(trimmed)
  }

  const flushBuffer = (): void => {
    if (buffer.length > 0) {
      merged.push(buffer)
      buffer = ""
    }
  }

  lines.forEach((line) => {
    if (isSingleCharFragment(line)) {
      buffer += line.trim()
      return
    }

    flushBuffer()
    merged.push(line)
  })

  flushBuffer()
  return merged.join("\n")
}

const normalizeMarkdownContent = (content: string): string => {
  const normalizedSymbols = content
    .replace(/∗/g, "*")
    .replace(/′/g, "'")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')

  const mergedFragments = normalizeFragmentedLines(normalizedSymbols)

  return mergedFragments.replace(/\b(?:[A-Za-z]\s){5,}[A-Za-z]\b/g, (match) => {
    return match.replace(/\s+/g, "")
  })
}

const MarkdownBlock = ({ content }: { content: string }): ReactElement => {
  const normalizedContent = normalizeMarkdownContent(content)

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}

const formatSeconds = (value: number): string => {
  const safeValue = Math.max(0, value)
  const mins = Math.floor(safeValue / 60)
  const secs = safeValue % 60

  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const calculateAttemptedCount = (questions: GeneratedExamQuestion[], answers: AnswerMap): number => {
  return questions.reduce((count, question) => {
    const answerPayload = answers[question.questionId]
    if (!answerPayload) {
      return count
    }

    if (question.questionType === "mcq") {
      return answerPayload.option ? count + 1 : count
    }

    const mainResponse = answerPayload.response?.trim() ?? ""
    const subResponses = Object.values(answerPayload.subAnswers ?? {}).filter((value) => value.trim().length > 0)

    return mainResponse.length > 0 || subResponses.length > 0 ? count + 1 : count
  }, 0)
}

export default function TakeExamPage({ params }: TakeExamPageProps): ReactElement {
  const { id: courseId, examId } = use(params)
  const router = useRouter()

  const [exam, setExam] = useState<GeneratedExam | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSubmitRef = useRef<boolean>(false)

  const totalQuestions = exam?.paper.questions.length ?? 0
  const attemptedCount = useMemo<number>(() => {
    if (!exam) {
      return 0
    }

    return calculateAttemptedCount(exam.paper.questions, answers)
  }, [answers, exam])

  const progressValue = totalQuestions > 0 ? Math.round((attemptedCount / totalQuestions) * 100) : 0

  const persistAnswers = useCallback(async (payload: AnswerMap): Promise<void> => {
    if (!sessionId) {
      return
    }

    setIsSaving(true)
    try {
      await saveExamSessionAnswers(sessionId, payload)
    } catch {
      setErrorMessage("Could not auto-save answers. Your local draft is still kept.")
    } finally {
      setIsSaving(false)
    }
  }, [sessionId])

  const updateAnswer = useCallback((questionId: string, nextValue: QuestionAnswerPayload): void => {
    setAnswers((previous) => {
      const next = { ...previous, [questionId]: nextValue }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        void persistAnswers(next)
      }, 500)

      return next
    })
  }, [persistAnswers])

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!sessionId || !exam || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await persistAnswers(answers)
      await submitExamSession(sessionId)
      const evaluated = await evaluateExamSession(sessionId)

      router.push(`/dashboard/course/${courseId}/exams/${examId}/results/${evaluated.examResultId}`)
    } catch {
      setErrorMessage("Could not submit and evaluate exam. Please try again.")
      setIsSubmitting(false)
    }
  }, [answers, courseId, exam, examId, isSubmitting, persistAnswers, router, sessionId])

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      setIsBootstrapping(true)
      setErrorMessage(null)

      try {
        const [examData, session] = await Promise.all([
          getGeneratedExamById(examId),
          startExamSession(examId),
        ])

        setExam(examData)
        setSessionId(session.examSessionId)
        setRemainingSeconds(
          Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000))
        )

        if (examData.paper.questions.length > 0) {
          setActiveQuestionId(examData.paper.questions[0].questionId)
        }
      } catch {
        setErrorMessage("Could not start live exam session.")
      } finally {
        setIsBootstrapping(false)
      }
    }

    void bootstrap()
  }, [examId])

  useEffect(() => {
    if (!sessionId) {
      return
    }

    const timer = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    const syncTimer = setInterval(() => {
      void getExamSessionRemainingTime(sessionId)
        .then((data) => {
          setRemainingSeconds(data.remainingSeconds)
        })
        .catch(() => {
          // Ignore short-lived sync failures; local timer continues.
        })
    }, 15000)

    return () => {
      clearInterval(timer)
      clearInterval(syncTimer)
    }
  }, [sessionId])

  useEffect(() => {
    if (remainingSeconds > 0 || autoSubmitRef.current) {
      return
    }

    autoSubmitRef.current = true
    void handleSubmit()
  }, [handleSubmit, remainingSeconds])

  if (isBootstrapping) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!exam || !sessionId) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <Link href={`/dashboard/course/${courseId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{errorMessage ?? "Could not start exam."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-sky-200/70 dark:border-sky-900 bg-linear-to-r from-sky-50 via-cyan-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Live Attempt</p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{exam.title}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {exam.paper.totalMarks} marks • {exam.paper.questions.length} questions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={remainingSeconds < 120 ? "destructive" : "outline"} className="text-sm px-3 py-1.5">
              <Clock3 className="h-4 w-4 mr-1" />
              {formatSeconds(remainingSeconds)}
            </Badge>
            <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Exam
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Attempted {attemptedCount}/{totalQuestions}</span>
            <span>{progressValue}% complete</span>
          </div>
          <Progress value={progressValue} className="h-2.5" />
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-lg border border-rose-300/70 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/20 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-4">
          {exam.paper.questions.map((question, index) => {
            const answerPayload = answers[question.questionId] ?? {}

            return (
              <Card key={question.questionId} id={question.questionId} className="scroll-mt-24 border-l-4" style={{ borderLeftColor: question.questionType === 'mcq' ? '#8b5cf6' : question.questionType === 'short' ? '#0ea5e9' : '#10b981' }}>
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                      <CardTitle className="text-sm sm:text-base font-semibold text-muted-foreground">Question {index + 1}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`capitalize ${question.questionType === 'mcq' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200' : question.questionType === 'short' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200'}`} variant="outline">{question.questionType}</Badge>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300">{question.marks} marks</Badge>
                    </div>
                  </div>
                  {question.questionCategory ? (
                    <p className="text-xs text-muted-foreground capitalize">Category: {question.questionCategory}</p>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  {question.passage ? (
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Scenario / Passage</p>
                      <MarkdownBlock content={question.passage} />
                    </div>
                  ) : null}

                  <MarkdownBlock content={question.prompt} />

                  {question.questionType === "mcq" && question.options?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {question.options.map((option, optionIndex) => {
                        const selected = answerPayload.option === option
                        return (
                          <button
                            type="button"
                            key={`${question.questionId}-${option}`}
                            onClick={() => updateAnswer(question.questionId, {
                              ...answerPayload,
                              option,
                              response: option,
                            })}
                            className={`rounded-xl border-2 p-3 text-left transition-all ${
                              selected
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20 shadow-sm"
                                : "border-border hover:border-violet-200 hover:bg-violet-50/50 dark:hover:bg-violet-950/10"
                            }`}
                          >
                            <div className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold mb-1.5 ${
                              selected ? 'bg-violet-500 text-white' : 'bg-muted text-muted-foreground'
                            }`}>{String.fromCharCode(65 + optionIndex)}</div>
                            <MarkdownBlock content={option} />
                          </button>
                        )
                      })}
                    </div>
                  ) : null}

                  {question.subQuestions?.length ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Sub-questions</p>
                      {question.subQuestions.map((subQuestion, subQuestionIndex) => {
                        const currentSubAnswer = answerPayload.subAnswers?.[subQuestion.subQuestionId] ?? ""

                        return (
                          <div key={subQuestion.subQuestionId} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                            <p className="text-xs text-muted-foreground">
                              ({String.fromCharCode(97 + subQuestionIndex)}) • {subQuestion.marks} marks
                            </p>
                            <MarkdownBlock content={subQuestion.prompt} />
                            <Textarea
                              value={currentSubAnswer}
                              placeholder="Write your answer"
                              onChange={(event) => {
                                updateAnswer(question.questionId, {
                                  ...answerPayload,
                                  subAnswers: {
                                    ...(answerPayload.subAnswers ?? {}),
                                    [subQuestion.subQuestionId]: event.target.value,
                                  },
                                })
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : null}

                  {question.questionType !== "mcq" ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Your answer</p>
                      <Textarea
                        value={answerPayload.response ?? ""}
                        placeholder="Write your response in detail"
                        className="min-h-28"
                        onChange={(event) => {
                          updateAnswer(question.questionId, {
                            ...answerPayload,
                            response: event.target.value,
                          })
                        }}
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="h-fit lg:sticky lg:top-20 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">Navigator</CardTitle>
            </div>
            <div className="flex gap-3 text-xs mt-1">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Answered</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border-2 border-primary" />Active</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-border bg-background" />Pending</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="h-72 pr-2">
              <div className="grid grid-cols-4 gap-2">
                {exam.paper.questions.map((question, index) => {
                  const answerPayload = answers[question.questionId]
                  const attempted = question.questionType === "mcq"
                    ? Boolean(answerPayload?.option)
                    : Boolean(
                      (answerPayload?.response?.trim().length ?? 0) > 0 ||
                      Object.values(answerPayload?.subAnswers ?? {}).some((value) => value.trim().length > 0)
                    )

                  return (
                    <button
                      key={question.questionId}
                      type="button"
                      onClick={() => {
                        setActiveQuestionId(question.questionId)
                        document.getElementById(question.questionId)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                      }}
                      className={`h-10 rounded-lg border-2 text-xs font-semibold transition-all ${
                        activeQuestionId === question.questionId
                          ? "border-primary bg-primary/10 text-primary"
                          : attempted
                            ? "border-emerald-400/70 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                            : "hover:bg-muted/40 border-border"
                      }`}
                    >
                      {attempted ? <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-emerald-600" /> : index + 1}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                {isSaving ? "Saving..." : "All changes saved"}
              </p>
            </div>

            <Button className="w-full" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit & Evaluate
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
