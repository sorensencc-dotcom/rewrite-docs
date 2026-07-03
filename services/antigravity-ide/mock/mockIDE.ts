import { AntigravityUI } from "../uiAdapter";

export class MockAntigravityIDE implements AntigravityUI {
  inlineHints: any[] = [];
  sidePanelContent: string = "";
  statusBarText: string = "";

  showInlineHint(filePath: string, line: number, text: string, severity: string) {
    this.inlineHints.push({ filePath, line, text, severity });
    console.log(`[INLINE HINT] (${severity}) ${filePath}:${line} → ${text}`);
  }

  showSidePanel(content: string) {
    this.sidePanelContent = content;
    console.log("\n=== SIDE PANEL ===\n" + content + "\n==================\n");
  }

  updateStatusBar(text: string) {
    this.statusBarText = text;
    console.log(`[STATUS BAR] ${text}`);
  }
}
