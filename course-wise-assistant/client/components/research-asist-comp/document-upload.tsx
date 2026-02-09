'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, X, CheckCircle2, Loader2 } from 'lucide-react';

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  pageCount?: number;
}

interface DocumentUploadProps {
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  documents: UploadedDocument[];
}

export function DocumentUpload({ onDocumentsChange, documents }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    // Reset input
    e.target.value = '';
  };

  const processFiles = async (files: File[]) => {
    setIsUploading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newDocuments: UploadedDocument[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      pageCount: Math.floor(Math.random() * 50) + 1, // Mock page count
    }));

    onDocumentsChange([...documents, ...newDocuments]);
    setIsUploading(false);
  };

  const removeDocument = (id: string) => {
    onDocumentsChange(documents.filter(doc => doc.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">Uploading documents...</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Drag and drop your research papers here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse files
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="mt-2"
              >
                Select Files
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: PDF, DOC, DOCX, TXT
              </p>
            </>
          )}
        </div>
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Uploaded Documents ({documents.length})
            </h3>
            <Badge variant="secondary" className="text-xs">
              {documents.reduce((acc, doc) => acc + doc.size, 0) > 0 
                ? formatFileSize(documents.reduce((acc, doc) => acc + doc.size, 0))
                : '0 KB'
              }
            </Badge>
          </div>
          
          <ScrollArea className="h-50 pr-4">
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors group"
                >
                  <div className="shrink-0 p-2 rounded-md bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)}
                      </span>
                      {doc.pageCount && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {doc.pageCount} pages
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove document"
                    >
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
