import { z } from 'zod';

/**
 * Interface cho tin nhắn chat
 */
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  isStreaming?: boolean;
  suggestions?: string[];
}

/**
 * Interface cho lịch sử cuộc trò chuyện
 */
export interface ConversationMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * Interface cho cấu hình chatbot
 */
export interface ChatbotConfig {
  title: string;
  description: string;
  welcomeMessage: string;
  placeholder: string;
  enableStreaming: boolean;
  maxMessageLength: number;
}

/**
 * Interface cho phản hồi từ Genkit
 */
export interface GenkitResponse {
  response: string;
  suggestions?: string[];
  error?: string;
}

/**
 * Interface cho streaming response
 */
export interface StreamingChunk {
  content: string;
  isComplete: boolean;
  suggestions?: string[];
}

/**
 * Interface cho story generation
 */
export interface StoryRequest {
  idea: string;
  genre?: string;
  length: 'short' | 'medium' | 'long';
}

export interface StoryResponse {
  title: string;
  story: string;
  characters: string[];
  moral?: string;
}

/**
 * WebView Message Types
 */
export interface WebviewMessage {
  command: string;
  data?: any;
}

export interface SendMessageCommand extends WebviewMessage {
  command: 'sendMessage';
  data: {
    text: string;
    conversationHistory?: ConversationMessage[];
  };
}

export interface AddMessageCommand extends WebviewMessage {
  command: 'addMessage';
  data: {
    message: ChatMessage;
  };
}

export interface StreamingMessageCommand extends WebviewMessage {
  command: 'streamingMessage';
  data: {
    messageId: string;
    chunk: StreamingChunk;
  };
}

export interface ClearChatCommand extends WebviewMessage {
  command: 'clearChat';
}

export interface GenerateStoryCommand extends WebviewMessage {
  command: 'generateStory';
  data: StoryRequest;
}

export interface StoryGeneratedCommand extends WebviewMessage {
  command: 'storyGenerated';
  data: StoryResponse;
}

export interface ErrorCommand extends WebviewMessage {
  command: 'error';
  data: {
    message: string;
    details?: string;
  };
}

/**
 * Union type cho tất cả commands
 */
export type ChatbotCommand = 
  | SendMessageCommand 
  | AddMessageCommand 
  | StreamingMessageCommand
  | ClearChatCommand 
  | GenerateStoryCommand
  | StoryGeneratedCommand
  | ErrorCommand;

/**
 * Zod schemas cho validation
 */
export const ChatMessageSchema = z.object({
  id: z.string(),
  text: z.string(),
  isUser: z.boolean(),
  timestamp: z.string(),
  isStreaming: z.boolean().optional(),
  suggestions: z.array(z.string()).optional(),
});

export const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const SendMessageSchema = z.object({
  text: z.string().min(1).max(1000),
  conversationHistory: z.array(ConversationMessageSchema).optional(),
});

export const StoryRequestSchema = z.object({
  idea: z.string().min(1),
  genre: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']),
});

/**
 * Constants
 */
export const CHATBOT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_CONVERSATION_HISTORY: 20,
  STREAMING_DELAY: 30,
  CHUNK_SIZE: 50,
  DEFAULT_SUGGESTIONS: [
    'Kể cho tôi một ý tưởng câu chuyện',
    'Tạo một nhân vật thú vị',
    'Giúp tôi nghĩ ra một cốt truyện',
  ],
} as const;

/**
 * Error types
 */
export class GenkitError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GenkitError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
