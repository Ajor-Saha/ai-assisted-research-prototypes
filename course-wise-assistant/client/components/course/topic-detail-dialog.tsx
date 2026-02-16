"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit, Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTopicStore } from "@/store/topic-store"
import { toast } from "sonner"
import { updateTopicSchema } from "@/schemas/topic-schema"
import type { Topic } from "@/services/topic-service"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface TopicDetailDialogProps {
  topic: Topic
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TopicDetailDialog({ topic, open, onOpenChange }: TopicDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateTopic } = useTopicStore()

  const form = useForm<z.infer<typeof updateTopicSchema>>({
    resolver: zodResolver(updateTopicSchema),
    defaultValues: {
      name: topic.name,
      description: topic.description || "",
      content: topic.content || "",
    },
  })

  const onSubmit = async (data: z.infer<typeof updateTopicSchema>) => {
    setIsSubmitting(true)
    try {
      await updateTopic(topic.topicId, data)
      toast.success("Topic updated successfully!")
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating topic:", error)
      const errorMessage = (error as any)?.response?.data?.message || "Failed to update topic"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.reset({
      name: topic.name,
      description: topic.description || "",
      content: topic.content || "",
    })
    setIsEditing(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150  max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>{topic.name}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Edit topic details" : "View topic details"}
              </DialogDescription>
            </div>
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-8rem)] pr-4">
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic Name</FormLabel>
                      <Input
                        {...field}
                        placeholder="e.g., Introduction to Algorithms"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        {...field}
                        placeholder="Brief description of the topic..."
                        rows={3}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="content"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <Textarea
                        {...field}
                        placeholder="Detailed content for this topic..."
                        rows={8}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              {topic.description && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {topic.description}
                  </p>
                </div>
              )}

              {topic.description && topic.content && <Separator />}

              {topic.content && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Content</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                    {topic.content}
                  </div>
                </div>
              )}

              {!topic.description && !topic.content && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    No content available yet. Click the edit button to add details.
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
