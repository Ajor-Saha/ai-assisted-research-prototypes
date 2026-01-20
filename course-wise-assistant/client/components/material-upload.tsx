"use client"

import { useState, useCallback } from "react"
import { Upload, FileText, X, CheckCircle2, Loader2, Sparkles, AlertCircle, Book, PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UploadedFile {
  id: string
  name: string
  size: number
  status: "uploading" | "analyzing" | "completed" | "error"
  progress: number
  type: "document" | "handwritten"
  analysis?: {
    keyTopics: string[]
    weakAreas: string[]
    feedback: string
  }
}

interface MaterialUploadProps {
  courseId: string
  onUploadComplete?: (files: UploadedFile[]) => void
}

export function MaterialUpload({ courseId, onUploadComplete }: MaterialUploadProps) {
  // courseId will be used for API calls to upload materials to specific course
  // onUploadComplete callback will be triggered after successful uploads
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState("document")

  const simulateAnalysis = useCallback((fileId: string, type: "document" | "handwritten") => {
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId
            ? {
                ...file,
                status: "completed",
                analysis: {
                  keyTopics: type === "handwritten" 
                    ? ["(Handwritten) Fourier Series", "(Handwritten) Laplace Transform"] 
                    : ["Vector Spaces", "Linear Transformations", "Eigenvalues"],
                  weakAreas: type === "handwritten"
                    ? ["Legibility in Section 2", "Diagram clarity"]
                    : ["Matrix Decomposition", "Spectral Theorem"],
                  feedback: type === "handwritten"
                    ? "Handwritten notes recognized. Good structure, but improve handwriting for better OCR accuracy."
                    : "This document covers the core concepts well."
                }
              }
            : file
        )
      )
    }, 2000)
  }, [])

  const handleFiles = useCallback((fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      status: "uploading" as const,
      progress: 0,
      type: activeTab as "document" | "handwritten",
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Simulate upload and analysis progress
    newFiles.forEach((file) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress: Math.min(progress, 100) } : f))
        )

        if (progress >= 100) {
          clearInterval(interval)
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, status: "analyzing" } : f))
          )
          simulateAnalysis(file.id, file.type)
        }
      }, 500)
    })
  }, [simulateAnalysis, activeTab])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      handleFiles(Array.from(selectedFiles))
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Course Materials</CardTitle>
        <CardDescription>
          Upload PDFs, presentations, notes, or any other study materials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, DOCX, PPTX, TXT, and more
              </p>
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="mt-2" asChild>
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files</h4>
            {files.map((file) => (
              <div key={file.id} className="space-y-2">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    {file.status === "uploading" && (
                      <Progress value={file.progress} className="h-1" />
                    )}
                    {file.status === "analyzing" && (
                      <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
                        <Sparkles className="h-3 w-3" /> Analyzing content...
                      </div>
                    )}
                  </div>
                  {file.status === "completed" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  )}
                  {(file.status === "uploading" || file.status === "analyzing") && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {file.status === "completed" && file.analysis && (
                  <div className="ml-11 space-y-3">
                      <Alert className="bg-blue-50/50 border-blue-100">
                          <Sparkles className="h-4 w-4 text-blue-500" />
                          <AlertTitle className="text-blue-700">AI Analysis</AlertTitle>
                          <AlertDescription className="text-blue-600/90 text-xs mt-1">
                              {file.analysis.feedback}
                          </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                              <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Key Topics
                              </p>
                              <div className="flex flex-wrap gap-1">
                                  {file.analysis.keyTopics.map(topic => (
                                      <span key={topic} className="text-[10px] bg-white px-2 py-0.5 rounded border border-green-200 text-green-600">
                                          {topic}
                                      </span>
                                  ))}
                              </div>
                          </div>
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                              <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> Weak Areas
                              </p>
                              <div className="flex flex-wrap gap-1">
                                  {file.analysis.weakAreas.map(area => (
                                      <span key={area} className="text-[10px] bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-600">
                                          {area}
                                      </span>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
