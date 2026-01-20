'use client';

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, CheckCircle2, Circle, AlertCircle, TrendingUp } from "lucide-react"

function TrendingUpIcon({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500"
  return <TrendingUp className={`h-5 w-5 ${color}`} />
}

interface Topic {
  id: string
  title: string
  duration: string // e.g., "45 mins"
  status: 'not_started' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

interface SyllabusData {
  [termId: string]: {
    modules: {
      title: string
      topics: Topic[]
    }[]
  }
}

// Mock Data
const MOCK_SYLLABUS: SyllabusData = {
  "1": {
    modules: [
      {
        title: "Module 1: Fundamentals",
        topics: [
          { id: "t1-1", title: "Introduction to the Subject", duration: "30 mins", status: "completed", priority: "low" },
          { id: "t1-2", title: "Basic Concepts & Definitions", duration: "45 mins", status: "completed", priority: "high" },
          { id: "t1-3", title: "History and Evolution", duration: "30 mins", status: "not_started", priority: "low" },
        ]
      },
      {
        title: "Module 2: Core Principles",
        topics: [
          { id: "t1-4", title: "First Principle Analysis", duration: "60 mins", status: "in_progress", priority: "high" },
          { id: "t1-5", title: "Theoretical Frameworks", duration: "90 mins", status: "not_started", priority: "medium" },
        ]
      }
    ]
  },
  "2": {
    modules: [
      {
        title: "Module 3: Advanced Concepts",
        topics: [
          { id: "t2-1", title: "Complex Systems", duration: "60 mins", status: "not_started", priority: "high" },
          { id: "t2-2", title: "Integration Methods", duration: "75 mins", status: "not_started", priority: "high" },
        ]
      }
    ]
  },
  "3": {
    modules: [
      {
        title: "Module 4: Applications",
        topics: [
          { id: "t3-1", title: "Real-world Case Studies", duration: "90 mins", status: "not_started", priority: "medium" },
          { id: "t3-2", title: "Future Trends", duration: "45 mins", status: "not_started", priority: "low" },
        ]
      },
      {
        title: "Module 5: Final Project",
        topics: [
          { id: "t3-3", title: "Project Planning", duration: "60 mins", status: "not_started", priority: "high" },
          { id: "t3-4", title: "Execution & Delivery", duration: "120 mins", status: "not_started", priority: "high" },
        ]
      }
    ]
  }
}

interface SyllabusTrackerProps {
  termId: string
}

export function SyllabusTracker({ termId }: SyllabusTrackerProps) {
  const [syllabus, setSyllabus] = useState(MOCK_SYLLABUS)
  
  // Calculate Progress
  const currentTermData = syllabus[termId] || { modules: [] }
  const allTopics = currentTermData.modules.flatMap(m => m.topics)
  const totalTopics = allTopics.length
  const completedTopics = allTopics.filter(t => t.status === 'completed').length
  const progressPercentage = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100)

  // Readiness Score (Mock calculation)
  const readinessScore = Math.min(100, Math.round(progressPercentage * 0.8 + 20)) // Base 20 + 80% of progress

  const toggleStatus = (topicId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed'
    
    setSyllabus(prev => {
      const newData = { ...prev }
      newData[termId].modules = newData[termId].modules.map(module => ({
        ...module,
        topics: module.topics.map(topic => 
          topic.id === topicId ? { ...topic, status: newStatus } : topic
        )
      }))
      return newData
    })
  }

  return (
    <div className="space-y-6">
      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Syllabus Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{progressPercentage}%</span>
              <span className="text-xs text-muted-foreground">{completedTopics}/{totalTopics} Topics</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Study Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">12.5h</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg. 45m per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Term Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUpIcon score={readinessScore} />
              <span className="text-2xl font-bold">{readinessScore}/100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on quiz & completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Syllabus List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Learning Modules</h2>
          <Badge variant="outline">Term Test {termId}</Badge>
        </div>
        
        <div className="grid gap-4">
          {currentTermData.modules.map((module, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {module.topics.map((topic) => (
                  <div key={topic.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleStatus(topic.id, topic.status)}
                        className={`
                          h-5 w-5 rounded-full border flex items-center justify-center transition-colors
                          ${topic.status === 'completed' 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-muted-foreground/30 hover:border-primary'
                          }
                        `}
                      >
                        {topic.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                      
                      <div className="space-y-1">
                        <span className={`text-sm font-medium ${topic.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>
                          {topic.title}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {topic.duration}
                          </span>
                          {topic.priority === 'high' && (
                            <Badge variant="destructive" className="h-4 px-1 text-[10px]">High Priority</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                        Details
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}


