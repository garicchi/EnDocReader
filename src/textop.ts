'use strict';

export function getSplitLine(text: string, isWhiteLineAdd: boolean) {

  var lines = text.split('\n');
  var active = false;
  var newLines = Array();
  var buffLine = '';
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.indexOf('```') !== -1 && lines.indexOf('```en') === -1) {
      active = false;
    }
    if (active) {
      if (!line.endsWith('.')) {
        buffLine += line;
        continue;
      } else {
        buffLine += line;
      }
      var currentLine = '';
      for (var j = 0; j < buffLine.length; j++) {
        currentLine += buffLine[j]
        var insertNewLine = false;
        if (buffLine[j] === '.') {
          if ((buffLine.length - 1) >= (j + 1)) {
            if (buffLine[j + 1] !== '\n\n') {
              insertNewLine = true;
            } else {
              insertNewLine = false;
            }

          }
        }

        if (insertNewLine) {
          currentLine += '\n';
          if (isWhiteLineAdd) {
            currentLine += '\n'
          }
        }
      }
      if (isWhiteLineAdd) {
        if ((buffLine.length - 1) >= (i + 1)) {
          if (buffLine[i] !== '' && buffLine[i + 1] !== '') {
            currentLine += '\n'
          }
        }
      }
      currentLine = currentLine.split('\n ').join('\n');
      newLines.push(currentLine);
      buffLine = '';
    } else {
      newLines.push(line);
    }

    if (line.indexOf('```en') !== -1) {
      active = true;
    }
  }
  if (buffLine !== '') {
    newLines.push(buffLine);
    buffLine = '';
  }
  return newLines.join('\n');
}