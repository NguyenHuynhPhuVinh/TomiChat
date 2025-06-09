export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  avatar?: string;
}

export interface ChatbotConfig {
  title: string;
  description: string;
  welcomeMessage: string;
  placeholder: string;
}

export interface WebviewMessage {
  command: string;
  data?: any;
}

export interface SendMessageCommand extends WebviewMessage {
  command: 'sendMessage';
  data: {
    text: string;
  };
}

export interface AddMessageCommand extends WebviewMessage {
  command: 'addMessage';
  data: {
    message: ChatMessage;
  };
}

export interface ClearChatCommand extends WebviewMessage {
  command: 'clearChat';
}

export type ChatbotCommand = SendMessageCommand | AddMessageCommand | ClearChatCommand;
