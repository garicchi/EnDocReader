'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    let splitLineDis = vscode.commands.registerCommand('splitLineCommand', () => {
        let activeEditor = vscode.window.activeTextEditor;
        let text = activeEditor.document.getText();
        let split = getSplitLine(text,true);

        activeEditor.edit((builder)=>{
            let startPos = activeEditor.document.positionAt(0);
            let endPos = activeEditor.document.positionAt(text.length);
            let allRange = new vscode.Range(startPos,endPos);
            builder.replace(allRange,split);
        });
        
        vscode.window.showInformationMessage('split done!');
    });

    context.subscriptions.push(splitLineDis);
}

// this method is called when your extension is deactivated
export function deactivate() {
}


function getSplitLine(text:string,isWhiteLineAdd:boolean){
  var lines = text.split('\n');
  var active = false;
  var newLines = Array();
  for(var i = 0;i<lines.length;i++){
    var line = lines[i];
    if(line.indexOf('```') !== -1 && lines.indexOf('```en') === -1){
      active = false;
    }
    if(active){
      var currentLine = '';
      for(var j = 0;j<line.length;j++){
        currentLine += line[j]
        var insertNewLine = false;
        if(line[j] === '.'){
          if((line.length-1) >= (j+1)){
            if(line[j+1] !== '\n'){
              insertNewLine = true;
            }else{
              insertNewLine = false;
            }

          }
        }

        if(insertNewLine){
          currentLine+='\n';
          if(isWhiteLineAdd){
            currentLine+='\n'
          }
        }
      }
      if(isWhiteLineAdd){
        if((lines.length-1)>=(i+1)){
          if(lines[i] !=='' && lines[i+1] !== ''){
            currentLine+='\n'
          }
        }
      }
      currentLine = currentLine.split('\n ').join('\n');
      newLines.push(currentLine);
    }else{
      newLines.push(line);
    }

    if(line.indexOf('```en') !== -1){
      active = true;
    }
  }
  return newLines.join('\n');
}
