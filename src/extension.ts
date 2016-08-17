'use strict';

import * as vscode from 'vscode';
let fs = require('fs');
let pos = require('pos');
var bt = require('bing-translate').init({
            client_id: 'endocreader', 
            client_secret: 'TBmW6RRy6vISr5RAr7g919C6mH5V1t54XxmYPUdIeIk='
        });
var toggleColoring = false;
let posStyleList = [];

export function activate(context: vscode.ExtensionContext) {
    
    let jsonFile = fs.readFileSync(__dirname+'/../../posstyle.json', 'utf8')
    posStyleList = JSON.parse(jsonFile);

    for(let i =0;i<posStyleList.length;i++){
        posStyleList[i].decoration = vscode.window.createTextEditorDecorationType({
            color:posStyleList[i].color
        });
    }
    
    let formatDis = vscode.commands.registerCommand('formatCommand', () => {
        let activeEditor = vscode.window.activeTextEditor;
        let text = activeEditor.document.getText();
        let split = getSplitLine(text,true);

        activeEditor.edit((builder)=>{
            let startPos = activeEditor.document.positionAt(0);
            let endPos = activeEditor.document.positionAt(text.length);
            let allRange = new vscode.Range(startPos,endPos);
            builder.replace(allRange,split);
        });
        
        vscode.window.showInformationMessage('format english done!');
    });
    context.subscriptions.push(formatDis);

    let coloringDis = vscode.commands.registerCommand('toggleColorCommand',()=>{
        toggleColoring = !toggleColoring;
        
        let activeEditor = vscode.window.activeTextEditor;
        let text = activeEditor.document.getText();
        
        decoratePartOfSpeech(text,posStyleList,activeEditor);

    });
    context.subscriptions.push(coloringDis);
    
    let translateDis = vscode.commands.registerCommand('googleTranslateCommand', () => {
        let activeEditor = vscode.window.activeTextEditor;
        let selectStart = activeEditor.document.offsetAt(activeEditor.selection.start);
        let selectEnd = activeEditor.document.offsetAt(activeEditor.selection.end);
        let selectText = activeEditor.document.getText().slice(selectStart,selectEnd);
        let url = vscode.Uri.parse('https://translate.google.co.jp/?hl=ja&tab=wT#en/ja/'+selectText);
        if(selectText !== ''){
        return vscode.commands.executeCommand('vscode.open', url).then((success) => {
        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
        }else{
            vscode.window.showInformationMessage('select you want to translate!');
        }
    });
    context.subscriptions.push(translateDis);
    let translateInnerDis = vscode.commands.registerCommand('innerTranslateCommand', () => {
        let activeEditor = vscode.window.activeTextEditor;
        let startPos = activeEditor.selection.start;
        let endPos = activeEditor.selection.end;
        let selectStart = activeEditor.document.offsetAt(startPos);
        let selectEnd = activeEditor.document.offsetAt(endPos);
        let selectText = activeEditor.document.getText().slice(selectStart,selectEnd);
        
        vscode.window.setStatusBarMessage('translating...');
        bt.translate(selectText, 'en', 'ja', function(err, res){
            let text = res.translated_text;
            if(text !== ''){
                activeEditor.edit((builder)=>{
                    builder.insert(new vscode.Position(startPos.line+1,0),'[ '+selectText+' : '+text+' ]\n');
                });
            }
            vscode.window.setStatusBarMessage('翻訳結果：['+text+']');
        });
        

    });
    context.subscriptions.push(translateInnerDis);
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

class PosInfo{
    startPos:vscode.Position;
    endPos:vscode.Position;
    word:string;
    pos:string;
    ja:string;
    color:string;
}

function decoratePartOfSpeech(text:string,posstyleJson:any,activeEditor:vscode.TextEditor){

  let codeLines = text.split('\n');
  let active = false;

  let posInfoList:PosInfo[] = [];
  
  for(var i =0;i<codeLines.length;i++){
    let line = codeLines[i]
    if(line.indexOf('```') !==-1 && line.indexOf('```en') === -1){
        active = false;
      }
      if(active){
          
        let posList = getPosList(line);
        let posIndex = 0;
        for(let j=0;j<posList.length;j++){
            let posItem = posList[j];
            let describe = getPosDescribe(posItem.pos,posstyleJson);
            let index = line.indexOf(posItem.word,posIndex);
            if(describe !=null){
                
            
            let posInfo = new PosInfo();
            posInfo.startPos = new vscode.Position(i,index);
            posInfo.endPos = new vscode.Position(i,index+posItem.word.length);
            posInfo.word = posItem.word;
            posInfo.pos = posItem.pos;
            posInfo.ja = describe.ja;
            posInfo.color = describe.color;

            posInfoList.push(posInfo);
            }

            posIndex = index+posItem.word.length;
            
        }
        
      }
      if(line.indexOf('```en') !==-1){
        active = true;
      }
  }

  for(let i =0;i<posstyleJson.length;i++){
      let option = getDecorateOptions(posstyleJson[i],posInfoList);
      if(toggleColoring){
          activeEditor.setDecorations(posstyleJson[i].decoration,option);
      }else{
          activeEditor.setDecorations(posstyleJson[i].decoration,[]);
      }
      
  }
}

function getDecorateOptions(posdescribe:any,posInfoList:PosInfo[]){

    let options:vscode.DecorationOptions[] = [];
    for(let i =0;i<posInfoList.length;i++){
        let info = posInfoList[i];
        if(info.pos === posdescribe.name){
            var decoration = { range: new vscode.Range(info.startPos, info.endPos), hoverMessage: info.pos+' **' +info.ja+ '**'};
            options.push(decoration);

        }
    }
    return options;
}

function getPosList(line){
    let posList = [];
  var clearLine = line.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
  var words = new pos.Lexer().lex(clearLine);
  var tagger = new pos.Tagger();
  var taggedWords = tagger.tag(words);

  for (let j in taggedWords) {
    var taggedWord = taggedWords[j];
    var word = taggedWord[0];
    var tag = taggedWord[1];
    //parse
    //noun
    var selectPos = null;
    if (tag === "NN" || tag === "NNP" || tag === "NNPS"
    || tag === "NNS" || tag === "PRP" || tag == "PRP$" || tag === "EX") {
      selectPos = 'noun';

      //adjective
    } else if (tag === "JJ" || tag === "JJR" || tag === "JJS") {
      selectPos = 'adjective';
      //adverb
    } else if (tag === "RB" || tag === "RBR" || tag === "RBS") {
      selectPos = 'adverb';
    }   //verb
    else if (tag === "VB" || tag === "VBD" || tag === "VBG" || tag === "VBN"
    || tag === "VBP" || tag === "VBZ") {
      selectPos = 'verb';
    }   //auxiliaryVerb
    else if (tag === "MD") {
      selectPos = 'auxiliaryVerb';
      //relative
    } else if (tag === "WDT" || tag === "WP" || tag === "WP$" || tag === "WRB") {
      selectPos = 'relative';
      //conjunction
    } else if (tag === "IN" || tag === "CC") {
      selectPos = 'conjunction';
      //determiner
    } else if (tag === "DT") {
      selectPos = 'determiner';
    }

    posList.push({
        word:word,
        pos:selectPos
    });
  }

  return posList;
}

function getPosDescribe(posName:string,posstyleJson:any){
    for(let i =0;i<posstyleJson.length;i++){
        if(posstyleJson[i].name === posName){
            return posstyleJson[i];
        }
    }
    return null;
}

function changePosColor(posColors,rootElement,isColor){

  for(var key in posColors){
    var items = rootElement.querySelectorAll('.'+key);
    for(var i = 0;i<items.length;i++){
      if(isColor){
        items[i].style.color = posColors[key];
      }else{
        items[i].style.color = "";
      }
    }
  }

}

