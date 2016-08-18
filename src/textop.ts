'use strict';

import * as vscode from 'vscode';
let config = vscode.workspace.getConfiguration('endocreader');


export function getSplitLine(text: string,endOfLine:string) {

  var lines = text.split(endOfLine);
  var active = false;
  var newLines = Array();
  var buffLine = '';
  let startOfEnStr = config['startOfEnStr'];
  let endOfEnStr = config['endOfEnStr'];
  let japaneseLineNum = config['japaneseLineNum'];
  let eolStr = endOfLine;
  
  for(let i = 0;i<japaneseLineNum;i++){
    if(i < japaneseLineNum -1){
      eolStr+=' > '+endOfLine;
    }else{
      eolStr+= endOfLine;
    }
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.indexOf(endOfEnStr) !== -1 && line.indexOf(startOfEnStr) === -1) {
      active = false;
    }
    if(line.startsWith(' > ')||line === endOfLine){
      newLines.push(line);
      continue;
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
            if (buffLine[j + 1] !== endOfLine+endOfLine) {
              insertNewLine = true;
            } else {
              insertNewLine = false;
            }

          }
        }

        if (insertNewLine) {
          newLines.push(currentLine);
          currentLine = '';
        }
      }
      
      newLines.push(currentLine);
      buffLine = '';
    } else {
      newLines.push(line);
    }

    if (line.indexOf(startOfEnStr) !== -1) {
      active = true;
    }
  }
  if (buffLine !== '') {
    newLines.push(buffLine);
    buffLine = '';
  }

  for(let i = 0;i<newLines.length;i++){
    if(newLines[i].startsWith(' ')&&newLines[i].indexOf(' > ') === -1){
      newLines[i] = newLines[i].substr(1);
    }
  }
  
  let newText = "";
  active = false;
  for(let i = 0;i<newLines.length;i++){
    let line = newLines[i];
    if (line.indexOf(endOfEnStr) !== -1 && line.indexOf(startOfEnStr) === -1) {
      active = false;
    }
    
    if (active) {
      if(line.startsWith(' > ')){
        newText += newLines[i] + endOfLine+endOfLine;
      }else{
        if(newLines[i+1].indexOf(' > ') !== -1){
          newText += newLines[i] + endOfLine;
        }else{   
          newText += newLines[i]+eolStr;
        }
      }
      
    }else{
      newText += newLines[i] + endOfLine;
    }

    if (line.indexOf(startOfEnStr) !== -1) {
      active = true;
      newText += endOfLine+endOfLine;
    }

  }
  return newText;
}