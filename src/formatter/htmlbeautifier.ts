import * as vscode from "vscode";
import * as cp from "child_process";
const isWsl = require("is-wsl");

export default class HtmlBeautifier {
  /**
   * Formats the given data using HTML Beautifier
   * @param {string} data - The data to be formatted
   * @returns {Promise<string>} The formatted data
   */
  public format(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const cmd = `${this.exe} ${this.cliOptions.join(" ")}`;
      console.log(`Formatting ERB with command: ${cmd}`);
      console.time(cmd);

      const htmlbeautifier = cp.spawn(this.exe, this.cliOptions, {
        cwd: vscode.workspace.rootPath || __dirname,
        env: {
          ...process.env,
          LC_ALL: "en_US.UTF-8",
        },
      });

      if (htmlbeautifier.stdin === null || htmlbeautifier.stdout === null) {
        const msg = "Couldn't initialize STDIN or STDOUT";
        console.warn(msg);
        vscode.window.showErrorMessage(msg);
        reject(msg);
        return;
      }

      let result = "";
      let errorMessage = "";
      htmlbeautifier.on("error", (err) => {
        console.warn(err);
        vscode.window.showErrorMessage(
          `Couldn't run ${this.exe} '${err.message}'`
        );
        reject(err);
      });
      htmlbeautifier.stdout.on("data", (data) => {
        result += data.toString();
      });
      htmlbeautifier.stderr.on("data", (data) => {
        errorMessage += data.toString();
      });
      htmlbeautifier.on("exit", (code) => {
        if (code) {
          vscode.window.showErrorMessage(
            `Failed with exit code: ${code}. '${errorMessage}'`
          );
          return reject();
        }
        console.timeEnd(cmd);
        resolve(result);
      });
      htmlbeautifier.stdin.write(data);
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
    let acc: string[] = [];

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
}
