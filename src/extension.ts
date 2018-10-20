"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as cp from "child_process";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider("erb", {
    provideDocumentFormattingEdits(
      document: vscode.TextDocument
    ): vscode.TextEdit[] {
      const beautifier = cp.spawn("htmlbeautifier", ["-v"]);

      beautifier.on("error", err => {
        if (err.message.includes("ENOENT")) {
          vscode.window.showErrorMessage(
            `couldn't find htmlbeautifier for formatting (ENOENT)`
          );
        } else {
          vscode.window.showErrorMessage(
            `couldn't run htmlbeautifier '${err.message}'`
          );
        }
      });

      beautifier.stderr.on("data", data => {
        console.log(`htmlbeautifier stderr ${data}`);
      });

      beautifier.stdout.on("data", data => {
        console.log(`htmlbeautifier stdout ${data}`);
      });

      beautifier.on("exit", code => {
        console.log(`htmlbeautifier is ready to go!`);
        cp.spawn("htmlbeautifier", [document.uri.fsPath]);
      });

      return [];
    }
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
