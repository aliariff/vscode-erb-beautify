import * as cp from "child_process";
import * as vscode from "vscode";
const isWsl = require("is-wsl");

export default class HtmlBeautifier {
  private logger: vscode.OutputChannel;
  private htmlbeautifier: cp.ChildProcessWithoutNullStreams;

  constructor() {
    this.logger = vscode.window.createOutputChannel("ERB Formatter/Beautify");
    this.htmlbeautifier = this.initializeBeautifier();
    vscode.workspace.onDidChangeConfiguration((event) => {
      const isAffected = event.affectsConfiguration("vscode-erb-beautify");
      if (!isAffected) {
        return;
      }
      this.htmlbeautifier = this.initializeBeautifier();
    });
  }

  /**
   * Formats the given data using HTML Beautifier
   * @param {string} data - The data to be formatted
   * @returns {Promise<string>} The formatted data
   */
  public async format(data: string): Promise<string> {
    if (
      this.htmlbeautifier === null ||
      this.htmlbeautifier.stdin === null ||
      this.htmlbeautifier.stdout === null
    ) {
      const msg =
        "Couldn't initialize htmlbeautifier. Make sure the gem is installed and available in PATH.";
      console.error(msg);
      vscode.window.showErrorMessage(msg);
      throw new Error(msg);
    }

    try {
      const cmd = `${this.exe} ${this.cliOptions.join(
        " "
      )} with custom env ${JSON.stringify(this.customEnvVars)}`;
      this.logger.appendLine(`Formatting ERB with command: ${cmd}`);
      console.time(cmd);

      const result = await this.executeCommand(data);

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

  private initializeBeautifier(): cp.ChildProcessWithoutNullStreams {
    const htmlbeautifier = cp.spawn(this.exe, this.cliOptions, {
      cwd: vscode.workspace.rootPath || __dirname,
      env: {
        ...process.env,
        ...this.customEnvVars,
      },
    });

    return htmlbeautifier;
  }

  private executeCommand(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let result = "";
      let errorMessage = "";
      let stdoutChunks: Buffer[] = [];
      let stderrChunks: Buffer[] = [];

      this.htmlbeautifier.on("error", (err) => {
        console.warn(err);
        vscode.window.showErrorMessage(
          `Couldn't run ${this.exe} '${err.message}'`
        );
        reject(err);
      });

      this.htmlbeautifier.stdout.on("data", (data) => {
        stdoutChunks.push(data);
      });
      this.htmlbeautifier.stderr.on("data", (data) => {
        stderrChunks.push(data);
      });

      this.htmlbeautifier.on("exit", (code) => {
        if (code) {
          vscode.window.showErrorMessage(
            `Failed with exit code: ${code}. '${errorMessage}'`
          );
          errorMessage = Buffer.concat(stderrChunks).toString();
          reject(new Error(errorMessage));
        } else {
          result = Buffer.concat(stdoutChunks).toString();
          resolve(result);
        }
        // Reinitialize htmlbeautifier after each operation
        this.htmlbeautifier = this.initializeBeautifier();
      });

      this.htmlbeautifier.stdin.write(data);
      this.htmlbeautifier.stdin.end();
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
}
