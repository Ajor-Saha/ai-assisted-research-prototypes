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
  Eye,
  Lightbulb,
  Check,
  BookOpen,
  ExternalLink,
  Tag,
  Video,
  FileText,
  MousePointerClick,
  FlaskConical,
  Paperclip,
  X
} from 'lucide-react';

interface Explanation {
  topic: string;
  steps: Array<{
    id: number;
    title: string;
    content: string;
    visualType?: 'diagram' | 'graph' | 'animation' | 'example';
    keyPoints?: string[];
    relatedConcepts?: string[];
  }>;
  summary: string;
  externalResources?: Array<{
    title: string;
    url: string;
    type: 'article' | 'video' | 'interactive' | 'research';
  }>;
  keywords?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  explanation?: Explanation;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<Explanation>;
}

export function ChatInterface({ onSendMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI learning assistant. Ask me to explain any complex academic concept, and I'll break it down into clear, step-by-step explanations with visual aids. What would you like to learn about today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const explanation = await onSendMessage(input.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll explain ${explanation.topic} step by step:`,
        explanation: explanation,
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
    'Explain how photosynthesis works',
    'What is quantum entanglement?',
    'How does DNA replication occur?',
    'Explain Newton\'s laws of motion'
  ];

  const handleExampleClick = (question: string) => {
    setInput(question);
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
                  <div className="space-y-6">
                    <p className="text-sm text-foreground">{message.content}</p>
                    
                    {message.explanation && message.explanation.steps && (
                      <div className="space-y-6">
                        {message.explanation.steps.map((step, index) => (
                          <div key={step.id} className="space-y-4 animate-in fade-in duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                            {/* Step Header */}
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-bold text-primary">{index + 1}</span>
                              </div>
                              <div className="flex-1 space-y-3">
                                <h3 className="text-base font-semibold text-foreground">
                                  {step.title}
                                </h3>
                                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                                  {step.content}
                                </p>

                                {/* Visual Element */}
                                {step.visualType && (
                                  <div className="bg-linear-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-dashed border-primary/30">
                                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                                      <Eye className="h-9 w-9 text-primary/60" />
                                      <div className="space-y-1">
                                        <p className="font-medium text-xs text-foreground">
                                          Visual: {step.visualType.charAt(0).toUpperCase() + step.visualType.slice(1)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Interactive visualization would appear here
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Key Points */}
                                {step.keyPoints && step.keyPoints.length > 0 && (
                                  <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Lightbulb className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                                        Key Points
                                      </span>
                                    </div>
                                    <ul className="space-y-1.5">
                                      {step.keyPoints.map((point, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs">
                                          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                          <span className="text-foreground/90">{point}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Related Concepts */}
                                {step.relatedConcepts && step.relatedConcepts.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 items-center">
                                    <span className="text-xs text-muted-foreground">Related:</span>
                                    {step.relatedConcepts.map((concept, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {concept}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {index < message.explanation!.steps.length - 1 && (
                              <Separator className="my-4" />
                            )}
                          </div>
                        ))}

                        {/* Summary */}
                        <div className="pt-4 border-t border-border/50">
                          <div className="flex items-start gap-3 p-4 bg-linear-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                            <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div className="space-y-1.5">
                              <h4 className="text-sm font-semibold text-foreground">Summary</h4>
                              <p className="text-sm text-foreground/90 leading-relaxed">
                                {message.explanation!.summary}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Keywords */}
                        {message.explanation!.keywords && message.explanation!.keywords.length > 0 && (
                          <div className="pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-primary" />
                              <h4 className="text-sm font-semibold text-foreground">Keywords</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {message.explanation!.keywords.map((keyword, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs px-3 py-1">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* External Resources */}
                        {message.explanation!.externalResources && message.explanation!.externalResources.length > 0 && (
                          <div className="pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4 text-primary" />
                              <h4 className="text-sm font-semibold text-foreground">Related External Resources</h4>
                            </div>
                            <div className="grid gap-2">
                              {message.explanation!.externalResources.map((resource, idx) => {
                                const getIcon = () => {
                                  switch (resource.type) {
                                    case 'video': return <Video className="h-3.5 w-3.5" />;
                                    case 'article': return <FileText className="h-3.5 w-3.5" />;
                                    case 'interactive': return <MousePointerClick className="h-3.5 w-3.5" />;
                                    case 'research': return <FlaskConical className="h-3.5 w-3.5" />;
                                    default: return <ExternalLink className="h-3.5 w-3.5" />;
                                  }
                                };
                                
                                return (
                                  <a
                                    key={idx}
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background hover:bg-accent transition-colors group"
                                  >
                                    <div className="shrink-0 p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                      {getIcon()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                        {resource.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground capitalize">
                                        {resource.type}
                                      </p>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                  </a>
                                );
                              })}
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
                  <span className="text-sm text-muted-foreground">Generating explanation...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto max-w-5xl px-4 py-4">
          {/* Example Questions (shown when no messages) */}
          {messages.length === 1 && (
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
            {/* File previews */}
            {uploadedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate max-w-50">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="ml-1 hover:bg-background rounded-sm p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 items-end">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me to explain any concept... (e.g., How does photosynthesis work?)"
                  className="min-h-15 max-h-30 resize-none pr-12"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                {/* Paperclip button inside textarea */}
                <button
                  type="button"
                  onClick={handleFileButtonClick}
                  disabled={isLoading}
                  className="absolute right-3 bottom-3 p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attach files"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
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
