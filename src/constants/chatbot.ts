import { ChatbotConfig } from '../types/chatbot';

export const CHATBOT_CONFIG: ChatbotConfig = {
  title: '🤖 TomiChat',
  description: 'Chatbot tạo truyện thông minh',
  welcomeMessage: '👋 Xin chào! Tôi là TomiChat, trợ lý AI giúp bạn tạo ra những câu chuyện thú vị. Hãy chia sẻ ý tưởng của bạn và tôi sẽ giúp phát triển thành một câu chuyện tuyệt vời!',
  placeholder: 'Nhập ý tưởng câu chuyện của bạn...'
};

export const CHATBOT_RESPONSES = [
  'Tôi hiểu bạn muốn nói về: "{message}". Hãy kể thêm chi tiết nhé!',
  'Thật thú vị! "{message}" có thể là một ý tưởng hay cho câu chuyện.',
  'Về "{message}", tôi nghĩ chúng ta có thể phát triển thành một cốt truyện hấp dẫn!',
  '"{message}" nghe rất hay! Bạn muốn tôi giúp tạo ra một câu chuyện từ ý tưởng này không?',
  'Tuyệt vời! "{message}" có thể là khởi đầu cho một câu chuyện thú vị. Bạn có muốn tôi tiếp tục không?'
];

export const WEBVIEW_COMMANDS = {
  SEND_MESSAGE: 'sendMessage',
  ADD_MESSAGE: 'addMessage',
  CLEAR_CHAT: 'clearChat'
} as const;

export const AVATARS = {
  USER: '👤',
  BOT: '🤖'
} as const;
