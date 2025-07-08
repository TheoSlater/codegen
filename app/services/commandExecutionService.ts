import { WebContainerService } from "./webContainerService";
import { PROJECT_DIR, CommandResult } from "../types/types";

// Export CommandResult for external use
export type { CommandResult } from "../types/types";

export class CommandExecutionService {
  private webContainerService: WebContainerService;

  constructor() {
    this.webContainerService = WebContainerService.getInstance();
  }

  async executeCommand(
    command: string,
    onOutput?: (data: string) => void,
    workingDirectory: string = PROJECT_DIR
  ): Promise<CommandResult> {
    const wc = this.webContainerService.getWebContainerInstance();
    if (!wc) {
      await this.webContainerService.initialize();
    }

    // Use the WebContainer service's terminal execution method
    return this.webContainerService.executeTerminalCommand(command, {
      workingDirectory: `/${workingDirectory}`,
      onOutput,
      onError: (error) => {
        this.webContainerService.writeErrorToTerminal(error);
      }
    });
  }

  async executeMultipleCommands(
    commands: string[],
    onOutput?: (data: string) => void,
    workingDirectory: string = PROJECT_DIR
  ): Promise<CommandResult[]> {
    return this.webContainerService.executeMultipleCommands(commands, {
      workingDirectory: `/${workingDirectory}`,
      onOutput,
      onError: (error) => {
        this.webContainerService.writeErrorToTerminal(error);
      }
    });
  }

  // common commands
  async installPackage(packageName: string, isDev: boolean = false): Promise<CommandResult> {
    const flag = isDev ? "--save-dev" : "--save";
    return this.executeCommand(`npm install ${flag} ${packageName}`);
  }

  async runScript(scriptName: string): Promise<CommandResult> {
    return this.executeCommand(`npm run ${scriptName}`);
  }

  async listFiles(directory: string = "."): Promise<CommandResult> {
    return this.executeCommand(`ls -la ${directory}`);
  }

  async showPackageJson(): Promise<CommandResult> {
    return this.executeCommand("cat package.json");
  }

  async checkNodeVersion(): Promise<CommandResult> {
    return this.executeCommand("node --version");
  }

  async checkNpmVersion(): Promise<CommandResult> {
    return this.executeCommand("npm --version");
  }

  // flippin ai specific methods
  async executeAICommands(aiResponse: string, onOutput?: (data: string) => void): Promise<CommandResult[]> {
    return this.webContainerService.executeAICommands(aiResponse, {
      workingDirectory: `/${PROJECT_DIR}`,
      onOutput,
      onError: (error) => {
        this.webContainerService.writeErrorToTerminal(error);
      }
    });
  }

  async parseAndExecuteFromText(text: string, onOutput?: (data: string) => void): Promise<CommandResult[]> {
    const commands = this.extractCommandsFromText(text);
    if (commands.length === 0) {
      return [];
    }

    return this.executeMultipleCommands(commands, onOutput);
  }

  private extractCommandsFromText(text: string): string[] {
    // Extract commands from various formats
    const patterns = [
      /```(?:bash|shell|sh|cmd|terminal)\n([\s\S]*?)```/g,
      /`([^`\n]+)`/g, // Single-line commands in backticks
    ];

    const commands: string[] = [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const commandText = match[1].trim();
        if (commandText) {
          // Split multi-line commands
          const individualCommands = commandText.split('\n')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd && !cmd.startsWith('#') && !cmd.startsWith('//'));
          
          commands.push(...individualCommands);
        }
      }
    }

    return [...new Set(commands)]; // remove ant duplicates
  }

  // Enhanced command validation
  async validateCommand(command: string): Promise<{ valid: boolean; warning?: string }> {
    const dangerousCommands = ['rm -rf', 'format', 'del /f', 'sudo rm', 'dd if='];
    const longRunningCommands = ['npm start', 'npm run dev', 'serve', 'python -m http.server'];

    for (const dangerous of dangerousCommands) {
      if (command.toLowerCase().includes(dangerous)) {
        return { valid: false, warning: `Command contains potentially dangerous operation: ${dangerous}` };
      }
    }

    for (const longRunning of longRunningCommands) {
      if (command.toLowerCase().includes(longRunning)) {
        return { valid: true, warning: `This command may run indefinitely: ${longRunning}` };
      }
    }

    return { valid: true };
  }
}