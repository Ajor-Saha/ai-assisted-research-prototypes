"use client"

import { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileText, Trash2, Loader2, ExternalLink, File, Video, Link as LinkIcon, Image as ImageIcon, Upload as UploadIcon, X, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMaterialStore } from "@/store/material-store"
import { useTopicStore } from "@/store/topic-store"
import { createMaterialSchema } from "@/schemas/material-schema"
import { createTopicSchema } from "@/schemas/topic-schema"
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

interface MaterialListProps {
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

const getMaterialIcon = (type: string) => {
  switch (type) {
    case "pdf":
    case "document":
      return FileText
    case "video":
      return Video
    case "link":
      return LinkIcon
    case "image":
      return ImageIcon
    default:
      return File
  }
}

const getMaterialTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    pdf: "PDF",
    video: "Video",
    link: "Link",
    document: "Document",
    image: "Image",
    other: "Other",
  }
  return labels[type] || type
}

export function MaterialList({ courseId }: MaterialListProps) {
  const { materials, isLoading, fetchCourseMaterials, deleteMaterial, createMaterial } = useMaterialStore()
  const { topics, fetchCourseTopics, createTopic } = useTopicStore()
  const [deleteMaterialId, setDeleteMaterialId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(true)
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCourseMaterials(courseId)
    fetchCourseTopics(courseId)
  }, [courseId, fetchCourseMaterials, fetchCourseTopics])

  const materialForm = useForm<z.infer<typeof createMaterialSchema>>({
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

  const topicForm = useForm<z.infer<typeof createTopicSchema>>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: {
      courseId,
      name: "",
      description: "",
      content: "",
      orderIndex: 0,
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!materialForm.getValues("name")) {
        materialForm.setValue("name", file.name)
      }
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') materialForm.setValue("type", "pdf")
      else if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) materialForm.setValue("type", "video")
      else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) materialForm.setValue("type", "image")
      else if (['doc', 'docx', 'txt'].includes(ext || '')) materialForm.setValue("type", "document")
    }
  }

  const onSubmitMaterial = async (data: z.infer<typeof createMaterialSchema>) => {
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
      materialForm.reset({
        courseId,
        name: "",
        description: "",
        type: "pdf",
        url: "",
        topicId: null,
        fileSize: "",
      })
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading material:", error)
      toast.error("Failed to upload material")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmitTopic = async (data: z.infer<typeof createTopicSchema>) => {
    try {
      const newTopic = await createTopic(data)
      toast.success("Topic created successfully!")
      topicForm.reset({
        courseId,
        name: "",
        description: "",
        content: "",
        orderIndex: 0,
      })
      setShowTopicForm(false)
      if (newTopic?.topicId) {
        materialForm.setValue("topicId", newTopic.topicId)
      }
    } catch (error) {
      console.error("Error creating topic:", error)
      toast.error("Failed to create topic")
    }
  }

  const handleDelete = async () => {
    if (!deleteMaterialId) return

    setIsDeleting(true)
    try {
      await deleteMaterial(deleteMaterialId)
      toast.success("Material deleted successfully")
      setDeleteMaterialId(null)
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete material")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenMaterial = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Materials</CardTitle>
          <CardDescription>Upload and manage study materials</CardDescription>
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
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>Upload and organize your study resources</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploadForm(!showUploadForm)}
            >
              {showUploadForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Form */}
          {showUploadForm && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="text-sm font-semibold mb-4">Upload New Material</h3>
              
              <Form {...materialForm}>
                <form onSubmit={materialForm.handleSubmit(onSubmitMaterial)} className="space-y-4">
                  {/* Upload Mode Tabs */}
                  <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "file" | "url")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="file" className="text-xs">
                        <UploadIcon className="h-3.5 w-3.5 mr-1.5" />
                        Upload File
                      </TabsTrigger>
                      <TabsTrigger value="url" className="text-xs">
                        <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                        From URL
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="mt-3">
                      <div>
                        <FormLabel className="text-sm">Select File</FormLabel>
                        <div className="flex items-center gap-2 mt-1.5">
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
                            className="flex-1 text-sm h-9"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <UploadIcon className="h-3.5 w-3.5 mr-1.5" />
                            <span className="truncate">{selectedFile ? selectedFile.name : "Choose File"}</span>
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
                          <p className="text-sm text-muted-foreground mt-1.5">
                            Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="url" className="mt-3">
                      <FormField
                        name="url"
                        control={materialForm.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Material URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://example.com/file.pdf"
                                className="h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  <FormField
                    name="name"
                    control={materialForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Material Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Chapter 1 - Introduction"
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      name="type"
                      control={materialForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select type" />
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
                      control={materialForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Topic (Optional)</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              if (value === "create-new") {
                                setShowTopicForm(true)
                              } else {
                                field.onChange(value === "none" ? null : value)
                              }
                            }}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select topic" />
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
                                <Plus className="h-3.5 w-3.5 mr-1 inline" />
                                Create New Topic
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Inline Topic Creation Form */}
                  {showTopicForm && (
                    <div className="border rounded-lg p-3 bg-background space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Create New Topic</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTopicForm(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Form {...topicForm}>
                        <div className="space-y-3">
                          <FormField
                            name="name"
                            control={topicForm.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Topic Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., Introduction to Algorithms"
                                    className="h-9"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            name="description"
                            control={topicForm.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Brief description..."
                                    rows={2}
                                    className="resize-none"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button
                            type="button"
                            size="sm"
                            onClick={topicForm.handleSubmit(onSubmitTopic)}
                            className="w-full"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Create Topic
                          </Button>
                        </div>
                      </Form>
                    </div>
                  )}

                  <FormField
                    name="description"
                    control={materialForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Brief description..."
                            rows={2}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
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
                </form>
              </Form>
            </div>
          )}

          {/* Materials List */}
          {showUploadForm && materials.length > 0 && <Separator />}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No materials uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-2">Upload your first material above</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-3">Uploaded Materials</h3>
              {materials.map((material) => {
                const IconComponent = getMaterialIcon(material.type)
                return (
                  <div
                    key={material.materialId}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
                  >
                    <button
                      onClick={() => handleOpenMaterial(material.url)}
                      className="flex items-start gap-3 flex-1 text-left"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">{material.name}</h4>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {getMaterialTypeLabel(material.type)}
                          </Badge>
                        </div>
                        {material.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                            {material.description}
                          </p>
                        )}
                        {material.fileSize && (
                          <p className="text-xs text-muted-foreground">
                            Size: {material.fileSize}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    </button>
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteMaterialId(material.materialId)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMaterialId} onOpenChange={(open) => !open && setDeleteMaterialId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this material? This action cannot be undone.
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
