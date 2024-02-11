import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

suite("ERB Formatter/Beautify tests", () => {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Resolve the test file path located in the `fixtures` directory.
   * @param filename - The name of the file.
   * @returns The full path of the test file.
   */
  function resolveTestFilePath(filename: string): string {
    return path.resolve(__dirname, "../../", "src/test/fixtures/", filename);
  }

  /**
   * Reads the content of a test file located in the `fixtures` directory.
   * @param filename - The name of the file to be read.
   * @returns The content of the file in UTF-8 encoding.
   */
  function readTestFile(filename: string): string {
    return fs.readFileSync(resolveTestFilePath(filename), "utf-8");
  }

  /**
   * Changes a specific configuration value.
   * @param key - The configuration key.
   * @param value - The new value to set.
   */
  async function changeConfig(key: string, value: any): Promise<void> {
    await vscode.workspace
      .getConfiguration()
      .update(key, value, vscode.ConfigurationTarget.Global);
  }

  /**
   * Formats a document and asserts its content against an expected formatted version.
   * @param initialFile - The initial unformatted file name.
   * @param expectedFile - The expected formatted file name.
   * @param formatCommand - The vscode command to execute for formatting.
   */
  async function formatAndAssert(
    initialFile: string,
    expectedFile: string,
    formatCommand: string = "editor.action.formatDocument"
  ): Promise<void> {
    const document = await vscode.workspace.openTextDocument({
      language: "erb",
      content: readTestFile(initialFile),
    });

    await vscode.window.showTextDocument(document);
    await sleep(1500); // Allow time for the extension to load.

    if (formatCommand === "editor.action.formatSelection") {
      await vscode.commands.executeCommand("editor.action.selectAll");
    }

    await vscode.commands.executeCommand(formatCommand);
    await sleep(500); // Allow time for the formatting to occur.

    assert.strictEqual(document.getText(), readTestFile(expectedFile));
  }

  test("formats whole document without bundler", async () => {
    await changeConfig("vscode-erb-beautify.useBundler", false);
    await formatAndAssert(
      "sample_unformatted.html.erb",
      "sample_formatted.html.erb"
    );
  });

  test("formats whole document using bundler", async () => {
    await changeConfig("vscode-erb-beautify.useBundler", true);
    await formatAndAssert(
      "sample_unformatted.html.erb",
      "sample_formatted.html.erb"
    );
  });

  test("formats selection without bundler", async () => {
    await changeConfig("vscode-erb-beautify.useBundler", false);
    await formatAndAssert(
      "sample_unformatted.html.erb",
      "sample_formatted.html.erb",
      "editor.action.formatSelection"
    );
  });

  test("formats selection using bundler", async () => {
    await changeConfig("vscode-erb-beautify.useBundler", true);
    await formatAndAssert(
      "sample_unformatted.html.erb",
      "sample_formatted.html.erb",
      "editor.action.formatSelection"
    );
  });

  test("formats without encoding issue", async () => {
    await formatAndAssert(
      "encoding_unformatted.html.erb",
      "encoding_formatted.html.erb"
    );
  });
});
