import * as vscode from "vscode";
import { GenkitChatbotService } from "./services/genkitChatbotService";
import { TemplateService } from "./services/templateService";
import { WEBVIEW_COMMANDS } from "./constants/genkit";
import { ChatbotCommand } from "./types/genkit";
import { getFlows, isGenkitReady } from "./genkit/config";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "tomisakae.chatbotView";

  private _view?: vscode.WebviewView;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private readonly _chatbotService: GenkitChatbotService;
  private readonly _templateService: TemplateService;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    this._chatbotService = GenkitChatbotService.getInstance();
    this._templateService = TemplateService.getInstance(extensionUri);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "media"),
        vscode.Uri.joinPath(this._extensionUri, "out"),
        vscode.Uri.joinPath(this._extensionUri, "dist"),
        vscode.Uri.joinPath(this._extensionUri, "src"),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      (message: ChatbotCommand) => {
        switch (message.command) {
          case WEBVIEW_COMMANDS.SEND_MESSAGE:
            this._handleUserMessage(message.data.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private async _handleUserMessage(userMessage: string) {
    if (!this._view) {
      return;
    }

    try {
      // Validate message
      this._chatbotService.validateMessage(userMessage);

      // Create user message and send immediately
      const userMsg = this._chatbotService.createMessage(userMessage, true);
      this._view.webview.postMessage({
        command: WEBVIEW_COMMANDS.ADD_MESSAGE,
        data: { message: userMsg },
      });

      // Sử dụng streaming thực từ Genkit
      await this._processMessageWithRealStreaming(userMessage);
    } catch (error) {
      console.error("Error processing message:", error);

      // Send error message to webview
      this._view.webview.postMessage({
        command: WEBVIEW_COMMANDS.ERROR,
        data: {
          message: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
          details: error instanceof Error ? error.stack : undefined,
        },
      });
    }
  }

  private async _processMessageWithRealStreaming(userMessage: string) {
    if (!this._view) return;

    // Gọi trực tiếp Genkit flow với streaming
    const flows = getFlows();
    if (!flows || !isGenkitReady()) {
      // Gửi error message
      const errorMsg = this._chatbotService.createMessage(
        "TomiChat chưa được cấu hình đúng cách. Vui lòng thiết lập API key.",
        false
      );
      this._view.webview.postMessage({
        command: WEBVIEW_COMMANDS.ADD_MESSAGE,
        data: { message: errorMsg },
      });
      return;
    }

    // Tạo bot message placeholder
    const botMessageId = `bot_${Date.now()}`;
    let accumulatedText = "";

    this._view.webview.postMessage({
      command: WEBVIEW_COMMANDS.ADD_MESSAGE,
      data: {
        message: {
          id: botMessageId,
          text: "",
          isUser: false,
          timestamp: new Date().toISOString(),
          isStreaming: true,
        },
      },
    });

    try {
      // Gọi flow với streaming callback
      const response = await flows.chatFlow({
        message: userMessage,
      });

      // Simulate streaming effect với response cuối cùng
      const chunks = this._splitIntoChunks(response.response);

      for (let i = 0; i < chunks.length; i++) {
        accumulatedText += chunks[i];

        this._view.webview.postMessage({
          command: WEBVIEW_COMMANDS.STREAMING_MESSAGE,
          data: {
            messageId: botMessageId,
            chunk: {
              content: accumulatedText,
              isComplete: i === chunks.length - 1,
              suggestions:
                i === chunks.length - 1 ? response.suggestions : undefined,
            },
          },
        });

        // Delay để tạo hiệu ứng streaming
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
      }
    } catch (error) {
      console.error("Error in streaming:", error);

      // Gửi error message
      this._view.webview.postMessage({
        command: WEBVIEW_COMMANDS.STREAMING_MESSAGE,
        data: {
          messageId: botMessageId,
          chunk: {
            content:
              "Xin lỗi, tôi đang gặp một chút vấn đề. Bạn có thể thử lại không? 🤔",
            isComplete: true,
            suggestions: [
              "Thử lại tin nhắn",
              "Kiểm tra kết nối mạng",
              "Báo cáo lỗi",
            ],
          },
        },
      });
    }
  }

  private _splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    const chunkSize = 50; // 50 characters per chunk

    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    return chunks;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return this._templateService.getHtmlForWebview(webview);
  }
}
