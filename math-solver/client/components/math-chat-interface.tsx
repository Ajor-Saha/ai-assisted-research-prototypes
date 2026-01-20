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
  Calculator,
  Image as ImageIcon,
  Upload,
  X,
  TrendingUp,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

interface Step {
  id: number;
  title: string;
  explanation: string;
  equation?: string;
  visualType?: 'graph' | 'diagram' | 'table';
  visualDescription?: string;
}

interface Solution {
  problem: string;
  steps: Step[];
  finalAnswer: string;
  methodology: string;
  keyInsights?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  solution?: Solution;
  timestamp: Date;
  hasImage?: boolean;
}

interface MathChatInterfaceProps {
  onSolveProblem: (problem: string, imageFile?: File) => Promise<Solution>;
}

export function MathChatInterface({ onSolveProblem }: MathChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Math Problem Solver. I'll help you solve mathematical problems with clear, step-by-step solutions and visual representations. You can type your problem or upload an image of handwritten work!",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !uploadedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || '(Problem from uploaded image)',
      hasImage: !!uploadedImage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const problemText = input.trim();
    const imageFile = uploadedImage;
    
    setInput('');
    setUploadedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      const solution = await onSolveProblem(problemText, imageFile || undefined);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll solve this problem step by step:`,
        solution: solution,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleProblems = [
    'Solve: 2x² + 5x - 3 = 0',
    'Find the derivative of f(x) = x³ - 4x² + 6x - 2',
    'Calculate the area under y = x² from x=0 to x=3',
  ];

  const handleExampleClick = (problem: string) => {
    setInput(problem);
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
                <div className="shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              )}
              
              <div className={`flex-1 max-w-4xl ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                {message.role === 'user' ? (
                  <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-md">
                    <p className="text-sm">{message.content}</p>
                    {message.hasImage && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Image attached
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Card className="p-6 bg-muted/50 border-muted">
                    <div className="space-y-4">
                      <p className="text-sm text-foreground leading-relaxed">
                        {message.content}
                      </p>
                      
                      {message.solution && (
                        <div className="space-y-6">
                          {/* Problem Statement */}
                          <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                            <h4 className="text-sm font-semibold text-foreground mb-2">Problem:</h4>
                            <p className="text-sm font-mono text-foreground/90">
                              {message.solution.problem}
                            </p>
                          </div>

                          <Separator />

                          {/* Steps */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              Step-by-Step Solution
                            </h4>
                            
                            {message.solution.steps.map((step, idx) => (
                              <div
                                key={step.id}
                                className="space-y-3 animate-in fade-in duration-300"
                                style={{ animationDelay: `${idx * 100}ms` }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="shrink-0 w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center mt-0.5">
                                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                      {idx + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <h5 className="text-sm font-semibold text-foreground">
                                      {step.title}
                                    </h5>
                                    <p className="text-sm text-foreground/90 leading-relaxed">
                                      {step.explanation}
                                    </p>

                                    {/* Equation */}
                                    {step.equation && (
                                      <div className="p-3 bg-background rounded-lg border border-border font-mono text-sm">
                                        {step.equation}
                                      </div>
                                    )}

                                    {/* Visual Representation */}
                                    {step.visualType && (
                                      <div className="bg-linear-to-br from-purple-500/5 to-purple-500/10 rounded-lg p-6 border border-dashed border-purple-500/30">
                                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                                          <Calculator className="h-9 w-9 text-purple-600 dark:text-purple-400" />
                                          <div className="space-y-1">
                                            <p className="font-medium text-xs text-foreground">
                                              Visual: {step.visualType.charAt(0).toUpperCase() + step.visualType.slice(1)}
                                            </p>
                                            {step.visualDescription && (
                                              <p className="text-xs text-muted-foreground">
                                                {step.visualDescription}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {idx < message.solution!.steps.length - 1 && (
                                  <Separator className="my-4" />
                                )}
                              </div>
                            ))}
                          </div>

                          <Separator />

                          {/* Final Answer */}
                          <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                              <div className="space-y-1.5">
                                <h4 className="text-sm font-semibold text-foreground">Final Answer</h4>
                                <p className="text-base font-mono font-semibold text-green-700 dark:text-green-400">
                                  {message.solution.finalAnswer}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Key Insights */}
                          {message.solution.keyInsights && message.solution.keyInsights.length > 0 && (
                            <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
                              <div className="flex items-start gap-3">
                                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-foreground">Key Insights</h4>
                                  <ul className="space-y-1.5">
                                    {message.solution.keyInsights.map((insight, idx) => (
                                      <li key={idx} className="text-sm text-foreground/90 flex items-start gap-2">
                                        <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                                        <span>{insight}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Methodology */}
                          <div className="text-xs text-muted-foreground italic">
                            Method used: {message.solution.methodology}
                          </div>
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
              <div className="shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="bg-muted/50 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Solving problem...</span>
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
          {/* Example Problems */}
          {messages.length === 1 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {exampleProblems.map((problem, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(problem)}
                    className="text-xs px-3 py-2 rounded-full border border-border bg-background hover:bg-accent transition-colors"
                  >
                    {problem}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-2 relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imagePreview} 
                  alt="Uploaded problem" 
                  className="h-24 w-auto rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full hover:bg-destructive/80 transition-colors"
                >
                  <X className="h-3 w-3 text-destructive-foreground" />
                </button>
              </div>
            )}
            
            <div className="flex gap-2 items-end">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your math problem here... (e.g., Solve x² + 5x + 6 = 0)"
                  className="min-h-15 max-h-30 resize-none pr-12"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                {/* Upload button inside textarea */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="absolute right-3 bottom-3 p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                  title="Upload image"
                >
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              <Button
                type="submit"
                size="icon"
                disabled={(!input.trim() && !uploadedImage) || isLoading}
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
              Press Enter to send • Upload image for handwritten problems
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
