'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { CourseCard } from "@/components/course"
import { CreateCourseDialog } from "@/components/course"
import { ThemeToggle } from "@/components/theme"
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
import { 
  Home, 
  BookOpen, 
  Loader2, 
  FileText, 
  Layers, 
  TrendingUp,
  Calculator,
  BookMarked,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useCourseStore } from "@/store/course-store"
import { getCourseTopics } from "@/services/topic-service"
import { getCourseMaterials } from "@/services/material-service"
import { toast } from "sonner"
import useAuthStore from "@/store/store"

export default function Page() {
  const { courses, isLoading, error, fetchCourses } = useCourseStore()
  const { user } = useAuthStore()
  const [totalTopics, setTotalTopics] = useState(0)
  const [totalMaterials, setTotalMaterials] = useState(0)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Fetch total topics and materials across all courses
  useEffect(() => {
    const fetchStats = async () => {
      if (courses.length === 0) {
        setTotalTopics(0)
        setTotalMaterials(0)
        return
      }

      setStatsLoading(true)
      try {
        let topicsCount = 0
        let materialsCount = 0

        await Promise.all(
          courses.map(async (course) => {
            try {
              const [topics, materials] = await Promise.all([
                getCourseTopics(course.courseId),
                getCourseMaterials(course.courseId)
              ])
              topicsCount += topics.length
              materialsCount += materials.length
            } catch (error) {
              console.error(`Error fetching data for course ${course.courseId}:`, error)
            }
          })
        )

        setTotalTopics(topicsCount)
        setTotalMaterials(materialsCount)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [courses])

  const recentCourses = courses.slice(0, 3)
  const completionRate = courses.length > 0 ? Math.min(Math.round((totalMaterials / (courses.length * 5)) * 100), 100) : 0

  return (
    <>
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
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4">
        {/* Welcome Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName || 'Student'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your learning journey
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active learning paths</p>
              <Progress value={courses.length > 0 ? 100 : 0} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Topics Covered</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalTopics}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
              <Progress value={totalTopics > 0 ? Math.min((totalTopics / 20) * 100, 100) : 0} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Study Materials</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalMaterials}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Uploaded resources</p>
              <Progress value={totalMaterials > 0 ? Math.min((totalMaterials / 50) * 100, 100) : 0} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Overall completion</p>
              <Progress value={completionRate} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & AI Assistants */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Get started quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <CreateCourseDialog />
              {/* <Button variant="outline" className="w-full justify-start gap-2" disabled>
                <Upload className="h-4 w-4" />
                Upload Materials
              </Button> */}
              
            </CardContent>
          </Card>

          {/* Math Assistant */}
          <Card className="lg:col-span-1 hover:shadow-lg transition-shadow border-purple-200 dark:border-purple-900 bg-linear-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Math Assistant</CardTitle>
                  <CardDescription>AI-powered math help</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Solve complex problems with step-by-step explanations
              </p>
              <Link href="/dashboard/math-assistant/math-ai-chat">
                <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700">
                  Open Math Assistant
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Research Assistant */}
          <Card className="lg:col-span-1 hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-900 bg-linear-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <BookMarked className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Research Assistant</CardTitle>
                  <CardDescription>Academic research help</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Analyze papers and get insights with citations
              </p>
              <Link href="/dashboard/research-assistant/research-ai-chat">
                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                  Open Research Assistant
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Courses or All Courses */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {courses.length > 3 ? 'Recent Courses' : 'My Courses'}
            </h2>
            <p className="text-muted-foreground">
              {courses.length > 3 
                ? 'Your most recently updated courses' 
                : 'Manage your courses and track your learning progress'}
            </p>
          </div>
          {courses.length > 3 && (
            <Link href="/dashboard/courses">
              <Button variant="outline" className="gap-2">
                View All Courses
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && courses.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentCourses.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && courses.length === 0 && (
          <Card className="p-12 border-dashed">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create your first course to unlock personalized AI assistants, smart analytics, 
                and a comprehensive study management system
              </p>
              <CreateCourseDialog />
            </div>
          </Card>
        )}

        {/* Learning Tips */}
        {courses.length > 0 && (
          <Card className="bg-linear-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Pro Tip</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use the Math Assistant for solving complex equations and the Research Assistant 
                to analyze academic papers. Upload your study materials to get AI-powered insights 
                and personalized recommendations.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}