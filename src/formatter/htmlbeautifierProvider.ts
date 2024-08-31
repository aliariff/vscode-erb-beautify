import * as vscode from "vscode";
import HtmlBeautifier from "./htmlbeautifier";
import micromatch from "micromatch";

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
   * Provides formatting edits for the entire document.
   * @param document - The document to be formatted.
   * @param options - The formatting options.
   * @param token - The cancellation token.
   * @returns The formatting edits.
   */
  public provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    return this.formatDocument(
      document,
      new vscode.Range(0, 0, Infinity, Infinity)
    );
  }

  /**
   * Provides formatting edits for a specific range within the document.
   * @param document - The document to be formatted.
   * @param range - The range to be formatted.
   * @param options - The formatting options.
   * @param token - The cancellation token.
   * @returns The formatting edits.
   */
  public provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    return this.formatDocument(document, range);
  }

  /**
   * Formats the document or a specific range within the document.
   * @param document - The document to be formatted.
   * @param range - The range to be formatted.
   * @returns The formatting edits.
   */
  private formatDocument(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    if (this.shouldIgnore(document)) {
      console.log(`Ignoring ${document.fileName}`);
      return [];
    }

    return this.htmlbeautifier.format(document.getText(range)).then(
      (result) => [new vscode.TextEdit(range, result)],
      (err) => {
        console.error(`Error formatting ${document.fileName}:`, err);
        return [];
      }
    );
  }

  /**
   * Checks if the document should be ignored based on user-defined patterns.
   * @param document - The document to be checked.
   * @returns Whether the document should be ignored.
   */
  private shouldIgnore(document: vscode.TextDocument): boolean {
    const config = vscode.workspace.getConfiguration("vscode-erb-beautify");
    const ignorePatterns: string[] = config.get("ignoreFormatFilePatterns", []);
    return micromatch.isMatch(document.fileName, ignorePatterns);
  }
}
