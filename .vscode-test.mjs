import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/**/*.test.js",
  mocha: {
    ui: "tdd",
    color: true,
    timeout: "10000",
  },
});
