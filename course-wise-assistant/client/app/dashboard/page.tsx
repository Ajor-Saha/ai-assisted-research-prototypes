'use client';

import { useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar"
import { CourseCard } from "@/components/course-card"
import { CreateCourseDialog } from "@/components/create-course-dialog"
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
import { Home, BookOpen, TrendingUp, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  const [courses, setCourses] = useState([
    {
      id: "1",
      name: "Introduction to Computer Science",
      code: "CS101",
      description: "Fundamental concepts of programming, algorithms, and data structures",
      color: "#3b82f6",
      examDate: "2026-03-15",
      materialsCount: 12,
      messagesCount: 45,
    },
    {
      id: "2",
      name: "Data Structures and Algorithms",
      code: "CS201",
      description: "Advanced data structures, algorithm design, and complexity analysis",
      color: "#10b981",
      examDate: "2026-03-20",
      materialsCount: 8,
      messagesCount: 32,
    },
    {
      id: "3",
      name: "Web Development Fundamentals",
      code: "WEB101",
      description: "HTML, CSS, JavaScript, and modern web frameworks",
      color: "#f59e0b",
      materialsCount: 15,
      messagesCount: 67,
    },
    {
      id: "4",
      name: "Machine Learning Basics",
      code: "ML101",
      description: "Introduction to machine learning algorithms and applications",
      color: "#8b5cf6",
      examDate: "2026-04-05",
      materialsCount: 10,
      messagesCount: 28,
    },
  ])

  const handleCreateCourse = (courseData: {
    name: string
    code: string
    description: string
    color: string
    examDate?: string
  }) => {
    const newCourse = {
      id: Date.now().toString(),
      ...courseData,
      materialsCount: 0,
      messagesCount: 0,
    }
    setCourses([newCourse, ...courses])
  }

  const totalMaterials = courses.reduce((sum, course) => sum + course.materialsCount, 0)
  const totalMessages = courses.reduce((sum, course) => sum + course.messagesCount, 0)
  const upcomingExams = courses.filter(c => c.examDate).length

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
                    <BreadcrumbLink href="/">
                      Home
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground">Active learning paths</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Study Materials</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMaterials}</div>
                <p className="text-xs text-muted-foreground">Uploaded documents</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingExams}</div>
                <p className="text-xs text-muted-foreground">Scheduled assessments</p>
              </CardContent>
            </Card>
          </div>

          {/* Courses Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">My Courses</h2>
              <p className="text-muted-foreground">
                Manage your courses and track your learning progress
              </p>
            </div>
            <CreateCourseDialog onCreateCourse={handleCreateCourse} />
          </div>

          {/* Courses Grid */}
          {courses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first course to get started with your personalized study assistant
                </p>
                <CreateCourseDialog onCreateCourse={handleCreateCourse} />
              </div>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
