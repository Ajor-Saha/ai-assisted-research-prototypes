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
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { UploadedDocument } from './document-upload';
import { 
  streamResearchChat, 
  PaperReference, 
  getResearchChatMessages,
  ResearchChatMessageDB 
} from '@/services/research-paper-service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: PaperReference[];
  timestamp: Date;
  isStreaming?: boolean;
}

interface ResearchChatInterfaceProps {
  documents: UploadedDocument[];
}

export function ResearchChatInterface({ documents }: ResearchChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages from database on mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const response = await getResearchChatMessages();
        
        if (response.data && response.data.length > 0) {
          // Convert DB messages to UI messages
          const loadedMessages: Message[] = response.data.map((dbMsg: ResearchChatMessageDB) => ({
            id: dbMsg.messageId,
            role: dbMsg.role,
            content: dbMsg.content,
            references: dbMsg.paperReferences || undefined,
            timestamp: new Date(dbMsg.createdAt),
          }));
          setMessages(loadedMessages);
        } else {
          // Show welcome message if no messages exist
          setMessages([
            {
              id: '1',
              role: 'assistant',
              content: documents.length === 0
                ? "Hello! I'm your Research Assistant. Please upload some research papers or academic articles above, and I'll help you analyze them and answer questions based on the content."
                : `Great! I've processed ${documents.length} document${documents.length > 1 ? 's' : ''}. You can now ask me questions about the uploaded materials, and I'll provide answers with proper citations.`,
              timestamp: new Date(),
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Show welcome message on error
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: documents.length === 0
              ? "Hello! I'm your Research Assistant. Please upload some research papers or academic articles above, and I'll help you analyze them and answer questions based on the content."
              : `Great! I've processed ${documents.length} document${documents.length > 1 ? 's' : ''}. You can now ask me questions about the uploaded materials, and I'll provide answers with proper citations.`,
            timestamp: new Date(),
          }
        ]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [documents.length]);

  // Update assistant message when documents change (only for welcome message)
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

    const question = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create assistant message that will be streamed
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      await streamResearchChat(
        question,
        // onChunk
        (chunk: string) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        // onReferences
        (references: PaperReference[]) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, references, isStreaming: false }
                : msg
            )
          );
        },
        // onError
        (error: string) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `Error: ${error}`,
                    isStreaming: false,
                  }
                : msg
            )
          );
          setIsLoading(false);
        },
        // onComplete
        () => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, there was an error processing your question. Please try again.',
                isStreaming: false,
              }
            : msg
        )
      );
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
                        <div className="prose prose-slate dark:prose-invert max-w-none prose-sm flex-1">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 pb-3 border-b-2 border-primary/30">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-xl font-bold text-foreground mb-3 mt-5 pb-2 border-b border-border">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-lg font-semibold text-primary mb-2 mt-4">
                                  {children}
                                </h3>
                              ),
                              h4: ({ children }) => (
                                <h4 className="text-base font-semibold text-foreground mb-2 mt-3">
                                  {children}
                                </h4>
                              ),
                              p: ({ children }) => (
                                <p className="text-sm text-foreground mb-4 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="space-y-2 mb-5 ml-6 list-disc">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="space-y-3 mb-5 ml-6 list-decimal">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-sm text-foreground leading-relaxed marker:text-primary marker:font-bold pl-2">
                                  {children}
                                </li>
                              ),
                              code: ({ children, className }) => {
                                const isInline = !className
                                return isInline ? (
                                  <code className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-xs border border-primary/20">
                                    {children}
                                  </code>
                                ) : (
                                  <code className={`${className} text-sm`}>
                                  {children}
                                  </code>
                                )
                              },
                              pre: ({ children }) => (
                                <pre className="bg-muted text-foreground rounded-xl p-4 mb-4 overflow-x-auto border border-border shadow-lg">
                                  {children}
                                </pre>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-primary pl-5 py-3 my-4 bg-muted/50 text-foreground rounded-r-lg shadow-sm">
                                  <div className="flex items-start gap-2">
                                    <span className="text-primary text-xl font-bold">💡</span>
                                    <div className="flex-1">{children}</div>
                                  </div>
                                </blockquote>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto mb-4 rounded-xl border border-border shadow-md">
                                  <table className="min-w-full divide-y divide-border">
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children }) => (
                                <thead className="bg-muted">
                                  {children}
                                </thead>
                              ),
                              tbody: ({ children }) => (
                                <tbody className="bg-background divide-y divide-border">
                                  {children}
                                </tbody>
                              ),
                              tr: ({ children }) => (
                                <tr className="hover:bg-muted/50 transition-colors">
                                  {children}
                                </tr>
                              ),
                              th: ({ children }) => (
                                <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-4 py-3 text-sm text-foreground">
                                  {children}
                                </td>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-primary">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-foreground">
                                  {children}
                                </em>
                              ),
                            }}
                          >
                            {message.content || (message.isStreaming ? '...' : '')}
                          </ReactMarkdown>
                        </div>
                      </div>
                      
                      {message.references && message.references.length > 0 && (
                        <div className="space-y-3">
                          <Separator />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Quote className="h-4 w-4 text-primary" />
                              <h4 className="text-sm font-semibold text-foreground">
                                Referenced Papers
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {message.references.map((ref, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-lg border border-border bg-background"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                          <p className="text-xs font-medium text-foreground">
                                            {ref.fileName}
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => window.open(ref.fileUrl, '_blank', 'noopener,noreferrer')}
                                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                                          title="View paper"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          View
                                        </button>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        <Badge variant="secondary" className="text-xs">
                                          {ref.chunkIds.length} relevant section{ref.chunkIds.length > 1 ? 's' : ''}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
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
