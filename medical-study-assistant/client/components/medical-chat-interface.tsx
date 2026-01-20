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
  BookOpen,
  FileText,
  AlertCircle,
  ImageIcon,
  Languages,
  GraduationCap,
  Stethoscope
} from 'lucide-react';
import { UploadedTextbook, UploadedPage } from './textbook-upload';

interface PageReference {
  textbookId?: string;
  textbookName: string;
  pageNumber: number;
  excerpt: string;
  hasImage?: boolean;
  imageDescription?: string;
}

interface Answer {
  content: string;
  references: PageReference[];
  technicalLevel: 'technical' | 'simplified';
  summary?: string;
  medicalTerms?: Array<{
    term: string;
    definition: string;
  }>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  answer?: Answer;
  timestamp: Date;
}

interface MedicalChatInterfaceProps {
  textbooks: UploadedTextbook[];
  pages: UploadedPage[];
  onAskQuestion: (question: string, languageMode: 'technical' | 'simplified') => Promise<Answer>;
}

export function MedicalChatInterface({ 
  textbooks, 
  pages,
  onAskQuestion 
}: MedicalChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: textbooks.length === 0 && pages.length === 0
        ? "Hello! I'm your Medical Study Assistant. Please upload medical textbooks or specific page images above, and I'll help you understand the content with explanations strictly based on your materials."
        : `Ready to help! I have ${textbooks.length} textbook${textbooks.length !== 1 ? 's' : ''} and ${pages.length} page image${pages.length !== 1 ? 's' : ''} loaded. Ask me questions and I'll provide answers strictly from these sources.`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [languageMode, setLanguageMode] = useState<'technical' | 'simplified'>('technical');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update assistant message when sources change
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      const updatedMessage: Message = {
        ...messages[0],
        content: textbooks.length === 0 && pages.length === 0
          ? "Hello! I'm your Medical Study Assistant. Please upload medical textbooks or specific page images above, and I'll help you understand the content with explanations strictly based on your materials."
          : `Ready to help! I have ${textbooks.length} textbook${textbooks.length !== 1 ? 's' : ''} and ${pages.length} page image${pages.length !== 1 ? 's' : ''} loaded. Ask me questions and I'll provide answers strictly from these sources.`,
      };
      setMessages([updatedMessage]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textbooks.length, pages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || (textbooks.length === 0 && pages.length === 0)) return;

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
      const answer = await onAskQuestion(input.trim(), languageMode);
      
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
    'Explain the anatomy of the heart',
    'What is the pathophysiology of diabetes?',
    'Describe the mechanism of action for antibiotics',
    'What are the stages of wound healing?'
  ];

  const handleExampleClick = (question: string) => {
    if (textbooks.length > 0 || pages.length > 0) {
      setInput(question);
    }
  };

  const toggleLanguageMode = () => {
    setLanguageMode(prev => prev === 'technical' ? 'simplified' : 'technical');
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-32">
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 mb-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                        <p className="text-sm text-foreground leading-relaxed flex-1 whitespace-pre-line">
                          {message.content}
                        </p>
                        {message.answer?.technicalLevel && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs shrink-0 ${
                              message.answer.technicalLevel === 'technical'
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
                                : 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                            }`}
                          >
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {message.answer.technicalLevel === 'technical' ? 'Technical' : 'Simplified'}
                          </Badge>
                        )}
                      </div>
                      
                      {message.answer && (
                        <div className="space-y-4">
                          {/* Page References */}
                          {message.answer.references && message.answer.references.length > 0 && (
                            <div className="space-y-3">
                              <Separator />
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-primary" />
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Textbook References
                                  </h4>
                                </div>
                                <div className="space-y-2">
                                  {message.answer.references.map((ref, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-lg border border-border bg-background"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <p className="text-xs font-medium text-foreground">
                                              {ref.textbookName}
                                            </p>
                                            <Badge variant="secondary" className="text-xs">
                                              Page {ref.pageNumber}
                                            </Badge>
                                            {ref.hasImage && (
                                              <Badge variant="outline" className="text-xs">
                                                <ImageIcon className="h-3 w-3 mr-1" />
                                                Has Diagram
                                              </Badge>
                                            )}
                                          </div>
                                          <blockquote className="text-xs text-muted-foreground italic border-l-2 border-blue-500/30 pl-3 py-1">
                                            &quot;{ref.excerpt}&quot;
                                          </blockquote>
                                          {ref.imageDescription && (
                                            <div className="p-2 bg-blue-500/5 rounded border border-blue-500/10">
                                              <p className="text-xs text-foreground/80">
                                                <span className="font-medium">Diagram: </span>
                                                {ref.imageDescription}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Medical Terms Glossary */}
                          {message.answer.medicalTerms && message.answer.medicalTerms.length > 0 && (
                            <div className="space-y-2">
                              <Separator />
                              <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  <h4 className="text-sm font-semibold text-foreground">Medical Terms</h4>
                                </div>
                                <div className="space-y-2">
                                  {message.answer.medicalTerms.map((term, idx) => (
                                    <div key={idx} className="text-xs">
                                      <span className="font-semibold text-foreground">{term.term}:</span>{' '}
                                      <span className="text-foreground/80">{term.definition}</span>
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
                              <div className="flex items-start gap-3 p-4 bg-linear-to-br from-blue-500/5 to-blue-500/10 rounded-lg border border-blue-500/20">
                                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
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
              <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-muted/50 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Analyzing textbook...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur z-10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          {/* No sources warning */}
          {textbooks.length === 0 && pages.length === 0 && (
            <div className="mb-3 flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Please upload textbooks or page images to start learning
              </p>
            </div>
          )}

          {/* Language Mode Toggle & Example Questions */}
          <div className="mb-3 flex items-center justify-between gap-3">
            {messages.length === 1 && (textbooks.length > 0 || pages.length > 0) && (
              <div className="flex flex-wrap gap-2 flex-1">
                {exampleQuestions.slice(0, 2).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(question)}
                    className="text-xs px-3 py-2 rounded-full border border-border bg-background hover:bg-accent transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguageMode}
              className="shrink-0"
            >
              <Languages className="h-4 w-4 mr-2" />
              <span className="text-xs">
                {languageMode === 'technical' ? 'Technical' : 'Simplified'}
              </span>
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  textbooks.length === 0 && pages.length === 0
                    ? "Upload textbooks first to start learning..."
                    : "Ask a question about your textbook content..."
                }
                className="min-h-15 max-h-30 resize-none"
                disabled={isLoading || (textbooks.length === 0 && pages.length === 0)}
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
                disabled={!input.trim() || isLoading || (textbooks.length === 0 && pages.length === 0)}
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
              Press Enter to send • Toggle language mode for technical/simplified explanations
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
