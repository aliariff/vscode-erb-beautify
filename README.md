# ERB Formatter/Beautify

Most of solution that exist in the internet is tell you to create a task and call it using ctrl-shift-p menu.

This extension basically using [htmlbeautifier](https://github.com/threedaymonk/htmlbeautifier) to format your file using the Formatter API from the vscode, so no need to create a hack using Task, etc.

## Features

![Demo GIF](https://drive.google.com/uc?export=view&id=1yzSYa9cau6sppFXSjWz66tJvZLAHDYCF)

## Requirements

```
gem install htmlbeautifier
```

## Settings

| Setting                              | Description                                           | Default |
| ------------------------------------ | ----------------------------------------------------- | ------- |
| `vscode-erb-beautify.tabStops`       | Set number of spaces per indent                       | 2       |
| `vscode-erb-beautify.tab`            | Indent using tabs                                     | false   |
| `vscode-erb-beautify.indentBy`       | Indent the output by NUMBER steps                     | 0       |
| `vscode-erb-beautify.stopOnErrors`   | Stop when invalid nesting is encountered in the input | false   |
| `vscode-erb-beautify.keepBlankLines` | Set number of consecutive blank lines                 | 0       |

## References

[Issue](https://github.com/threedaymonk/htmlbeautifier/issues/49)

[Issue](https://github.com/rubyide/vscode-ruby/issues/56)

[Ref](https://medium.com/@costa.alexoglou/enable-formatting-with-erb-files-in-vscode-d4b4ff537017)
