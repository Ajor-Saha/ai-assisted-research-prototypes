"use client"

import Link from "next/link"
import { use, useEffect, useState, type ReactElement } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Play,
  Target,
  Hash,
  Info,
  Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import {
  getGeneratedExamById,
  getGeneratedExamFullById,
  type GeneratedExam,
} from "@/services/generated-exam-service"

interface ExamDetailsPageProps {
  params: Promise<{ id: string; examId: string }>
  searchParams?: Promise<{ mode?: string }>
}

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
    .replaceAll("∗", "*")
    .replaceAll("′", "'")
    .replaceAll("‘", "'")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')

  const mergedFragments = normalizeFragmentedLines(normalizedSymbols)

  const compacted = mergedFragments.replace(/\b(?:[A-Za-z]\s){5,}[A-Za-z]\b/g, (match) => {
    return match.replace(/\s+/g, "")
  })

  return autoFenceLikelyCodeSnippet(compacted)
}

const inferCodeLanguage = (snippet: string): string => {
  const lower = snippet.toLowerCase()

  if (/\b(select|insert|update|delete|from|where|join)\b/.test(lower)) {
    return /\b(_post|\$[a-z_]|pdo|->prepare|->execute)\b/.test(lower) ? "php" : "sql"
  }

  if (/\b(function|const|let|var|=>|console\.log)\b/.test(lower)) {
    return "javascript"
  }

  return "text"
}

const autoFenceLikelyCodeSnippet = (content: string): string => {
  if (content.includes("```")) {
    return content
  }

  const codeSignalPattern = /\bSELECT\b|\bFROM\b|\bWHERE\b|_POST|pdo|->prepare|->execute|\$[A-Za-z_][A-Za-z0-9_]*\s*=|\w+\s*=\s*"[^"]+";/i

  if (!codeSignalPattern.test(content)) {
    return content
  }

  const snippetMatch = content.match(
    /(\$?[A-Za-z_][A-Za-z0-9_\[\]'"$>\-]*\s*=\s*[^\n]+;|SELECT\s+[\s\S]*?;|\$stmt\s*=\s*[^\n]+;|\$stmt->execute\([^\n]+\);)/i
  )

  if (!snippetMatch || snippetMatch[0].trim().length < 12) {
    return content
  }

  const snippet = snippetMatch[0].trim()
  const language = inferCodeLanguage(snippet)

  return content.replace(snippet, `\n\n\`\`\`${language}\n${snippet}\n\`\`\`\n`)
}

const MarkdownBlock = ({ content }: { content: string }): ReactElement => {
  const normalizedContent = normalizeMarkdownContent(content)

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 mt-6 pb-3 border-b-2 border-purple-300 dark:border-purple-700">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 mt-5 pb-2 border-b border-slate-300 dark:border-slate-600">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2 mt-4">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-3">
              {children}
            </h4>
          ),
          ul: ({ children }) => (
            <ul className="space-y-2 mb-5 ml-6 list-disc">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-3 mb-5 ml-6 list-decimal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed marker:text-purple-600 dark:marker:text-purple-400 marker:font-bold pl-1">
              {children}
            </li>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-linear-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 dark:border-purple-400 pl-4 py-2 my-4 bg-linear-to-r from-purple-50 via-purple-50 to-blue-50 dark:from-purple-950/30 dark:via-purple-950/30 dark:to-blue-950/30 text-slate-700 dark:text-slate-300 rounded-r-lg">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => (
            <pre className="bg-linear-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-slate-100 rounded-xl p-4 mb-4 overflow-x-auto border border-slate-700 shadow-lg text-xs">
              {children}
            </pre>
          ),
          code: ({ children, className }) => (
            <code
              className={
                className
                  ? `${className} text-xs`
                  : "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 text-[13px]"
              }
            >
              {children}
            </code>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-purple-700 dark:text-purple-300">{children}</strong>
          ),
          p: ({ children }) => <p className="leading-relaxed whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{children}</p>,
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}

export default function ExamDetailsPage({ params, searchParams }: ExamDetailsPageProps): ReactElement {
  const { id: courseId, examId } = use(params)
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined
  const mode = resolvedSearchParams?.mode === "full" ? "full" : "student"

  const [exam, setExam] = useState<GeneratedExam | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadExam = async (): Promise<void> => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = mode === "full"
          ? await getGeneratedExamFullById(examId)
          : await getGeneratedExamById(examId)

        setExam(response)
      } catch {
        setErrorMessage("Could not load exam details.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadExam()
  }, [examId, mode])

  const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"]

  const TYPE_STYLE: Record<string, string> = {
    mcq: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    short: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    broad: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    essay: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading exam…</p>
      </div>
    )
  }

  if (!exam || errorMessage) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <Link href={`/dashboard/course/${courseId}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Button>
        </Link>
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{errorMessage ?? "Exam not found."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* Admin Dashboard Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
        <div className="flex items-center gap-2 px-2 sm:px-4 w-full justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/dashboard/course/${courseId}`}>Course</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Practice</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Nav bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href={`/dashboard/course/${courseId}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Practice
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/course/${courseId}/exams/${examId}/take`}>
              <Button size="sm" className="gap-2">
                <Play className="h-3.5 w-3.5" />
                Take Exam
              </Button>
            </Link>
            {mode !== "full" && (
              <Link href={`/dashboard/course/${courseId}/exams/${examId}?mode=full`}>
                <Button size="sm" variant="outline" className="gap-2">
                  <Eye className="h-3.5 w-3.5" />
                  Show Answers
                </Button>
              </Link>
            )}
            <Badge
              variant="outline"
              className={mode === "full" ? "border-emerald-400 text-emerald-600 dark:text-emerald-400" : ""}
            >
              {mode === "full" ? "With Answers" : "Student View"}
            </Badge>
          </div>
        </div>

      {/* Exam Header Card */}
      <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0 mt-0.5">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl leading-tight">{exam.title}</CardTitle>
              <div className="flex flex-wrap gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-foreground">{exam.paper.totalMarks}</span>
                  <span>marks</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4 text-purple-500" />
                  <span className="font-semibold text-foreground">{exam.paper.estimatedDurationMinutes}</span>
                  <span>minutes</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-foreground">{exam.paper.questions.length}</span>
                  <span>questions</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {exam.paper.instructions.length > 0 && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Instructions</p>
                <ul className="space-y-1.5">
                  {exam.paper.instructions.map((instruction, index) => (
                    <li key={`${instruction}-${index}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {exam.paper.questions.map((question, index) => {
          const typeKey = question.questionType?.toLowerCase() ?? ""
          const typeClass = TYPE_STYLE[typeKey] ?? "bg-muted text-muted-foreground border-border"

          return (
            <Card key={question.questionId} className="overflow-hidden">
              {/* Question header stripe */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-muted/30 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  {question.questionCategory && (
                    <span className="text-xs text-muted-foreground capitalize">{question.questionCategory}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeClass}`}>
                    {question.questionType?.toUpperCase() ?? "Q"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {question.marks} {question.marks === 1 ? "mark" : "marks"}
                  </Badge>
                </div>
              </div>

              <CardContent className="pt-4 space-y-4">
                {/* Passage */}
                {question.passage && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-4">
                    <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400">
                      <Info className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Scenario / Passage</span>
                    </div>
                    <MarkdownBlock content={question.passage} />
                  </div>
                )}

                {/* Question prompt */}
                <div className="px-1">
                  <MarkdownBlock content={question.prompt} />
                </div>

                {/* MCQ Options */}
                {question.questionType === "mcq" && question.options?.length ? (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={`${question.questionId}-opt-${optionIndex}`}
                        className="flex items-start gap-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors p-3"
                      >
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs font-bold shrink-0 mt-0.5">
                          {OPTION_LABELS[optionIndex] ?? String(optionIndex + 1)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <MarkdownBlock content={option} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Sub-questions */}
                {question.subQuestions?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sub-questions</p>
                    <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                      {question.subQuestions.map((subQuestion, subIndex) => (
                        <div key={subQuestion.subQuestionId} className="rounded-xl border bg-muted/20 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold shrink-0">
                              {String.fromCharCode(97 + subIndex)}
                            </span>
                            <Badge variant="secondary" className="text-xs">{subQuestion.marks} marks</Badge>
                          </div>
                          <MarkdownBlock content={subQuestion.prompt} />
                          {mode === "full" && subQuestion.answer ? (
                            <div className="rounded-lg border border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 mt-2">
                              <div className="flex items-center gap-1.5 mb-2 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold uppercase tracking-wide">Answer</span>
                              </div>
                              <MarkdownBlock content={subQuestion.answer} />
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Full answer */}
                {mode === "full" && question.answer ? (
                  <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
                    <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400">
                      <Lightbulb className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Model Answer</span>
                    </div>
                    <MarkdownBlock content={question.answer} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div className="flex items-center justify-center gap-3 pt-2 pb-6">
        <Link href={`/dashboard/course/${courseId}/exams/${examId}/take`}>
          <Button size="lg" className="gap-2 px-8">
            <Play className="h-4 w-4" />
            Take This Exam
          </Button>
        </Link>
        <Link href={`/dashboard/course/${courseId}`}>
          <Button size="lg" variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Practice
          </Button>
        </Link>
      </div>
      </div>
    </>
  )
}
