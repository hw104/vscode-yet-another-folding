import * as vscode from "vscode";
import { ExtensionContext, Range } from "vscode";

type Pair = [string, string];
const bracketPairs: Pair[] = [
  ["(", ")"],
  ["{", "}"],
  ["[", "]"],
];

export async function foldAllHandler(context: ExtensionContext) {
  const textEditor = vscode.window.activeTextEditor;
  if (textEditor == null) {
    return;
  }
  const document = textEditor.document;
  const symbolLength = new Set(bracketPairs.flat().map((s) => s.length));
  const maxOffset = document.offsetAt(
    document.lineAt(document.lineCount - 1).range.end
  );
  let foldRanges: Range[] = [];
  let stack: { symbol: string; symbolRange: vscode.Range }[] = [];

  const starters = bracketPairs.map((p) => p[0]);
  const closers = bracketPairs.map((p) => p[1]);

  for (let offset = 0; offset < maxOffset; offset++) {
    const symbolStartP = document.positionAt(offset);
    for (const l of symbolLength) {
      const symbolEndP = symbolStartP.translate({ characterDelta: l });
      const symbolR = new Range(symbolStartP, symbolEndP);
      const char = document.getText(document.validateRange(symbolR));

      const type = starters.includes(char)
        ? "starter"
        : closers.includes(char)
        ? "closer"
        : undefined;
      if (type == null) {
        continue;
      }
      if (type === "closer") {
        const closer = bracketPairs.find(
          (p) => p[0] === stack.at(-1)?.symbol
        )?.[1];
        if (closer === char) {
          const start = stack.at(-1)!.symbolRange.end;
          const end = new vscode.Position(symbolStartP.line, 0);
          if (end.isAfter(start)) {
            foldRanges.push(new Range(start, end));
          }
          stack.pop();
        }
      }

      if (type === "starter") {
        stack.push({ symbol: char, symbolRange: symbolR });
      }
    }
  }

  const sorted = foldRanges.sort((a, b) =>
    a.contains(b) ? 1 : b.contains(a) ? -1 : 0
  );

  for (let r of sorted) {
    textEditor.selections = [new vscode.Selection(r.start, r.end)];
    await vscode.commands.executeCommand(
      "editor.createFoldingRangeFromSelection"
    );
  }
}
