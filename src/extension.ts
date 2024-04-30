import * as vscode from "vscode";
import HtmlBeautifierProvider from "./formatter/htmlbeautifierProvider";

/**
 * Activates the extension
 * @param {vscode.ExtensionContext} context - The extension context
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      {
        language: "erb",
        pattern: "**/*.html.erb",
      },
      new HtmlBeautifierProvider()
    ),
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      {
        language: "erb",
        pattern: "**/*.html.erb",
      },
      new HtmlBeautifierProvider()
    )
  );
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {}
