import { WebContainer } from "@webcontainer/api";
import {  ENTRY_FILE } from "../types/types";

let webcontainerInstance: WebContainer | null = null;

export class WebContainerService {
  private static instance: WebContainerService;
  private terminalInstance: import("xterm").Terminal | null = null;

  static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService();
    }
    return WebContainerService.instance;
  }

  async bootWebContainer(terminalElement: HTMLDivElement): Promise<WebContainer> {
    if (webcontainerInstance) return webcontainerInstance;

    const { Terminal } = await import("xterm");
    const terminal = new Terminal({
      convertEol: true,
      fontSize: 14,
      cursorBlink: true,
      theme: {
        background: "#000000",
        foreground: "#ffffff",
      },
    });

    terminal.open(terminalElement);
    terminal.write("\u001b[1;34m🔧 Booting WebContainer...\r\n\u001b[0m");
    this.terminalInstance = terminal;

    const wc = await WebContainer.boot();
    webcontainerInstance = wc;

    return wc;
  }

  getTerminalInstance(): import("xterm").Terminal | null {
    return this.terminalInstance;
  }

  getWebContainerInstance(): WebContainer | null {
    return webcontainerInstance;
  }

  async writeCodeToFile(code: string): Promise<void> {
    if (!webcontainerInstance) {
      throw new Error("WebContainer not initialized");
    }
    
    await webcontainerInstance.fs.writeFile(ENTRY_FILE, code);
  }

  async readCodeFromFile(): Promise<string> {
    if (!webcontainerInstance) {
      throw new Error("WebContainer not initialized");
    }
    
    return await webcontainerInstance.fs.readFile(ENTRY_FILE, "utf-8");
  }

  writeToTerminal(message: string): void {
    if (this.terminalInstance) {
      this.terminalInstance.write(`\u001b[1;36m${message}\r\n\u001b[0m`);
    }
  }

  writeErrorToTerminal(message: string): void {
    if (this.terminalInstance) {
      this.terminalInstance.write(`\u001b[1;31m${message}\r\n\u001b[0m`);
    }
  }

  writeSuccessToTerminal(message: string): void {
    if (this.terminalInstance) {
      this.terminalInstance.write(`\u001b[1;32m${message}\r\n\u001b[0m`);
    }
  }
}