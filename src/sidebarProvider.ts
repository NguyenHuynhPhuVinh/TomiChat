import * as vscode from "vscode";
import { GenkitChatbotService } from "./services/genkitChatbotService";
import { TemplateService } from "./services/templateService";
import { WEBVIEW_COMMANDS } from "./constants/genkit";
import { ChatbotCommand, StreamingChunk } from "./types/genkit";

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

      // Send initial bot message placeholder first
      const botMessageId = `bot_${Date.now()}`;
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

      // Process message with streaming support
      await this._chatbotService.processMessage(
        userMessage,
        (chunk: StreamingChunk) => {
          // Handle streaming chunks
          if (this._view) {
            this._view.webview.postMessage({
              command: WEBVIEW_COMMANDS.STREAMING_MESSAGE,
              data: {
                messageId: botMessageId,
                chunk,
              },
            });
          }
        }
      );
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

  private _getHtmlForWebview(webview: vscode.Webview) {
    return this._templateService.getHtmlForWebview(webview);
  }
}
