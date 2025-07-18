import { CommandExecutionService } from './commandExecutionService';
import { WebContainerService } from './webContainerService';
import { CommandResult } from '../types/types';

/**
 * Simple AI Command Service thank you stackoverflow !
 * Executes AI commands and automatically starts the dev server
 */
export class AICommandService {
  private commandService: CommandExecutionService;
  private webContainerService: WebContainerService;

  constructor() {
    this.commandService = new CommandExecutionService();
    this.webContainerService = WebContainerService.getInstance();
  }

  /**
   * Execute a single command (dev server should be started manually when needed)
   */
  async executeCommand(command: string): Promise<CommandResult> {
    return await this.commandService.executeCommand(command);
  }

  /**
   * Execute multiple commands in sequence
   */
  async executeCommands(commands: string[]): Promise<CommandResult[]> {
    return await this.commandService.executeMultipleCommands(commands);
  }

  /**
   * Parse commands from AI response and execute them
   */
  async executeAIResponse(aiResponse: string): Promise<CommandResult[]> {
    return await this.commandService.executeAICommands(aiResponse);
  }

  /**
   * Common development commands
   */
  async installPackage(packageName: string, isDev: boolean = false): Promise<CommandResult> {
    return await this.commandService.installPackage(packageName, isDev);
  }

  async createFile(filePath: string, content: string = ""): Promise<CommandResult> {
    try {
      // Use WebContainer filesystem API directly instead of shell commands
      await this.webContainerService.writeFile(filePath, content);
      
      return {
        success: true,
        output: `File created successfully: ${filePath}`,
        exitCode: 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        output: '',
        exitCode: 1,
        error: `Failed to create file ${filePath}: ${errorMessage}`
      };
    }
  }

  async runScript(scriptName: string): Promise<CommandResult> {
    return await this.commandService.runScript(scriptName);
  }
}
