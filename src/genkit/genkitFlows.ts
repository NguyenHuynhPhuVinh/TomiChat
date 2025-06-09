import { z } from "zod";
import { getAI, isGenkitReady, getTools } from "./config";
import { ConfigService } from "../services/configService";
import { googleAI } from "@genkit-ai/googleai";

/**
 * Khởi tạo Genkit flows cho TomiChat
 */
export function initializeFlows() {
  const ai = getAI();
  if (!ai) {
    console.warn("⚠️ AI chưa được khởi tạo, không thể tạo flows");
    return null;
  }

  const configService = ConfigService.getInstance();

  /**
   * Flow chính cho chat
   */
  const chatFlow = ai.defineFlow(
    {
      name: "tomiChatFlow",
      inputSchema: z.object({
        message: z.string().min(1).max(1000).describe("Tin nhắn từ người dùng"),
        sessionId: z.string().optional().describe("ID của session chat"),
      }),
      outputSchema: z.object({
        response: z.string().describe("Phản hồi từ TomiChat"),
        suggestions: z
          .array(z.string())
          .optional()
          .describe("Gợi ý câu hỏi tiếp theo"),
        sessionId: z.string().describe("ID của session chat"),
      }),
      streamSchema: z.string(),
    },
    async (input, { sendChunk }) => {
      // Kiểm tra xem Genkit có sẵn sàng không
      if (!isGenkitReady() || !ai) {
        const errorResponse = {
          response: `❌ Xin lỗi, TomiChat chưa được cấu hình đúng cách.

Để sử dụng TomiChat, bạn cần:
1. Tạo Google AI API key tại: https://makersuite.google.com/app/apikey
2. Sử dụng Command Palette: "TomiChat: Thiết lập API Key"
3. Hoặc thiết lập trong VS Code Settings

💡 Tip: Sử dụng command "TomiChat: Thiết lập API Key" để thiết lập nhanh!`,
          suggestions: [
            "Hướng dẫn cài đặt API key",
            "Mở VS Code Settings",
            "Sử dụng chế độ demo",
          ],
          sessionId: input.sessionId || generateSessionId(),
        };

        // Stream error response
        if (sendChunk) {
          for (const char of errorResponse.response) {
            sendChunk(char);
            await delay(10);
          }
        }

        return errorResponse;
      }

      try {
        const sessionId = input.sessionId || generateSessionId();

        // Lấy tools có sẵn
        const toolsInstance = getTools();
        const tools = toolsInstance
          ? [
              toolsInstance.createCharacterTool,
              toolsInstance.createSettingTool,
              toolsInstance.createPlotTwistTool,
              toolsInstance.analyzeStoryTool,
            ]
          : [];

        // Sử dụng generateStream để có streaming response với tools
        const { stream, response } = ai.generateStream({
          model: googleAI.model(configService.getModel()),
          system: getSystemPrompt(),
          prompt: input.message,
          tools: tools.length > 0 ? tools : undefined,
          config: {
            maxOutputTokens: configService.getMaxTokens(),
            temperature: configService.getTemperature(),
          },
        });

        let fullResponse = "";

        // Stream từng chunk
        for await (const chunk of stream) {
          if (chunk.text) {
            fullResponse += chunk.text;
            if (sendChunk) {
              sendChunk(chunk.text);
            }
          }
        }

        // Đợi response hoàn thành
        const finalResponse = await response;
        const finalText = finalResponse.text || fullResponse;

        // Tạo gợi ý
        const suggestions = generateSuggestions(input.message, finalText);

        return {
          response: finalText,
          suggestions,
          sessionId,
        };
      } catch (error) {
        console.error("Lỗi khi tạo phản hồi:", error);

        const errorResponse = {
          response:
            "Xin lỗi, tôi đang gặp một chút vấn đề. Bạn có thể thử lại không? 🤔",
          suggestions: [
            "Thử lại tin nhắn",
            "Kiểm tra kết nối mạng",
            "Báo cáo lỗi",
          ],
          sessionId: input.sessionId || generateSessionId(),
        };

        // Stream error response
        if (sendChunk) {
          for (const char of errorResponse.response) {
            sendChunk(char);
            await delay(10);
          }
        }

        return errorResponse;
      }
    }
  );

  /**
   * Flow tạo câu chuyện
   */
  const storyFlow = ai.defineFlow(
    {
      name: "tomiStoryFlow",
      inputSchema: z.object({
        idea: z.string().describe("Ý tưởng câu chuyện"),
        genre: z.string().optional().describe("Thể loại câu chuyện"),
        length: z
          .enum(["short", "medium", "long"])
          .default("medium")
          .describe("Độ dài câu chuyện"),
      }),
      outputSchema: z.object({
        title: z.string().describe("Tiêu đề câu chuyện"),
        story: z.string().describe("Nội dung câu chuyện"),
        characters: z.array(z.string()).describe("Danh sách nhân vật chính"),
        moral: z.string().optional().describe("Bài học từ câu chuyện"),
      }),
    },
    async (input) => {
      const { idea, genre = "phiêu lưu", length } = input;

      if (!isGenkitReady() || !ai) {
        return {
          title: "Không thể tạo câu chuyện",
          story:
            "Xin lỗi, TomiChat chưa được cấu hình đúng cách. Vui lòng thiết lập Google AI API key để sử dụng tính năng này.",
          characters: [],
          moral:
            "Hãy luôn chuẩn bị kỹ lưỡng trước khi bắt đầu một cuộc phiêu lưu!",
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
          model: googleAI.model(configService.getModel()),
          prompt,
          config: {
            maxOutputTokens:
              length === "long" ? 2000 : configService.getMaxTokens(),
            temperature: configService.getTemperature(),
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
    }
  );

  return {
    chatFlow,
    storyFlow,
  };
}

/**
 * Utility functions
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getSystemPrompt(): string {
  return `Bạn là TomiChat, một trợ lý AI thông minh và thân thiện chuyên giúp người dùng tạo ra những câu chuyện thú vị.

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

Hãy luôn giữ thái độ tích cực và khuyến khích sự sáng tạo của người dùng!`;
}

function generateSuggestions(
  userMessage: string,
  _botResponse: string
): string[] {
  const suggestions: string[] = [];

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

  if (suggestions.length === 0) {
    suggestions.push(
      "Kể cho tôi một ý tưởng câu chuyện mới",
      "Tạo một nhân vật thú vị",
      "Giúp tôi nghĩ ra một cốt truyện"
    );
  }

  return suggestions.slice(0, 3);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
