import React, { useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Outlet, useNavigate } from "react-router";
import { ChatActionEnum, useChatContext, useChatDispatchContext } from "./contexts";

const ChatLayout: React.FC = () => {
  const navigate = useNavigate();
  const { conversations, currentConversationId } = useChatContext();
  const dispatch = useChatDispatchContext();

  const handleNewChat = () => {
    dispatch({ type: ChatActionEnum.ADD_CONVERSATION });
  };

  const handleSelectConversation = (id: string) => {
    dispatch({ type: ChatActionEnum.SELECT_CONVERSATION, payload: { id } });
  };

  const handleDeleteConversation = (id: string) => {
    dispatch({ type: ChatActionEnum.DELETE_CONVERSATION, payload: { id } });
  };

  const handleEditConversation = (id: string, title: string) => {
    dispatch({
      type: ChatActionEnum.EDIT_CONVERSATION_TITLE,
      payload: { conversationId: id, title }
    });
  };

  const handleNavigateDocuments = () => {
    navigate("/documents");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Sidebar Menu */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onEditConversation={handleEditConversation}
        onOpenDocuments={handleNavigateDocuments}
        uploadedFilesCount={0}
      />

      {/* Main Content */}
      <Outlet />
    </div>
  );
};

export default ChatLayout;
