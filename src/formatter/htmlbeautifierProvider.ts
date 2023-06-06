import * as vscode from "vscode";
import HtmlBeautifier from "./htmlbeautifier";

export default class HtmlBeautifierProvider
  implements
    vscode.DocumentFormattingEditProvider,
    vscode.DocumentRangeFormattingEditProvider
{
  private htmlbeautifier: HtmlBeautifier;

  constructor() {
    this.htmlbeautifier = new HtmlBeautifier();
  }

  /**
   * Provides formatting edits for the entire document
   * @param {vscode.TextDocument} document - The document to be formatted
   * @param {vscode.FormattingOptions} options - The formatting options
   * @param {vscode.CancellationToken} token - The cancellation token
   * @returns {vscode.ProviderResult<vscode.TextEdit[]>} The formatting edits
   */
  public provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    return this.htmlbeautifier.format(document.getText()).then(
      (result) => {
        return [
          new vscode.TextEdit(
            document.validateRange(new vscode.Range(0, 0, Infinity, Infinity)),
            result
          ),
        ];
      },
      (err) => {
        // will be handled in format
        return [];
      }
    );
  }

  /**
   * Provides formatting edits for a specific range within the document
   * @param {vscode.TextDocument} document - The document to be formatted
   * @param {vscode.Range} range - The range to be formatted
   * @param {vscode.FormattingOptions} options - The formatting options
   * @param {vscode.CancellationToken} token - The cancellation token
   * @returns {vscode.ProviderResult<vscode.TextEdit[]>} The formatting edits
   */
  public provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    return this.htmlbeautifier.format(document.getText(range)).then(
      (result) => {
        return [new vscode.TextEdit(range, result)];
      },
      (err) => {
        // will be handled in format
        return [];
      }
    );
  }
}
