import React, { createContext, useContext, useReducer } from "react";
import { Conversation, Message } from "../../../types";

export enum ChatActionEnum {
  ADD_CONVERSATION = "ADD_CONVERSATION",
  DELETE_CONVERSATION = "DELETE_CONVERSATION",
  SELECT_CONVERSATION = "SELECT_CONVERSATION",
  ADD_MESSAGE = "ADD_MESSAGE",
  UPDATE_CONVERSATION = "UPDATE_CONVERSATION",
  REPLACE_LAST_MESSAGE = "REPLACE_LAST_MESSAGE",
  EDIT_CONVERSATION_TITLE = "EDIT_CONVERSATION_TITLE"
}

type ChatState = {
  conversations: Conversation[];
  currentConversationId: string;
};

type AddConversationAction = {
  type: ChatActionEnum.ADD_CONVERSATION;
};

type DeleteConversationAction = {
  type: ChatActionEnum.DELETE_CONVERSATION;
  payload: { id: string };
};

type SelectConversationAction = {
  type: ChatActionEnum.SELECT_CONVERSATION;
  payload: { id: string };
};

type AddMessageAction = {
  type: ChatActionEnum.ADD_MESSAGE;
  payload: { conversationId: string; message: Message };
};

type UpdateConversationAction = {
  type: ChatActionEnum.UPDATE_CONVERSATION;
  payload: { conversationId: string; updates: Partial<Conversation> };
};

type ReplaceLastMessageAction = {
  type: ChatActionEnum.REPLACE_LAST_MESSAGE;
  payload: { conversationId: string; message: Message };
};

type EditConversationTitleAction = {
  type: ChatActionEnum.EDIT_CONVERSATION_TITLE;
  payload: { conversationId: string; title: string };
};

type ChatAction =
  | AddConversationAction
  | DeleteConversationAction
  | SelectConversationAction
  | AddMessageAction
  | UpdateConversationAction
  | ReplaceLastMessageAction
  | EditConversationTitleAction;

const ChatContext = createContext<ChatState | null>(null);
const ChatDispatchContext = createContext<React.Dispatch<ChatAction> | null>(null);

const initialState: ChatState = {
  conversations: [
    {
      id: "1",
      title: "Chat mới",
      lastMessage: "Xin chào!",
      timestamp: new Date(),
      messages: [
        {
          id: "1",
          type: "bot",
          content:
            "Xin chào! Tôi là AI Assistant dành cho embedded developers. Tôi có thể giúp bạn về lập trình, debugging, và các vấn đề kỹ thuật. Bạn có thể gửi tin nhắn văn bản, ghi âm giọng nói, hoặc upload file code để tôi phân tích.",
          timestamp: new Date()
        }
      ]
    }
  ],
  currentConversationId: "1"
};

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case ChatActionEnum.ADD_CONVERSATION:
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: `Chat ${state.conversations.length + 1}`,
        lastMessage: "Đã tạo chat mới",
        timestamp: new Date(),
        messages: [
          {
            id: Date.now().toString(),
            type: "bot",
            content: "Đã tạo chat mới. Tôi có thể giúp gì cho bạn?",
            timestamp: new Date()
          }
        ]
      };

      return {
        ...state,
        conversations: [...state.conversations, newConversation],
        currentConversationId: newConversation.id
      };

    case ChatActionEnum.DELETE_CONVERSATION:
      const updatedConversations = state.conversations.filter(c => c.id !== action.payload.id);
      let newCurrentId = state.currentConversationId;

      // If deleting current conversation, switch to another one
      if (action.payload.id === state.currentConversationId) {
        if (updatedConversations.length > 0) {
          newCurrentId = updatedConversations[0].id;
        } else {
          // Create a new conversation if no conversations left
          const newConversation: Conversation = {
            id: Date.now().toString(),
            title: `Chat ${state.conversations.length + 1}`,
            lastMessage: "Đã tạo chat mới",
            timestamp: new Date(),
            messages: [
              {
                id: Date.now().toString(),
                type: "bot",
                content: "Đã tạo chat mới. Tôi có thể giúp gì cho bạn?",
                timestamp: new Date()
              }
            ]
          };
          newCurrentId = newConversation.id;
          updatedConversations.push(newConversation);
        }
      }

      return {
        ...state,
        conversations: updatedConversations,
        currentConversationId: newCurrentId
      };

    case ChatActionEnum.SELECT_CONVERSATION:
      return {
        ...state,
        currentConversationId: action.payload.id
      };

    case ChatActionEnum.ADD_MESSAGE:
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload.conversationId
            ? {
                ...c,
                messages: [...c.messages, action.payload.message],
                lastMessage: action.payload.message.content.substring(0, 50),
                timestamp: new Date(),
                // Update title if it's the first user message
                title:
                  action.payload.message.type === "user" &&
                  !c.messages.some(msg => msg.type === "user")
                    ? action.payload.message.content.substring(0, 30) + "..."
                    : c.title
              }
            : c
        )
      };

    case ChatActionEnum.UPDATE_CONVERSATION:
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload.conversationId ? { ...c, ...action.payload.updates } : c
        )
      };

    case ChatActionEnum.REPLACE_LAST_MESSAGE:
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload.conversationId
            ? {
                ...c,
                messages: [
                  ...c.messages.slice(0, -1), // Remove last message
                  action.payload.message // Add new message
                ],
                lastMessage: action.payload.message.content.substring(0, 50),
                timestamp: new Date()
              }
            : c
        )
      };

    case ChatActionEnum.EDIT_CONVERSATION_TITLE:
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload.conversationId ? { ...c, title: action.payload.title } : c
        )
      };

    default:
      return state;
  }
};

type ChatProviderProps = {
  children?: React.ReactNode;
};

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <ChatContext.Provider value={state}>
      <ChatDispatchContext.Provider value={dispatch}>{children}</ChatDispatchContext.Provider>
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatState => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

export const useChatDispatchContext = (): React.Dispatch<ChatAction> => {
  const context = useContext(ChatDispatchContext);
  if (!context) {
    throw new Error("useChatDispatchContext must be used within a ChatProvider");
  }
  return context;
};
