'use client';

import { useState } from 'react';
import { DocumentUpload, UploadedDocument } from '@/components/research-asist-comp/document-upload';
import { ResearchChatInterface } from '@/components/research-asist-comp/research-chat-interface';
import { ThemeToggle } from '@/components/theme-toggle';
import { FileSearch } from 'lucide-react';
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

// Mock data generator - in a real app, this would call an AI API with RAG
function generateAnswer(question: string, documents: UploadedDocument[]) {
  // This is demo data - in production, you'd call your AI backend with document context
  const mockAnswer = {
    content: `Based on the analysis of your uploaded documents, here's what I found regarding "${question}":\n\nThe research papers indicate that this topic involves several key components and methodologies. The authors present comprehensive evidence through both qualitative and quantitative approaches, demonstrating robust findings that contribute to the field's understanding.\n\nThe main argument centers around the relationship between theoretical frameworks and practical applications, with particular emphasis on empirical validation and real-world implications. Multiple studies corroborate these findings, suggesting a strong consensus in the literature.`,
    citations: documents.slice(0, Math.min(3, documents.length)).map((doc) => ({
      documentId: doc.id,
      documentName: doc.name,
      pageNumber: Math.floor(Math.random() * (doc.pageCount || 10)) + 1,
      excerpt: `This excerpt from ${doc.name} provides supporting evidence for the analysis. The research methodology employed robust statistical techniques and comprehensive data collection procedures to ensure validity and reliability of the findings. The results demonstrate significant correlations between the variables under investigation.`,
    })),
    summary: `The uploaded research papers collectively provide strong evidence supporting the main thesis. The methodologies are sound, the data is comprehensive, and the conclusions are well-supported by empirical evidence. This represents a significant contribution to the field and opens avenues for further research.`,
    confidence: 'high' as const,
  };

  return mockAnswer;
}

export default function Home() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const handleAskQuestion = async (question: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const answer = generateAnswer(question, documents);
    return answer;
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
              documents={documents}
              onDocumentsChange={setDocuments}
            />
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ResearchChatInterface 
            documents={documents}
            onAskQuestion={handleAskQuestion}
          />
        </div>
      </div>
    </>
  );
}
