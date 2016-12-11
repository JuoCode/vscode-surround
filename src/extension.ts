'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    let ifSurround = vscode.commands.registerCommand('extension.surroundWithIf', async () => {
        const editor = vscode.window.activeTextEditor
        let selection = editor.selection
        if (selection.isEmpty) {
            selection = getCurrentLineSelection(selection)
        }
        const lines = getSelectLines(selection)
        const startLine = lines[0]
        const firstLineNumber = startLine.lineNumber
        const endLine = lines[lines.length - 1]
        await editor.edit(currentText => {
            currentText.replace(startLine.range.union(endLine.range), surroundWithIf(selection));
        });
        await editor.edit(currentText => {
            const firstLine = editor.document.lineAt(firstLineNumber)
            editor.selection = new vscode.Selection(
                new vscode.Position(firstLine.lineNumber, firstLine.firstNonWhitespaceCharacterIndex + 4),
                new vscode.Position(firstLine.lineNumber, firstLine.firstNonWhitespaceCharacterIndex + 13)
            );
        });
    });

    let trySurround = vscode.commands.registerCommand('extension.surroundWithTry', async () => {
        const editor = vscode.window.activeTextEditor
        let selection = editor.selection
        if (selection.isEmpty) {
            selection = getCurrentLineSelection(selection)
        }
        const lines = getSelectLines(selection)
        const startLine = lines[0]
        const catchBodyLineNumber = lines.length + 2
        const endLine = lines[lines.length - 1]
        await editor.edit(currentText => {
            currentText.replace(startLine.range.union(endLine.range), surroundWithTry(selection))
        });
        await editor.edit(currentText => {
            const catchLine = editor.document.lineAt(catchBodyLineNumber)
            editor.selection = new vscode.Selection(
                new vscode.Position(catchLine.lineNumber, catchLine.firstNonWhitespaceCharacterIndex),
                new vscode.Position(catchLine.lineNumber, catchLine.firstNonWhitespaceCharacterIndex + catchLine.text.length)
            );
        });
    });

    context.subscriptions.push(ifSurround);
    context.subscriptions.push(trySurround);
}

function surroundWithIf(selection: vscode.Selection) {
    let lines = getSelectLines(selection)
    const { prefix } = getPrefixAndIndent(lines[0])
    return [
        `${prefix}if (condition) {`,
        ...indentLines(lines),
        `${prefix}}`
    ].join('\n')
}

function surroundWithTry(selection: vscode.Selection) {
    let lines = getSelectLines(selection)
    const { prefix, indent } = getPrefixAndIndent(lines[0])
    return [
        `${prefix}try {`,
        ...indentLines(lines),
        `${prefix}} catch (error) {`,
        `${prefix}${indent}console.error(error)`,
        `${prefix}}`,
    ].join('\n')
}

function getCurrentLineSelection(selection: vscode.Selection) {
    const pos = selection.active
    let line = vscode.window.activeTextEditor.document.lineAt(pos.line)
    return line.range as vscode.Selection
}

function getPrefixAndIndent(line: vscode.TextLine) {
    let indentLength = line.firstNonWhitespaceCharacterIndex
    const { tabSize, insertSpaces } = vscode.window.activeTextEditor.options
    return {
        indent: new Array((tabSize as number) + 1).join(insertSpaces ? ' ' : '\t'),
        prefix: new Array(indentLength + 1).join(insertSpaces ? ' ' : '\t')
    }
}

function getSelectLines(selection: vscode.Selection): vscode.TextLine[] {
    let linesCount = selection.start.line - selection.end.line
    let lines = []
    for (let i = selection.start.line; i < selection.end.line + 1; i++) {
        lines.push(vscode.window.activeTextEditor.document.lineAt(i))
    }
    return lines
}

function indentLines(lines: vscode.TextLine[]) {
    const { tabSize, insertSpaces } = vscode.window.activeTextEditor.options
    let prefix = insertSpaces ? new Array((tabSize as number) + 1).join(' ') : '\t'
    return lines.map(line => prefix + line.text)
}