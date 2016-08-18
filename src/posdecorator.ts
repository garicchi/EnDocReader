'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

let pos = require('pos');
let bt = require('bing-translate');
let btTranslator = null;

let transWordStyleList: vscode.TextEditorDecorationType[] = [];
let posStyleList = [];
let posData = null;

let config = vscode.workspace.getConfiguration('endocreader');


class PosInfo {
    startPos: vscode.Position;
    endPos: vscode.Position;
    word: string;
    describe: any;
}

export function loadPosData(dataPath:string){
    let jsonFile = fs.readFileSync(dataPath, 'utf8');
    posData = JSON.parse(jsonFile);
}

export function decoratePartOfSpeech(text: string, activeEditor: vscode.TextEditor, isDecorate: boolean, endOfLine: string) {

    let codeLines = text.split(endOfLine);
    let active = false;

    let posInfoList: PosInfo[] = [];

    if (isDecorate) {
        for (let i = 0; i < posData.length; i++) {
            let bigPos = posData[i].tags;
            for (let j = 0; j < bigPos.length; j++) {
                let color = posData[i].color;
                let decoration = null;
                if (color == '') {
                    decoration = vscode.window.createTextEditorDecorationType({
                    });
                } else {
                    decoration = vscode.window.createTextEditorDecorationType({
                        color: posData[i].color
                    });
                }

                let posObj = bigPos[j];
                posObj.category = posData[i].name;
                posObj.color = posData[i].color;
                posObj.decoration = decoration;
                posStyleList.push(posObj);
            }

        }
    }

    for (var i = 0; i < codeLines.length; i++) {
        let line = codeLines[i]
        let posList = getPosList(line);
            let posIndex = 0;
            for (let j = 0; j < posList.length; j++) {
                let posItem = posList[j];
                let describe = getPosDescribe(posItem.tag, posStyleList);
                let index = line.indexOf(posItem.word, posIndex);
                if (describe != null) {

                    let posInfo = new PosInfo();
                    posInfo.startPos = new vscode.Position(i, index);
                    posInfo.endPos = new vscode.Position(i, index + posItem.word.length);
                    posInfo.word = posItem.word;
                    posInfo.describe = describe;

                    posInfoList.push(posInfo);
                }

                posIndex = index + posItem.word.length;

            }
    }

    for (let i = 0; i < posStyleList.length; i++) {
        let option = getDecorateOptions(posStyleList[i], posInfoList);
        if (isDecorate) {
            activeEditor.setDecorations(posStyleList[i].decoration, option);
        } else {
            activeEditor.setDecorations(posStyleList[i].decoration, []);
        }

    }
}

export function getDecorateOptions(posdescribe: any, posInfoList: PosInfo[]) {

    let options: vscode.DecorationOptions[] = [];
    for (let i = 0; i < posInfoList.length; i++) {
        let info = posInfoList[i];
        if (info.describe.tag === posdescribe.tag) {
            let message = '【 ' + info.describe.name + ' 】\ncategory: ' + info.describe.category + '\nexample: ' + info.describe.example;
            var decoration = { range: new vscode.Range(info.startPos, info.endPos), hoverMessage: message };
            options.push(decoration);

        }
    }
    return options;
}

export function getPosList(line) {
    let posList = [];
    var clearLine = line.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
    var words = new pos.Lexer().lex(clearLine);
    var tagger = new pos.Tagger();
    var taggedWords = tagger.tag(words);

    for (let j in taggedWords) {
        var taggedWord = taggedWords[j];
        posList.push({
            word: taggedWord[0],
            tag: taggedWord[1]
        });
    }

    return posList;
}

export function getPosDescribe(posName: string, posstyleJson: any) {
    for (let i = 0; i < posstyleJson.length; i++) {
        if (posstyleJson[i].tag === posName) {
            return posstyleJson[i];
        }
    }
    return null;
}

export function initBingTranslator() {
    let id = config['bingTransId'];
    let secret = config['bingTransSecret'];
    btTranslator = bt.init({
        client_id: id,
        client_secret: secret
    });

}

export function translateInnerWord(activeEditor: vscode.TextEditor, endOfLine: string) {
    let startPos = activeEditor.selection.start;
    let endPos = activeEditor.selection.end;
    let selectStart = activeEditor.document.offsetAt(startPos);
    let selectEnd = activeEditor.document.offsetAt(endPos);
    let selectText = activeEditor.document.getText().slice(selectStart, selectEnd);
    if (selectText !== '') {
        vscode.window.setStatusBarMessage('translating...');
        btTranslator.translate(selectText, 'en', 'ja', function (err, res) {
            let text = res.translated_text;
            if (text !== '') {
                let sentence = ' > [ ' + selectText + ' : ' + text + ' ]  ' + endOfLine
                let wordStart = new vscode.Position(startPos.line + 1, 0);
                let wordEnd = new vscode.Position(startPos.line + 1, sentence.length - 1);
                activeEditor.edit((builder) => {

                    builder.insert(wordStart, sentence);
                });
                let transWordStyle = vscode.window.createTextEditorDecorationType({
                    color: config['innerTransColor']
                });
                transWordStyleList.push(transWordStyle);
                activeEditor.setDecorations(transWordStyle, [{ range: new vscode.Range(wordStart, wordEnd), hoverMessage: null }]);
            }
            vscode.window.setStatusBarMessage('翻訳結果：[' + text + ']');
        });
    } else {
        vscode.window.showInformationMessage('select you want to translate!');
    }
}