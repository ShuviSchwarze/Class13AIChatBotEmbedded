import React, { useState } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  X,
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Search,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Code2
} from "lucide-react";
import { cn } from "./ui/utils";

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onEditConversation: (id: string, title: string) => void;
  onOpenDocuments: () => void;
  uploadedFilesCount: number;
}

export function Sidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onEditConversation,
  onOpenDocuments,
  uploadedFilesCount
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by date
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groupedConversations = {
    today: filteredConversations.filter(c => c.timestamp.toDateString() === today.toDateString()),
    yesterday: filteredConversations.filter(
      c => c.timestamp.toDateString() === yesterday.toDateString()
    ),
    lastWeek: filteredConversations.filter(
      c =>
        c.timestamp > lastWeek &&
        c.timestamp.toDateString() !== today.toDateString() &&
        c.timestamp.toDateString() !== yesterday.toDateString()
    ),
    older: filteredConversations.filter(c => c.timestamp <= lastWeek)
  };

  if (collapsed) {
    return (
      <div className="w-16 h-screen bg-slate-900 dark:bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <ChevronRight className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <Plus className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenDocuments}
          className="text-slate-300 hover:text-white hover:bg-slate-800 relative"
        >
          <FolderOpen className="size-5" />
          {uploadedFilesCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs"
            >
              {uploadedFilesCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 h-screen bg-slate-900 dark:bg-slate-950 border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded">
            <Code2 className="size-4 text-white" />
          </div>
          <span className="text-sm text-white">Embedded Dev</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(true)}
          className="size-8 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
        >
          <Plus className="size-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 pb-4">
          {/* Today */}
          {groupedConversations.today.length > 0 && (
            <div>
              <h3 className="px-3 py-1 text-xs text-slate-400 uppercase tracking-wider">Today</h3>
              <div className="space-y-1">
                {groupedConversations.today.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === currentConversationId}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                    onEditTitle={onEditConversation}
                    isEditing={editingId === conversation.id}
                    onEdit={setEditingId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groupedConversations.yesterday.length > 0 && (
            <div>
              <h3 className="px-3 py-1 text-xs text-slate-400 uppercase tracking-wider">
                Yesterday
              </h3>
              <div className="space-y-1">
                {groupedConversations.yesterday.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === currentConversationId}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                    onEditTitle={onEditConversation}
                    isEditing={editingId === conversation.id}
                    onEdit={setEditingId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Last 7 Days */}
          {groupedConversations.lastWeek.length > 0 && (
            <div>
              <h3 className="px-3 py-1 text-xs text-slate-400 uppercase tracking-wider">
                Previous 7 Days
              </h3>
              <div className="space-y-1">
                {groupedConversations.lastWeek.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === currentConversationId}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                    onEditTitle={onEditConversation}
                    isEditing={editingId === conversation.id}
                    onEdit={setEditingId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Older */}
          {groupedConversations.older.length > 0 && (
            <div>
              <h3 className="px-3 py-1 text-xs text-slate-400 uppercase tracking-wider">Older</h3>
              <div className="space-y-1">
                {groupedConversations.older.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === currentConversationId}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                    onEditTitle={onEditConversation}
                    isEditing={editingId === conversation.id}
                    onEdit={setEditingId}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredConversations.length === 0 && (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="size-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm text-slate-500">No conversations</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <Button
          variant="ghost"
          onClick={onOpenDocuments}
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <FolderOpen className="size-4" />
          Documents
          {uploadedFilesCount > 0 && (
            <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-200">
              {uploadedFilesCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTitle: (id: string, title: string) => void;
  isEditing: boolean;
  onEdit: (id: string | null) => void;
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onEditTitle,
  isEditing,
  onEdit
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue !== conversation.title) {
      onEditTitle(conversation.id, editValue.trim());
    }
    onEdit(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setEditValue(conversation.title);
      onEdit(null);
    }
  };

  const handleStartEdit = () => {
    setEditValue(conversation.title);
    onEdit(conversation.id);
  };

  return (
    <div
      className={cn(
        "group rounded-lg transition-colors overflow-hidden w-60",
        isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/50",
        isEditing ? "cursor-default" : "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isEditing && onSelect(conversation.id)}
    >
      <div className="flex items-center px-3 py-2 max-w-full">
        <div className="w-5 shrink-0 flex justify-start">
          <MessageSquare className="size-4" />
        </div>

        {isEditing ? (
          <input
            className="flex-1 text-sm ml-2 mr-2 min-w-0 bg-transparent border border-slate-600 rounded px-1 h-5 leading-none focus:outline-none focus:border-blue-500 text-inherit"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyPress}
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate ml-2 mr-2 min-w-0 h-5 leading-none flex items-center">
            {conversation.title}
          </span>
        )}

        <div
          className={cn(
            "w-12 shrink-0 flex items-center gap-0.5 justify-end transition-opacity duration-200",
            isHovered || isActive ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={e => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-5 hover:bg-slate-700"
            onClick={handleStartEdit}
          >
            <Edit2 className="size-3 text-slate-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 hover:bg-slate-700"
            onClick={() => onDelete(conversation.id)}
          >
            <Trash2 className="size-3 text-red-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}
