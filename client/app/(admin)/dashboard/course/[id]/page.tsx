'use client';

import { useState, useEffect, use } from "react";
import { CourseChatInterface } from "@/components/course/course-chat-interface"
import { StudyPathRecommendations } from "@/components/learning/study-path-recommendations"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { SyllabusTracker } from "@/components/course/syllabus-tracker"
import { PracticeCenter } from "@/components/learning/practice-center"
import { GroupStudy } from "@/components/social/group-study"
import { PerformanceAnalytics } from "@/components/analytics/performance-analytics"
import { PYQAnalysis } from "@/components/learning/pyq-analysis"
import { BookLibrary } from "@/components/learning/book-library"
import { BanglaVoiceAssistant } from "@/components/ai-assistants/bangla-voice-assistant"
import { SubscriptionModal } from "@/components/modals/subscription-modal"
import { GamificationProfile } from "@/components/analytics/gamification-profile"
import { TopicList } from "@/components/course/topic-list"
import { MaterialList } from "@/components/course/material-list"
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
import { Home, MessageSquare, Upload, TrendingUp, BookOpen, BrainCircuit, Users, BarChart, Library, Award, Loader2 } from "lucide-react"
import { useCourseStore } from "@/store/course-store"

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { currentCourse, isLoading, fetchCourseById } = useCourseStore()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedTerm] = useState("1")
  const [showSubscription, setShowSubscription] = useState(false)

  useEffect(() => {
    const loadCourse = async () => {
      await fetchCourseById(id)
    }
    loadCourse()
  }, [id, fetchCourseById])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentCourse) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <BookOpen className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Course not found</p>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <>
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
                    <BreadcrumbPage className="truncate max-w-50">{currentCourse.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShowSubscription(true)} className="hidden sm:flex">
                 <Award className="h-4 w-4 mr-2 text-yellow-500" />
                 Premium
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowSubscription(true)} className="sm:hidden">
                 <Award className="h-4 w-4 text-yellow-500" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        
        {/* Course Header */}
        <div className="border-b bg-muted/30">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                <div
                  className="p-3 sm:p-4 rounded-xl shrink-0"
                  style={{ backgroundColor: `${currentCourse.color}20` }}
                >
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: currentCourse.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{currentCourse.name}</h1>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">{currentCourse.description}</p>
                </div>
              </div>
              {/* <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {course.examDate && (
                  <Badge className="gap-1">
                    Exam: {format(new Date(course.examDate), "MMM d, yyyy")}
                  </Badge>
                )}
                <TermTestSelector selectedTerm={selectedTerm} onTermChange={setSelectedTerm} />
              </div> */}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col w-full">
            <div className="px-4 sm:px-6 pt-4 border-b">
              <div className="overflow-x-auto scrollbar-thin">
                <TabsList className="inline-flex w-full h-auto p-1 gap-1">
                  <TabsTrigger value="overview" className="gap-2 py-2 whitespace-nowrap">
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="gap-2 py-2 whitespace-nowrap">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">AI Tutor</span>
                  </TabsTrigger>
                  <TabsTrigger value="materials" className="gap-2 py-2 whitespace-nowrap">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Materials</span>
                  </TabsTrigger>
                  <TabsTrigger value="practice" className="gap-2 py-2 whitespace-nowrap">
                    <BrainCircuit className="h-4 w-4" />
                    <span className="hidden sm:inline">Practice</span>
                  </TabsTrigger>
                  <TabsTrigger value="pyq" className="gap-2 py-2 whitespace-nowrap">
                    <BarChart className="h-4 w-4" />
                    <span className="hidden sm:inline">PYQ</span>
                  </TabsTrigger>
                  <TabsTrigger value="library" className="gap-2 py-2 whitespace-nowrap">
                    <Library className="h-4 w-4" />
                    <span className="hidden sm:inline">Library</span>
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="gap-2 py-2 whitespace-nowrap">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Groups</span>
                  </TabsTrigger>
                  <TabsTrigger value="study-path" className="gap-2 py-2 whitespace-nowrap">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Path</span>
                  </TabsTrigger>
                  {/* <TabsTrigger value="voice" className="gap-2 py-2 whitespace-nowrap">
                    <Mic className="h-4 w-4" />
                    <span className="hidden sm:inline">Voice</span>
                  </TabsTrigger> */}
                </TabsList>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-background">
              <TabsContent value="overview" className="h-full m-0 p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                   <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                      <SyllabusTracker termId={selectedTerm} />
                   </div>
                   <div className="space-y-4 sm:space-y-6">
                      <GamificationProfile />
                      <BanglaVoiceAssistant />
                   </div>
                </div>
              </TabsContent>

              <TabsContent value="chat" className="h-full m-0 p-0">
                <CourseChatInterface 
                  courseId={currentCourse.courseId} 
                  courseName={currentCourse.name} 
                  // Pass term context to chat if supported later
                />
              </TabsContent>

              <TabsContent value="materials" className="h-full m-0 p-4 sm:p-6 space-y-6 sm:space-y-8">
                <MaterialList courseId={currentCourse.courseId} />
                <Separator />
                <TopicList courseId={currentCourse.courseId} />
              </TabsContent>

              <TabsContent value="practice" className="h-full m-0 p-4 sm:p-6 space-y-6 sm:space-y-8">
                <PracticeCenter termId={selectedTerm} />
                <Separator />
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Performance Analytics
                  </h3>
                  <PerformanceAnalytics />
                </div>
              </TabsContent>

              <TabsContent value="pyq" className="h-full m-0 p-4 sm:p-6">
                <PYQAnalysis />
              </TabsContent>

              <TabsContent value="library" className="h-full m-0 p-4 sm:p-6">
                <BookLibrary />
              </TabsContent>

              <TabsContent value="groups" className="h-full m-0 p-4 sm:p-6">
                <GroupStudy />
              </TabsContent>

              <TabsContent value="study-path" className="h-full m-0 p-4 sm:p-6">
                <StudyPathRecommendations
                  courseId={currentCourse.courseId}
                  courseName={currentCourse.name}
                  examDate={undefined}
                />
              </TabsContent>

              <TabsContent value="voice" className="h-full m-0 p-4 sm:p-6">
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
