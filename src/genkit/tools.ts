import { z } from "zod";
import { getAI, isGenkitReady } from "./config";
import { ConfigService } from "../services/configService";
import { googleAI } from "@genkit-ai/googleai";

/**
 * Khởi tạo tools cho TomiChat
 */
export function initializeTools() {
  const ai = getAI();
  if (!ai) {
    console.warn("⚠️ AI chưa được khởi tạo, không thể tạo tools");
    return null;
  }

  /**
   * Tool tạo nhân vật cho câu chuyện
   */
  const createCharacterTool = ai.defineTool(
    {
      name: "createCharacter",
      description:
        "Tạo nhân vật chi tiết cho câu chuyện với tính cách, ngoại hình và background",
      inputSchema: z.object({
        name: z.string().describe("Tên nhân vật"),
        role: z
          .string()
          .describe("Vai trò trong câu chuyện (chính, phụ, phản diện)"),
        genre: z.string().optional().describe("Thể loại câu chuyện"),
      }),
      outputSchema: z.object({
        name: z.string(),
        appearance: z.string(),
        personality: z.string(),
        background: z.string(),
        skills: z.array(z.string()),
        motivation: z.string(),
      }),
    },
    async (input) => {
      const { name, role, genre = "phiêu lưu" } = input;

      const prompt = `Tạo nhân vật chi tiết cho câu chuyện ${genre}:
Tên: ${name}
Vai trò: ${role}

Hãy tạo ra:
- Ngoại hình chi tiết
- Tính cách độc đáo
- Background thú vị
- Kỹ năng đặc biệt
- Động lực hành động

Trả về JSON với các trường: name, appearance, personality, background, skills, motivation`;

      try {
        const configService = ConfigService.getInstance();
        const response = await ai.generate({
          model: googleAI.model(configService.getModel()),
          prompt,
          output: {
            schema: z.object({
              name: z.string(),
              appearance: z.string(),
              personality: z.string(),
              background: z.string(),
              skills: z.array(z.string()),
              motivation: z.string(),
            }),
          },
        });

        return (
          response.output || {
            name,
            appearance: "Một nhân vật bí ẩn",
            personality: "Thông minh và dũng cảm",
            background: "Có quá khứ đầy bí ẩn",
            skills: ["Thông minh", "Dũng cảm"],
            motivation: "Tìm kiếm sự thật",
          }
        );
      } catch (error) {
        console.error("Lỗi tạo nhân vật:", error);
        throw new Error("Không thể tạo nhân vật");
      }
    }
  );

  /**
   * Tool tạo setting/bối cảnh cho câu chuyện
   */
  const createSettingTool = ai.defineTool(
    {
      name: "createSetting",
      description:
        "Tạo bối cảnh chi tiết cho câu chuyện bao gồm thời gian, địa điểm và môi trường",
      inputSchema: z.object({
        timeperiod: z
          .string()
          .describe("Thời đại (hiện đại, cổ đại, tương lai, etc.)"),
        location: z.string().describe("Địa điểm chính"),
        genre: z.string().optional().describe("Thể loại câu chuyện"),
      }),
      outputSchema: z.object({
        timeperiod: z.string(),
        location: z.string(),
        environment: z.string(),
        culture: z.string(),
        technology: z.string(),
        challenges: z.array(z.string()),
      }),
    },
    async (input) => {
      const { timeperiod, location, genre = "phiêu lưu" } = input;

      const prompt = `Tạo bối cảnh chi tiết cho câu chuyện ${genre}:
Thời đại: ${timeperiod}
Địa điểm: ${location}

Hãy mô tả:
- Môi trường sống
- Văn hóa xã hội
- Trình độ công nghệ
- Thử thách và nguy hiểm

Trả về JSON với các trường: timeperiod, location, environment, culture, technology, challenges`;

      try {
        const configService = ConfigService.getInstance();
        const response = await ai.generate({
          model: googleAI.model(configService.getModel()),
          prompt,
          output: {
            schema: z.object({
              timeperiod: z.string(),
              location: z.string(),
              environment: z.string(),
              culture: z.string(),
              technology: z.string(),
              challenges: z.array(z.string()),
            }),
          },
        });

        return (
          response.output || {
            timeperiod,
            location,
            environment: "Một thế giới đầy bí ẩn",
            culture: "Văn hóa phong phú",
            technology: "Công nghệ phù hợp thời đại",
            challenges: ["Khó khăn", "Thử thách"],
          }
        );
      } catch (error) {
        console.error("Lỗi tạo bối cảnh:", error);
        throw new Error("Không thể tạo bối cảnh");
      }
    }
  );

  /**
   * Tool tạo plot twist cho câu chuyện
   */
  const createPlotTwistTool = ai.defineTool(
    {
      name: "createPlotTwist",
      description: "Tạo tình tiết bất ngờ thú vị cho câu chuyện",
      inputSchema: z.object({
        currentPlot: z.string().describe("Cốt truyện hiện tại"),
        characters: z.array(z.string()).describe("Danh sách nhân vật"),
        genre: z.string().optional().describe("Thể loại câu chuyện"),
      }),
      outputSchema: z.object({
        twist: z.string(),
        explanation: z.string(),
        impact: z.string(),
        newDirection: z.string(),
      }),
    },
    async (input) => {
      const { currentPlot, characters, genre = "phiêu lưu" } = input;

      const prompt = `Tạo tình tiết bất ngờ cho câu chuyện ${genre}:
Cốt truyện hiện tại: ${currentPlot}
Nhân vật: ${characters.join(", ")}

Hãy tạo ra:
- Tình tiết bất ngờ thú vị
- Giải thích logic
- Tác động đến câu chuyện
- Hướng phát triển mới

Trả về JSON với các trường: twist, explanation, impact, newDirection`;

      try {
        const configService = ConfigService.getInstance();
        const response = await ai.generate({
          model: googleAI.model(configService.getModel()),
          prompt,
          output: {
            schema: z.object({
              twist: z.string(),
              explanation: z.string(),
              impact: z.string(),
              newDirection: z.string(),
            }),
          },
        });

        return (
          response.output || {
            twist: "Một bí mật được tiết lộ",
            explanation: "Điều này thay đổi mọi thứ",
            impact: "Nhân vật phải đối mặt với thực tế mới",
            newDirection: "Câu chuyện đi theo hướng khác",
          }
        );
      } catch (error) {
        console.error("Lỗi tạo plot twist:", error);
        throw new Error("Không thể tạo tình tiết bất ngờ");
      }
    }
  );

  /**
   * Tool phân tích và cải thiện câu chuyện
   */
  const analyzeStoryTool = ai.defineTool(
    {
      name: "analyzeStory",
      description: "Phân tích câu chuyện và đưa ra gợi ý cải thiện",
      inputSchema: z.object({
        story: z.string().describe("Nội dung câu chuyện"),
        focusArea: z
          .string()
          .optional()
          .describe(
            "Khía cạnh cần tập trung (plot, character, dialogue, etc.)"
          ),
      }),
      outputSchema: z.object({
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        suggestions: z.array(z.string()),
        rating: z.number().min(1).max(10),
      }),
    },
    async (input) => {
      const { story, focusArea = "tổng thể" } = input;

      const prompt = `Phân tích câu chuyện sau và đưa ra đánh giá về ${focusArea}:

${story}

Hãy đánh giá:
- Điểm mạnh của câu chuyện
- Điểm yếu cần cải thiện
- Gợi ý cụ thể để làm hay hơn
- Điểm số từ 1-10

Trả về JSON với các trường: strengths, weaknesses, suggestions, rating`;

      try {
        const configService = ConfigService.getInstance();
        const response = await ai.generate({
          model: googleAI.model(configService.getModel()),
          prompt,
          output: {
            schema: z.object({
              strengths: z.array(z.string()),
              weaknesses: z.array(z.string()),
              suggestions: z.array(z.string()),
              rating: z.number().min(1).max(10),
            }),
          },
        });

        return (
          response.output || {
            strengths: ["Có ý tưởng hay"],
            weaknesses: ["Cần phát triển thêm"],
            suggestions: ["Thêm chi tiết", "Phát triển nhân vật"],
            rating: 7,
          }
        );
      } catch (error) {
        console.error("Lỗi phân tích câu chuyện:", error);
        throw new Error("Không thể phân tích câu chuyện");
      }
    }
  );

  return {
    createCharacterTool,
    createSettingTool,
    createPlotTwistTool,
    analyzeStoryTool,
  };
}
