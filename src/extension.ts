// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { SidebarProvider } from "./sidebarProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "tomisakae" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "tomisakae.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from TomiChat!");
    }
  );

  // Register sidebar provider
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  const sidebarDisposable = vscode.window.registerWebviewViewProvider(
    SidebarProvider.viewType,
    sidebarProvider
  );

  context.subscriptions.push(disposable, sidebarDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
