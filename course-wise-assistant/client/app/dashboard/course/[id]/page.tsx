'use client';

import { useState, use } from "react";
import { CourseChatInterface } from "@/components/course-chat-interface"
import { MaterialUpload } from "@/components/material-upload"
import { StudyPathRecommendations } from "@/components/study-path-recommendations"
import { ThemeToggle } from "@/components/theme-toggle"
import { TermTestSelector } from "@/components/term-test-selector"
import { SyllabusTracker } from "@/components/syllabus-tracker"
import { PracticeCenter } from "@/components/practice-center"
import { GroupStudy, SharedResourcesList } from "@/components/group-study"
import { PerformanceAnalytics } from "@/components/performance-analytics"
import { PYQAnalysis } from "@/components/pyq-analysis"
import { BookLibrary } from "@/components/book-library"
import { BanglaVoiceAssistant } from "@/components/bangla-voice-assistant"
import { SubscriptionModal } from "@/components/subscription-modal"
import { GamificationProfile } from "@/components/gamification-profile"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, MessageSquare, Upload, TrendingUp, BookOpen, BrainCircuit, Users, BarChart, Library, Award, Mic } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface Course {
  id: string
  name: string
  code: string
  description: string
  color: string
  examDate?: string
}

// This would typically come from a database/API
const getCourseData = (id: string): Course => {
  const courses: Record<string, Course> = {
    "1": {
      id: "1",
      name: "Introduction to Computer Science",
      code: "CS101",
      description: "Fundamental concepts of programming, algorithms, and data structures",
      color: "#3b82f6",
      examDate: "2026-03-15",
    },
    "2": {
      id: "2",
      name: "Data Structures and Algorithms",
      code: "CS201",
      description: "Advanced data structures, algorithm design, and complexity analysis",
      color: "#10b981",
      examDate: "2026-03-20",
    },
    "3": {
      id: "3",
      name: "Web Development Fundamentals",
      code: "WEB101",
      description: "HTML, CSS, JavaScript, and modern web frameworks",
      color: "#f59e0b",
    },
    "4": {
      id: "4",
      name: "Machine Learning Basics",
      code: "ML101",
      description: "Introduction to machine learning algorithms and applications",
      color: "#8b5cf6",
      examDate: "2026-04-05",
    },
  }
  return courses[id] || courses["1"]
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const course = getCourseData(id)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedTerm, setSelectedTerm] = useState("1")
  const [showSubscription, setShowSubscription] = useState(false)

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2 px-4 w-full justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
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
                    <BreadcrumbPage>{course.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSubscription(true)}>
                 <Award className="h-4 w-4 mr-2 text-yellow-500" />
                 Premium
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        
        {/* Course Header */}
        <div className="border-b bg-muted/30">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: `${course.color}20` }}
                >
                  <BookOpen className="h-8 w-8" style={{ color: course.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">{course.name}</h1>
                    <Badge variant="outline" className="font-mono">
                      {course.code}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{course.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {course.examDate && (
                  <Badge className="gap-1">
                    Exam: {format(new Date(course.examDate), "MMM d, yyyy")}
                  </Badge>
                )}
                <TermTestSelector selectedTerm={selectedTerm} onTermChange={setSelectedTerm} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4 border-b overflow-x-auto">
              <TabsList className="grid w-full min-w-max grid-cols-9 h-auto p-1">
                <TabsTrigger value="overview" className="gap-2 py-2">
                  <Home className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-2 py-2">
                  <MessageSquare className="h-4 w-4" />
                  AI Tutor
                </TabsTrigger>
                <TabsTrigger value="materials" className="gap-2 py-2">
                  <Upload className="h-4 w-4" />
                  Materials
                </TabsTrigger>
                <TabsTrigger value="practice" className="gap-2 py-2">
                  <BrainCircuit className="h-4 w-4" />
                  Practice
                </TabsTrigger>
                <TabsTrigger value="pyq" className="gap-2 py-2">
                  <BarChart className="h-4 w-4" />
                  PYQ Analysis
                </TabsTrigger>
                <TabsTrigger value="library" className="gap-2 py-2">
                  <Library className="h-4 w-4" />
                  Library
                </TabsTrigger>
                <TabsTrigger value="groups" className="gap-2 py-2">
                  <Users className="h-4 w-4" />
                  Groups
                </TabsTrigger>
                <TabsTrigger value="study-path" className="gap-2 py-2">
                  <TrendingUp className="h-4 w-4" />
                  Path
                </TabsTrigger>
                <TabsTrigger value="voice" className="gap-2 py-2">
                  <Mic className="h-4 w-4" />
                  Voice
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto bg-background">
              <TabsContent value="overview" className="h-full m-0 p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-6">
                      <SyllabusTracker termId={selectedTerm} />
                   </div>
                   <div className="space-y-6">
                      <GamificationProfile />
                      <BanglaVoiceAssistant />
                   </div>
                </div>
              </TabsContent>

              <TabsContent value="chat" className="h-full m-0 p-0">
                <CourseChatInterface 
                  courseId={course.id} 
                  courseName={course.name} 
                  // Pass term context to chat if supported later
                />
              </TabsContent>

              <TabsContent value="materials" className="h-full m-0 p-6 space-y-8">
                <MaterialUpload courseId={course.id} />
                <Separator />
                <SharedResourcesList />
              </TabsContent>

              <TabsContent value="practice" className="h-full m-0 p-6 space-y-8">
                <PracticeCenter termId={selectedTerm} />
                <Separator />
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Performance Analytics
                  </h3>
                  <PerformanceAnalytics />
                </div>
              </TabsContent>

              <TabsContent value="pyq" className="h-full m-0 p-6">
                <PYQAnalysis />
              </TabsContent>

              <TabsContent value="library" className="h-full m-0 p-6">
                <BookLibrary />
              </TabsContent>

              <TabsContent value="groups" className="h-full m-0 p-6">
                <GroupStudy />
              </TabsContent>

              <TabsContent value="study-path" className="h-full m-0 p-6">
                <StudyPathRecommendations
                  courseId={course.id}
                  courseName={course.name}
                  examDate={course.examDate}
                />
              </TabsContent>

              <TabsContent value="voice" className="h-full m-0 p-6">
                 <div className="max-w-2xl mx-auto mt-10">
                    <BanglaVoiceAssistant />
                 </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        <SubscriptionModal open={showSubscription} onOpenChange={setShowSubscription} />
    </>
  )
}
