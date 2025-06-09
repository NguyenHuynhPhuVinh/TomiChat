import { z } from "zod";
import { getAI, CHATBOT_CONFIG, isGenkitReady } from "./config";

/**
 * Schema cho input của chatbot
 */
export const ChatInputSchema = z.object({
  message: z.string().min(1).max(1000).describe("Tin nhắn từ người dùng"),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string(),
      })
    )
    .optional()
    .describe("Lịch sử cuộc trò chuyện"),
});

/**
 * Schema cho output của chatbot
 */
export const ChatOutputSchema = z.object({
  response: z.string().describe("Phản hồi từ TomiChat"),
  suggestions: z
    .array(z.string())
    .optional()
    .describe("Gợi ý câu hỏi tiếp theo"),
});

/**
 * Flow chính cho chatbot - xử lý tin nhắn và tạo phản hồi
 */
export const chatFlow = async (
  input: z.infer<typeof ChatInputSchema>
): Promise<z.infer<typeof ChatOutputSchema>> => {
  const { message, conversationHistory = [] } = input;
  const ai = getAI();

  // Kiểm tra xem Genkit có sẵn sàng không
  if (!isGenkitReady() || !ai) {
    return {
      response: `❌ Xin lỗi, TomiChat chưa được cấu hình đúng cách.

Để sử dụng TomiChat, bạn cần:
1. Tạo Google AI API key tại: https://makersuite.google.com/app/apikey
2. Thiết lập biến môi trường GOOGLE_GENAI_API_KEY
3. Khởi động lại VS Code

Ví dụ:
\`\`\`bash
export GOOGLE_GENAI_API_KEY="your-api-key-here"
\`\`\`

Hoặc bạn có thể sử dụng các biến môi trường khác:
- GEMINI_API_KEY
- GOOGLE_API_KEY`,
      suggestions: [
        "Hướng dẫn cài đặt API key",
        "Tôi đã có API key rồi",
        "Sử dụng chế độ demo",
      ],
    };
  }

  // Tạo messages array cho Genkit
  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "model",
      content: [{ text: msg.content }],
    })),
    {
      role: "user" as const,
      content: [{ text: message }],
    },
  ];

  try {
    // Gọi Genkit để tạo phản hồi
    const response = await ai.generate({
      model: CHATBOT_CONFIG.model,
      system: CHATBOT_CONFIG.system,
      messages,
      config: CHATBOT_CONFIG.config,
    });

    // Tạo gợi ý dựa trên nội dung phản hồi
    const suggestions = generateSuggestions(message, response.text);

    return {
      response: response.text,
      suggestions,
    };
  } catch (error) {
    console.error("Lỗi khi tạo phản hồi:", error);

    // Fallback response khi có lỗi
    return {
      response:
        "Xin lỗi, tôi đang gặp một chút vấn đề. Bạn có thể thử lại không? 🤔",
      suggestions: [
        "Hãy kể cho tôi một ý tưởng câu chuyện",
        "Tôi muốn tạo một nhân vật mới",
        "Giúp tôi nghĩ ra một cốt truyện thú vị",
      ],
    };
  }
};

/**
 * Schema cho story generation input
 */
export const StoryInputSchema = z.object({
  idea: z.string().describe("Ý tưởng câu chuyện"),
  genre: z.string().optional().describe("Thể loại câu chuyện"),
  length: z
    .enum(["short", "medium", "long"])
    .default("medium")
    .describe("Độ dài câu chuyện"),
});

/**
 * Schema cho story generation output
 */
export const StoryOutputSchema = z.object({
  title: z.string().describe("Tiêu đề câu chuyện"),
  story: z.string().describe("Nội dung câu chuyện"),
  characters: z.array(z.string()).describe("Danh sách nhân vật chính"),
  moral: z.string().optional().describe("Bài học từ câu chuyện"),
});

/**
 * Flow cho việc tạo câu chuyện từ ý tưởng
 */
export const storyGenerationFlow = async (
  input: z.infer<typeof StoryInputSchema>
): Promise<z.infer<typeof StoryOutputSchema>> => {
  const { idea, genre = "phiêu lưu", length } = input;
  const ai = getAI();

  // Kiểm tra xem Genkit có sẵn sàng không
  if (!isGenkitReady() || !ai) {
    return {
      title: "Không thể tạo câu chuyện",
      story:
        "Xin lỗi, TomiChat chưa được cấu hình đúng cách. Vui lòng thiết lập Google AI API key để sử dụng tính năng này.",
      characters: [],
      moral: "Hãy luôn chuẩn bị kỹ lưỡng trước khi bắt đầu một cuộc phiêu lưu!",
    };
  }

  const lengthPrompt = {
    short: "một câu chuyện ngắn (200-300 từ)",
    medium: "một câu chuyện vừa phải (500-700 từ)",
    long: "một câu chuyện dài (1000-1500 từ)",
  }[length];

  const prompt = `Dựa trên ý tưởng: "${idea}"
Thể loại: ${genre}
Hãy tạo ra ${lengthPrompt} với:
- Tiêu đề hấp dẫn
- Cốt truyện rõ ràng với khởi đầu, phát triển và kết thúc
- Nhân vật sinh động
- Bài học ý nghĩa (nếu phù hợp)

Trả về kết quả theo định dạng JSON với các trường: title, story, characters, moral.`;

  try {
    const response = await ai.generate({
      model: CHATBOT_CONFIG.model,
      prompt,
      config: {
        ...CHATBOT_CONFIG.config,
        maxOutputTokens: length === "long" ? 2000 : 1000,
      },
      output: {
        schema: z.object({
          title: z.string(),
          story: z.string(),
          characters: z.array(z.string()),
          moral: z.string().optional(),
        }),
      },
    });

    return (
      response.output || {
        title: "Câu chuyện từ ý tưởng của bạn",
        story:
          "Xin lỗi, tôi không thể tạo câu chuyện lúc này. Hãy thử lại sau!",
        characters: [],
        moral: undefined,
      }
    );
  } catch (error) {
    console.error("Lỗi khi tạo câu chuyện:", error);
    throw new Error("Không thể tạo câu chuyện. Vui lòng thử lại!");
  }
};

/**
 * Hàm tạo gợi ý dựa trên ngữ cảnh
 */
function generateSuggestions(
  userMessage: string,
  _botResponse: string
): string[] {
  const suggestions: string[] = [];

  // Gợi ý dựa trên từ khóa trong tin nhắn
  if (
    userMessage.toLowerCase().includes("câu chuyện") ||
    userMessage.toLowerCase().includes("truyện")
  ) {
    suggestions.push("Tạo thêm một câu chuyện khác");
    suggestions.push("Phát triển nhân vật trong câu chuyện này");
  }

  if (userMessage.toLowerCase().includes("nhân vật")) {
    suggestions.push("Tạo thêm nhân vật phụ");
    suggestions.push("Mô tả chi tiết về nhân vật này");
  }

  if (
    userMessage.toLowerCase().includes("cốt truyện") ||
    userMessage.toLowerCase().includes("kịch bản")
  ) {
    suggestions.push("Thêm tình tiết bất ngờ");
    suggestions.push("Tạo kết thúc khác");
  }

  // Gợi ý mặc định
  if (suggestions.length === 0) {
    suggestions.push(
      "Kể cho tôi một ý tưởng câu chuyện mới",
      "Tạo một nhân vật thú vị",
      "Giúp tôi nghĩ ra một cốt truyện"
    );
  }

  return suggestions.slice(0, 3); // Giới hạn 3 gợi ý
}
