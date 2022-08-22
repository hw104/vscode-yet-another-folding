import * as vscode from 'vscode';
import { foldAllHandler } from './fold_all';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('yafa.foldAll', () => {
		foldAllHandler(context);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
