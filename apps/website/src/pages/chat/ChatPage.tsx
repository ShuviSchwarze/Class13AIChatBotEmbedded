import React, { Fragment, useEffect, useRef, useState } from "react";
import { Card } from "../../components/ui/card";
import { Code2 } from "lucide-react";
import { ChatActionEnum, useChatContext, useChatDispatchContext } from "./contexts";
import { ScrollArea } from "../../components/ui/scroll-area";
import { ChatMessage } from "../../components/ChatMessage";
import { ChatInput } from "../../components/ChatInput";
import { API_ROOT } from "../../config";
import { PdfViewer } from "../../components/PdfViewer";
import { Message } from "../../types";
import { getBotResponse } from "../../utils";

const ChatPage: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { conversations, currentConversationId } = useChatContext();
  const dispatch = useChatDispatchContext();
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerConfig, setPdfViewerConfig] = useState<{
    url: string;
    page?: number;
    searchText?: string;
  } | null>(null);
  // track pending bot responses per conversation to avoid duplicate sends/placeholders
  const [pendingResponses, setPendingResponses] = useState<Record<string, boolean>>({});
  const pendingResponsesRef = useRef<Record<string, boolean>>({});
  const prevConversationIdRef = useRef<string | null>(currentConversationId);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
    };

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [
    currentConversation?.messages // Scroll when messages change
  ]);

  useEffect(() => {
    const scrollToBottomInstant = () => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "auto",
        block: "end"
      });
    };

    // Check if conversation actually changed
    if (prevConversationIdRef.current !== currentConversationId) {
      scrollToBottomInstant();
      prevConversationIdRef.current = currentConversationId;
    }
  }, [currentConversationId]);

  const handleOpenPdf = (source: string, page?: number, searchText?: string) => {
    // Extract just the filename from the source path (e.g., "document_source/file.pdf" -> "file.pdf")
    const filename = source.split("/").pop() || source.split("\\").pop() || source;
    const pdfUrl = `${API_ROOT}/api/v1/files/view/${encodeURIComponent(filename)}`;
    console.log("Opening PDF:", { source, filename, pdfUrl, page, searchText });

    // Build URL with query parameters for PDF viewer page
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      url: encodeURIComponent(pdfUrl),
      page: (page || 1).toString()
    });

    if (searchText) {
      params.set("search", searchText);
    }

    // Open PDF viewer in a new tab
    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, "_blank");
  };

  const handleClosePdf = () => {
    setPdfViewerOpen(false);
    setPdfViewerConfig(null);
  };

  const handleSelectTopic = (topic: string) => {
    const topicMessages: Record<string, string> = {
      Microcontrollers:
        "Bạn muốn tìm hiểu về microcontrollers nào? Tôi có thể giúp bạn về ARM Cortex-M, AVR (Arduino), ESP32, STM32, PIC, và nhiều dòng khác. Hỏi tôi về architecture, peripherals, programming, hoặc các vấn đề cụ thể!",
      "Communication Protocols":
        "Communication protocols là nền tảng của embedded systems. Tôi có thể giúp bạn về:\n- UART/USART: Serial communication\n- I2C: Multi-device bus\n- SPI: High-speed peripheral interface\n- CAN: Automotive & industrial\n- USB, Ethernet, Modbus\n\nBạn đang gặp vấn đề với protocol nào?",
      "GPIO & Interrupts":
        "GPIO và Interrupts là cơ bản nhất của embedded programming:\n- Cấu hình GPIO (input/output, pull-up/down)\n- Interrupt handling và ISR\n- External interrupts vs internal\n- Priority và nested interrupts\n- Debouncing và noise filtering\n\nBạn cần giúp gì?",
      "Timers & PWM":
        "Timers và PWM rất quan trọng cho real-time control:\n- Hardware timers configuration\n- PWM generation cho motor control, LED dimming\n- Input capture và output compare\n- Watchdog timers\n- RTC (Real-time clock)\n\nBạn đang làm project gì?",
      "Power Management":
        "Power management quan trọng cho battery-powered devices:\n- Sleep modes (light sleep, deep sleep)\n- Clock gating và frequency scaling\n- Wake-up sources\n- Low-power peripherals\n- Power consumption optimization\n\nCần tối ưu điện năng cho project nào?",
      "RTOS & Threading":
        "RTOS giúp quản lý multi-tasking:\n- FreeRTOS basics\n- Task creation và scheduling\n- Semaphores, Mutexes, Queues\n- Inter-task communication\n- Priority inversion và deadlock\n\nBạn đang dùng RTOS nào?"
    };

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: `Tìm hiểu về ${topic}`,
      timestamp: new Date()
    };

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      content: topicMessages[topic] || `Đây là thông tin về ${topic}.`,
      timestamp: new Date()
    };

    dispatch({
      type: ChatActionEnum.UPDATE_CONVERSATION,
      payload: {
        conversationId: currentConversationId!,
        updates: {
          messages: [...currentConversation!.messages, userMessage, botMessage],
          lastMessage: userMessage.content,
          timestamp: new Date()
        }
      }
    });
  };

  const handleSendMessage = (content: string, file?: File) => {
    if (!currentConversationId) return;
    // If we're already waiting for a bot response for this conversation, ignore additional sends
    if (pendingResponsesRef.current[currentConversationId]) return;
    // Guard: prevent duplicate sends (sometimes browsers/firefox/extension may fire twice)
    const lastMsg = currentConversation?.messages[currentConversation.messages.length - 1];
    if (
      lastMsg &&
      lastMsg.type === "user" &&
      lastMsg.content === content &&
      ((file && lastMsg.file && lastMsg.file.name === file.name) || (!file && !lastMsg.file))
    ) {
      // ignore duplicate send
      return;
    }
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
      file: file
        ? {
            name: file.name,
            size: file.size,
            type: file.type
          }
        : undefined
    };
    // Update conversation with user message
    dispatch({
      type: ChatActionEnum.ADD_MESSAGE,
      payload: {
        conversationId: currentConversationId,
        message: userMessage
      }
    });

    // Call backend API to get bot response (async)
    (async () => {
      const placeholderMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "",
        loading: true,
        timestamp: new Date()
      };
      // Add placeholder immediately so user sees a reply is coming
      dispatch({
        type: ChatActionEnum.ADD_MESSAGE,
        payload: {
          conversationId: currentConversationId,
          message: placeholderMessage
        }
      });

      // Mark pending for this conversation (ref updated immediately to avoid race)
      pendingResponsesRef.current = {
        ...pendingResponsesRef.current,
        [currentConversationId]: true
      };
      setPendingResponses(prev => ({ ...prev, [currentConversationId]: true }));

      try {
        const response = await getBotResponse(content);
        const botMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "bot",
          content: response.text || "",
          timestamp: new Date(),
          sources: response.sources || []
        };
        // Replace placeholder with actual bot message
        dispatch({
          type: ChatActionEnum.REPLACE_LAST_MESSAGE,
          payload: {
            conversationId: currentConversationId,
            message: botMessage
          }
        });

        // clear pending flag
        pendingResponsesRef.current = { ...pendingResponsesRef.current };
        delete pendingResponsesRef.current[currentConversationId];
        setPendingResponses(prev => {
          const copy = { ...prev };
          delete copy[currentConversationId];
          return copy;
        });
      } catch (err: any) {
        const errorMessage: Message = {
          id: (Date.now() + 3).toString(),
          type: "bot",
          content: "Xin lỗi, có lỗi xảy ra khi gọi tới server: " + (err?.message || String(err)),
          timestamp: new Date()
        };

        // Replace placeholder with error message
        dispatch({
          type: ChatActionEnum.UPDATE_CONVERSATION,
          payload: {
            conversationId: currentConversationId,
            updates: {
              messages: [
                ...currentConversation!.messages.slice(0, -1), // Remove placeholder
                errorMessage // Add error message
              ]
            }
          }
        });

        // clear pending flag on error as well
        pendingResponsesRef.current = { ...pendingResponsesRef.current };
        delete pendingResponsesRef.current[currentConversationId];
        setPendingResponses(prev => {
          const copy = { ...prev };
          delete copy[currentConversationId];
          return copy;
        });
      }
    })();
  };

  const handleAddNotice = (content: string) => {
    if (!currentConversationId) return;
    const noticeMessage: Message = {
      id: Date.now().toString(),
      type: "bot",
      content,
      timestamp: new Date()
    };
    dispatch({
      type: ChatActionEnum.ADD_MESSAGE,
      payload: {
        conversationId: currentConversationId,
        message: noticeMessage
      }
    });
  };

  return (
    <Fragment>
      <div className="flex-1 flex flex-col p-4">
        <div className="max-w-4xl mx-auto w-full h-screen flex flex-col py-6">
          {/* Header */}
          <div className="mb-4">
            <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Code2 className="size-6 text-white" />
                </div>
                <div>
                  <h1 className="text-slate-900 dark:text-slate-100">
                    {currentConversation?.title || "Embedded Dev Assistant"}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AI chatbot hỗ trợ embedded development
                  </p>
                </div>
              </div>
            </Card>
          </div>
          {/* Chat Messages */}
          <Card className="flex-1 mb-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-slate-200 dark:border-slate-800 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {currentConversation?.messages.map(message => (
                  <ChatMessage key={message.id} message={message} onOpenPdf={handleOpenPdf} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </Card>
          {/* Chat Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            onAddNotice={handleAddNotice}
            isSending={!!pendingResponses[currentConversationId]}
          />
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfViewerOpen && pdfViewerConfig && (
        <PdfViewer
          pdfUrl={pdfViewerConfig.url}
          pageNumber={pdfViewerConfig.page}
          searchText={pdfViewerConfig.searchText}
          onClose={handleClosePdf}
        />
      )}
    </Fragment>
  );
};

export default ChatPage;
