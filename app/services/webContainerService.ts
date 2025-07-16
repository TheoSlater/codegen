import { WebContainer } from "@webcontainer/api";
import type { Terminal } from "xterm";
import { CommandResult, CommandExecutionOptions, ENTRY_FILE } from "../types/types";
import { stripAnsiCodes, cleanTerminalOutput } from "../utils/ansiUtils";

// fitaddon is the addon for xterm.js to fit the terminal to the container size
type FitAddon = import("@xterm/addon-fit").FitAddon;

let webcontainerInstance: WebContainer | null = null;

// Performance optimizations
const DEBUG_MODE = process.env.NODE_ENV === 'development';
const DEFAULT_TIMEOUT = 15000; // Reduced from 30000
const INSTALL_TIMEOUT = 60000; // Reduced from 120000
const BUILD_TIMEOUT = 45000; // Reduced from 90000

// Command execution cache for repeated commands - reduced cache size
const commandCache = new Map<string, { result: CommandResult; timestamp: number }>();
const CACHE_DURATION = 15000; // Reduced from 30 seconds to 15
const MAX_CACHE_SIZE = 20; // Limit cache size

export class WebContainerService {
  private static instance: WebContainerService;
  private webContainer: WebContainer | null = null;
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private isReady = false;
  private initializationPromise: Promise<void> | null = null;
  private commandQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  private constructor() {}

  static getInstance(): WebContainerService {
    if (typeof window === 'undefined') {
      // Return a mock instance on server side with minimal functionality
      const mockService = Object.create(WebContainerService.prototype);
      mockService.isWebContainerReady = () => false;
      mockService.executeTerminalCommand = async () => ({ success: false, output: "", exitCode: 1, error: "Not available on server" });
      mockService.executeMultipleCommands = async () => [];
      mockService.executeAICommands = async () => [];
      return mockService;
    }
    
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService();
    }
    return WebContainerService.instance;
  }

  async bootWebContainer(terminalElement: HTMLDivElement): Promise<WebContainer> {
    if (webcontainerInstance) return webcontainerInstance;

    // Initialize terminal with proper addons and configuration
    await this.initializeTerminal(terminalElement);
    
    if (this.terminal) {
      this.terminal.write("\u001b[1;34m🔧 Booting WebContainer...\r\n\u001b[0m");
      this.scrollToBottom();
    }

    const wc = await WebContainer.boot();
    webcontainerInstance = wc;
    this.webContainer = wc;
    this.isReady = true;

    return wc;
  }

  getTerminalInstance(): import("xterm").Terminal | null {
    return this.terminal;
  }

  getWebContainerInstance(): WebContainer | null {
    return webcontainerInstance;
  }

  async initialize(): Promise<void> {
    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    if (webcontainerInstance) {
      this.webContainer = webcontainerInstance;
      this.isReady = true;
      return;
    }

    if (!this.checkEnvironmentSupport()) {
      throw new Error("WebContainer environment not supported. Requires HTTPS with COOP/COEP headers.");
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      this.webContainer = await WebContainer.boot();
      webcontainerInstance = this.webContainer;
      this.isReady = true;
      if (DEBUG_MODE) {
        console.log("WebContainer initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize WebContainer:", error);
      this.initializationPromise = null; // Reset on failure
      throw error;
    }
  }

  isWebContainerReady(): boolean {
    return this.isReady && this.webContainer !== null;
  }

  async initializeTerminal(terminalElement: HTMLDivElement): Promise<Terminal> {
    if (this.terminal) {
      this.terminal.dispose();
    }

    // Dynamic imports for browser-only code
    const { Terminal } = await import("xterm");
    const { FitAddon } = await import("@xterm/addon-fit");

    this.terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      convertEol: true,
      scrollback: 1000,
      theme: {
        background: "#0a0a0a",
        foreground: "#ffffff",
        cursor: "#ffffff",
      },
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.open(terminalElement);
    this.fitAddon.fit();

    // Set up resize observer for auto-fitting
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        this.fitAddon?.fit();
      });
    });
    resizeObserver.observe(terminalElement);

    // Store the observer for cleanup  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.terminal as any)._resizeObserver = resizeObserver;

    return this.terminal;
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

  // Optimized terminal command execution with caching and queue management
  async executeTerminalCommand(
    command: string, 
    options: CommandExecutionOptions = {}
  ): Promise<CommandResult> {
    // Check cache for repeated commands (excluding installs and builds)
    if (this.shouldCacheCommand(command)) {
      const cached = this.getCachedResult(command);
      if (cached) {
        if (DEBUG_MODE) {
          console.log(`🚀 Using cached result for: ${command}`);
        }
        return cached;
      }
    }

    // Queue management for better performance
    return new Promise((resolve, reject) => {
      this.commandQueue.push(async () => {
        try {
          const result = await this.executeCommandInternal(command, options);
          
          // Cache result if appropriate
          if (this.shouldCacheCommand(command) && result.success) {
            this.setCachedResult(command, result);
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async executeCommandInternal(
    command: string,
    options: CommandExecutionOptions = {}
  ): Promise<CommandResult> {
    await this.ensureWebContainerReady();
    
    const wc = this.getWebContainerInstance();
    if (!wc) {
      return {
        success: false,
        output: "",
        exitCode: 1,
        error: "WebContainer not initialized",
      };
    }

    // Smart timeout based on command type
    const timeout = this.getCommandTimeout(command, options.timeout);
    const { workingDirectory = "/", onOutput, onError } = options;

    // Minimal terminal output for performance
    if (this.terminal && DEBUG_MODE) {
      this.terminal.write(`\x1b[36m$ ${command}\x1b[0m\r\n`);
      this.scrollToBottom();
    }

    // Validate command before execution
    const validation = this.validateCommand(command);
    if (!validation.valid) {
      const errorMsg = validation.warning || 'Invalid command';
      if (this.terminal) {
        this.terminal.write(`\x1b[31mError: ${errorMsg}\x1b[0m\r\n`);
        this.scrollToBottom();
      }
      return {
        success: false,
        output: "",
        exitCode: 1,
        error: errorMsg,
      };
    }

    try {
      const process = await wc.spawn("sh", ["-c", command], {
        cwd: workingDirectory,
      });

      let output = "";
      let outputComplete = false;

      // Simplified output handling
      const outputPromise = new Promise<void>((resolve) => {
        const stream = new WritableStream({
          write: (data: string) => {
            const cleanData = stripAnsiCodes(data);
            output += cleanData;
            onOutput?.(cleanData);
            
            if (this.terminal && !DEBUG_MODE) {
              // Only write to terminal in production if it's important
              if (cleanData.includes('error') || cleanData.includes('completed')) {
                this.terminal.write(data);
                this.scrollToBottom();
              }
            } else if (this.terminal && DEBUG_MODE) {
              this.terminal.write(data);
              this.scrollToBottom();
            }
          },
          close: () => {
            outputComplete = true;
            resolve();
          },
          abort: () => {
            outputComplete = true;
            resolve();
          }
        });

        process.output.pipeTo(stream).catch(() => {
          outputComplete = true;
          resolve();
        });
      });

      // Wait for process completion with timeout
      const exitCode = await Promise.race([
        process.exit,
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error("Command timeout")), timeout)
        )
      ]);

      // Wait briefly for output completion
      if (!outputComplete) {
        await Promise.race([
          outputPromise,
          new Promise<void>((resolve) => setTimeout(resolve, 2000))
        ]);
      }

      const success = exitCode === 0;
      
      if (this.terminal) {
        this.terminal.write('\r\n');
        this.scrollToBottom();
      }

      return {
        success,
        output: cleanTerminalOutput(output),
        exitCode,
        error: success ? undefined : cleanTerminalOutput(output),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      onError?.(errorMessage);
      
      if (this.terminal) {
        this.terminal.write(`\x1b[31mError: ${errorMessage}\x1b[0m\r\n`);
        this.scrollToBottom();
      }
      
      return {
        success: false,
        output: "",
        exitCode: 1,
        error: errorMessage,
      };
    }
  }

  private getCommandTimeout(command: string, customTimeout?: number): number {
    if (customTimeout) return customTimeout;
    
    if (command.includes('npm install') || command.includes('npm i ')) {
      return INSTALL_TIMEOUT;
    } else if (command.includes('npm run build') || command.includes('npm run dev')) {
      return BUILD_TIMEOUT;
    } else if (command.includes('git clone') || command.includes('yarn install')) {
      return BUILD_TIMEOUT;
    }
    
    return DEFAULT_TIMEOUT;
  }

  private shouldCacheCommand(command: string): boolean {
    // Only cache simple read commands
    return command.includes('ls') || 
           command.includes('pwd') || 
           command.includes('cat package.json') ||
           command.includes('node --version') ||
           command.includes('npm --version');
  }

  private getCachedResult(command: string): CommandResult | null {
    const cached = commandCache.get(command);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }
    return null;
  }

  private setCachedResult(command: string, result: CommandResult): void {
    // Cleanup old cache entries if cache is getting too large
    if (commandCache.size >= MAX_CACHE_SIZE) {
      const entries = Array.from(commandCache.entries());
      const oldestEntries = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(MAX_CACHE_SIZE / 2));
      
      oldestEntries.forEach(([key]) => commandCache.delete(key));
    }
    
    commandCache.set(command, {
      result,
      timestamp: Date.now()
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.commandQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    while (this.commandQueue.length > 0) {
      const task = this.commandQueue.shift();
      if (task) {
        await task();
      }
    }
    
    this.isProcessingQueue = false;
  }

  async ensureWebContainerReady(): Promise<void> {
    if (!this.isWebContainerReady()) {
      await this.initialize();
    }
  }

  async executeMultipleCommands(
    commands: string[],
    options: CommandExecutionOptions = {}
  ): Promise<CommandResult[]> {
    await this.ensureWebContainerReady();
    
    const results: CommandResult[] = [];
    
    // Execute commands in parallel where safe, series for installations
    const hasInstalls = commands.some(cmd => 
      cmd.includes('npm install') || cmd.includes('npm i ') || cmd.includes('yarn install')
    );
    
    if (hasInstalls) {
      // Execute serially for safety with installations
      for (const command of commands) {
        const result = await this.executeTerminalCommand(command, options);
        results.push(result);
        
        if (!result.success) {
          if (this.terminal) {
            this.writeErrorToTerminal(`Command failed: ${command}. Stopping execution.`);
          }
          break;
        }
      }
    } else {
      // Execute simple commands in parallel for better performance
      const promises = commands.map(command => 
        this.executeTerminalCommand(command, options)
      );
      results.push(...await Promise.all(promises));
    }
    
    return results;
  }

  // Simplified terminal writing methods
  writeToTerminal(text: string): void {
    this.terminal?.write(text);
    this.scrollToBottom();
  }

  writeErrorToTerminal(error: string): void {
    this.terminal?.write(`\x1b[31mError: ${error}\x1b[0m\r\n`);
    this.scrollToBottom();
  }

  writeSuccessToTerminal(message: string): void {
    this.terminal?.write(`\u001b[1;32m${message}\r\n\u001b[0m`);
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    if (this.terminal) {
      this.terminal.scrollToBottom();
    }
  }

  fitTerminal(): void {
    if (this.fitAddon) {
      this.fitAddon.fit();
    }
  }

  clearTerminal(): void {
    this.terminal?.clear();
  }

  resizeTerminal(): void {
    this.fitAddon?.fit();
  }

  dispose(): void {
    if (this.terminal) {
      // Clean up resize observer if it exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resizeObserver = (this.terminal as any)._resizeObserver;
      if (resizeObserver && resizeObserver.disconnect) {
        resizeObserver.disconnect();
      }
      
      this.terminal.dispose();
      this.terminal = null;
    }
    this.fitAddon = null;
    this.commandQueue = [];
    commandCache.clear();
  }

  // Convenience methods for common commands (optimized)
  async listFiles(directory: string = ".", options?: CommandExecutionOptions): Promise<CommandResult> {
    return this.executeTerminalCommand(`ls -la ${directory}`, options);
  }

  async showPackageJson(options?: CommandExecutionOptions): Promise<CommandResult> {
    return this.executeTerminalCommand("cat package.json", options);
  }

  async installPackage(packageName: string, isDev: boolean = false, options?: CommandExecutionOptions): Promise<CommandResult> {
    const flag = isDev ? "--save-dev" : "--save";
    return this.executeTerminalCommand(`npm install ${flag} ${packageName}`, options);
  }

  async runNpmScript(scriptName: string, options?: CommandExecutionOptions): Promise<CommandResult> {
    return this.executeTerminalCommand(`npm run ${scriptName}`, options);
  }

  // AI-specific command parsing and execution (optimized)
  async executeAICommands(aiResponse: string, options?: CommandExecutionOptions): Promise<CommandResult[]> {
    const commands = this.extractCommandsFromAIResponse(aiResponse);
    if (commands.length === 0) return [];
    return this.executeMultipleCommands(commands, options);
  }

  private extractCommandsFromAIResponse(response: string): string[] {
    const bashBlocks = response.match(/```(?:bash|shell|sh|cmd)\n([\s\S]*?)```/g);
    if (!bashBlocks) return [];

    const commands: string[] = [];
    
    for (const block of bashBlocks) {
      const commandText = block.replace(/```(?:bash|shell|sh|cmd)\n/, '').replace(/```$/, '').trim();
      const individualCommands = commandText.split('\n')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd && !cmd.startsWith('#'));
      
      commands.push(...individualCommands);
    }
    
    return commands;
  }

  // Optimized command validation
  validateCommand(command: string): { valid: boolean; warning?: string } {
    const dangerousCommands = ['rm -rf', 'format', 'del /f', 'sudo rm', 'dd if='];
    const longRunningCommands = ['npm start', 'npm run dev', 'serve', 'python -m http.server'];

    for (const dangerous of dangerousCommands) {
      if (command.includes(dangerous)) {
        return { valid: false, warning: `Dangerous command detected: ${dangerous}` };
      }
    }

    for (const longRunning of longRunningCommands) {
      if (command.includes(longRunning)) {
        return { valid: true, warning: `Long-running command: ${longRunning}` };
      }
    }

    return { valid: true };
  }

  // Check if environment supports WebContainer
  private checkEnvironmentSupport(): boolean {
    if (typeof window === 'undefined') return false;

    if (!window.SharedArrayBuffer) {
      console.warn('SharedArrayBuffer not available. WebContainer requires secure context with COOP/COEP headers.');
      return false;
    }

    if (!window.crossOriginIsolated) {
      console.warn('Cross-origin isolation not enabled. WebContainer requires COOP/COEP headers.');
      return false;
    }

    return true;
  }
}