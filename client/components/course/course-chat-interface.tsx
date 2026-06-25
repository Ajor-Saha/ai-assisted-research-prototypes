"use client"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageSquarePlus,
  FileText,
  Sparkles,
  Clock,
  PanelLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { ChatSidebar } from "@/components/course/chat-sidebar"
import { useChatStore } from "@/store/chat-store"
import { streamAIResponse, MaterialReference } from "@/services/chat-service"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface CourseChatInterfaceProps {
  courseId: string
  courseName: string
}

export function CourseChatInterface({ courseId, courseName }: CourseChatInterfaceProps) {
  const { 
    currentChat, 
    messages, 
    isLoading, 
    fetchCourseChats, 
    fetchChatById, 
    createChat, 
    addMessage 
  } = useChatStore()

  // Helper function to get material view URL
  const getMaterialViewUrl = (materialId: string) => {
    const baseURL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000'
    return `${baseURL}/api/materials/${materialId}/view`
  }
  
  const [input, setInput] = useState("")
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentReferences, setCurrentReferences] = useState<MaterialReference[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  // Load chats when component mounts
  useEffect(() => {
    fetchCourseChats(courseId)
  }, [courseId, fetchCourseChats])

  const handleChatSelect = async (chatId: string) => {
    await fetchChatById(chatId)
  }

  const handleNewChat = async () => {
    const chat = await createChat({
      courseId,
      title: "New Chat"
    })
    if (chat) {
      await fetchChatById(chat.chatId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || isStreaming || !currentChat) return

    const userInput = input
    setInput("")
    setStreamingContent("")
    setCurrentReferences([])

    // Add user message to UI and database
    await addMessage(currentChat.chatId, {
      role: "user",
      content: userInput
    })

    // Start streaming AI response
    setIsStreaming(true)

    streamAIResponse(
      currentChat.chatId,
      userInput,
      // On chunk received
      (content: string) => {
        setStreamingContent((prev) => prev + content)
      },
      // On references received
      (references: MaterialReference[]) => {
        setCurrentReferences(references)
      },
      // On error
      (error: string) => {
        console.error('Streaming error:', error)
        setIsStreaming(false)
        setStreamingContent("")
      },
      // On done
      () => {
        setIsStreaming(false)
        setStreamingContent("")
        // Refresh messages to get the saved response
        fetchChatById(currentChat.chatId)
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-full">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 border-r shrink-0">
        <ChatSidebar
          courseId={courseId}
          currentChatId={currentChat?.chatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Mobile Sidebar - Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetTitle className="sr-only">Chat History</SheetTitle>
          <ChatSidebar
            courseId={courseId}
            currentChatId={currentChat?.chatId}
            onChatSelect={(chatId) => {
              handleChatSelect(chatId)
              setMobileSidebarOpen(false)
            }}
            onNewChat={() => {
              handleNewChat()
              setMobileSidebarOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Chat Messages Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {currentChat ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
              <div className="flex items-center gap-3">
                <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden shrink-0">
                      <PanelLeft className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                </Sheet>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{currentChat.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{courseName}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs gap-1">
                  <Clock className="h-3 w-3" />
                  {messages.length} {messages.length === 1 ? "message" : "messages"}
                </Badge>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden shrink-0"
                  onClick={handleNewChat}
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea ref={scrollAreaRef} className="flex-1">
              <div className="p-4 sm:p-6">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.map((message) => {
                    const references = message.attachments && typeof message.attachments === "object" && "references" in message.attachments
                      ? (message.attachments.references as MaterialReference[])
                      : [];

                    return (
                      <div
                        key={message.messageId}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <Avatar className="h-9 w-9 border-2 border-primary/20 shrink-0">
                            <AvatarFallback className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col gap-2 max-w-[85%] sm:max-w-[80%]">
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-sm ${
                              message.role === "user"
                                ? "bg-linear-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            {message.role === "user" ? (
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            ) : (
                              <div className="prose prose-slate dark:prose-invert max-w-none prose-sm">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({ children }) => (
                                      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                                        {children}
                                      </h1>
                                    ),
                                    h2: ({ children }) => (
                                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-5 pb-1 border-b border-gray-200 dark:border-gray-700">
                                        {children}
                                      </h2>
                                    ),
                                    h3: ({ children }) => (
                                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4">
                                        {children}
                                      </h3>
                                    ),
                                    h4: ({ children }) => (
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-3">
                                        {children}
                                      </h4>
                                    ),
                                    p: ({ children }) => (
                                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                                        {children}
                                      </p>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="space-y-2 mb-4 ml-4">
                                        {children}
                                      </ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="space-y-2 mb-4 ml-4 list-decimal">
                                        {children}
                                      </ol>
                                    ),
                                    li: ({ children, className }) => {
                                      const isTaskList = className?.includes("task-list-item")
                                      return (
                                        <li
                                          className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed ${
                                            isTaskList ? "list-none flex items-start gap-2" : "ml-4 marker:text-gray-500 dark:marker:text-gray-400"
                                          }`}
                                        >
                                          {children}
                                        </li>
                                      )
                                    },
                                    input: ({ type, checked, disabled }) => {
                                      if (type === "checkbox") {
                                        return (
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={disabled}
                                            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            readOnly
                                          />
                                        )
                                      }
                                      return <input type={type} />
                                    },
                                    a: ({ href, children }) => (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 font-medium"
                                      >
                                        {children}
                                      </a>
                                    ),
                                    code: ({ children, className }) => {
                                      const isInline = !className
                                      return isInline ? (
                                        <code className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[13px] font-mono border border-blue-200 dark:border-blue-800">
                                          {children}
                                        </code>
                                      ) : (
                                        <code className={`${className} text-sm`}>{children}</code>
                                      )
                                    },
                                    pre: ({ children }) => (
                                      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg p-4 mb-4 overflow-x-auto border border-gray-700 dark:border-gray-800 shadow-sm">
                                        {children}
                                      </pre>
                                    ),
                                    blockquote: ({ children }) => (
                                      <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 mb-4 bg-blue-50/50 dark:bg-blue-950/20 text-gray-700 dark:text-gray-300 italic rounded-r">
                                        {children}
                                      </blockquote>
                                    ),
                                    table: ({ children }) => (
                                      <div className="overflow-x-auto mb-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                          {children}
                                        </table>
                                      </div>
                                    ),
                                    thead: ({ children }) => (
                                      <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>
                                    ),
                                    tbody: ({ children }) => (
                                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {children}
                                      </tbody>
                                    ),
                                    tr: ({ children }) => (
                                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        {children}
                                      </tr>
                                    ),
                                    th: ({ children }) => (
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        {children}
                                      </th>
                                    ),
                                    td: ({ children }) => (
                                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                        {children}
                                      </td>
                                    ),
                                    hr: () => (
                                      <hr className="my-6 border-t border-gray-300 dark:border-gray-700" />
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-semibold text-gray-900 dark:text-gray-100">
                                        {children}
                                      </strong>
                                    ),
                                    em: ({ children }) => (
                                      <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
                                    ),
                                    del: ({ children }) => (
                                      <del className="line-through text-gray-500 dark:text-gray-400">
                                        {children}
                                      </del>
                                    ),
                                    img: ({ src, alt }) => (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={src}
                                        alt={alt || ""}
                                        className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 my-4"
                                      />
                                    ),
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )}
                            <p className="text-xs opacity-60 mt-1">
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>

                          {/* Material References */}
                          {message.role === "assistant" && references.length > 0 && (
                            <Card className="p-3 bg-background/50 border-primary/20">
                              <div className="flex items-start gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold mb-2 text-foreground">Referenced Materials</p>
                                  <div className="space-y-1.5">
                                    {references.map((ref) => (
                                      <button
                                        key={ref.materialId}
                                        onClick={() => window.open(getMaterialViewUrl(ref.materialId), "_blank", "noopener,noreferrer")}
                                        className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer group"
                                      >
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                          {ref.materialName}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
                                          {ref.fileName}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          )}
                        </div>
                        {message.role === "user" && (
                          <Avatar className="h-9 w-9 border-2 border-primary/20 shrink-0">
                            <AvatarFallback className="bg-muted-foreground text-muted-foreground">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )
                  })}

                  {/* Streaming Response */}
                  {isStreaming && streamingContent && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-9 w-9 border-2 border-primary/20 shrink-0">
                        <AvatarFallback className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2 max-w-[85%] sm:max-w-[80%]">
                        <div className="rounded-2xl px-4 py-3 bg-muted rounded-bl-md shadow-sm">
                          <div className="prose prose-slate dark:prose-invert max-w-none prose-sm">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-5 pb-1 border-b border-gray-200 dark:border-gray-700">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4">
                                    {children}
                                  </h3>
                                ),
                                h4: ({ children }) => (
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-3">
                                    {children}
                                  </h4>
                                ),
                                p: ({ children }) => (
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                                    {children}
                                  </p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="space-y-2 mb-4 ml-4">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="space-y-2 mb-4 ml-4 list-decimal">{children}</ol>
                                ),
                                li: ({ children, className }) => {
                                  const isTaskList = className?.includes("task-list-item")
                                  return (
                                    <li
                                      className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed ${
                                        isTaskList ? "list-none flex items-start gap-2" : "ml-4 marker:text-gray-500 dark:marker:text-gray-400"
                                      }`}
                                    >
                                      {children}
                                    </li>
                                  )
                                },
                                input: ({ type, checked, disabled }) => {
                                  if (type === "checkbox") {
                                    return (
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={disabled}
                                        className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        readOnly
                                      />
                                    )
                                  }
                                  return <input type={type} />
                                },
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 font-medium"
                                  >
                                    {children}
                                  </a>
                                ),
                                code: ({ children, className }) => {
                                  const isInline = !className
                                  return isInline ? (
                                    <code className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[13px] font-mono border border-blue-200 dark:border-blue-800">
                                      {children}
                                    </code>
                                  ) : (
                                    <code className={`${className} text-sm`}>{children}</code>
                                  )
                                },
                                pre: ({ children }) => (
                                  <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg p-4 mb-4 overflow-x-auto border border-gray-700 dark:border-gray-800 shadow-sm">
                                    {children}
                                  </pre>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 mb-4 bg-blue-50/50 dark:bg-blue-950/20 text-gray-700 dark:text-gray-300 italic rounded-r">
                                    {children}
                                  </blockquote>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto mb-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>
                                ),
                                tbody: ({ children }) => (
                                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {children}
                                  </tbody>
                                ),
                                tr: ({ children }) => (
                                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    {children}
                                  </tr>
                                ),
                                th: ({ children }) => (
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                    {children}
                                  </td>
                                ),
                                hr: () => (
                                  <hr className="my-6 border-t border-gray-300 dark:border-gray-700" />
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-gray-900 dark:text-gray-100">
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
                                ),
                                del: ({ children }) => (
                                  <del className="line-through text-gray-500 dark:text-gray-400">
                                    {children}
                                  </del>
                                ),
                                img: ({ src, alt }) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={src}
                                    alt={alt || ""}
                                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 my-4"
                                  />
                                ),
                              }}
                            >
                              {streamingContent}
                            </ReactMarkdown>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-xs">Generating response…</span>
                          </div>
                        </div>
                        {/* Show references during streaming */}
                        {currentReferences.length > 0 && (
                          <Card className="p-3 bg-background/50 border-primary/20">
                            <div className="flex items-start gap-2 mb-2">
                              <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold mb-2 text-foreground">Referenced Materials</p>
                                <div className="space-y-1.5">
                                  {currentReferences.map((ref) => (
                                    <button
                                      key={ref.materialId}
                                      onClick={() => window.open(getMaterialViewUrl(ref.materialId), "_blank", "noopener,noreferrer")}
                                      className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer group"
                                    >
                                      <Badge variant="secondary" className="text-xs shrink-0">
                                        {ref.materialName}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
                                        {ref.fileName}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}

                  {(isLoading || isStreaming) && !streamingContent && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-9 w-9 border-2 border-primary/20 shrink-0">
                        <AvatarFallback className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-2xl px-4 py-3 bg-muted rounded-bl-md shadow-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 p-4">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask me anything about ${courseName}...`}
                    className="min-h-15 max-h-37.5 pr-12 resize-none rounded-xl border-2 focus:border-primary transition-colors"
                    disabled={isLoading || isStreaming}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || isStreaming || !input.trim()}
                    className="absolute right-2 bottom-2 h-9 w-9 rounded-lg shadow-sm"
                  >
                    {(isLoading || isStreaming) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
            <div className="p-6 rounded-full bg-linear-to-br from-primary/10 to-primary/5">
              <MessageSquarePlus className="h-16 w-16 text-primary" />
            </div>
            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-xl font-bold">Start a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Select an existing chat or create a new one to start asking questions about {courseName}
              </p>
            </div>
            <Button onClick={handleNewChat} size="lg" className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Create New Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
