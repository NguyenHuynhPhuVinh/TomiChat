// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { SidebarProvider } from "./sidebarProvider";
import { ConfigService } from "./services/configService";
import { initializeAI, reloadAI } from "./genkit/config";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("🚀 TomiChat extension is now active!");

  // Khởi tạo ConfigService và AI
  const configService = ConfigService.getInstance();
  initializeAI();

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const helloWorldCommand = vscode.commands.registerCommand(
    "tomisakae.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from TomiChat!");
    }
  );

  // Command để thiết lập API Key
  const setApiKeyCommand = vscode.commands.registerCommand(
    "tomisakae.setApiKey",
    async () => {
      const success = await configService.showApiKeySetupDialog();
      if (success) {
        // Reload AI với API key mới
        const aiInitialized = reloadAI();
        if (aiInitialized) {
          vscode.window.showInformationMessage("🤖 TomiChat AI đã sẵn sàng!");
        } else {
          vscode.window.showErrorMessage(
            "❌ Không thể khởi tạo AI. Vui lòng kiểm tra API key."
          );
        }
      }
    }
  );

  // Command để xóa API Key
  const clearApiKeyCommand = vscode.commands.registerCommand(
    "tomisakae.clearApiKey",
    async () => {
      const success = await configService.showClearApiKeyDialog();
      if (success) {
        // Reload AI (sẽ thất bại vì không có API key)
        reloadAI();
        vscode.window.showWarningMessage("⚠️ TomiChat AI đã bị vô hiệu hóa");
      }
    }
  );

  // Register sidebar provider
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  const sidebarDisposable = vscode.window.registerWebviewViewProvider(
    SidebarProvider.viewType,
    sidebarProvider
  );

  // Lắng nghe thay đổi cấu hình
  const configChangeDisposable = configService.onConfigurationChanged(() => {
    console.log("📝 Cấu hình TomiChat đã thay đổi, đang reload AI...");
    reloadAI();
  });

  // Hiển thị thông báo nếu chưa có API key
  if (!configService.isConfigValid()) {
    vscode.window
      .showWarningMessage(
        "⚠️ TomiChat chưa được cấu hình. Bạn cần thiết lập API key để sử dụng.",
        "Thiết lập ngay",
        "Hướng dẫn"
      )
      .then((choice) => {
        if (choice === "Thiết lập ngay") {
          vscode.commands.executeCommand("tomisakae.setApiKey");
        } else if (choice === "Hướng dẫn") {
          configService.showApiKeyGuide();
        }
      });
  }

  context.subscriptions.push(
    helloWorldCommand,
    setApiKeyCommand,
    clearApiKeyCommand,
    sidebarDisposable,
    configChangeDisposable
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
