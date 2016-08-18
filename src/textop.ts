'use strict';

import * as vscode from 'vscode';
import * as editorop from './editorop';
let config = vscode.workspace.getConfiguration('endocreader');


export function formatSelectedText(selected:editorop.EditorSelection,endOfLine:string) {

  var lines = selected.text.split(endOfLine);
  var newLines = Array();
  var buffLine = '';
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
    
    if(line.startsWith(' >')||line === endOfLine){
      newLines.push(line);
      continue;
    }
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
  }
  if (buffLine !== '') {
    newLines.push(buffLine);
    buffLine = '';
  }

  for(let i = 0;i<newLines.length;i++){
    if(newLines[i].startsWith(' ')&&newLines[i].indexOf(' >') === -1){
      newLines[i] = newLines[i].substr(1);
    }
  }
  
  let newText = "";
  for(let i = 0;i<newLines.length;i++){
    let line = newLines[i];
    if(line.startsWith(' >')){
        newText += newLines[i] + endOfLine+endOfLine;
      }else{
        newText += newLines[i]+eolStr;
    }

  }
  newText = endOfLine + newText;
  return newText;
}