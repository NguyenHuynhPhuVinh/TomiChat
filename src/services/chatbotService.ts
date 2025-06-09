import { ChatMessage } from "../types/chatbot";
import { CHATBOT_RESPONSES } from "../constants/chatbot";
import { generateId, getCurrentTimestamp } from "../utils/helpers";

export class ChatbotService {
  private static instance: ChatbotService;

  private constructor() {}

  public static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  /**
   * Generate a bot response based on user message
   */
  public generateResponse(userMessage: string): string {
    // Simple template-based response for now
    // In the future, this can be replaced with AI API calls
    const template =
      CHATBOT_RESPONSES[Math.floor(Math.random() * CHATBOT_RESPONSES.length)];
    return template.replace("{message}", userMessage);
  }

  /**
   * Create a chat message object
   */
  public createMessage(text: string, isUser: boolean): ChatMessage {
    return {
      id: generateId(),
      text,
      isUser,
      timestamp: getCurrentTimestamp(),
    };
  }

  /**
   * Process user message and generate bot response
   */
  public async processMessage(userMessage: string): Promise<{
    userMsg: ChatMessage;
    botMsg: ChatMessage;
  }> {
    const userMsg = this.createMessage(userMessage, true);

    // Simulate thinking time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const botResponse = this.generateResponse(userMessage);
    const botMsg = this.createMessage(botResponse, false);

    return { userMsg, botMsg };
  }

  /**
   * Validate message content
   */
  public validateMessage(message: string): boolean {
    return message.trim().length > 0 && message.length <= 1000;
  }
}
