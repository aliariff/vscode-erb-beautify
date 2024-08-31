import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

suite("ERB Formatter/Beautify Tests", () => {
  /**
   * Sleeps for a given number of milliseconds.
   * @param ms - Milliseconds to sleep.
   * @returns A promise that resolves after the specified delay.
   */
  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Resolves the test file path located in the `fixtures` directory.
   * @param filename - The name of the file.
   * @returns The full path of the test file.
   */
  const resolveTestFilePath = (filename: string): string =>
    path.resolve(__dirname, "../../", "src/test/fixtures/", filename);

  /**
   * Reads the content of a test file located in the `fixtures` directory.
   * @param filename - The name of the file to be read.
   * @returns The content of the file in UTF-8 encoding.
   */
  const readTestFile = (filename: string): string =>
    fs.readFileSync(resolveTestFilePath(filename), "utf-8");

  /**
   * Changes a specific configuration value.
   * @param key - The configuration key.
   * @param value - The new value to set.
   */
  const changeConfig = async (key: string, value: any): Promise<void> => {
    await vscode.workspace
      .getConfiguration()
      .update(key, value, vscode.ConfigurationTarget.Global);
  };

  /**
   * Formats a document and asserts its content against an expected formatted version.
   * @param initialFile - The initial unformatted file name.
   * @param expectedFile - The expected formatted file name.
   * @param formatCommand - The vscode command to execute for formatting.
   */
  const formatAndAssert = async (
    initialFile: string,
    expectedFile: string,
    formatCommand: string = "editor.action.formatDocument"
  ): Promise<void> => {
    const document = await vscode.workspace.openTextDocument(
      resolveTestFilePath(initialFile)
    );

    await vscode.window.showTextDocument(document);
    await sleep(1500); // Allow time for the extension to load.

    if (formatCommand === "editor.action.formatSelection") {
      await vscode.commands.executeCommand("editor.action.selectAll");
    }

    await vscode.commands.executeCommand(formatCommand);
    await sleep(500); // Allow time for the formatting to occur.

    assert.strictEqual(
      document.getText(),
      readTestFile(expectedFile),
      `Formatting did not produce the expected result for ${initialFile}`
    );
  };

  /**
   * Runs a series of formatting tests with various configurations.
   */
  const runFormattingTests = async (
    useBundler: boolean,
    formatSelection = false
  ) => {
    const formatCommand = formatSelection
      ? "editor.action.formatSelection"
      : "editor.action.formatDocument";

    await changeConfig("vscode-erb-beautify.useBundler", useBundler);
    await formatAndAssert(
      "sample_unformatted.html.erb",
      "sample_formatted.html.erb",
      formatCommand
    );
  };

  test("Formats whole document without bundler", async () => {
    await runFormattingTests(false);
  });

  test("Formats whole document using bundler", async () => {
    await runFormattingTests(true);
  });

  test("Formats selection without bundler", async () => {
    await runFormattingTests(false, true);
  });

  test("Formats selection using bundler", async () => {
    await runFormattingTests(true, true);
  });

  test("Formats without encoding issue", async () => {
    await formatAndAssert(
      "encoding_unformatted.html.erb",
      "encoding_formatted.html.erb"
    );
  });

  test("Formats ERB without final newline, insertFinalNewline=false", async () => {
    await changeConfig("files.insertFinalNewline", false);
    await formatAndAssert(
      "without_final_newline.html.erb",
      "without_final_newline.html.erb"
    );
  });

  test("Formats ERB without final newline, insertFinalNewline=true", async () => {
    await changeConfig("files.insertFinalNewline", true);
    await formatAndAssert(
      "without_final_newline.html.erb",
      "with_final_newline.html.erb"
    );
  });

  test("Formats ERB with final newline, insertFinalNewline=true", async () => {
    await changeConfig("files.insertFinalNewline", true);
    await formatAndAssert(
      "with_final_newline.html.erb",
      "with_final_newline.html.erb"
    );
  });

  test("Formats ERB with final newline, insertFinalNewline=false", async () => {
    await changeConfig("files.insertFinalNewline", false);
    await formatAndAssert(
      "with_final_newline.html.erb",
      "with_final_newline.html.erb"
    );
  });

  test("Ignores formatting for files matching ignore patterns", async () => {
    await changeConfig("vscode-erb-beautify.ignoreFormatFilePatterns", [
      "**/*.text.erb",
    ]);

    const initialFile = "ignored_file.text.erb";
    const initialContent = readTestFile(initialFile);

    await formatAndAssert(initialFile, initialFile);
    assert.strictEqual(
      readTestFile(initialFile),
      initialContent,
      "File content should remain unchanged when ignored"
    );
  });
});
