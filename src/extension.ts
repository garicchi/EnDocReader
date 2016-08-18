'use strict';

import * as vscode from 'vscode';
import * as textop from './textop';
import * as posdecorator from './posdecorator';
import * as fs from 'fs';
import * as path from 'path';

var toggleColoring = false;
var activeEOL = null;
let rootDir = path.join(__dirname,'..','..');
let config = vscode.workspace.getConfiguration('endocreader');

export function activate(context: vscode.ExtensionContext) {
  posdecorator.loadPosData(path.join(rootDir,'posData.json'));
  updateActiveEof();

  vscode.window.onDidChangeActiveTextEditor(function(){
    updateActiveEof();
  });
  
  posdecorator.initBingTranslator();

  let formatDis = vscode.commands.registerCommand('formatCommand', () => {
    updateActiveEof();
    let activeEditor = vscode.window.activeTextEditor;
    let text = activeEditor.document.getText();
    let split = textop.getSplitLine(text,activeEOL);

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
    updateActiveEof();
    toggleColoring = !toggleColoring;

    let activeEditor = vscode.window.activeTextEditor;
    let text = activeEditor.document.getText();

    posdecorator.decoratePartOfSpeech(text, activeEditor, toggleColoring,activeEOL);

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

  let weblioDis = vscode.commands.registerCommand('weblioCommand', () => {
    let activeEditor = vscode.window.activeTextEditor;
    let selectStart = activeEditor.document.offsetAt(activeEditor.selection.start);
    let selectEnd = activeEditor.document.offsetAt(activeEditor.selection.end);
    let selectText = activeEditor.document.getText().slice(selectStart, selectEnd);
    let url = vscode.Uri.parse('http://ejje.weblio.jp/content/' + selectText);
    if (selectText !== '') {
      let previewPath = path.join(rootDir,'previewWeblio.html');
      let content = fs.readFileSync(previewPath, 'utf8');
      content = content.replace(/src=.*" /g,'src="'+url+'" ');
      fs.writeFileSync(previewPath,content,'utf-8');

      let previewUri = vscode.Uri.parse('file:'+previewPath);
      
      return vscode.commands.executeCommand('vscode.previewHtml', previewUri,vscode.ViewColumn.Two,'Weblio').then((success) => {
      }, (reason) => {
        vscode.window.showErrorMessage(reason);
      });
    } else {
      vscode.window.showInformationMessage('select you want to translate!');
    }
  });
  context.subscriptions.push(weblioDis);


  let translateInnerDis = vscode.commands.registerCommand('innerTranslateCommand', () => {
    let activeEditor = vscode.window.activeTextEditor;
    posdecorator.translateInnerWord(activeEditor,activeEOL);
  });
  context.subscriptions.push(translateInnerDis);

  let insertEnDis = vscode.commands.registerCommand('insertEnCommand', () => {
    let activeEditor = vscode.window.activeTextEditor;
    let cursor = activeEditor.selection.active;
    let startOfEnStr = config['startOfEnStr'];
    let endOfEnStr = config['endOfEnStr'];
    
    let block = activeEOL + startOfEnStr+activeEOL+activeEOL+endOfEnStr;
    activeEditor.edit((builder)=>{
      builder.insert(cursor,block);
    });
  });
  context.subscriptions.push(insertEnDis);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function updateActiveEof(){
    let filesConfig = vscode.workspace.getConfiguration('files');
    activeEOL = filesConfig['eol'];
}
