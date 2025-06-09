/**
 * Constants cho Genkit Chatbot
 */

/**
 * WebView Commands
 */
export const WEBVIEW_COMMANDS = {
  SEND_MESSAGE: 'sendMessage',
  ADD_MESSAGE: 'addMessage',
  STREAMING_MESSAGE: 'streamingMessage',
  CLEAR_CHAT: 'clearChat',
  GENERATE_STORY: 'generateStory',
  STORY_GENERATED: 'storyGenerated',
  ERROR: 'error',
} as const;

/**
 * Cấu hình chatbot
 */
export const CHATBOT_CONFIG = {
  title: 'TomiChat',
  description: 'Trợ lý AI tạo truyện thông minh',
  welcomeMessage: `👋 Xin chào! Tôi là TomiChat, trợ lý AI giúp bạn tạo ra những câu chuyện thú vị.

🌟 Tôi có thể giúp bạn:
• Tạo câu chuyện từ ý tưởng của bạn
• Phát triển nhân vật và cốt truyện
• Đưa ra gợi ý sáng tạo
• Kể những câu chuyện hấp dẫn

Hãy chia sẻ ý tưởng của bạn và tôi sẽ giúp biến nó thành một câu chuyện tuyệt vời! ✨`,
  placeholder: 'Nhập tin nhắn của bạn...',
  enableStreaming: true,
  maxMessageLength: 1000,
};

/**
 * UI Messages
 */
export const UI_MESSAGES = {
  THINKING: '🤔 Đang suy nghĩ...',
  TYPING: '✍️ Đang viết...',
  ERROR_GENERIC: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
  ERROR_NETWORK: 'Không thể kết nối. Vui lòng kiểm tra kết nối mạng.',
  ERROR_VALIDATION: 'Tin nhắn không hợp lệ. Vui lòng thử lại.',
  EMPTY_MESSAGE: 'Vui lòng nhập tin nhắn.',
  MESSAGE_TOO_LONG: 'Tin nhắn quá dài. Vui lòng rút ngắn.',
};

/**
 * Story Generation Constants
 */
export const STORY_GENRES = [
  'phiêu lưu',
  'thần thoại',
  'khoa học viễn tưởng',
  'kinh dị',
  'lãng mạn',
  'hài hước',
  'trinh thám',
  'fantasy',
  'slice of life',
  'giáo dục',
] as const;

export const STORY_LENGTHS = {
  short: {
    label: 'Ngắn',
    description: '200-300 từ',
    maxTokens: 500,
  },
  medium: {
    label: 'Vừa',
    description: '500-700 từ',
    maxTokens: 1000,
  },
  long: {
    label: 'Dài',
    description: '1000-1500 từ',
    maxTokens: 2000,
  },
} as const;

/**
 * Default suggestions
 */
export const DEFAULT_SUGGESTIONS = [
  'Kể cho tôi một ý tưởng câu chuyện',
  'Tạo một nhân vật thú vị',
  'Giúp tôi nghĩ ra một cốt truyện',
  'Viết một câu chuyện ngắn',
  'Tạo một câu chuyện phiêu lưu',
];

/**
 * Animation và UI constants
 */
export const ANIMATION_DURATIONS = {
  MESSAGE_APPEAR: 300,
  TYPING_INDICATOR: 1000,
  FADE_IN: 200,
  SLIDE_UP: 250,
} as const;

/**
 * CSS Classes
 */
export const CSS_CLASSES = {
  MESSAGE_USER: 'message-user',
  MESSAGE_BOT: 'message-bot',
  MESSAGE_STREAMING: 'message-streaming',
  TYPING_INDICATOR: 'typing-indicator',
  SUGGESTION_BUTTON: 'suggestion-button',
  ERROR_MESSAGE: 'error-message',
} as const;
