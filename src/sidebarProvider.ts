import * as vscode from "vscode";
import { ChatbotService } from "./services/chatbotService";
import { TemplateService } from "./services/templateService";
import { WEBVIEW_COMMANDS } from "./constants/chatbot";
import { ChatbotCommand } from "./types/chatbot";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "tomisakae.chatbotView";

  private _view?: vscode.WebviewView;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private readonly _chatbotService: ChatbotService;
  private readonly _templateService: TemplateService;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    this._chatbotService = ChatbotService.getInstance();
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

    // Validate message
    if (!this._chatbotService.validateMessage(userMessage)) {
      return;
    }

    try {
      // Process message using service
      const { userMsg, botMsg } = await this._chatbotService.processMessage(
        userMessage
      );

      // Send user message to webview
      this._view.webview.postMessage({
        command: WEBVIEW_COMMANDS.ADD_MESSAGE,
        data: { message: userMsg },
      });

      // Send bot response to webview
      this._view.webview.postMessage({
        command: WEBVIEW_COMMANDS.ADD_MESSAGE,
        data: { message: botMsg },
      });
    } catch (error) {
      console.error("Error processing message:", error);
      // Send error message to webview
      this._view.webview.postMessage({
        command: WEBVIEW_COMMANDS.ADD_MESSAGE,
        data: {
          message: this._chatbotService.createMessage(
            "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
            false
          ),
        },
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return this._templateService.getHtmlForWebview(webview);
  }
}
