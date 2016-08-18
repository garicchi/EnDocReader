'use strict';

import * as vscode from 'vscode';
import * as textop from './textop';
import * as posdecorator from './posdecorator';


var toggleColoring = false;
var activeEOF = null;


export function activate(context: vscode.ExtensionContext) {
  posdecorator.loadPosJson(__dirname + '/../../posstyle.json');

  vscode.window.onDidChangeActiveTextEditor(function(){
    let activeEditor = vscode.window.activeTextEditor;
    let text = activeEditor.document.getText();
    if(text.indexOf('\r\n') == -1){
      activeEOF = '\n'
    }else{
      activeEOF = '\r\n'
    }
  });

  let formatDis = vscode.commands.registerCommand('formatCommand', () => {
    let activeEditor = vscode.window.activeTextEditor;
    let text = activeEditor.document.getText();
    let split = textop.getSplitLine(text, true,activeEOF);

    activeEditor.edit((builder) => {
      let startPos = activeEditor.document.positionAt(0);
      let endPos = activeEditor.document.positionAt(text.length);
      let allRange = new vscode.Range(startPos, endPos);
      builder.replace(allRange, split);
    });

    vscode.window.setStatusBarMessage('format english done!');
  });
  context.subscriptions.push(formatDis);

  let coloringDis = vscode.commands.registerCommand('toggleColorCommand', () => {
    toggleColoring = !toggleColoring;

    let activeEditor = vscode.window.activeTextEditor;
    let text = activeEditor.document.getText();

    posdecorator.decoratePartOfSpeech(text, activeEditor, toggleColoring,activeEOF);

  });
  context.subscriptions.push(coloringDis);

  let translateDis = vscode.commands.registerCommand('googleTranslateCommand', () => {
    let activeEditor = vscode.window.activeTextEditor;
    let selectStart = activeEditor.document.offsetAt(activeEditor.selection.start);
    let selectEnd = activeEditor.document.offsetAt(activeEditor.selection.end);
    let selectText = activeEditor.document.getText().slice(selectStart, selectEnd);
    let url = vscode.Uri.parse('https://translate.google.co.jp/?hl=ja&tab=wT#en/ja/' + selectText);
    if (selectText !== '') {
      return vscode.commands.executeCommand('vscode.open', url).then((success) => {
      }, (reason) => {
        vscode.window.showErrorMessage(reason);
      });
    } else {
      vscode.window.showInformationMessage('select you want to translate!');
    }
  });
  context.subscriptions.push(translateDis);

  let translateInnerDis = vscode.commands.registerCommand('innerTranslateCommand', () => {
    let activeEditor = vscode.window.activeTextEditor;
    posdecorator.translateInnerWord(activeEditor,activeEOF);
  });
  context.subscriptions.push(translateInnerDis);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
