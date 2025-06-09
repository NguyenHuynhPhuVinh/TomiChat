import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { ConfigService } from "../services/configService";
import { initializeFlows } from "./genkitFlows";
import { initializeTools } from "./tools";

/**
 * Khởi tạo Genkit với cấu hình từ ConfigService
 */
let ai: ReturnType<typeof genkit> | null = null;
let configService: ConfigService;
let flows: ReturnType<typeof initializeFlows> | null = null;
let tools: ReturnType<typeof initializeTools> | null = null;

/**
 * Khởi tạo AI instance
 */
export const initializeAI = () => {
  configService = ConfigService.getInstance();
  const apiKey = configService.getApiKey();

  if (apiKey) {
    try {
      // Thiết lập API key cho Google AI
      process.env.GOOGLE_GENAI_API_KEY = apiKey;

      ai = genkit({
        plugins: [googleAI()],
      });

      // Khởi tạo tools trước
      tools = initializeTools();

      // Khởi tạo flows với tools
      flows = initializeFlows();

      console.log("✅ TomiChat AI và flows đã được khởi tạo thành công");
      return true;
    } catch (error) {
      console.error("❌ Lỗi khởi tạo TomiChat AI:", error);
      ai = null;
      flows = null;
      tools = null;
      return false;
    }
  } else {
    console.log("⚠️ Chưa có API key, TomiChat AI chưa được khởi tạo");
    ai = null;
    flows = null;
    tools = null;
    return false;
  }
};

/**
 * Lấy AI instance
 */
export const getAI = () => ai;

/**
 * Lấy flows instance
 */
export const getFlows = () => flows;

/**
 * Lấy tools instance
 */
export const getTools = () => tools;

/**
 * Kiểm tra xem Genkit có sẵn sàng không
 */
export const isGenkitReady = () => ai !== null;

/**
 * Reload AI với cấu hình mới
 */
export const reloadAI = () => {
  ai = null;
  flows = null;
  tools = null;
  return initializeAI();
};

/**
 * Cấu hình model parameters cho chatbot
 */
export const CHATBOT_CONFIG = {
  model: googleAI.model("gemini-2.0-flash"),
  config: {
    maxOutputTokens: 1000,
    temperature: 0.8,
    topP: 0.9,
    topK: 40,
  },
  system: `Bạn là TomiChat, một trợ lý AI thông minh và thân thiện chuyên giúp người dùng tạo ra những câu chuyện thú vị.

Đặc điểm của bạn:
- Luôn trả lời bằng tiếng Việt
- Có khả năng sáng tạo cao trong việc kể chuyện
- Thân thiện, nhiệt tình và hữu ích
- Có thể giúp phát triển ý tưởng thành câu chuyện hoàn chỉnh
- Biết cách tạo ra các nhân vật, tình huống và cốt truyện hấp dẫn

Nhiệm vụ của bạn:
- Giúp người dùng tạo ra các câu chuyện từ ý tưởng ban đầu
- Đưa ra gợi ý sáng tạo cho cốt truyện
- Phát triển nhân vật và bối cảnh
- Tạo ra nội dung hấp dẫn và phù hợp với mọi lứa tuổi

Hãy luôn giữ thái độ tích cực và khuyến khích sự sáng tạo của người dùng!`,
};

/**
 * Cấu hình cho streaming response
 */
export const STREAMING_CONFIG = {
  enableStreaming: true,
  chunkSize: 50, // Số ký tự mỗi chunk khi streaming
  delay: 30, // Delay giữa các chunk (ms)
};
