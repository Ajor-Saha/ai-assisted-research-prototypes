"use client"

import { useState } from "react"
import { MessageSquare, Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useMathChatStore } from "@/store/math-chat-store"
import { MathChat } from "@/services/math-chat-service"

interface MathChatSidebarProps {
  currentChatId?: string
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
}

export function MathChatSidebar({
  currentChatId,
  onChatSelect,
  onNewChat,
}: MathChatSidebarProps) {
  const { chats, deleteChat, updateChat } = useMathChatStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)

  const handleEditStart = (chat: MathChat) => {
    setEditingId(chat.mathChatId)
    setEditTitle(chat.title)
  }

  const handleEditSave = async (chatId: string) => {
    if (editTitle.trim()) {
      await updateChat(chatId, { title: editTitle.trim() })
    }
    setEditingId(null)
    setEditTitle("")
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const handleDeleteClick = (chatId: string) => {
    setChatToDelete(chatId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (chatToDelete) {
      await deleteChat(chatToDelete)
      setChatToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-linear-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 shrink-0">
          <Button onClick={onNewChat} className="w-full bg-linear-to-r from-purple-500 via-purple-600 to-blue-600 hover:from-purple-600 hover:via-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Math Chat
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2 pb-4">
            {chats.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-500 dark:text-slate-400 text-sm">
                No math chats yet. Create one to get started!
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.mathChatId}
                  className={`group relative rounded-xl p-3 cursor-pointer transition-all ${
                    currentChatId === chat.mathChatId
                      ? "bg-linear-to-br from-purple-500 via-purple-600 to-blue-600 text-white shadow-md"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {editingId === chat.mathChatId ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleEditSave(chat.mathChatId)
                          } else if (e.key === "Escape") {
                            handleEditCancel()
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleEditSave(chat.mathChatId)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={handleEditCancel}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="flex items-start gap-2"
                        onClick={() => onChatSelect(chat.mathChatId)}
                      >
                        <MessageSquare className="h-5 w-5 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {chat.title}
                          </p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(chat.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`absolute right-2 top-2 gap-1 ${
                          currentChatId === chat.mathChatId
                            ? "flex"
                            : "hidden group-hover:flex"
                        }`}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 ${
                            currentChatId === chat.mathChatId
                              ? "hover:bg-primary-foreground/20"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditStart(chat)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 ${
                            currentChatId === chat.mathChatId
                              ? "hover:bg-primary-foreground/20"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(chat.mathChatId)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          </ScrollArea>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Math Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this math chat? This action cannot be
              undone and all messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
