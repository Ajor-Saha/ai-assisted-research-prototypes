'use client';

import { useState } from 'react';
import { DocumentUpload, UploadedDocument } from '@/components/ai-assistants/research/document-upload';
import { ResearchChatInterface } from '@/components/ai-assistants/research/research-chat-interface';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { FileSearch, RefreshCw } from 'lucide-react';
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

export default function ResearchAIChatPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
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
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Research Assistant</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            {documents.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                <FileSearch className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {documents.length} document{documents.length > 1 ? 's' : ''} loaded
                </span>
              </div>
            )}
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document Upload Sidebar */}
        <div className="w-80 shrink-0 border-r overflow-y-auto">
          <div className="p-4">
            <DocumentUpload 
              key={refreshKey}
              documents={documents}
              onDocumentsChange={setDocuments}
            />
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ResearchChatInterface 
            documents={documents}
          />
        </div>
      </div>
    </>
  );
}
