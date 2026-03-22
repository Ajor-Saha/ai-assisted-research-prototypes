'use client';

import { useEffect, useMemo } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  FolderOpen,
  Layers3,
  TrendingUp,
  FileText,
  Sparkles,
} from "lucide-react"
import { useTopicStore } from "@/store/topic-store"
import { useMaterialStore } from "@/store/material-store"
import type { Topic } from "@/services/topic-service"
import type { Material } from "@/services/material-service"

function TrendingUpIcon({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500"
  return <TrendingUp className={`h-5 w-5 ${color}`} />
}

type LearningStatus = 'not_started' | 'in_progress' | 'completed'

interface OverviewTopic {
  topicId: string
  title: string
  description: string | null
  status: LearningStatus
  materialCount: number
  updatedAt: string
}

interface OverviewModule {
  title: string
  topics: OverviewTopic[]
}

interface SyllabusTrackerProps {
  courseId: string
  termId?: string
}

function chunkTopics(topics: OverviewTopic[], size: number): OverviewModule[] {
  if (topics.length === 0) return []

  const modules: OverviewModule[] = []
  for (let currentIndex = 0; currentIndex < topics.length; currentIndex += size) {
    modules.push({
      title: `Module ${modules.length + 1}`,
      topics: topics.slice(currentIndex, currentIndex + size),
    })
  }
  return modules
}

function getRelativeDateLabel(dateInput: string): string {
  const parsedDate = new Date(dateInput)
  const now = Date.now()
  const diffMs = now - parsedDate.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  const diffDays = Math.floor(diffMs / dayMs)

  if (diffDays <= 0) return "Updated today"
  if (diffDays === 1) return "Updated yesterday"
  if (diffDays < 7) return `Updated ${diffDays} days ago`
  return `Updated ${parsedDate.toLocaleDateString()}`
}

function buildMaterialMap(materials: Material[]): Record<string, number> {
  const materialMap: Record<string, number> = {}

  for (const material of materials) {
    if (!material.topicId) continue
    materialMap[material.topicId] = (materialMap[material.topicId] ?? 0) + 1
  }

  return materialMap
}

function getTopicStatus(topic: Topic, materialCount: number): LearningStatus {
  if (materialCount > 0) return 'completed'
  if ((topic.description ?? '').trim().length > 0 || (topic.content ?? '').trim().length > 0) return 'in_progress'
  return 'not_started'
}

export function SyllabusTracker({ courseId, termId = "1" }: SyllabusTrackerProps) {
  const {
    topics,
    isLoading: isTopicsLoading,
    fetchCourseTopics,
  } = useTopicStore()
  const {
    materials,
    isLoading: isMaterialsLoading,
    fetchCourseMaterials,
  } = useMaterialStore()

  useEffect(() => {
    void fetchCourseTopics(courseId)
    void fetchCourseMaterials(courseId)
  }, [courseId, fetchCourseMaterials, fetchCourseTopics])

  const isLoading = isTopicsLoading || isMaterialsLoading

  const {
    modules,
    totalTopics,
    completedTopics,
    inProgressTopics,
    notStartedTopics,
    totalMaterials,
    topicsUpdatedThisWeek,
    progressPercentage,
    readinessScore,
  } = useMemo(() => {
    const sortedTopics = [...topics].sort((firstTopic, secondTopic) => firstTopic.orderIndex - secondTopic.orderIndex)
    const materialMap = buildMaterialMap(materials)

    const overviewTopics: OverviewTopic[] = sortedTopics.map((topic) => {
      const materialCount = materialMap[topic.topicId] ?? 0
      return {
        topicId: topic.topicId,
        title: topic.name,
        description: topic.description,
        status: getTopicStatus(topic, materialCount),
        materialCount,
        updatedAt: topic.updatedAt ?? topic.createdAt,
      }
    })

    const completed = overviewTopics.filter((topic) => topic.status === 'completed').length
    const inProgress = overviewTopics.filter((topic) => topic.status === 'in_progress').length
    const notStarted = overviewTopics.filter((topic) => topic.status === 'not_started').length
    const total = overviewTopics.length
    const completion = total === 0 ? 0 : Math.round((completed / total) * 100)
    const updatedThisWeek = overviewTopics.filter((topic) => {
      const lastUpdated = new Date(topic.updatedAt).getTime()
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      return Date.now() - lastUpdated <= sevenDaysMs
    }).length

    const materialsCoverage = total === 0 ? 0 : Math.round((Object.keys(materialMap).length / total) * 100)
    const readiness = Math.min(
      100,
      Math.round(completion * 0.65 + materialsCoverage * 0.25 + (updatedThisWeek > 0 ? 10 : 0))
    )

    return {
      modules: chunkTopics(overviewTopics, 5),
      totalTopics: total,
      completedTopics: completed,
      inProgressTopics: inProgress,
      notStartedTopics: notStarted,
      totalMaterials: materials.length,
      topicsUpdatedThisWeek: updatedThisWeek,
      progressPercentage: completion,
      readinessScore: readiness,
    }
  }, [materials, topics])

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-none bg-linear-to-br from-sky-500/15 via-cyan-500/10 to-background shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                Live course overview
              </div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Learning Momentum</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Term Test {termId} performance snapshot based on current topics and materials.
              </p>
            </div>
            <div className="min-w-55 rounded-xl border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Course Completion</p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <span className="text-3xl font-bold">{progressPercentage}%</span>
                <span className="text-xs text-muted-foreground">{completedTopics}/{totalTopics} topics</span>
              </div>
              <Progress value={progressPercentage} className="mt-3 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Term Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUpIcon score={readinessScore} />
              <span className="text-2xl font-bold">{readinessScore}/100</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Completion + material coverage + recent activity</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Topic Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-cyan-600" />
              <span className="text-2xl font-bold">{totalTopics}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{inProgressTopics} in progress, {notStartedTopics} not started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Learning Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span className="text-2xl font-bold">{totalMaterials}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Files and resources linked to this course</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-bold">{topicsUpdatedThisWeek}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Topics updated in the last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Course Modules</h2>
          <Badge variant="outline">Auto-organized from topics</Badge>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              Loading course overview...
            </CardContent>
          </Card>
        ) : modules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No topics yet. Add topics to unlock your overview analytics.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {modules.map((module) => (
              <Card key={module.title} className="border-l-4 border-l-cyan-500/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {module.topics.map((topic) => (
                    <div key={topic.topicId} className="flex items-start justify-between rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="mt-0.5">
                          {topic.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </span>

                        <div className="space-y-1">
                          <span className={`text-sm font-medium ${topic.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>
                            {topic.title}
                          </span>
                          {topic.description && <p className="line-clamp-2 text-xs text-muted-foreground">{topic.description}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[11px]">
                          {topic.materialCount} material{topic.materialCount === 1 ? '' : 's'}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{getRelativeDateLabel(topic.updatedAt)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


