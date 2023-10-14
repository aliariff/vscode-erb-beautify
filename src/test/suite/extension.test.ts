import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

suite("ERB Formatter/Beautify tests", () => {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Reads the content of a test file located in the `data` directory.
   *
   * @param {string} filename - The name of the file to be read.
   * @returns {string} - The content of the file in UTF-8 encoding.
   * @throws {Error} - Throws an error if the file cannot be read.
   */
  function readTestFile(filename: string): string {
    const testFilePath = path.resolve(
      __dirname,
      "../../../",
      "src/test/fixtures/",
      filename
    );
    return fs.readFileSync(testFilePath, "utf-8");
  }

  /**
   * Changes the configuration value
   * @param {string} key - The configuration key
   * @param {any} value - The new value
   * @returns {Promise<void>}
   */
  async function changeConfig(key: string, value: any): Promise<void> {
    await vscode.workspace
      .getConfiguration()
      .update(key, value, vscode.ConfigurationTarget.Global);
  }

  /**
   * Formats the whole document and asserts the result
   * @returns {Promise<void>}
   */
  async function formatWholeDocument(): Promise<void> {
    const document = await vscode.workspace.openTextDocument({
      language: "erb",
      content: readTestFile("sample_1_unformatted.html.erb"),
    });
    await vscode.window.showTextDocument(document);
    await sleep(1500); // we need to wait a little bit until extension is loaded
    await vscode.commands.executeCommand("editor.action.formatDocument");
    await sleep(500); // wait until extension executed
    assert.strictEqual(
      document.getText(),
      readTestFile("sample_1_formatted.html.erb")
    );
  }

  /**
   * Formats the selected range in the document and asserts the result
   * @returns {Promise<void>}
   */
  async function formatSelectionDocument(): Promise<void> {
    const document = await vscode.workspace.openTextDocument({
      language: "erb",
      content: readTestFile("sample_1_unformatted.html.erb"),
    });
    await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand("editor.action.selectAll");
    await sleep(1500); // we need to wait a little bit until extension is loaded
    await vscode.commands.executeCommand("editor.action.formatSelection");
    await sleep(500); // wait until extension executed
    assert.strictEqual(
      document.getText(),
      readTestFile("sample_1_formatted.html.erb")
    );
  }

  test("formats whole document without bundler", async () => {
    await changeConfig("vscode-erb-beautify.useBundler", false);
    await formatWholeDocument();
  });

  test("formats whole document using bundler", async () => {
    await changeConfig("vscode-erb-beautify.useBundler", true);
    await formatWholeDocument();
  });

  test("formats selection without bundler", async () => {
    await changeConfig("vscode-erb-beautify.useBundler", false);
    await formatSelectionDocument();
  });

  test("formats selection using bundler", async () => {
    await changeConfig("vscode-erb-beautify.useBundler", true);
    await formatSelectionDocument();
  });
});
