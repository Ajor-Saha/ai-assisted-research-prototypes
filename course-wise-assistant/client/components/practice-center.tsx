"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, BrainCircuit, BookOpen, BarChart3, RotateCcw } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Question {
  id: string
  type: 'mcq' | 'gap'
  question: string
  options?: string[]
  answer: string
  explanation: string
}

const MOCK_QUESTIONS = {
  mcq: [
    {
      id: "1",
      type: "mcq" as const,
      question: "What is the dimension of the subspace spanned by (1,0,0) and (0,1,0)?",
      options: ["1", "2", "3", "0"],
      answer: "2",
      explanation: "The vectors are linearly independent, so they span a 2D plane.",
    },
    {
      id: "2",
      type: "mcq" as const,
      question: "Which of the following matrices is invertible?",
      options: ["[[1, 2], [2, 4]]", "[[1, 0], [0, 1]]", "[[0, 0], [0, 0]]", "[[1, 1], [1, 1]]"],
      answer: "[[1, 0], [0, 1]]",
      explanation: "The determinant of the identity matrix is 1, which is non-zero.",
    },
  ],
  gap: [
    {
      id: "3",
      type: "gap" as const,
      question: "Define linear independence of a set of vectors.",
      answer: "zero",
      explanation: "A set of vectors is linearly independent if the only solution to c1v1 + ... + cnvn = 0 is c1 = ... = cn = 0.",
    },
  ],
  "pop-quiz": [
    {
      id: "pq1",
      type: "mcq" as const,
      question: "[POP QUIZ] What is the trace of Identity Matrix I3?",
      options: ["1", "3", "0", "9"],
      answer: "3",
      explanation: "Trace is the sum of diagonal elements (1+1+1=3).",
    },
    {
      id: "pq2",
      type: "mcq" as const,
      question: "[POP QUIZ] If A is 3x3 and det(A)=2, what is det(2A)?",
      options: ["2", "4", "16", "8"],
      answer: "16",
      explanation: "det(kA) = k^n * det(A). Here n=3, k=2. So 2^3 * 2 = 8 * 2 = 16.",
    },
  ]
}

export function PracticeCenter({ termId }: { termId: string }) {
  const [activeTab, setActiveTab] = useState("mcq")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [userAnswers, setUserAnswers] = useState<{questionId: string, isCorrect: boolean, userAnswer: string}[]>([])
  const [isQuizComplete, setIsQuizComplete] = useState(false)

  const questions = MOCK_QUESTIONS[activeTab as keyof typeof MOCK_QUESTIONS] || []
  const currentQuestion = questions[currentQuestionIndex]

  const handleSubmit = () => {
    const isCorrect = selectedAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()
    setUserAnswers([...userAnswers, {
      questionId: currentQuestion.id,
      isCorrect,
      userAnswer: selectedAnswer
    }])
    setShowResult(true)
  }

  const handleNext = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(p => p + 1)
      setSelectedAnswer("")
      setShowResult(false)
    } else {
      setIsQuizComplete(true)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer("")
    setShowResult(false)
    setUserAnswers([])
    setIsQuizComplete(false)
  }

  const score = userAnswers.filter(a => a.isCorrect).length

  if (isQuizComplete) {
    return (
      <Card className="max-w-3xl mx-auto mt-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
          <CardDescription>Term Test {termId} Preparation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-4 border-primary">
              <div className="text-center">
                <span className="text-3xl font-bold">{Math.round((score / questions.length) * 100)}%</span>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-500">{score}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-500">{questions.length - score}</p>
              <p className="text-sm text-muted-foreground">Incorrect</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Question-Level Error Analysis
            </h3>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const ua = userAnswers.find(a => a.questionId === q.id)
                  if (!ua) return null
                  return (
                    <div key={q.id} className={`p-4 rounded-lg border ${ua.isCorrect ? 'bg-green-500/5 border-green-200' : 'bg-red-500/5 border-red-200'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm">Q{idx + 1}. {q.question}</span>
                        {ua.isCorrect ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Correct</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Incorrect</Badge>
                        )}
                      </div>
                      {!ua.isCorrect && (
                        <div className="text-sm space-y-1 mt-2">
                          <p className="text-red-600">Your Answer: {ua.userAnswer}</p>
                          <p className="text-green-600">Correct Answer: {q.answer}</p>
                          <p className="text-muted-foreground italic mt-2">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={resetQuiz} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Try Again
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Practice Center</h2>
          <p className="text-muted-foreground">Master concepts with adaptive quizzes</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <BarChart3 className="h-3 w-3" />
            Analytics
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); resetQuiz(); }} className="space-y-4">
        <TabsList>
          <TabsTrigger value="mcq" className="gap-2">
            <BookOpen className="h-4 w-4" /> MCQ Practice
          </TabsTrigger>
          <TabsTrigger value="gap" className="gap-2">
            <BrainCircuit className="h-4 w-4" /> Fill-in-Gaps
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
              <Badge>{activeTab === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank'}</Badge>
            </div>
            <Progress value={((currentQuestionIndex) / questions.length) * 100} className="h-1 mt-2" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-lg font-medium">{currentQuestion.question}</p>

            {currentQuestion.type === 'mcq' ? (
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showResult}>
                {currentQuestion.options?.map((option) => (
                  <div key={option} className={`flex items-center space-x-2 border p-4 rounded-lg transition-colors ${
                    showResult && option === currentQuestion.answer ? 'bg-green-500/10 border-green-500' :
                    showResult && option === selectedAnswer && option !== currentQuestion.answer ? 'bg-red-500/10 border-red-500' :
                    'hover:bg-accent'
                  }`}>
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="flex-1 cursor-pointer">{option}</Label>
                    {showResult && option === currentQuestion.answer && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {showResult && option === selectedAnswer && option !== currentQuestion.answer && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                <Input 
                  placeholder="Type your answer..." 
                  value={selectedAnswer} 
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={showResult}
                  className={showResult 
                    ? selectedAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim() 
                      ? "border-green-500 bg-green-50 dark:bg-green-900/10" 
                      : "border-red-500 bg-red-50 dark:bg-red-900/10"
                    : ""
                  }
                />
                {showResult && (
                  <p className="text-sm text-muted-foreground">Correct Answer: <span className="font-medium text-foreground">{currentQuestion.answer}</span></p>
                )}
              </div>
            )}

            {showResult && (
              <Alert variant={selectedAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim() ? "default" : "destructive"}>
                <AlertTitle>{selectedAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim() ? "Correct!" : "Incorrect"}</AlertTitle>
                <AlertDescription>{currentQuestion.explanation}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          
          <CardFooter className="justify-between">
            <span className="text-sm text-muted-foreground">Score: {userAnswers.filter(a => a.isCorrect).length}/{currentQuestionIndex + (showResult ? 1 : 0)}</span>
            {showResult ? (
              <Button onClick={handleNext}>
                {currentQuestionIndex + 1 === questions.length ? "Finish Quiz" : "Next Question"}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!selectedAnswer}>Check Answer</Button>
            )}
          </CardFooter>
        </Card>
      </Tabs>
    </div>
  )
}
