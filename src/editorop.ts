'use strict';

import * as vscode from 'vscode';

export class EditorSelection{
    public startPosition:vscode.Position;
    public endPosition:vscode.Position;
    public startOffset:number;
    public endOffset:number;
    public range:vscode.Range;
    public size:number;
    public text:string;
    public isSelected:boolean;

    public static getSelectedItem(editor:vscode.TextEditor){
        let result = new EditorSelection();
        result.startPosition = editor.selection.start;
        result.endPosition = editor.selection.end;
        result.range = new vscode.Range(result.startPosition,result.endPosition);
        result.startOffset = editor.document.offsetAt(result.startPosition);
        result.endOffset = editor.document.offsetAt(result.endPosition);
        result.size = result.endOffset - result.startOffset; 
        result.text = editor.document.getText().slice(result.startOffset, result.endOffset);
        if(result.startOffset == result.endOffset){
            result.isSelected = false;
        }else{
            result.isSelected = true;
        }
        return result;
    }
}