"use client"

import Link from "next/link"
import { use, useEffect, useState, type ReactElement } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!exam || errorMessage) {
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
            <p className="text-sm text-destructive">{errorMessage ?? "Exam not found."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/course/${courseId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Practice
            </Button>
          </Link>
          <Link href={`/dashboard/course/${courseId}/exams/${examId}/take`}>
            <Button size="sm">Take Exam</Button>
          </Link>
        </div>
        <Badge variant="outline">{mode === "full" ? "With Answers" : "Student View"}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{exam.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {exam.paper.totalMarks} marks • {exam.paper.estimatedDurationMinutes} mins • {exam.paper.questions.length} questions
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {exam.paper.instructions.length > 0 ? (
            <div>
              <p className="font-medium mb-2">Instructions</p>
              <ul className="list-disc ml-5 space-y-1 text-sm text-muted-foreground">
                {exam.paper.instructions.map((instruction, index) => (
                  <li key={`${instruction}-${index}`}>{instruction}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {exam.paper.questions.map((question, index) => (
          <Card key={question.questionId}>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">Q{index + 1}</CardTitle>
                <Badge variant="secondary">{question.questionType} • {question.marks} marks</Badge>
              </div>
              {question.questionCategory ? (
                <p className="text-xs text-muted-foreground capitalize">Category: {question.questionCategory}</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {question.passage ? (
                <div className="rounded-md border bg-muted/20 p-3">
                  <p className="text-xs font-medium mb-2">Scenario / Passage</p>
                  <MarkdownBlock content={question.passage} />
                </div>
              ) : null}

              <MarkdownBlock content={question.prompt} />

              {question.questionType === "mcq" && question.options?.length ? (
                <ul className="space-y-2 text-sm">
                  {question.options.map((option, optionIndex) => (
                    <li key={`${question.questionId}-${option}`} className="rounded-md border bg-muted/20 px-3 py-2">
                      <MarkdownBlock content={`${String.fromCharCode(65 + optionIndex)}. ${option}`} />
                    </li>
                  ))}
                </ul>
              ) : null}

              {question.subQuestions?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sub-questions</p>
                  <ul className="space-y-2">
                    {question.subQuestions.map((subQuestion, subQuestionIndex) => (
                      <li key={subQuestion.subQuestionId} className="rounded-md border bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground mb-1">({String.fromCharCode(97 + subQuestionIndex)}) • {subQuestion.marks} marks</p>
                        <MarkdownBlock content={subQuestion.prompt} />
                        {mode === "full" && subQuestion.answer ? (
                          <div className="mt-2 text-emerald-700 dark:text-emerald-400">
                            <p className="text-xs font-medium mb-1">Answer</p>
                            <MarkdownBlock content={subQuestion.answer} />
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {mode === "full" && question.answer ? (
                <div className="rounded-md border border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-emerald-700 dark:text-emerald-400">
                  <p className="text-xs font-medium mb-1">Answer</p>
                  <MarkdownBlock content={question.answer} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
