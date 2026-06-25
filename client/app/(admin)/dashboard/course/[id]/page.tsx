'use client';

import { useState, useEffect, use } from "react";
import { CourseChatInterface } from "@/components/course/course-chat-interface"
import { StudyPathRecommendations } from "@/components/learning/study-path-recommendations"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { CourseOverviewStats } from "@/components/course/course-overview-stats"
import { GroupStudy } from "@/components/social/group-study"
import { SubscriptionModal } from "@/components/modals/subscription-modal"
import { MaterialList } from "@/components/course/material-list"
import { TopicList } from "@/components/course/topic-list"
import { ExamPatternSelector } from "@/components/learning/exam-pattern-selector"
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
import { Home, MessageSquare, Upload, TrendingUp, BookOpen, BrainCircuit, Users, Award, Loader2 } from "lucide-react"
import { useCourseStore } from "@/store/course-store"

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { currentCourse, isLoading, fetchCourseById } = useCourseStore()
  const [activeTab, setActiveTab] = useState("overview")
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
        
        {/* Course Header Banner */}
        <div
          className="relative overflow-hidden border-b"
          style={{ background: `linear-gradient(135deg, ${currentCourse.color}18 0%, ${currentCourse.color}08 60%, transparent 100%)` }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{ background: `radial-gradient(ellipse at top right, ${currentCourse.color} 0%, transparent 60%)` }}
          />
          <div className="relative px-4 sm:px-6 py-5">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                <div
                  className="p-3 sm:p-4 rounded-2xl shadow-sm shrink-0 border"
                  style={{ backgroundColor: `${currentCourse.color}20`, borderColor: `${currentCourse.color}30` }}
                >
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: currentCourse.color }} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">{currentCourse.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{currentCourse.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col w-full">
            <div className="px-4 sm:px-6 pt-3 border-b bg-muted/20">
              <div className="overflow-x-auto scrollbar-thin">
                <TabsList className="inline-flex h-auto p-1 gap-0.5 bg-transparent">
                  <TabsTrigger value="overview" className="gap-1.5 px-3 py-2 whitespace-nowrap rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary">
                    <Home className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs font-medium">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="gap-1.5 px-3 py-2 whitespace-nowrap rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs font-medium">AI Tutor</span>
                  </TabsTrigger>
                  <TabsTrigger value="materials" className="gap-1.5 px-3 py-2 whitespace-nowrap rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary">
                    <Upload className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs font-medium">Materials</span>
                  </TabsTrigger>
                  <TabsTrigger value="practice" className="gap-1.5 px-3 py-2 whitespace-nowrap rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary">
                    <BrainCircuit className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs font-medium">Practice</span>
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="gap-1.5 px-3 py-2 whitespace-nowrap rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary">
                    <Users className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs font-medium">Groups</span>
                  </TabsTrigger>
                  <TabsTrigger value="study-path" className="gap-1.5 px-3 py-2 whitespace-nowrap rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs font-medium">Path</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-background">
              <TabsContent value="overview" className="h-full m-0 p-4 sm:p-6 space-y-6">
                <CourseOverviewStats courseId={currentCourse.courseId} />
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
                <ExamPatternSelector courseId={currentCourse.courseId} />
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
            </div>
          </Tabs>
        </div>
        <SubscriptionModal open={showSubscription} onOpenChange={setShowSubscription} />
    </>
  )
}
