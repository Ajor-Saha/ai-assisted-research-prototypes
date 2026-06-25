'use client';

import { useState } from 'react';
import { DocumentUpload, UploadedDocument } from '@/components/ai-assistants/research/document-upload';
import { ResearchChatInterface } from '@/components/ai-assistants/research/research-chat-interface';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { FileSearch, RefreshCw, PanelLeft } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function ResearchAIChatPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDocPanelOpen, setIsDocPanelOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 w-full justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Research Assistant</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-1.5">
            {documents.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                <FileSearch className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {documents.length} doc{documents.length > 1 ? 's' : ''} loaded
                </span>
              </div>
            )}
            {/* Mobile: open doc panel button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden relative"
              onClick={() => setIsDocPanelOpen(true)}
              title="Documents"
            >
              <FileSearch className="h-4 w-4" />
              {documents.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  {documents.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              title="Refresh documents"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Research Assistant Banner */}
      <div className="relative overflow-hidden border-b bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 sm:px-6 py-3 shrink-0">
        <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur">
              <FileSearch className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Research AI Assistant</p>
              <p className="text-xs text-white/70">Analyze papers and extract insights with citations</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-xs text-white font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Document Upload Panel - desktop only */}
        <div className="hidden md:flex md:w-80 shrink-0 border-r overflow-y-auto flex-col bg-background">
          <div className="p-4">
            <DocumentUpload
              key={refreshKey}
              documents={documents}
              onDocumentsChange={setDocuments}
            />
          </div>
        </div>

        {/* Mobile Document Panel Sheet */}
        <Sheet open={isDocPanelOpen} onOpenChange={setIsDocPanelOpen}>
          <SheetContent side="left" className="w-80 p-0 flex flex-col">
            <SheetHeader className="px-4 py-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-base flex items-center gap-2">
                  <PanelLeft className="h-4 w-4" />
                  Research Documents
                </SheetTitle>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <DocumentUpload
                  key={`mobile-${refreshKey}`}
                  documents={documents}
                  onDocumentsChange={setDocuments}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <ResearchChatInterface
            documents={documents}
          />
        </div>
      </div>
    </div>
  );
}
