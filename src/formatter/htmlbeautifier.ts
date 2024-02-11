import * as vscode from "vscode";
import * as cp from "child_process";
const isWsl = require("is-wsl");

export default class HtmlBeautifier {
  /**
   * Formats the given input using HTML Beautifier
   * @param {string} input - The input to be formatted
   * @returns {Promise<string>} The formatted input
   */
  public async format(input: string): Promise<string> {
    try {
      const cmd = `${this.exe} ${this.cliOptions.join(
        " "
      )} with custom env ${JSON.stringify(this.customEnvVars)}`;
      console.log(`Formatting ERB with command: ${cmd}`);
      console.time(cmd);

      const result = await this.executeCommand(input);

      console.timeEnd(cmd);
      return result;
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      vscode.window.showErrorMessage(
        `Error occurred while formatting: ${errorMessage}`
      );
      throw error;
    }
  }

  private executeCommand(input: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const htmlbeautifier = cp.spawn(this.exe, this.cliOptions, {
        cwd: vscode.workspace.rootPath || __dirname,
        env: {
          ...process.env,
          ...this.customEnvVars,
        },
      });

      if (htmlbeautifier.stdin === null || htmlbeautifier.stdout === null) {
        const msg = "Couldn't initialize STDIN or STDOUT";
        console.warn(msg);
        vscode.window.showErrorMessage(msg);
        reject(new Error(msg));
        return;
      }

      let formattedResult = "";
      let errorMessage = "";
      let stdoutChunks: Buffer[] = [];
      let stderrChunks: Buffer[] = [];

      htmlbeautifier.on("error", (err) => {
        console.warn(err);
        vscode.window.showErrorMessage(
          `Couldn't run ${this.exe} '${err.message}'`
        );
        reject(err);
      });

      htmlbeautifier.stdout.on("data", (chunk) => {
        stdoutChunks.push(chunk);
      });

      htmlbeautifier.stdout.on("end", () => {
        let result = Buffer.concat(stdoutChunks).toString();
        formattedResult = this.handleFinalNewline(input, result);
      });

      htmlbeautifier.stderr.on("data", (chunk) => {
        stderrChunks.push(chunk);
      });

      htmlbeautifier.stderr.on("end", () => {
        errorMessage = Buffer.concat(stderrChunks).toString();
      });

      htmlbeautifier.on("exit", (code) => {
        if (code) {
          vscode.window.showErrorMessage(
            `Failed with exit code: ${code}. '${errorMessage}'`
          );
          reject(new Error(`Command failed with exit code ${code}`));
        } else {
          resolve(formattedResult);
        }
      });

      htmlbeautifier.stdin.write(input);
      htmlbeautifier.stdin.end();
    });
  }

  /**
   * Returns the executable path for HTML Beautifier
   * @returns {string} The executable path
   */
  private get exe(): string {
    const config = vscode.workspace.getConfiguration("vscode-erb-beautify");
    const executePath = config.get("executePath", "htmlbeautifier");
    const useBundler = config.get("useBundler", false);
    const bundlerPath = config.get("bundlerPath", "bundle");
    const ext = process.platform === "win32" && !isWsl ? ".bat" : "";
    return useBundler ? `${bundlerPath}${ext}` : `${executePath}${ext}`;
  }

  /**
   * Returns the command-line options for HTML Beautifier
   * @returns {string[]} The command-line options
   */
  private get cliOptions(): string[] {
    const config = vscode.workspace.getConfiguration("vscode-erb-beautify");
    const acc: string[] = [];

    if (config.get("useBundler")) {
      acc.push("exec", "htmlbeautifier");
    }

    return Object.keys(config).reduce(function (acc, key) {
      switch (key) {
        case "indentBy":
          acc.push("--indent-by", config[key]);
          break;
        case "keepBlankLines":
          acc.push("--keep-blank-lines", config[key]);
          break;
        case "stopOnErrors":
          if (config["stopOnErrors"] === true) {
            acc.push("--stop-on-errors");
          }
          break;
        case "tab":
          if (config["tab"] === true) {
            acc.push("--tab");
          }
          break;
        case "tabStops":
          acc.push("--tab-stops", config[key]);
          break;
      }
      return acc;
    }, acc);
  }

  /**
   * Retrieves the custom environment variables from the configuration
   * @returns {Record<string, string>} The custom environment variables
   */
  private get customEnvVars(): Record<string, string> {
    const config = vscode.workspace.getConfiguration("vscode-erb-beautify");
    const customEnvVar = config.get("customEnvVar", {}) as Record<
      string,
      string
    >;
    return customEnvVar;
  }

  /**
   * Adjusts the final newline of the result string based on the VS Code configuration and the input string.
   * @param {string} input - The original input string.
   * @param {string} result - The result string to be processed.
   * @returns {string} The processed result string.
   */
  private handleFinalNewline(input: string, result: string): string {
    // Get the 'insertFinalNewline' setting from VS Code configuration
    const insertFinalNewline = vscode.workspace
      .getConfiguration()
      .get("files.insertFinalNewline");

    // Check if the result string ends with a newline
    const resultEndsWithNewline =
      result.endsWith("\n") || result.endsWith("\r\n");

    // If 'insertFinalNewline' is true and the result does not end with a newline
    if (insertFinalNewline && !resultEndsWithNewline) {
      // Get the 'files.eol' setting from VS Code configuration
      const eol = vscode.workspace.getConfiguration().get("files.eol");

      // Set the newline character(s) based on the 'files.eol' setting and the platform
      let newline = eol;
      if (eol === "auto") {
        newline = process.platform === "win32" ? "\r\n" : "\n";
      }

      // Append the newline to the result
      result += newline;
    } else if (!insertFinalNewline) {
      // If 'insertFinalNewline' is false, adjust the result's ending to match the input's ending

      // Get the newline character(s) used in the input and result
      const inputNewline = this.getNewline(input);
      const resultNewline = this.getNewline(result);

      // If the input and result use different newline character(s)
      if (inputNewline !== resultNewline) {
        // Remove the newline from the end of the result
        result = result.slice(0, -resultNewline.length);

        // Append the newline from the input to the result
        result += inputNewline;
      }
    }

    // Return the processed result
    return result;
  }

  /**
   * Determines the type of newline used in the input string.
   * @param {string} input - The input string.
   * @returns {string} The newline character(s) used in the input string, or an empty string if the input does not end with a newline.
   */
  private getNewline(input: string): string {
    // If the input ends with a Windows-style newline, return '\r\n'
    if (input.endsWith("\r\n")) {
      return "\r\n";
    }
    // If the input ends with a Unix-style newline, return '\n'
    else if (input.endsWith("\n")) {
      return "\n";
    }
    // If the input does not end with a newline, return an empty string
    return "";
  }
}
