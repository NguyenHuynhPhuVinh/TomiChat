import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { CHATBOT_CONFIG } from "../constants/chatbot";

export class TemplateService {
  private static instance: TemplateService;
  private extensionUri: vscode.Uri;

  private constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  public static getInstance(extensionUri: vscode.Uri): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService(extensionUri);
    }
    return TemplateService.instance;
  }

  /**
   * Get the HTML content for the webview
   */
  public getHtmlForWebview(webview: vscode.Webview): string {
    // Get paths to resources
    const cssPath = this.getWebviewUri(webview, "dist", "main.css");
    const jsPath = this.getWebviewUri(
      webview,
      "src",
      "webview",
      "assets",
      "js",
      "chatbot.js"
    );

    // Read the HTML template
    const templatePath = path.join(
      this.extensionUri.fsPath,
      "src",
      "webview",
      "templates",
      "chatbot.html"
    );

    let html = fs.readFileSync(templatePath, "utf8");

    // Replace placeholders
    html = html.replace(/\{\{title\}\}/g, CHATBOT_CONFIG.title);
    html = html.replace(/\{\{description\}\}/g, CHATBOT_CONFIG.description);
    html = html.replace(
      /\{\{welcomeMessage\}\}/g,
      CHATBOT_CONFIG.welcomeMessage
    );
    html = html.replace(/\{\{placeholder\}\}/g, CHATBOT_CONFIG.placeholder);
    html = html.replace(/\{\{cssPath\}\}/g, cssPath.toString());
    html = html.replace(/\{\{jsPath\}\}/g, jsPath.toString());

    return html;
  }

  /**
   * Get a webview URI for a resource
   */
  private getWebviewUri(
    webview: vscode.Webview,
    ...pathSegments: string[]
  ): vscode.Uri {
    const resourcePath = vscode.Uri.joinPath(
      this.extensionUri,
      ...pathSegments
    );
    return webview.asWebviewUri(resourcePath);
  }

  /**
   * Get CSS content with processed Tailwind
   */
  public async getProcessedCss(): Promise<string> {
    // In a real implementation, you might want to process the CSS here
    // For now, we'll return the raw CSS
    const cssPath = path.join(
      this.extensionUri.fsPath,
      "src",
      "webview",
      "assets",
      "css",
      "main.css"
    );

    return fs.readFileSync(cssPath, "utf8");
  }
}
