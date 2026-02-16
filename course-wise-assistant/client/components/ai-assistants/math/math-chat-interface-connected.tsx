"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, MessageSquarePlus, Upload, X, Languages, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MathChatSidebar } from "@/components/ai-assistants/math/math-chat-sidebar"
import { MathSymbolPicker } from "@/components/ai-assistants/math/math-symbol-picker"
import { useMathChatStore } from "@/store/math-chat-store"
import { streamMathAIResponse, translateContentToBangla, generateBanglaSpeech } from "@/services/math-chat-service"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { toast } from "sonner"

export function MathChatInterface() {
  const {
    currentChat,
    messages,
    isLoading,
    fetchUserChats,
    fetchChatById,
    createChat,
    addMessage,
  } = useMathChatStore()

  const [input, setInput] = useState("")
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set())
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [generatingAudioId, setGeneratingAudioId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
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
    fetchUserChats()
  }, [fetchUserChats])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  const handleChatSelect = async (chatId: string) => {
    await fetchChatById(chatId)
  }

  const handleNewChat = async () => {
    const chat = await createChat({
      title: "New Math Problem",
    })
    if (chat) {
      await fetchChatById(chat.mathChatId)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || isStreaming || !currentChat) return

    const userInput = input
    setInput("")
    setStreamingContent("")

    // Add user message to UI and database
    await addMessage(currentChat.mathChatId, {
      role: "user",
      content: userInput,
      attachments: uploadedFile ? { fileName: uploadedFile.name } : undefined,
    })

    // Clear uploaded file after sending
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Start streaming AI response
    setIsStreaming(true)

    streamMathAIResponse(
      currentChat.mathChatId,
      userInput,
      // On chunk received
      (content: string) => {
        setStreamingContent((prev) => prev + content)
      },
      // On error
      (error: string) => {
        console.error("Streaming error:", error)
        setIsStreaming(false)
        setStreamingContent("")
      },
      // On done
      () => {
        setIsStreaming(false)
        setStreamingContent("")
        // Refresh messages to get the saved response
        fetchChatById(currentChat.mathChatId)
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSymbolSelect = (symbol: string) => {
    setInput((prev) => prev + symbol)
    // Focus back on textarea after inserting symbol
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  const handleTranslate = async (messageId: string, content: string) => {
    if (translations[messageId]) {
      // Toggle back to original
      setTranslations(prev => {
        const newTranslations = { ...prev }
        delete newTranslations[messageId]
        return newTranslations
      })
      return
    }

    setTranslatingIds(prev => new Set(prev).add(messageId))

    try {
      const translatedContent = await translateContentToBangla(content)
      setTranslations(prev => ({
        ...prev,
        [messageId]: translatedContent
      }))
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setTranslatingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageId)
        return newSet
      })
    }
  }

  const handleSpeak = async (messageId: string, content: string) => {
    // If already speaking this message, stop it
    if (speakingId === messageId && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      setSpeakingId(null)
      toast.info('Speech stopped')
      return
    }

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    // Set generating state
    setGeneratingAudioId(messageId)
    toast.loading('Generating Bangla speech...', { id: 'tts-loading' })

    try {
      // Generate audio using Camb.ai API
      console.log('Requesting TTS for content length:', content.length)
      const audioUrl = await generateBanglaSpeech(content)
      console.log('Received audio URL:', audioUrl)

      toast.dismiss('tts-loading')

      // Validate the URL
      if (!audioUrl || !audioUrl.startsWith('blob:')) {
        throw new Error('Invalid audio URL received: ' + audioUrl)
      }

      // Create and play audio
      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      audioRef.current.src = audioUrl
      
      audioRef.current.onloadstart = () => {
        toast.success('Loading audio...')
      }

      audioRef.current.oncanplay = () => {
        toast.success('Speech ready! Playing...')
      }

      audioRef.current.onplay = () => {
        setSpeakingId(messageId)
        setGeneratingAudioId(null)
      }

      audioRef.current.onended = () => {
        setSpeakingId(null)
        // Clean up the blob URL
        URL.revokeObjectURL(audioUrl)
        toast.success('Speech completed')
      }

      audioRef.current.onerror = (event) => {
        console.error('Audio playback error:', {
          event,
          src: audioRef.current?.src,
          error: audioRef.current?.error,
          networkState: audioRef.current?.networkState,
          readyState: audioRef.current?.readyState
        })
        
        setSpeakingId(null)
        setGeneratingAudioId(null)
        URL.revokeObjectURL(audioUrl)
        
        // Provide more specific error message based on error code
        const mediaError = audioRef.current?.error
        let errorMessage = 'Failed to play audio'
        
        if (mediaError) {
          switch (mediaError.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = 'Audio playback was aborted'
              break
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading audio'
              break
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'Audio format not supported or file corrupted'
              break
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Audio source not supported'
              break
            default:
              errorMessage = `Audio error: ${mediaError.message || 'Unknown error'}`
          }
        }
        
        toast.error(errorMessage)
      }

      // Attempt to play
      const playPromise = audioRef.current.play()
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Play promise rejected:', error)
          toast.error(`Cannot play audio: ${error.message}`)
          setSpeakingId(null)
          setGeneratingAudioId(null)
          URL.revokeObjectURL(audioUrl)
        })
      }
      
    } catch (error: unknown) {
      console.error('Error generating speech:', error)
      toast.dismiss('tts-loading')
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check for specific error types
      if (errorMessage.includes('500 characters')) {
        toast.error('Text too long. Only first 500 characters will be spoken.', {
          duration: 5000
        })
      } else if (errorMessage.includes('empty audio')) {
        toast.error('Received empty audio file. Please try again.')
      } else if (errorMessage.includes('No audio data')) {
        toast.error('No audio data received. Please check your connection.')
      } else {
        toast.error(errorMessage || 'Failed to generate speech. Please try again.')
      }
      
      setSpeakingId(null)
      setGeneratingAudioId(null)
    }
  }

  return (
    <div className="flex h-full bg-linear-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-slate-900 dark:to-purple-950">
      {/* Chat Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shrink-0 h-full overflow-hidden">
        <MathChatSidebar
          currentChatId={currentChat?.mathChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Chat Messages Area */}
      <div className="flex flex-col flex-1 h-full">
        {currentChat ? (
          <>
            <div className="flex-1 overflow-hidden">
              <ScrollArea ref={scrollAreaRef} className="h-full">
                <div className="p-6">
                  <div className="space-y-6 max-w-4xl mx-auto pb-4">
                {messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-10 w-10 border-2 border-purple-500 shadow-lg">
                        <AvatarFallback className="bg-linear-to-br from-purple-500 via-purple-600 to-blue-600 text-white">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div
                        className={`rounded-2xl px-5 py-4 shadow-md transition-all hover:shadow-lg ${
                          message.role === "user"
                            ? "bg-linear-to-br from-blue-500 via-blue-600 to-purple-600 text-white"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {message.role === "user" ? (
                          <>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">
                              {message.content}
                            </p>
                            {message.attachments && (
                              <Badge variant="secondary" className="mt-3 bg-white/20 text-white border-white/30 hover:bg-white/30">
                                <Upload className="h-3 w-3 mr-1" />
                                File attached
                              </Badge>
                            )}
                          </>
                        ) : (
                          <div className="prose prose-slate dark:prose-invert max-w-none prose-sm">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-2xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 mt-6 pb-3 border-b-2 border-purple-300 dark:border-purple-700">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 mt-5 pb-2 border-b border-slate-300 dark:border-slate-600">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2 mt-4">
                                    {children}
                                  </h3>
                                ),
                                h4: ({ children }) => (
                                  <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-3">
                                    {children}
                                  </h4>
                                ),
                                p: ({ children }) => (
                                  <p className="text-base text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
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
                                  <li className="text-base text-slate-700 dark:text-slate-300 leading-relaxed marker:text-purple-600 dark:marker:text-purple-400 marker:font-bold pl-2">
                                    {children}
                                  </li>
                                ),
                                code: ({ children, className }) => {
                                  const isInline = !className
                                  return isInline ? (
                                    <code className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-mono text-[13px] border border-purple-200 dark:border-purple-800">
                                      {children}
                                    </code>
                                  ) : (
                                    <code className={`${className} text-sm`}>
                                    {children}
                                    </code>
                                  )
                                },
                                pre: ({ children }) => (
                                  <pre className="bg-linear-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-slate-100 rounded-xl p-4 mb-4 overflow-x-auto border border-slate-700 shadow-lg">
                                    {children}
                                  </pre>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-purple-500 dark:border-purple-400 pl-5 py-3 my-4 bg-linear-to-r from-purple-50 via-purple-50 to-blue-50 dark:from-purple-950/30 dark:via-purple-950/30 dark:to-blue-950/30 text-slate-700 dark:text-slate-300 rounded-r-lg shadow-sm">
                                    <div className="flex items-start gap-2">
                                      <span className="text-purple-500 dark:text-purple-400 text-xl font-bold">💡</span>
                                      <div className="flex-1">{children}</div>
                                    </div>
                                  </blockquote>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto mb-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="bg-linear-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50">
                                    {children}
                                  </thead>
                                ),
                                tbody: ({ children }) => (
                                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {children}
                                  </tbody>
                                ),
                                tr: ({ children }) => (
                                  <tr className="hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
                                    {children}
                                  </tr>
                                ),
                                th: ({ children }) => (
                                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                    {children}
                                  </td>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-bold text-purple-700 dark:text-purple-300">
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic text-slate-700 dark:text-slate-300">
                                    {children}
                                  </em>
                                ),
                              }}
                            >
                              {translations[message.messageId] || message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 gap-2">
                          <p className="text-xs opacity-60 font-medium">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                          {message.role === "assistant" && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTranslate(message.messageId, message.content)}
                                disabled={translatingIds.has(message.messageId)}
                                className="h-7 px-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400"
                              >
                                {translatingIds.has(message.messageId) ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Languages className={`h-3.5 w-3.5 ${translations[message.messageId] ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                                )}
                                <span className="ml-1.5 text-xs font-medium">
                                  {translations[message.messageId] ? 'বাংলা' : 'Translate'}
                                </span>
                              </Button>
                              {translations[message.messageId] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSpeak(message.messageId, translations[message.messageId])}
                                  disabled={generatingAudioId === message.messageId}
                                  className="h-7 px-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                                  title={
                                    generatingAudioId === message.messageId
                                      ? 'Generating audio...'
                                      : speakingId === message.messageId
                                      ? 'Stop speaking'
                                      : 'Speak in Bangla'
                                  }
                                >
                                  {generatingAudioId === message.messageId ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : speakingId === message.messageId ? (
                                    <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                                  ) : (
                                    <Volume2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-10 w-10 border-2 border-blue-500 shadow-lg">
                        <AvatarFallback className="bg-linear-to-br from-blue-500 via-cyan-500 to-teal-500 text-white">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {/* Streaming Response */}
                {isStreaming && streamingContent && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-10 w-10 border-2 border-purple-500 shadow-lg">
                      <AvatarFallback className="bg-linear-to-br from-purple-500 via-purple-600 to-blue-600 text-white">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div className="rounded-2xl px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                        <div className="prose prose-slate dark:prose-invert max-w-none prose-sm">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {streamingContent}
                          </ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            Solving step by step...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(isLoading || isStreaming) && !streamingContent && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-10 w-10 border-2 border-purple-500 shadow-lg">
                      <AvatarFallback className="bg-linear-to-br from-purple-500 via-purple-600 to-blue-600 text-white">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                )}
                  </div>
                </div>
              </ScrollArea>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                {uploadedFile && (
                  <div className="mb-3 flex items-center gap-3 p-3 bg-linear-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Upload className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm flex-1 truncate font-medium text-slate-700 dark:text-slate-300">
                      {uploadedFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isStreaming}
                      title="Upload file"
                      className="h-11 w-11 border-2 border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all"
                    >
                      <Upload className="h-5 w-5" />
                    </Button>
                    <MathSymbolPicker onSymbolSelect={handleSymbolSelect} />
                  </div>
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a math question or upload an image..."
                    className="min-h-22 max-h-32 border-2 border-slate-300 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-xl resize-none text-sm"
                    disabled={isLoading || isStreaming}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || isStreaming || !input.trim()}
                    className="h-11 w-11 bg-linear-to-br from-purple-500 via-purple-600 to-blue-600 hover:from-purple-600 hover:via-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading || isStreaming ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 ml-1">
                  Press <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">Enter</kbd> to send, <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">Shift+Enter</kbd> for new line
                </p>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-purple-500 via-purple-600 to-blue-600 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              <div className="relative bg-linear-to-br from-purple-500 via-purple-600 to-blue-600 p-6 rounded-3xl shadow-2xl">
                <MessageSquarePlus className="h-16 w-16 text-white" />
              </div>
            </div>
            <div className="text-center space-y-3 max-w-lg">
              <h1 className="text-3xl font-bold bg-linear-to-r from-purple-600 via-purple-700 to-blue-600 bg-clip-text text-transparent">
                Math Assistant AI
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Get step-by-step solutions to math problems with detailed explanations,
                visualizations, and interactive learning support
              </p>
            </div>
            <div className="flex flex-col gap-3 items-center">
              <Button 
                onClick={handleNewChat} 
                size="lg"
                className="bg-linear-to-r from-purple-500 via-purple-600 to-blue-600 hover:from-purple-600 hover:via-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 px-8 py-6 text-base"
              >
                <MessageSquarePlus className="h-5 w-5 mr-2" />
                Start Solving Math Problems
              </Button>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>AI Powered</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Step-by-Step</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>24/7 Available</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
