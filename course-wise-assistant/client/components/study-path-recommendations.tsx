"use client"

import { useState, useEffect } from "react"
import { Calendar, Target, TrendingUp, CheckCircle2, Circle, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface StudyTask {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  dueDate: string
  completed: boolean
  estimatedTime: string
}

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
  const [tasks, setTasks] = useState<StudyTask[]>([
    {
      id: "1",
      title: "Review Chapter 1-3",
      description: "Focus on fundamental concepts and key definitions",
      priority: "high",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      estimatedTime: "2 hours",
    },
    {
      id: "2",
      title: "Practice Problem Set 1",
      description: "Complete 20 practice problems to reinforce learning",
      priority: "high",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      estimatedTime: "1.5 hours",
    },
    {
      id: "3",
      title: "Watch Lecture Videos 4-6",
      description: "Advanced topics and case studies",
      priority: "medium",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      estimatedTime: "3 hours",
    },
    {
      id: "4",
      title: "Create Summary Notes",
      description: "Consolidate key concepts from all chapters",
      priority: "medium",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      estimatedTime: "2 hours",
    },
    {
      id: "5",
      title: "Take Practice Exam",
      description: "Full-length mock exam under timed conditions",
      priority: "low",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      estimatedTime: "2.5 hours",
    },
  ])

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const completedCount = tasks.filter((task) => task.completed).length
  const progress = (completedCount / tasks.length) * 100

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

  const daysUntilExam = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Personalized Study Path
              </CardTitle>
              <CardDescription>
                AI-generated recommendations based on your learning needs and exam timeline
              </CardDescription>
            </div>
            {daysUntilExam !== null && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {daysUntilExam} days until exam
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`border rounded-lg p-4 transition-all ${
                  task.completed ? "bg-muted/50" : "hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-1 flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4
                        className={`font-medium ${
                          task.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </h4>
                      <Badge variant={getPriorityColor(task.priority)} className="flex-shrink-0">
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
                        <Target className="h-3 w-3" />
                        {task.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Focus Area</p>
              <p className="text-sm text-muted-foreground">
                Based on your uploaded materials, prioritize fundamental concepts first
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Calendar className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Recommended Pace</p>
              <p className="text-sm text-muted-foreground">
                Complete 2-3 tasks per week to stay on track for your exam
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium">AI Suggestion</p>
              <p className="text-sm text-muted-foreground">
                Schedule regular practice sessions to reinforce learned concepts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
