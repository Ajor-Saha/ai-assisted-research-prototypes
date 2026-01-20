'use client';

import { useState, use } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar"
import { CourseChatInterface } from "@/components/course-chat-interface"
import { MaterialUpload } from "@/components/material-upload"
import { StudyPathRecommendations } from "@/components/study-path-recommendations"
import { ThemeToggle } from "@/components/theme-toggle"
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, MessageSquare, Upload, TrendingUp, BookOpen } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState("chat")

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
              <ThemeToggle />
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
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
              {course.examDate && (
                <Badge className="gap-1">
                  Exam: {format(new Date(course.examDate), "MMM d, yyyy")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="materials" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Materials
                </TabsTrigger>
                <TabsTrigger value="study-path" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Study Path
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 m-0 p-0">
              <div className="h-[calc(100vh-16rem)]">
                <CourseChatInterface courseId={course.id} courseName={course.name} />
              </div>
            </TabsContent>

            <TabsContent value="materials" className="flex-1 overflow-auto p-6">
              <MaterialUpload courseId={course.id} />
            </TabsContent>

            <TabsContent value="study-path" className="flex-1 overflow-auto p-6">
              <StudyPathRecommendations
                courseId={course.id}
                courseName={course.name}
                examDate={course.examDate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
