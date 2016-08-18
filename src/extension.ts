'use strict';

import * as vscode from 'vscode';
import * as textop from './textop';
import * as posdecorator from './posdecorator';
import * as fs from 'fs';
import * as path from 'path';
import * as editorop from './editorop';

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
    let selected = editorop.EditorSelection.getSelectedItem(activeEditor);
    if(selected.isSelected){
      let newText = textop.formatSelectedText(selected,activeEOL);
      activeEditor.edit((builder) => {
        builder.replace(selected.range, newText);
      });
    }else{
      vscode.window.showErrorMessage('please select text');
    }
    vscode.window.setStatusBarMessage('format english done!',2000);
  });
  context.subscriptions.push(formatDis);

  let coloringDis = vscode.commands.registerCommand('toggleColorCommand', () => {
    updateActiveEof();
    toggleColoring = !toggleColoring;

    let activeEditor = vscode.window.activeTextEditor;
    let text = activeEditor.document.getText();

    posdecorator.decoratePartOfSpeech(text, activeEditor, toggleColoring,activeEOL);
    if(toggleColoring){
      vscode.window.setStatusBarMessage('colorful mode!',2000);
    }else{
      vscode.window.setStatusBarMessage('no color mode!',2000);
    }
  });
  context.subscriptions.push(coloringDis);

  let translateDis = vscode.commands.registerCommand('googleTranslateCommand', () => {
    
    let activeEditor = vscode.window.activeTextEditor;
    let selected = editorop.EditorSelection.getSelectedItem(activeEditor);
    let url = vscode.Uri.parse('https://translate.google.co.jp/?hl=ja&tab=wT#en/ja/' + selected.text);
    if(selected.isSelected){
      return vscode.commands.executeCommand('vscode.open', url).then((success) => {
      }, (reason) => {
        vscode.window.showErrorMessage(reason);
      });
    }else{
      vscode.window.showErrorMessage('please select text');
    }
  });
  context.subscriptions.push(translateDis);

  let weblioDis = vscode.commands.registerCommand('weblioCommand', () => {
    
    let activeEditor = vscode.window.activeTextEditor;
    let selected = editorop.EditorSelection.getSelectedItem(activeEditor);
    let url = vscode.Uri.parse('http://ejje.weblio.jp/content/' + selected.text);
    if(selected.isSelected){
      let previewPath = path.join(rootDir,'previewWeblio.html');
      let content = fs.readFileSync(previewPath, 'utf8');
      content = content.replace(/src=.*" /g,'src="'+url+'" ');
      fs.writeFileSync(previewPath,content,'utf-8');

      let previewUri = vscode.Uri.parse('file:'+previewPath);
      
      return vscode.commands.executeCommand('vscode.previewHtml', previewUri,vscode.ViewColumn.Two,'Weblio').then((success) => {
      }, (reason) => {
        vscode.window.showErrorMessage(reason);
      });
    }else{
      vscode.window.showErrorMessage('please select text');
    }
  });
  context.subscriptions.push(weblioDis);


  let translateInnerDis = vscode.commands.registerCommand('innerTranslateCommand', () => {
    let activeEditor = vscode.window.activeTextEditor;
    posdecorator.translateInnerWord(activeEditor,activeEOL);
  });
  context.subscriptions.push(translateInnerDis);

}

// this method is called when your extension is deactivated
export function deactivate() {
}

function updateActiveEof(){
    let filesConfig = vscode.workspace.getConfiguration('files');
    activeEOL = filesConfig['eol'];
}
