'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  User, 
  Bot,
  Quote,
  BookOpen,
  FileText,
  AlertCircle
} from 'lucide-react';
import { UploadedDocument } from './document-upload';

interface Citation {
  documentId: string;
  documentName: string;
  pageNumber?: number;
  excerpt: string;
}

interface Answer {
  content: string;
  citations: Citation[];
  summary?: string;
  confidence?: 'high' | 'medium' | 'low';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  answer?: Answer;
  timestamp: Date;
}

interface ResearchChatInterfaceProps {
  documents: UploadedDocument[];
  onAskQuestion: (question: string) => Promise<Answer>;
}

export function ResearchChatInterface({ documents, onAskQuestion }: ResearchChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: documents.length === 0
        ? "Hello! I'm your Research Assistant. Please upload some research papers or academic articles above, and I'll help you analyze them and answer questions based on the content."
        : `Great! I've processed ${documents.length} document${documents.length > 1 ? 's' : ''}. You can now ask me questions about the uploaded materials, and I'll provide answers with proper citations.`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update assistant message when documents change
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      const updatedMessage: Message = {
        ...messages[0],
        content: documents.length === 0
          ? "Hello! I'm your Research Assistant. Please upload some research papers or academic articles above, and I'll help you analyze them and answer questions based on the content."
          : `Great! I've processed ${documents.length} document${documents.length > 1 ? 's' : ''}. You can now ask me questions about the uploaded materials, and I'll provide answers with proper citations.`,
      };
      setMessages([updatedMessage]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || documents.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const answer = await onAskQuestion(input.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer.content,
        answer: answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQuestions = [
    'What are the main findings of this research?',
    'Summarize the methodology used in these papers',
    'What are the key conclusions?',
    'Compare the approaches discussed in different papers'
  ];

  const handleExampleClick = (question: string) => {
    if (documents.length > 0) {
      setInput(question);
    }
  };

  const getConfidenceBadge = (confidence?: 'high' | 'medium' | 'low') => {
    if (!confidence) return null;
    
    const styles = {
      high: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
      low: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    };

    return (
      <Badge variant="outline" className={`text-xs ${styles[confidence]}`}>
        {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 mb-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              
              <div className={`flex-1 max-w-4xl ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                {message.role === 'user' ? (
                  <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm">
                    <p className="text-sm">{message.content}</p>
                  </div>
                ) : (
                  <Card className="p-6 bg-muted/50 border-muted">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-foreground leading-relaxed flex-1">
                          {message.content}
                        </p>
                        {message.answer?.confidence && getConfidenceBadge(message.answer.confidence)}
                      </div>
                      
                      {message.answer && (
                        <div className="space-y-4">
                          {/* Citations */}
                          {message.answer.citations && message.answer.citations.length > 0 && (
                            <div className="space-y-3">
                              <Separator />
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Quote className="h-4 w-4 text-primary" />
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Citations & References
                                  </h4>
                                </div>
                                <div className="space-y-2">
                                  {message.answer.citations.map((citation, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-lg border border-border bg-background"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                          <span className="text-xs font-bold text-primary">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                            <p className="text-xs font-medium text-foreground">
                                              {citation.documentName}
                                            </p>
                                            {citation.pageNumber && (
                                              <Badge variant="secondary" className="text-xs">
                                                Page {citation.pageNumber}
                                              </Badge>
                                            )}
                                          </div>
                                          <blockquote className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-1">
                                            &quot;{citation.excerpt}&quot;
                                          </blockquote>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Summary */}
                          {message.answer.summary && (
                            <div className="space-y-2">
                              <Separator />
                              <div className="flex items-start gap-3 p-4 bg-linear-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                                <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold text-foreground">Key Takeaway</h4>
                                  <p className="text-sm text-foreground/90 leading-relaxed">
                                    {message.answer.summary}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {message.role === 'user' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 mb-6">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="bg-muted/50 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Analyzing documents...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Sticky at bottom */}
      <div className="border-t border-border bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* No documents warning */}
          {documents.length === 0 && (
            <div className="mb-3 flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Please upload at least one document to start asking questions
              </p>
            </div>
          )}

          {/* Example Questions */}
          {messages.length === 1 && documents.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {exampleQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(question)}
                    className="text-xs px-3 py-2 rounded-full border border-border bg-background hover:bg-accent transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  documents.length === 0
                    ? "Upload documents first to start asking questions..."
                    : "Ask a question about your uploaded documents..."
                }
                className="min-h-15 max-h-30 resize-none"
                disabled={isLoading || documents.length === 0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading || documents.length === 0}
                className="h-15 w-15 shrink-0"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift + Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
