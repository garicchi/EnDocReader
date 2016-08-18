'use strict';

import * as vscode from 'vscode';
import * as textop from './textop';
import * as posdecorator from './posdecorator';
import * as google from './googleclient';

var toggleColoring = false;


export function activate(context: vscode.ExtensionContext) {
  posdecorator.loadPosJson(__dirname + '/../../posstyle.json');

  let formatDis = vscode.commands.registerCommand('formatCommand', () => {
    let activeEditor = vscode.window.activeTextEditor;
    let text = activeEditor.document.getText();
    let split = textop.getSplitLine(text, true);

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

    posdecorator.decoratePartOfSpeech(text, activeEditor, toggleColoring);

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
    posdecorator.translateInnerWord(activeEditor);
  });
  context.subscriptions.push(translateInnerDis);

  /*
  let syntaxDis = vscode.commands.registerCommand('googleSyntaxCommand', () => {
    let activeEditor = vscode.window.activeTextEditor;
    google.decorateSyntax('We propose a solution to the double-spending problem using a peer-to-peer network.');
  });
  context.subscriptions.push(syntaxDis);

  */
  
}

// this method is called when your extension is deactivated
export function deactivate() {
}
