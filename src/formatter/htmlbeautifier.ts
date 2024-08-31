import * as vscode from "vscode";
import * as cp from "child_process";
const isWsl = require("is-wsl");

export default class HtmlBeautifier {
  private logChannel: vscode.LogOutputChannel;

  constructor() {
    this.logChannel = vscode.window.createOutputChannel("ERB Beautifier", {
      log: true,
    });
  }

  /**
   * Formats the input string using HTML Beautifier.
   * @param input The input string to be formatted.
   * @returns A promise that resolves to the formatted string.
   */
  public async format(input: string): Promise<string> {
    try {
      const startTime = Date.now();
      const result = await this.executeCommand(input);
      const duration = Date.now() - startTime;
      this.logChannel.info(
        `Formatting completed successfully in ${duration}ms.`
      );
      return result;
    } catch (error) {
      this.handleError(error, "Error occurred while formatting");
      throw error;
    }
  }

  /**
   * Executes the formatting command with the provided input.
   * @param input The input to format.
   * @returns A promise that resolves to the formatted output.
   */
  private executeCommand(input: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Handle spawn EINVAL error on Windows. See https://github.com/nodejs/node/issues/52554
      const shellOptions = this.isWindows() ? { shell: true } : {};
      const htmlbeautifier = cp.spawn(this.exe, this.cliOptions, {
        cwd: vscode.workspace.rootPath || __dirname,
        env: {
          ...process.env,
          ...this.customEnvVars,
        },
        ...shellOptions,
      });

      const fullCommand = `${this.exe} ${this.cliOptions.join(" ")} (cwd: ${
        vscode.workspace.rootPath || __dirname
      }) with custom env: ${JSON.stringify(this.customEnvVars)}`;
      this.logChannel.info(`Formatting ERB with command: ${fullCommand}`);

      if (!htmlbeautifier.stdin || !htmlbeautifier.stdout) {
        return this.handleSpawnError(
          reject,
          "Couldn't initialize STDIN or STDOUT"
        );
      }

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      htmlbeautifier.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
      htmlbeautifier.stderr.on("data", (chunk) => stderrChunks.push(chunk));

      htmlbeautifier.on("error", (err) =>
        this.handleSpawnError(
          reject,
          `Couldn't run ${this.exe}: ${err.message}`,
          err
        )
      );

      htmlbeautifier.on("exit", (code) => {
        const formattedResult = Buffer.concat(stdoutChunks).toString();
        const finalResult = this.handleFinalNewline(input, formattedResult);
        const errorMessage = Buffer.concat(stderrChunks).toString();
        this.handleExit(code, finalResult, errorMessage, resolve, reject);
      });

      htmlbeautifier.stdin.write(input);
      htmlbeautifier.stdin.end();
    });
  }

  /**
   * Handles errors during process spawning.
   * @param reject The promise reject function.
   * @param message The error message to log and show to the user.
   * @param err Optional error object.
   */
  private handleSpawnError(
    reject: (reason?: any) => void,
    message: string,
    err?: Error
  ): void {
    this.logChannel.warn(message);
    vscode.window.showErrorMessage(message);
    if (err) {
      this.logChannel.warn(err.message);
    }
    reject(err || new Error(message));
  }

  /**
   * Handles the process exit event and resolves or rejects the promise.
   * @param code The process exit code.
   * @param result The formatted result.
   * @param errorMessage The error message, if any.
   * @param resolve The promise resolve function.
   * @param reject The promise reject function.
   */
  private handleExit(
    code: number | null,
    result: string,
    errorMessage: string,
    resolve: (value: string | PromiseLike<string>) => void,
    reject: (reason?: any) => void
  ): void {
    if (code && code !== 0) {
      const error = `Failed with exit code: ${code}. ${errorMessage}`;
      this.logChannel.error(error);
      vscode.window.showErrorMessage(error);
      reject(new Error(error));
    } else {
      resolve(result);
    }
  }

  /**
   * Handles errors by logging and displaying a message to the user.
   * @param error The error object or message.
   * @param userMessage The message to display to the user.
   */
  private handleError(error: any, userMessage: string): void {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    this.logChannel.error(errorMessage);
    vscode.window.showErrorMessage(`${userMessage}: ${errorMessage}`);
  }

  /**
   * Gets the executable path for HTML Beautifier based on the configuration.
   * @returns The path to the executable.
   */
  private get exe(): string {
    const config = vscode.workspace.getConfiguration("vscode-erb-beautify");
    const executePath = config.get("executePath", "htmlbeautifier");
    const useBundler = config.get("useBundler", false);
    const bundlerPath = config.get("bundlerPath", "bundle");
    const ext = this.isWindows() ? ".bat" : "";
    return useBundler ? `${bundlerPath}${ext}` : `${executePath}${ext}`;
  }

  /**
   * Checks if the current platform is Windows (excluding WSL).
   * @returns True if the platform is Windows; false otherwise.
   */
  private isWindows(): boolean {
    return process.platform === "win32" && !isWsl;
  }

  /**
   * Retrieves the command-line options for HTML Beautifier from the configuration.
   * @returns An array of command-line options.
   */
  private get cliOptions(): string[] {
    const config = vscode.workspace.getConfiguration("vscode-erb-beautify");
    const options: string[] = [];

    if (config.get("useBundler")) {
      options.push("exec", "htmlbeautifier");
    }

    return Object.keys(config).reduce((acc, key) => {
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
    }, options);
  }

  /**
   * Retrieves custom environment variables from the configuration.
   * @returns A record of custom environment variables.
   */
  private get customEnvVars(): Record<string, string> {
    const config = vscode.workspace.getConfiguration("vscode-erb-beautify");
    return config.get("customEnvVar", {}) as Record<string, string>;
  }

  /**
   * Adjusts the final newline of the result string based on VS Code configuration.
   * @param input The original input string.
   * @param result The formatted result string.
   * @returns The adjusted result string.
   */
  private handleFinalNewline(input: string, result: string): string {
    // Get the 'insertFinalNewline' setting from VS Code configuration
    const insertFinalNewline = vscode.workspace
      .getConfiguration()
      .get("files.insertFinalNewline");

    // Determine if the result ends with a newline
    const resultEndsWithNewline =
      result.endsWith("\n") || result.endsWith("\r\n");

    // If 'insertFinalNewline' is true and the result does not end with a newline
    if (insertFinalNewline && !resultEndsWithNewline) {
      // Get the 'files.eol' setting from VS Code configuration
      const eol = vscode.workspace.getConfiguration().get("files.eol");

      // Determine newline character(s) based on the 'files.eol' setting and the platform
      const newline = eol === "auto" ? (this.isWindows() ? "\r\n" : "\n") : eol;

      // Append the newline to the result
      result += newline;
    } else if (!insertFinalNewline) {
      // If 'insertFinalNewline' is false, adjust the result's ending to match the input's ending

      // Get the newline character(s) used in the input and result
      const inputNewline = this.getNewline(input);
      const resultNewline = this.getNewline(result);

      // If the input and result use different newline character(s)
      if (inputNewline !== resultNewline) {
        // Remove the newline from the end of the result and append the input's newline
        result = result.slice(0, -resultNewline.length) + inputNewline;
      }
    }

    // Return the processed result
    return result;
  }

  /**
   * Determines the newline character(s) used in the input string.
   * @param input The input string.
   * @returns The newline character(s) used, or an empty string if none.
   */
  private getNewline(input: string): string {
    if (input.endsWith("\r\n")) {
      return "\r\n"; // Return Windows-style newline
    } else if (input.endsWith("\n")) {
      return "\n"; // Return Unix-style newline
    }
    return ""; // Return empty if no newline found
  }
}
