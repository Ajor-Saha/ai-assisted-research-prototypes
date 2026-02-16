"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Upload as UploadIcon, Link as LinkIcon, File as FileIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useMaterialStore } from "@/store/material-store"
import { useTopicStore } from "@/store/topic-store"
import { toast } from "sonner"
import { createMaterialSchema } from "@/schemas/material-schema"
import { CreateTopicDialog } from "./create-topic-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UploadMaterialDialogProps {
  courseId: string
}

const materialTypes = [
  { value: "pdf", label: "PDF Document" },
  { value: "video", label: "Video" },
  { value: "link", label: "Web Link" },
  { value: "document", label: "Document" },
  { value: "image", label: "Image" },
  { value: "other", label: "Other" },
]

export function UploadMaterialDialog({ courseId }: UploadMaterialDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTopicCreate, setShowTopicCreate] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { createMaterial } = useMaterialStore()
  const { topics, fetchCourseTopics } = useTopicStore()

  useEffect(() => {
    if (open) {
      fetchCourseTopics(courseId)
    }
  }, [open, courseId, fetchCourseTopics])

  const form = useForm<z.infer<typeof createMaterialSchema>>({
    resolver: zodResolver(createMaterialSchema),
    defaultValues: {
      courseId,
      name: "",
      description: "",
      type: "pdf",
      url: "",
      topicId: null,
      fileSize: "",
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill name if empty
      if (!form.getValues("name")) {
        form.setValue("name", file.name)
      }
      // Auto-detect type
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') form.setValue("type", "pdf")
      else if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) form.setValue("type", "video")
      else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) form.setValue("type", "image")
      else if (['doc', 'docx', 'txt'].includes(ext || '')) form.setValue("type", "document")
    }
  }

  const onSubmit = async (data: z.infer<typeof createMaterialSchema>) => {
    // Validate that either file or URL is provided
    if (uploadMode === "file" && !selectedFile) {
      toast.error("Please select a file to upload")
      return
    }
    if (uploadMode === "url" && !data.url) {
      toast.error("Please enter a URL")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: {
        courseId: string;
        name: string;
        type: string;
        description?: string;
        topicId?: string | null;
        file?: File;
        url?: string;
      } = {
        courseId: data.courseId,
        name: data.name,
        type: data.type,
        description: data.description,
        topicId: data.topicId,
      }

      if (uploadMode === "file" && selectedFile) {
        payload.file = selectedFile
      } else {
        payload.url = data.url
      }

      await createMaterial(payload)
      toast.success("Material uploaded successfully!")
      form.reset({
        courseId,
        name: "",
        description: "",
        type: "pdf",
        url: "",
        topicId: null,
        fileSize: "",
      })
      setSelectedFile(null)
      setOpen(false)
    } catch (error) {
      console.error("Error uploading material:", error)
      toast.error("Failed to upload material")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <UploadIcon className="h-4 w-4" />
            Upload Material
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-131.25 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Study Material</DialogTitle>
            <DialogDescription>
              Upload a file or provide a URL for your study material
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Upload Mode Tabs */}
              <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "file" | "url")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">
                    <FileIcon className="h-4 w-4 mr-2" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    From URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <FormLabel>Select File</FormLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadIcon className="h-4 w-4 mr-2" />
                        {selectedFile ? selectedFile.name : "Choose File"}
                      </Button>
                      {selectedFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedFile(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4 mt-4">
                  <FormField
                    name="url"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://example.com/file.pdf"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the URL of your material
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Chapter 1 - Introduction"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="type"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materialTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="topicId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Topic (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <Select 
                        onValueChange={(value) => {
                          if (value === "create-new") {
                            setShowTopicCreate(true)
                          } else {
                            field.onChange(value === "none" ? null : value)
                          }
                        }} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Topic</SelectItem>
                          {topics.map((topic) => (
                            <SelectItem key={topic.topicId} value={topic.topicId}>
                              {topic.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="create-new" className="text-primary font-medium">
                            + Create New Topic
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormDescription>
                      Link this material to a specific topic or leave unassigned
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief description of the material..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Upload Material
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Topic Dialog */}
      {showTopicCreate && (
        <CreateTopicDialog 
          courseId={courseId}
        />
      )}
    </>
  )
}
