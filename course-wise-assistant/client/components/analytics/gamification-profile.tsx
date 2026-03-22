"use client"

import { useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Zap, GraduationCap } from "lucide-react"
import { useTopicStore } from "@/store/topic-store"
import { useMaterialStore } from "@/store/material-store"

interface GamificationProfileProps {
  courseId: string
}

function getConsecutiveActiveDays(activityDates: Date[]): number {
  if (activityDates.length === 0) return 0

  const activeDays = new Set(
    activityDates.map((dateItem) => {
      const year = dateItem.getUTCFullYear()
      const month = String(dateItem.getUTCMonth() + 1).padStart(2, "0")
      const day = String(dateItem.getUTCDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    })
  )

  let streak = 0
  const currentDay = new Date()

  while (true) {
    const lookupDate = new Date(Date.UTC(currentDay.getUTCFullYear(), currentDay.getUTCMonth(), currentDay.getUTCDate() - streak))
    const year = lookupDate.getUTCFullYear()
    const month = String(lookupDate.getUTCMonth() + 1).padStart(2, "0")
    const day = String(lookupDate.getUTCDate()).padStart(2, "0")
    const dayKey = `${year}-${month}-${day}`

    if (!activeDays.has(dayKey)) break
    streak += 1
  }

  return streak
}

function getRankLabel(completionPercentage: number): string {
  if (completionPercentage >= 90) return "Top 5%"
  if (completionPercentage >= 70) return "Top 15%"
  if (completionPercentage >= 50) return "Top 30%"
  return "Building Momentum"
}

export function GamificationProfile({ courseId }: GamificationProfileProps) {
  const { topics, fetchCourseTopics } = useTopicStore()
  const { materials, fetchCourseMaterials } = useMaterialStore()

  useEffect(() => {
    void fetchCourseTopics(courseId)
    void fetchCourseMaterials(courseId)
  }, [courseId, fetchCourseMaterials, fetchCourseTopics])

  const {
    level,
    levelProgress,
    streakDays,
    rankLabel,
  } = useMemo(() => {
    const topicsWithMaterials = new Set(materials.filter((material) => material.topicId).map((material) => material.topicId as string))
    const completedTopics = topics.filter((topic) => topicsWithMaterials.has(topic.topicId)).length
    const completionPercentage = topics.length === 0 ? 0 : Math.round((completedTopics / topics.length) * 100)

    const pointsFromTopics = completedTopics * 15
    const pointsFromMaterials = materials.length * 4
    const totalPoints = pointsFromTopics + pointsFromMaterials
    const computedLevel = Math.max(1, Math.floor(totalPoints / 60) + 1)
    const computedLevelProgress = totalPoints % 60

    const allActivityDates = [
      ...topics.map((topic) => new Date(topic.updatedAt ?? topic.createdAt)),
      ...materials.map((material) => new Date(material.updatedAt ?? material.createdAt)),
    ]

    return {
      level: computedLevel,
      levelProgress: Math.round((computedLevelProgress / 60) * 100),
      streakDays: getConsecutiveActiveDays(allActivityDates),
      rankLabel: getRankLabel(completionPercentage),
    }
  }, [materials, topics])

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Progress</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-linear-to-tr from-sky-500 to-cyan-500 flex items-center justify-center text-white font-bold">
            {level}
          </div>
          <div>
            <p className="text-sm font-medium">Level {level} Scholar</p>
            <div className="w-32 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${levelProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 p-2 rounded flex flex-col items-center justify-center text-center">
            <Zap className="h-4 w-4 text-yellow-500 mb-1" />
            <span className="text-xs font-bold">{streakDays} Day Streak</span>
          </div>
          <div className="bg-muted/50 p-2 rounded flex flex-col items-center justify-center text-center">
            <Trophy className="h-4 w-4 text-blue-500 mb-1" />
            <span className="text-xs font-bold">{rankLabel}</span>
          </div>
        </div>

        <div className="rounded-md border border-border/70 bg-background/80 p-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              Next level
            </span>
            <span>{levelProgress}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
