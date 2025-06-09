import { chatFlow, storyGenerationFlow } from "../genkit/flows";
import { STREAMING_CONFIG } from "../genkit/config";
import { ConfigService } from "./configService";
import {
  ChatMessage,
  ConversationMessage,
  StreamingChunk,
  StoryRequest,
  StoryResponse,
  GenkitError,
  CHATBOT_CONSTANTS,
} from "../types/genkit";
import { generateId, getCurrentTimestamp } from "../utils/helpers";

/**
 * Service chính cho chatbot sử dụng Genkit
 */
export class GenkitChatbotService {
  private static instance: GenkitChatbotService;
  private conversationHistory: ConversationMessage[] = [];
  private configService: ConfigService;

  private constructor() {
    this.configService = ConfigService.getInstance();
  }

  public static getInstance(): GenkitChatbotService {
    if (!GenkitChatbotService.instance) {
      GenkitChatbotService.instance = new GenkitChatbotService();
    }
    return GenkitChatbotService.instance;
  }

  /**
   * Xử lý tin nhắn từ người dùng
   */
  public async processMessage(
    userMessage: string,
    onStreamingChunk?: (chunk: StreamingChunk) => void
  ): Promise<{
    userMsg: ChatMessage;
    botMsg: ChatMessage;
  }> {
    // Validate input
    this.validateMessage(userMessage);

    // Tạo user message
    const userMsg = this.createMessage(userMessage, true);

    try {
      // Thêm vào lịch sử
      this.addToHistory("user", userMessage);

      // Gọi Genkit flow
      const response = await chatFlow({
        message: userMessage,
        conversationHistory: this.getRecentHistory(),
      });

      // Tạo bot message
      let botMsg: ChatMessage;

      if (this.configService.isStreamingEnabled() && onStreamingChunk) {
        // Streaming response
        botMsg = await this.handleStreamingResponse(
          response.response,
          response.suggestions,
          onStreamingChunk
        );
      } else {
        // Non-streaming response
        botMsg = this.createMessage(
          response.response,
          false,
          response.suggestions
        );
      }

      // Thêm phản hồi vào lịch sử
      this.addToHistory("model", response.response);

      return { userMsg, botMsg };
    } catch (error) {
      console.error("Lỗi khi xử lý tin nhắn:", error);

      const errorMsg =
        error instanceof GenkitError
          ? error.message
          : "Xin lỗi, tôi đang gặp một chút vấn đề. Bạn có thể thử lại không? 🤔";

      const botMsg = this.createMessage(errorMsg, false, [
        ...CHATBOT_CONSTANTS.DEFAULT_SUGGESTIONS,
      ]);

      return { userMsg, botMsg };
    }
  }

  /**
   * Tạo câu chuyện từ ý tưởng
   */
  public async generateStory(request: StoryRequest): Promise<StoryResponse> {
    try {
      const story = await storyGenerationFlow(request);
      return story;
    } catch (error) {
      console.error("Lỗi khi tạo câu chuyện:", error);
      throw new GenkitError(
        "Không thể tạo câu chuyện. Vui lòng thử lại!",
        "STORY_GENERATION_ERROR",
        error
      );
    }
  }

  /**
   * Xử lý streaming response
   */
  private async handleStreamingResponse(
    fullResponse: string,
    suggestions: string[] | undefined,
    onChunk: (chunk: StreamingChunk) => void
  ): Promise<ChatMessage> {
    const messageId = generateId();
    const chunks = this.splitIntoChunks(fullResponse);

    let accumulatedText = "";

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      accumulatedText += chunk;

      const isComplete = i === chunks.length - 1;

      onChunk({
        content: accumulatedText,
        isComplete,
        suggestions: isComplete ? suggestions : undefined,
      });

      if (!isComplete) {
        await this.delay(STREAMING_CONFIG.delay);
      }
    }

    return {
      id: messageId,
      text: fullResponse,
      isUser: false,
      timestamp: getCurrentTimestamp(),
      suggestions,
    };
  }

  /**
   * Chia text thành các chunks để streaming
   */
  private splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    const chunkSize = STREAMING_CONFIG.chunkSize;

    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(0, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Tạo message object
   */
  public createMessage(
    text: string,
    isUser: boolean,
    suggestions?: string[]
  ): ChatMessage {
    return {
      id: generateId(),
      text,
      isUser,
      timestamp: getCurrentTimestamp(),
      suggestions,
    };
  }

  /**
   * Validate tin nhắn
   */
  public validateMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new GenkitError("Tin nhắn không được để trống", "EMPTY_MESSAGE");
    }

    if (message.length > CHATBOT_CONSTANTS.MAX_MESSAGE_LENGTH) {
      throw new GenkitError(
        `Tin nhắn quá dài. Tối đa ${CHATBOT_CONSTANTS.MAX_MESSAGE_LENGTH} ký tự`,
        "MESSAGE_TOO_LONG"
      );
    }
  }

  /**
   * Thêm tin nhắn vào lịch sử
   */
  private addToHistory(role: "user" | "model", content: string): void {
    this.conversationHistory.push({ role, content });

    // Giới hạn số lượng tin nhắn trong lịch sử
    if (
      this.conversationHistory.length >
      CHATBOT_CONSTANTS.MAX_CONVERSATION_HISTORY
    ) {
      this.conversationHistory = this.conversationHistory.slice(
        -CHATBOT_CONSTANTS.MAX_CONVERSATION_HISTORY
      );
    }
  }

  /**
   * Lấy lịch sử gần đây
   */
  private getRecentHistory(): ConversationMessage[] {
    return this.conversationHistory.slice(-10); // Lấy 10 tin nhắn gần nhất
  }

  /**
   * Xóa lịch sử cuộc trò chuyện
   */
  public clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Lấy lịch sử cuộc trò chuyện
   */
  public getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
