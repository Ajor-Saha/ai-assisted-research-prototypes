"use client"

import Link from "next/link"
import { BookOpen, Calendar, FileText, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"


interface CourseCardProps {
  course: {
    id: string
    name: string
    code: string
    description: string
    color: string
    examDate?: string
    materialsCount: number
    messagesCount: number
  }
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/dashboard/course/${course.id}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${course.color}20` }}
            >
              <BookOpen className="h-6 w-6" style={{ color: course.color }} />
            </div>
            {course.examDate && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(course.examDate), "MMM d, yyyy")}
              </Badge>
            )}
          </div>
          <CardTitle className="group-hover:text-primary transition-colors">
            {course.name}
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            {course.code}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {course.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{course.materialsCount} materials</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{course.messagesCount} chats</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
