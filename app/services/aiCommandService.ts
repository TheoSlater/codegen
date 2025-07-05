import { CommandExecutionService } from './commandExecutionService';
import { CommandResult } from '../types/types';

/**
 * Simple AI Command Service
 * Executes AI commands and automatically starts the dev server
 */
export class AICommandService {
  private commandService: CommandExecutionService;

  constructor() {
    this.commandService = new CommandExecutionService();
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
    // Create file using echo or mkdir/touch commands
    const commands = [
      `mkdir -p $(dirname "${filePath}")`,
      `echo '${content.replace(/'/g, "'\\''")}' > "${filePath}"`
    ];
    
    const commandResults = await this.commandService.executeMultipleCommands(commands);
    return commandResults[commandResults.length - 1]; // Return last result
  }

  async runScript(scriptName: string): Promise<CommandResult> {
    return await this.commandService.runScript(scriptName);
  }
}
