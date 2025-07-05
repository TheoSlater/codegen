import { useCallback, useState, useMemo } from "react";
import { CommandExecutionService } from "../services/commandExecutionService";
import { CommandResult } from "../types/types";

export interface UseCommandExecutionOptions {
  onCommandStart?: (command: string) => void;
  onCommandComplete?: (command: string, result: CommandResult) => void;
  onCommandOutput?: (output: string) => void;
}

export const useCommandExecution = (options: UseCommandExecutionOptions = {}) => {
  const { onCommandStart, onCommandComplete, onCommandOutput } = options;
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  
  // Only create the command service on the client side
  const commandService = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new CommandExecutionService();
    }
    return null;
  }, []);

  const executeCommand = useCallback(async (command: string): Promise<CommandResult> => {
    if (!commandService) {
      throw new Error("CommandService not available on server side");
    }
    
    setIsExecuting(true);
    onCommandStart?.(command);
    
    try {
      const result = await commandService.executeCommand(command, onCommandOutput);
      
      setLastResult(result);
      onCommandComplete?.(command, result);
      
      return result;
    } catch (error) {
      console.error('Command execution error:', error);
      const errorResult: CommandResult = {
        success: false,
        output: "",
        exitCode: 1,
        error: error instanceof Error ? error.message : String(error)
      };
      setLastResult(errorResult);
      onCommandComplete?.(command, errorResult);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [commandService, onCommandStart, onCommandComplete, onCommandOutput]);

  const executeMultipleCommands = useCallback(async (commands: string[]): Promise<CommandResult[]> => {
    if (!commandService) {
      throw new Error("CommandService not available on server side");
    }
    
    setIsExecuting(true);
    
    try {
      const results = await commandService.executeMultipleCommands(commands, onCommandOutput);
      
      if (results.length > 0) {
        setLastResult(results[results.length - 1]);
      }
      
      return results;
    } finally {
      setIsExecuting(false);
    }
  }, [commandService, onCommandOutput]);

  // Helper methods for common commands
  const installPackage = useCallback(async (packageName: string, isDev: boolean = false) => {
    return executeCommand(`npm install ${isDev ? '--save-dev' : '--save'} ${packageName}`);
  }, [executeCommand]);

  const runScript = useCallback(async (scriptName: string) => {
    return executeCommand(`npm run ${scriptName}`);
  }, [executeCommand]);

  const listFiles = useCallback(async (directory: string = ".") => {
    return executeCommand(`ls -la ${directory}`);
  }, [executeCommand]);

  // Parse commands from LLM response
  const parseAndExecuteCommands = useCallback(async (llmResponse: string): Promise<CommandResult[]> => {
    if (!commandService) {
      return [];
    }
    
    const commandMatches = llmResponse.match(/```(?:bash|shell|cmd)\n([\s\S]*?)```/g);
    
    if (!commandMatches) {
      return [];
    }
    
    const commands = commandMatches.map(match => 
      match.replace(/```(?:bash|shell|cmd)\n/, '').replace(/```$/, '').trim()
    );
    
    const results: CommandResult[] = [];
    
    for (const commandBlock of commands) {
      const individualCommands = commandBlock.split('\n').filter(cmd => cmd.trim());
      const blockResults = await executeMultipleCommands(individualCommands);
      results.push(...blockResults);
    }
    
    return results;
  }, [executeMultipleCommands, commandService]);

  // Auto-execute commands from LLM responses - removed sendMessage dependency
  const handleLLMResponse = useCallback(async (response: string) => {
    if (!commandService) {
      return [];
    }
    
    if (response.includes('```bash') || response.includes('```shell') || response.includes('```cmd')) {
      const results = await parseAndExecuteCommands(response);
      return results;
    }
    
    return [];
  }, [parseAndExecuteCommands, commandService]);

  return {
    executeCommand,
    executeMultipleCommands,
    installPackage,
    runScript,
    listFiles,
    parseAndExecuteCommands,
    handleLLMResponse,
    isExecuting,
    lastResult,
    commandService
  };
};