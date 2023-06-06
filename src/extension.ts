import * as vscode from "vscode";
import HtmlBeautifierProvider from "./formatter/htmlbeautifierProvider";

/**
 * Activates the extension
 * @param {vscode.ExtensionContext} context - The extension context
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      { scheme: "file", language: "erb" },
      new HtmlBeautifierProvider()
    ),
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      { scheme: "file", language: "erb" },
      new HtmlBeautifierProvider()
    )
  );
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {}
