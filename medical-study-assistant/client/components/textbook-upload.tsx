'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  Loader2,
  Layers
} from 'lucide-react';
import Image from 'next/image';

export interface Chapter {
  id: string;
  name: string;
  pageRange: string;
}

export interface UploadedTextbook {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  pageCount?: number;
  chapters?: Chapter[];
  isProcessing?: boolean;
}

export interface UploadedPage {
  id: string;
  name: string;
  pageNumber?: number;
  uploadedAt: Date;
  thumbnailUrl?: string;
}

interface TextbookUploadProps {
  onTextbooksChange: (textbooks: UploadedTextbook[]) => void;
  onPagesChange: (pages: UploadedPage[]) => void;
  textbooks: UploadedTextbook[];
  pages: UploadedPage[];
}

export function TextbookUpload({ 
  onTextbooksChange, 
  onPagesChange,
  textbooks, 
  pages 
}: TextbookUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('textbooks');

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

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>, type: 'textbook' | 'page') => {
    const files = Array.from(e.target.files || []);
    await processFiles(files, type);
    e.target.value = '';
  };

  const processFiles = async (files: File[], type: 'textbook' | 'page' = 'textbook') => {
    setIsUploading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (type === 'textbook' || files.some(f => f.type === 'application/pdf')) {
      const newTextbooks: UploadedTextbook[] = files
        .filter(f => f.type === 'application/pdf')
        .map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          pageCount: Math.floor(Math.random() * 500) + 100,
          isProcessing: true,
          chapters: [
            { id: '1', name: 'Chapter 1: Introduction', pageRange: '1-25' },
            { id: '2', name: 'Chapter 2: Anatomy', pageRange: '26-75' },
            { id: '3', name: 'Chapter 3: Physiology', pageRange: '76-150' },
            { id: '4', name: 'Chapter 4: Pathology', pageRange: '151-250' },
          ],
        }));
      
      onTextbooksChange([...textbooks, ...newTextbooks]);
      
      // Simulate processing completion
      setTimeout(() => {
        onTextbooksChange(
          [...textbooks, ...newTextbooks].map(tb => ({ ...tb, isProcessing: false }))
        );
      }, 3000);
    }
    
    if (type === 'page' || files.some(f => f.type.startsWith('image/'))) {
      const newPages: UploadedPage[] = files
        .filter(f => f.type.startsWith('image/'))
        .map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          pageNumber: Math.floor(Math.random() * 200) + 1,
          uploadedAt: new Date(),
          thumbnailUrl: URL.createObjectURL(file),
        }));
      
      onPagesChange([...pages, ...newPages]);
    }
    
    setIsUploading(false);
  };

  const removeTextbook = (id: string) => {
    onTextbooksChange(textbooks.filter(tb => tb.id !== id));
  };

  const removePage = (id: string) => {
    onPagesChange(pages.filter(p => p.id !== id));
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="textbooks" className="text-xs">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Full Textbooks
          </TabsTrigger>
          <TabsTrigger value="pages" className="text-xs">
            <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
            Page Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="textbooks" className="space-y-4">
          {/* Upload Area for Textbooks */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }
            `}
          >
            <input
              type="file"
              id="textbook-upload"
              multiple
              accept=".pdf"
              onChange={(e) => handleFileInput(e, 'textbook')}
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs font-medium text-foreground">Processing textbook...</p>
                </>
              ) : (
                <>
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">Upload medical textbooks (PDF)</p>
                    <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('textbook-upload')?.click()}
                    className="mt-1"
                  >
                    Select PDF Files
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Uploaded Textbooks */}
          {textbooks.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Textbooks ({textbooks.length})
                </h3>
              </div>
              
              <ScrollArea className="max-h-100 pr-4">
                <div className="space-y-3 pb-4">
                  {textbooks.map((textbook) => (
                    <div
                      key={textbook.id}
                      className="rounded-lg border border-border bg-background p-3 space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 p-2 rounded-md bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {textbook.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(textbook.size)}
                            </span>
                            {textbook.pageCount && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {textbook.pageCount} pages
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {textbook.isProcessing ? (
                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                          <button
                            onClick={() => removeTextbook(textbook.id)}
                            className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                            title="Remove textbook"
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>

                      {/* Chapters */}
                      {textbook.chapters && textbook.chapters.length > 0 && !textbook.isProcessing && (
                        <div className="pl-12 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                            <Layers className="h-3 w-3" />
                            <span>Chapters</span>
                          </div>
                          <div className="space-y-1">
                            {textbook.chapters.slice(0, 3).map((chapter) => (
                              <div key={chapter.id} className="flex items-center justify-between text-xs">
                                <span className="text-foreground/80">{chapter.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  p. {chapter.pageRange}
                                </Badge>
                              </div>
                            ))}
                            {textbook.chapters.length > 3 && (
                              <p className="text-xs text-muted-foreground italic">
                                +{textbook.chapters.length - 3} more chapters
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          {/* Upload Area for Pages */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }
            `}
          >
            <input
              type="file"
              id="page-upload"
              multiple
              accept="image/*"
              onChange={(e) => handleFileInput(e, 'page')}
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs font-medium text-foreground">Uploading page images...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">Upload specific page images</p>
                    <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('page-upload')?.click()}
                    className="mt-1"
                  >
                    Select Images
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Uploaded Pages */}
          {pages.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Page Images ({pages.length})
                </h3>
              </div>
              
              <ScrollArea className="max-h-100 pr-4">
                <div className="grid grid-cols-2 gap-2 pb-4">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className="relative rounded-lg border border-border bg-background overflow-hidden group"
                    >
                      {page.thumbnailUrl && (
                        <Image
                          src={page.thumbnailUrl} 
                          alt={page.name}
                          className="w-full h-32 object-cover"
                          width={200}
                          height={200}
                        />
                      )}
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {page.name}
                        </p>
                        {page.pageNumber && (
                          <Badge variant="secondary" className="text-xs">
                            Page {page.pageNumber}
                          </Badge>
                        )}
                      </div>
                      <button
                        onClick={() => removePage(page.id)}
                        className="absolute top-2 right-2 p-1.5 bg-destructive/90 hover:bg-destructive rounded-md transition-all opacity-0 group-hover:opacity-100"
                        title="Remove page"
                      >
                        <X className="h-3 w-3 text-destructive-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
