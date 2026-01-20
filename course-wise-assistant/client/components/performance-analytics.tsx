"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { BrainCircuit, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"

const MOCK_TOPIC_PERFORMANCE = [
  { topic: "Data Structures", score: 85, status: "strong" },
  { topic: "Algorithms", score: 65, status: "average" },
  { topic: "Database", score: 90, status: "strong" },
  { topic: "Networking", score: 45, status: "weak" },
  { topic: "OS", score: 60, status: "average" },
]

const MOCK_HISTORY = [
  { quiz: "Q1", score: 60 },
  { quiz: "Q2", score: 75 },
  { quiz: "Q3", score: 70 },
  { quiz: "Q4", score: 85 },
  { quiz: "Q5", score: 90 },
]

export function PerformanceAnalytics() {
  const averageScore = Math.round(MOCK_HISTORY.reduce((acc, curr) => acc + curr.score, 0) / MOCK_HISTORY.length)
  const weakTopics = MOCK_TOPIC_PERFORMANCE.filter(t => t.score < 60)
  const strongTopics = MOCK_TOPIC_PERFORMANCE.filter(t => t.score >= 80)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
            <Progress value={averageScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_HISTORY.length}</div>
            <p className="text-xs text-muted-foreground">Total practice sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Topics Mastered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strongTopics.length}</div>
            <p className="text-xs text-muted-foreground">Out of {MOCK_TOPIC_PERFORMANCE.length} total topics</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Topic Performance</CardTitle>
            <CardDescription>Your strength across different subjects</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_TOPIC_PERFORMANCE} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="topic" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar 
                  dataKey="score" 
                  fill="currentColor" 
                  radius={[0, 4, 4, 0]}
                  className="fill-primary"
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Personalized revision plan based on your results</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {weakTopics.length > 0 ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Needs Attention</AlertTitle>
                <AlertDescription>
                  You are struggling with <strong>{weakTopics.map(t => t.topic).join(", ")}</strong>. 
                  Consider reviewing the lecture notes for these topics.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Great Job!</AlertTitle>
                <AlertDescription>You have a good grasp of all current topics.</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Suggested Actions</h4>
              {weakTopics.map(topic => (
                <div key={topic.topic} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Revise {topic.topic}</p>
                    <p className="text-xs text-muted-foreground">Accuracy: {topic.score}%</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8">
                    Start <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Take a Mixed Quiz</p>
                  <p className="text-xs text-muted-foreground">Test all topics together</p>
                </div>
                <Button size="sm" variant="outline" className="h-8">
                  Start <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
