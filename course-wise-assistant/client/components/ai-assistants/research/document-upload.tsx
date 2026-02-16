'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  uploadResearchPaper, 
  getUserResearchPapers,
  deleteResearchPaper,
  type ResearchPaper 
} from '@/services/research-paper-service';

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  pageCount?: number;
  parsingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  isIndexed?: boolean;
  fileUrl?: string;
}

interface DocumentUploadProps {
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  documents: UploadedDocument[];
}

export function DocumentUpload({ onDocumentsChange, documents }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allPapers, setAllPapers] = useState<ResearchPaper[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDocuments = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      const response = await getUserResearchPapers();
      setAllPapers(response.data.papers);
      
      // Filter for completed and indexed documents for chat
      const completedDocs: UploadedDocument[] = response.data.papers
        .filter((paper: ResearchPaper) => paper.parsingStatus === 'completed' && paper.isIndexed)
        .map((paper: ResearchPaper) => ({
          id: paper.paperId,
          name: paper.fileName,
          size: parseInt(paper.fileSize),
          type: paper.fileType,
          uploadedAt: new Date(paper.createdAt),
          pageCount: paper.chunkCount || undefined,
          parsingStatus: paper.parsingStatus,
          isIndexed: paper.isIndexed,
          fileUrl: paper.fileUrl,
        }));
      onDocumentsChange(completedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (!silent) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Failed to fetch documents', {
          description: errorMessage,
        });
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [onDocumentsChange]);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
    return () => {
      // Cleanup polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchDocuments]);

  // Start polling if there are processing documents
  useEffect(() => {
    const hasProcessing = allPapers.some(
      (paper) => paper.parsingStatus === 'processing' || paper.parsingStatus === 'pending'
    );

    if (hasProcessing) {
      // Start polling every 5 seconds
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          fetchDocuments(true); // silent fetch
        }, 5000);
      }
    } else {
      // Stop polling if no processing documents
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [allPapers, fetchDocuments]);

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
    
    try {
      for (const file of files) {
        // Extract title from filename (remove extension)
        const title = file.name.replace(/\.[^/.]+$/, '');
        
        await uploadResearchPaper(file, {
          title,
          description: `Uploaded for research analysis`,
        });
      }
      
      toast.success(`Successfully uploaded ${files.length} document${files.length > 1 ? 's' : ''}`, {
        description: 'Documents are being processed. They will appear automatically when ready.',
      });
      
      // Immediately fetch to show processing status
      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to upload documents', {
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = async (id: string) => {
    try {
      await deleteResearchPaper(id);
      toast.success('Document removed successfully');
      // Refetch to update the list
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to remove document', {
        description: errorMessage,
      });
    }
  };

  const viewDocument = (fileUrl: string) => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

      {/* All Documents List (including processing) */}
      {allPapers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({allPapers.length})
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {documents.length} ready
              </Badge>
              {allPapers.some(p => p.parsingStatus === 'processing' || p.parsingStatus === 'pending') && (
                <Badge variant="outline" className="text-xs">
                  Processing...
                </Badge>
              )}
            </div>
          </div>
          
          <ScrollArea className="h-50 pr-4">
            <div className="space-y-2">
              {allPapers.map((paper) => (
                <div
                  key={paper.paperId}
                  onClick={() => {
                    if (paper.parsingStatus === 'completed' && paper.isIndexed) {
                      viewDocument(paper.fileUrl);
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors group ${
                    paper.parsingStatus === 'completed' && paper.isIndexed ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="shrink-0 p-2 rounded-md bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {paper.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(parseInt(paper.fileSize))}
                      </span>
                      {paper.chunkCount && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {paper.chunkCount} chunks
                          </span>
                        </>
                      )}
                      {paper.parsingStatus === 'processing' && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            Processing...
                          </span>
                        </>
                      )}
                      {paper.parsingStatus === 'failed' && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-destructive">
                            Failed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {paper.parsingStatus === 'completed' && paper.isIndexed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : paper.parsingStatus === 'processing' || paper.parsingStatus === 'pending' ? (
                      <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    ) : paper.parsingStatus === 'failed' ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDocument(paper.paperId);
                      }}
                      className="h-8 w-8 hover:bg-destructive/10"
                      title="Remove document"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
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
