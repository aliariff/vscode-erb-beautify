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
