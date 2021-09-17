# ERB Formatter/Beautify

[![Test](https://github.com/aliariff/vscode-erb-beautify/actions/workflows/test.yaml/badge.svg)](https://github.com/aliariff/vscode-erb-beautify/actions/workflows/test.yaml)
&nbsp;
[![Release](https://github.com/aliariff/vscode-erb-beautify/actions/workflows/release.yaml/badge.svg)](https://github.com/aliariff/vscode-erb-beautify/actions/workflows/release.yaml)

Most of solution that exist in the internet is tell you to create a task and call it using ctrl-shift-p menu.

This extension basically using [htmlbeautifier](https://github.com/threedaymonk/htmlbeautifier) to format your file using the Formatter API from the vscode, so no need to create a hack using Task, etc.

## Features

![Demo GIF](https://drive.google.com/uc?export=view&id=1yzSYa9cau6sppFXSjWz66tJvZLAHDYCF)

## Requirements

```
gem install htmlbeautifier
```

or

To use the gem with Bundler, add to your `Gemfile`:

```ruby
gem 'htmlbeautifier'
```

NOTE: For you that have a filename with extension `.html.erb`, your file might be recognized as `html` file, not as `erb` file. In that case, add a setting in your `settings.json` like below:

```json
"files.associations": {
  "*.html.erb": "erb"
}
```

## Settings

| Setting                              | Description                                                                                                                      | Default        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `vscode-erb-beautify.executePath`    | Path to the htmlbeautifier executable, set this to absolute path when you have different htmlbeautifier location                 | htmlbeautifier |
| `vscode-erb-beautify.useBundler`     | Execute htmlbeautifier using bundler (ie 'bundle exec htmlbeautifier'). If this true, vscode-erb-beautify.executePath is ignored | false          |
| `vscode-erb-beautify.bundlerPath`    | Path to the bundler executable, set this to absolute path when you have different bundler location                               | bundle         |
| `vscode-erb-beautify.tabStops`       | Set number of spaces per indent                                                                                                  | 2              |
| `vscode-erb-beautify.tab`            | Indent using tabs                                                                                                                | false          |
| `vscode-erb-beautify.indentBy`       | Indent the output by NUMBER steps                                                                                                | 0              |
| `vscode-erb-beautify.stopOnErrors`   | Stop when invalid nesting is encountered in the input                                                                            | false          |
| `vscode-erb-beautify.keepBlankLines` | Set number of consecutive blank lines                                                                                            | 0              |

## References

[Issue](https://github.com/threedaymonk/htmlbeautifier/issues/49)

[Issue](https://github.com/rubyide/vscode-ruby/issues/56)

[Ref](https://medium.com/@costa.alexoglou/enable-formatting-with-erb-files-in-vscode-d4b4ff537017)
