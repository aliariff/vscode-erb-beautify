import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

suite("ERB Formatter/Beautify tests", () => {
  const FIXTURE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
      <meta http-equiv="content-type" content="text/html; charset=utf-8" />
      <script src="/javascript/prototype.js" type="text/javascript"></script>
      <link rel="stylesheet" type="text/css" href="/stylesheets/screen.css" media="screen"/>
      <!--[if IE 6]>
      <link rel="stylesheet" href="/stylesheets/screen_ie6.css" type="text/css" />
      <![endif]-->
      <title>Title Goes Here</title>
      <script type="text/javascript" charset="utf-8">
      doSomething();
      </script>
      </head>
      <body>
      <div id="something">
      <h1>
      Heading 1
      </h1>
      </div>
      <div id="somethingElse"><p>Lorem Ipsum</p>
      <% if @x %>
      <% @ys.each do |y| %>
      <p>
      <%= h y %>
      </p>
      <% end %>
      <% elsif @z %>
      <hr />
      <% end %>
      </div>
      <table>
      <colgroup>
      <col style="width: 50%;">
      <col style="width: 50%;">
      </colgroup>
      <tbody>
      <tr><td>First column</td></tr><tr>
      <td>Second column</td></tr>
      </tbody>
      </table>
      </body>
      </html>`;
  const CORRECT = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <script src="/javascript/prototype.js" type="text/javascript"></script>
    <link rel="stylesheet" type="text/css" href="/stylesheets/screen.css" media="screen"/>
    <!--[if IE 6]>
      <link rel="stylesheet" href="/stylesheets/screen_ie6.css" type="text/css" />
    <![endif]-->
    <title>Title Goes Here</title>
    <script type="text/javascript" charset="utf-8">
      doSomething();
    </script>
  </head>
  <body>
    <div id="something">
      <h1>
        Heading 1
      </h1>
    </div>
    <div id="somethingElse">
      <p>Lorem Ipsum</p>
      <% if @x %>
        <% @ys.each do |y| %>
          <p>
            <%= h y %>
          </p>
        <% end %>
      <% elsif @z %>
        <hr />
      <% end %>
    </div>
    <table>
      <colgroup>
        <col style="width: 50%;">
        <col style="width: 50%;">
      </colgroup>
      <tbody>
        <tr>
          <td>First column</td>
        </tr>
        <tr>
          <td>Second column</td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
`;

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  async function changeConfig(key: string, value: any) {
    await vscode.workspace
      .getConfiguration()
      .update(key, value, vscode.ConfigurationTarget.Global);
  }

  async function formatDocument() {
    const document = await vscode.workspace.openTextDocument({
      language: "erb",
      content: FIXTURE,
    });
    await vscode.window.showTextDocument(document);
    await sleep(1500); // we need to wait a little bit until extension is loaded
    await vscode.commands.executeCommand("editor.action.formatDocument");
    await sleep(500); // wait until extension executed
    assert.strictEqual(document.getText(), CORRECT);
  }

  test("formats whole document without bundler", async () => {
    await changeConfig("vscode-erb-beautify.useBundler", false);
    await formatDocument();
  });

  test("formats whole document using bundler", async () => {
    await changeConfig("vscode-erb-beautify.useBundler", true);
    await formatDocument();
  });
});
