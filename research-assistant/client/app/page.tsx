'use client';

import { useState } from 'react';
import { DocumentUpload, UploadedDocument } from '@/components/document-upload';
import { ResearchChatInterface } from '@/components/research-chat-interface';
import { BookOpenCheck, FileSearch } from 'lucide-react';

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
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpenCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Research Assistant</h1>
                <p className="text-xs text-muted-foreground">AI-powered document analysis with citations</p>
              </div>
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 container mx-auto max-w-7xl">
        {/* Document Upload Sidebar */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="sticky top-24">
            <DocumentUpload 
              documents={documents}
              onDocumentsChange={setDocuments}
            />
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-w-0">
          <div className="h-[calc(100vh-8rem)] bg-background rounded-lg border border-border/40">
            <ResearchChatInterface 
              documents={documents}
              onAskQuestion={handleAskQuestion}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <p className="text-xs text-center text-muted-foreground">
            HCI Research Prototype • Reference-Based Learning • Academic Integrity Support
          </p>
        </div>
      </div>
    </div>
  );
}
