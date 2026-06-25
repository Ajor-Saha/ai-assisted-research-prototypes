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
import { Skeleton } from "@/components/ui/skeleton"
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

  const CourseCardSkeleton = () => (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="pt-2">
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  )

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

      <div className="flex flex-1 flex-col gap-6 p-6 pt-5">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Learning Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
                Welcome back, {user?.firstName || 'Student'}! 👋
              </h1>
              <p className="text-white/70 text-sm sm:text-base">
                Here&apos;s an overview of your learning journey
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 bg-white/15 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
              <Sparkles className="h-8 w-8 text-yellow-300" />
              <div>
                <p className="text-xs text-white/70">AI Assistants</p>
                <p className="text-lg font-bold">Ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Courses */}
          <Card className="relative overflow-hidden border-0 shadow-sm bg-linear-to-br from-violet-500 to-purple-600 text-white">
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Courses</CardTitle>
              <div className="p-2 rounded-lg bg-white/20">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{courses.length}</div>
              <p className="text-xs text-white/70 mt-1">Active learning paths</p>
              <Progress value={courses.length > 0 ? 100 : 0} className="mt-3 h-1.5 bg-white/20 [&>div]:bg-white" />
            </CardContent>
          </Card>

          {/* Topics */}
          <Card className="relative overflow-hidden border-0 shadow-sm bg-linear-to-br from-blue-500 to-cyan-500 text-white">
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Topics Covered</CardTitle>
              <div className="p-2 rounded-lg bg-white/20">
                <Layers className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? <Skeleton className="h-9 w-14 bg-white/30" /> : totalTopics}
              </div>
              <p className="text-xs text-white/70 mt-1">Across all courses</p>
              <Progress value={totalTopics > 0 ? Math.min((totalTopics / 20) * 100, 100) : 0} className="mt-3 h-1.5 bg-white/20 [&>div]:bg-white" />
            </CardContent>
          </Card>

          {/* Materials */}
          <Card className="relative overflow-hidden border-0 shadow-sm bg-linear-to-br from-emerald-500 to-teal-500 text-white">
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Study Materials</CardTitle>
              <div className="p-2 rounded-lg bg-white/20">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? <Skeleton className="h-9 w-14 bg-white/30" /> : totalMaterials}
              </div>
              <p className="text-xs text-white/70 mt-1">Uploaded resources</p>
              <Progress value={totalMaterials > 0 ? Math.min((totalMaterials / 50) * 100, 100) : 0} className="mt-3 h-1.5 bg-white/20 [&>div]:bg-white" />
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="relative overflow-hidden border-0 shadow-sm bg-linear-to-br from-amber-500 to-orange-500 text-white">
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Progress</CardTitle>
              <div className="p-2 rounded-lg bg-white/20">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completionRate}%</div>
              <p className="text-xs text-white/70 mt-1">Overall completion</p>
              <Progress value={completionRate} className="mt-3 h-1.5 bg-white/20 [&>div]:bg-white" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & AI Assistants */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </div>
              <CardDescription>Get started quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <CreateCourseDialog />
            </CardContent>
          </Card>

          {/* Math Assistant */}
          <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-200">
            <div className="absolute inset-0 bg-linear-to-br from-purple-50 via-white to-white dark:from-purple-950/30 dark:via-background dark:to-background" />
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-100/60 dark:bg-purple-900/20" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 shadow-sm">
                  <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-base text-purple-900 dark:text-purple-100">Math Assistant</CardTitle>
                  <CardDescription>AI-powered math help</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm text-muted-foreground mb-4">
                Solve complex problems with step-by-step explanations and visualizations.
              </p>
              <Link href="/dashboard/math-assistant/math-ai-chat">
                <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700 shadow-sm">
                  Open Math Assistant
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Research Assistant */}
          <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-200">
            <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-white dark:from-blue-950/30 dark:via-background dark:to-background" />
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-100/60 dark:bg-blue-900/20" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50 shadow-sm">
                  <BookMarked className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base text-blue-900 dark:text-blue-100">Research Assistant</CardTitle>
                  <CardDescription>Academic research help</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm text-muted-foreground mb-4">
                Analyze papers and get insights with citations and references.
              </p>
              <Link href="/dashboard/research-assistant/research-ai-chat">
                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm">
                  Open Research Assistant
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Section Header - Courses */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-linear-to-b from-violet-500 to-blue-500" />
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {courses.length > 3 ? 'Recent Courses' : 'My Courses'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {courses.length > 3
                  ? 'Your most recently updated courses'
                  : 'Manage your courses and track your learning progress'}
              </p>
            </div>
          </div>
          {courses.length > 3 && (
            <Link href="/dashboard/courses">
              <Button variant="outline" size="sm" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
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
          <Card className="p-12 border-2 border-dashed border-primary/20 bg-linear-to-br from-primary/5 to-background">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                <div className="relative p-5 rounded-full bg-linear-to-br from-violet-500 to-indigo-500">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Start Your Learning Journey</h3>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">
                Create your first course to unlock personalized AI assistants, smart analytics,
                and a comprehensive study management system.
              </p>
              <CreateCourseDialog />
            </div>
          </Card>
        )}

        {/* Pro Tip Banner */}
        {courses.length > 0 && (
          <div className="relative overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-900 bg-linear-to-r from-indigo-50 via-violet-50 to-blue-50 dark:from-indigo-950/30 dark:via-violet-950/30 dark:to-blue-950/30 p-5">
            <div className="absolute top-0 right-0 h-20 w-40 bg-linear-to-bl from-violet-200/50 to-transparent dark:from-violet-800/20 rounded-bl-full" />
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-linear-to-br from-violet-500 to-indigo-500 shadow-sm shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">Pro Tip</p>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Use the <span className="font-semibold">Math Assistant</span> for solving complex equations and the{" "}
                  <span className="font-semibold">Research Assistant</span> to analyze academic papers. Upload your study materials to get AI-powered insights and personalized recommendations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}