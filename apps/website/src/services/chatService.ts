// Chat Service

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  temperature?: number; // 0.0 - 1.0
  max_tokens?: number;
  use_context?: boolean; // Whether to use document context
  k?: number; // Number of context documents to retrieve
}

export interface ChatResponse {
  response: string;
  context_used?: Array<{
    text: string;
    source?: string;
    page?: number;
    score: number;
  }>;
  conversation_history?: ChatMessage[];
}

export interface ChatStreamOptions {
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Chat Controller
 * Handles AI chat operations with document context
 */
class ChatService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a chat message
   * POST /api/v1/chat/chat
   * 
   * @param message - User message
   * @param options - Optional chat parameters
   */
  async chat(
    message: string,
    options?: {
      conversationHistory?: ChatMessage[];
      temperature?: number;
      maxTokens?: number;
      useContext?: boolean;
      k?: number;
    }
  ): Promise<ChatResponse> {
    const request: ChatRequest = {
      message,
      conversation_history: options?.conversationHistory,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      use_context: options?.useContext ?? true,
      k: options?.k,
    };

    const response = await fetch(`${this.baseUrl}/api/v1/chat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Chat request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send a chat message with streaming response
   * POST /api/v1/chat/stream (if available)
   * 
   * @param message - User message
   * @param options - Chat options and stream callbacks
   */
  async chatStream(
    message: string,
    options?: {
      conversationHistory?: ChatMessage[];
      temperature?: number;
      maxTokens?: number;
      useContext?: boolean;
      k?: number;
    } & ChatStreamOptions
  ): Promise<string> {
    const request: ChatRequest = {
      message,
      conversation_history: options?.conversationHistory,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      use_context: options?.useContext ?? true,
      k: options?.k,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `Chat stream failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        if (options?.onToken) {
          options.onToken(chunk);
        }
      }

      if (options?.onComplete) {
        options.onComplete(fullResponse);
      }

      return fullResponse;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Stream failed');
      if (options?.onError) {
        options.onError(err);
      }
      throw err;
    }
  }

  /**
   * Clear conversation history (client-side helper)
   */
  createConversationHistory(): ChatMessage[] {
    return [];
  }

  /**
   * Add message to conversation history
   */
  addToHistory(
    history: ChatMessage[],
    role: 'user' | 'assistant' | 'system',
    content: string
  ): ChatMessage[] {
    return [...history, { role, content }];
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
