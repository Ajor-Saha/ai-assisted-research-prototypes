"use client"

import { useEffect, useState } from "react"
import { BookOpen, FileText, Trash2, Loader2, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTopicStore } from "@/store/topic-store"
import { CreateTopicDialog } from "./create-topic-dialog"
import { TopicDetailDialog } from "@/components/course/topic-detail-dialog"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Topic } from "@/services/topic-service"

interface TopicListProps {
  courseId: string
}

export function TopicList({ courseId }: TopicListProps) {
  const { topics, isLoading, fetchCourseTopics, deleteTopic } = useTopicStore()
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchCourseTopics(courseId)
  }, [courseId, fetchCourseTopics])

  const handleDelete = async () => {
    if (!deleteTopicId) return

    setIsDeleting(true)
    try {
      await deleteTopic(deleteTopicId)
      toast.success("Topic deleted successfully")
      setDeleteTopicId(null)
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete topic")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Topics</CardTitle>
          <CardDescription>Manage topics for this course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Course Topics</CardTitle>
              <CardDescription>Organize and manage your course content</CardDescription>
            </div>
            <CreateTopicDialog courseId={courseId} />
          </div>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No topics yet</p>
              <CreateTopicDialog courseId={courseId} />
            </div>
          ) : (
            <div className="space-y-2">
              {topics.map((topic) => (
                <div
                  key={topic.topicId}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
                >
                  <button
                    onClick={() => setSelectedTopic(topic)}
                    className="flex items-start gap-3 flex-1 text-left"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 truncate">{topic.name}</h4>
                      {topic.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {topic.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </button>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTopicId(topic.topicId)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topic Detail Dialog */}
      {selectedTopic && (
        <TopicDetailDialog
          topic={selectedTopic}
          open={!!selectedTopic}
          onOpenChange={(open: boolean) => !open && setSelectedTopic(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTopicId} onOpenChange={(open) => !open && setDeleteTopicId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this topic? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
