"use client"

import { useState, useCallback } from "react"
import { Upload, FileText, X, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface UploadedFile {
  id: string
  name: string
  size: number
  status: "uploading" | "completed" | "error"
  progress: number
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

  const simulateUpload = useCallback((fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId
            ? {
                ...file,
                progress,
                status: progress === 100 ? "completed" : "uploading",
              }
            : file
        )
      )

      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 200)
  }, [])

  const handleFiles = useCallback((fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      status: "uploading" as const,
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Simulate upload process
    newFiles.forEach((file) => {
      simulateUpload(file.id)
    })
  }, [simulateUpload])

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
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
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
                </div>
                {file.status === "completed" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                )}
                {file.status === "uploading" && (
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
