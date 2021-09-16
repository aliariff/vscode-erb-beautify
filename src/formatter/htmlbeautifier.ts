import * as vscode from "vscode";
import * as cp from "child_process";

export default class HtmlBeautifier {
  public format(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const cmd = `${this.exe} ${this.cliOptions.join(" ")}`;
      console.log(`formatting erb with command: ${cmd}`);
      console.time(cmd);

      const htmlbeautifier = cp.spawn(this.exe, this.cliOptions, {
        cwd: vscode.workspace.rootPath || __dirname,
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
          `couldn't run ${this.exe} '${err.message}'`
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
            `failed with exit code: ${code}. '${errorMessage}'`
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

  private get exe(): string {
    const config = vscode.workspace.getConfiguration("vscode-erb-beautify");
    const executePath = config.get("executePath", "htmlbeautifier");
    const useBundler = config.get("useBundler", false);
    const bundlerPath = config.get("bundlerPath", "bundle");
    return useBundler ? `${bundlerPath}` : executePath;
  }

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
