'use client';

import { useEffect, useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquarePlus,
  Edit2,
  Trash2,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Chat } from '@/services/chat-service';

interface ChatSidebarProps {
  courseId: string;
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  courseId,
  currentChatId,
  onChatSelect,
  onNewChat,
}: ChatSidebarProps) {
  const { chats, fetchCourseChats, createChat, updateChat, deleteChat, isLoading } =
    useChatStore();

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseChats(courseId);
    }
  }, [courseId, fetchCourseChats]);

  const handleCreateChat = async () => {
    try {
      setCreatingChat(true);
      const newChat = await createChat({
        courseId,
        title: 'New Chat',
      });
      onChatSelect(newChat.chatId);
      onNewChat();
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleStartEdit = (chat: Chat) => {
    setEditingChatId(chat.chatId);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = async (chatId: string) => {
    if (!editTitle.trim()) return;

    try {
      await updateChat(chatId, { title: editTitle.trim() });
      setEditingChatId(null);
      setEditTitle('');
    } catch (error) {
      console.error('Failed to update chat:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleDeleteClick = (chat: Chat) => {
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;

    try {
      await deleteChat(chatToDelete.chatId);
      if (currentChatId === chatToDelete.chatId) {
        // Select the first available chat or create new one
        const remainingChats = chats.filter(c => c.chatId !== chatToDelete.chatId);
        if (remainingChats.length > 0) {
          onChatSelect(remainingChats[0].chatId);
        } else {
          handleCreateChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    } finally {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <Button
          onClick={handleCreateChat}
          disabled={creatingChat}
          className="w-full"
          size="sm"
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          {creatingChat ? 'Creating...' : 'New Chat'}
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 p-2">
        {isLoading && chats.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            Loading chats...
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No chats yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click &ldquo;New Chat&rdquo; to start
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.chatId}
                className={cn(
                  'group relative flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                  currentChatId === chat.chatId
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent'
                )}
              >
                {editingChatId === chat.chatId ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(chat.chatId);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      className="h-7 flex-1 text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSaveEdit(chat.chatId)}
                      className="h-7 w-7"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-7 w-7"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onChatSelect(chat.chatId)}
                      className="flex-1 truncate text-left text-sm"
                    >
                      {chat.title}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartEdit(chat)}
                        className="h-7 w-7"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(chat)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{chatToDelete?.title}&rdquo;? This action
              cannot be undone and all messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
