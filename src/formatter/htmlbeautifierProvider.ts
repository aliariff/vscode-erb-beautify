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
    const start = new vscode.Position(0, 0); // Start at the beginning of the document.
    const end = document.lineAt(document.lineCount - 1).range.end; // End at the last line of the document.
    const range = new vscode.Range(start, end); // Range for the entire document.
    return this.formatDocument(document, range); // Format the entire document.
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
      this.htmlbeautifier.logChannel.info(`Ignoring ${document.fileName}`);
      return [];
    }

    return this.htmlbeautifier.format(document.getText(range)).then(
      (result) => [new vscode.TextEdit(range, result)],
      (error) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const shortFileName = document.fileName.split("/").pop();
        const fullMessage = `Error formatting ${shortFileName}: ${errorMessage}`;
        this.htmlbeautifier.logChannel.error(fullMessage);
        vscode.window.showErrorMessage(fullMessage);
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
