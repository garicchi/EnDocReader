'use strict';

import * as vscode from 'vscode';
import * as st from './settings';

let pos = require('pos');
let bt = require('bing-translate');
let btTranslator = null;

let transWordStyleList: vscode.TextEditorDecorationType[] = [];
let posStyleList = [];


class PosInfo {
    startPos: vscode.Position;
    endPos: vscode.Position;
    word: string;
    pos: string;
    ja: string;
    color: string;
}


export function decoratePartOfSpeech(text: string, activeEditor: vscode.TextEditor, isDecorate: boolean,endOfLine:string) {

    let codeLines = text.split(endOfLine);
    let active = false;

    let posInfoList: PosInfo[] = [];
    let startOfEnStr = st.Settings.getSetting('startOfEnStr');
    let endOfEnStr = st.Settings.getSetting('endOfEnStr');

    posStyleList = st.Settings.getSetting('posData');
    for (let i = 0; i < posStyleList.length; i++) {
        posStyleList[i].decoration = vscode.window.createTextEditorDecorationType({
            color: posStyleList[i].color
        });
    }

    for (var i = 0; i < codeLines.length; i++) {
        let line = codeLines[i]
        if (line.indexOf(endOfEnStr) !== -1 && line.indexOf(startOfEnStr) === -1) {
            active = false;
        }
        if (active) {

            let posList = getPosList(line);
            let posIndex = 0;
            for (let j = 0; j < posList.length; j++) {
                let posItem = posList[j];
                let describe = getPosDescribe(posItem.pos, posStyleList);
                let index = line.indexOf(posItem.word, posIndex);
                if (describe != null) {


                    let posInfo = new PosInfo();
                    posInfo.startPos = new vscode.Position(i, index);
                    posInfo.endPos = new vscode.Position(i, index + posItem.word.length);
                    posInfo.word = posItem.word;
                    posInfo.pos = posItem.pos;
                    posInfo.ja = describe.ja;
                    posInfo.color = describe.color;

                    posInfoList.push(posInfo);
                }

                posIndex = index + posItem.word.length;

            }

        }
        if (line.indexOf(startOfEnStr) !== -1) {
            active = true;
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
        if (info.pos === posdescribe.name) {
            var decoration = { range: new vscode.Range(info.startPos, info.endPos), hoverMessage: info.pos + ' **' + info.ja + '**' };
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
            word: word,
            pos: selectPos
        });
    }

    return posList;
}

export function getPosDescribe(posName: string, posstyleJson: any) {
    for (let i = 0; i < posstyleJson.length; i++) {
        if (posstyleJson[i].name === posName) {
            return posstyleJson[i];
        }
    }
    return null;
}

export function initBingTranslator(){
    let id = st.Settings.getSetting('bingTransId');
    let secret = st.Settings.getSetting('bingTransSecret');
    btTranslator = bt.init({
        client_id: id,
        client_secret: secret
    });

}

export function translateInnerWord(activeEditor: vscode.TextEditor,endOfLine:string) {
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
                let sentence = '[ ' + selectText + ' : ' + text + ' ]'+endOfLine
                let wordStart = new vscode.Position(startPos.line + 1, 0);
                let wordEnd = new vscode.Position(startPos.line + 1, sentence.length - 1);
                activeEditor.edit((builder) => {

                    builder.insert(wordStart, sentence);
                });
                let transWordStyle = vscode.window.createTextEditorDecorationType({
                    color: st.Settings.getSetting('innerTransColor')
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