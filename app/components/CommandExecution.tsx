import React, { useState, useRef, useCallback, useMemo } from "react";
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  IconButton,
  Collapse,
  Alert
} from "@mui/material";
import { 
  PlayArrow, 
  Stop, 
  Clear, 
  ExpandMore, 
  ExpandLess, 
  Terminal,
  CheckCircle,
  Error as ErrorIcon
} from "@mui/icons-material";
import { useCommandExecution } from "../hooks/useCommandExecution";
import { CommandResult } from "../types/types";

interface CommandExecutionProps {
  onCommandOutput?: (output: string) => void;
  className?: string;
}

interface CommandHistoryItem {
  command: string;
  result: CommandResult;
  timestamp: Date;
}

// Memoized history item component to prevent unnecessary re-renders
const HistoryItem = React.memo<{
  item: CommandHistoryItem;
  index: number;
  isExpanded: boolean;
  onToggleExpanded: (index: number) => void;
}>(({ item, index, isExpanded, onToggleExpanded }) => {
  const handleToggle = useCallback(() => {
    onToggleExpanded(index);
  }, [index, onToggleExpanded]);

  const formatTimestamp = useCallback((date: Date) => {
    return date.toLocaleTimeString();
  }, []);

  return (
    <Paper sx={{ m: 1, border: 1, borderColor: "divider" }}>
      <ListItem 
        sx={{ 
          cursor: "pointer",
          backgroundColor: item.result.success ? "success.light" : "error.light",
          "&:hover": { backgroundColor: item.result.success ? "success.main" : "error.main" }
        }}
        onClick={handleToggle}
      >
        <ListItemText
          primary={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: "bold" }}>
                $ {item.command}
              </Typography>
              <Chip
                label={item.result.success ? "Success" : "Failed"}
                color={item.result.success ? "success" : "error"}
                size="small"
              />
            </Box>
          }
          secondary={formatTimestamp(item.timestamp)}
        />
        <IconButton size="small">
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </ListItem>
      
      <Collapse in={isExpanded}>
        <Box sx={{ p: 2, backgroundColor: "grey.100" }}>
          <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
            Exit Code: {item.result.exitCode}
          </Typography>
          
          {item.result.output && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                Output:
              </Typography>
              <Paper sx={{ p: 1, backgroundColor: "black", color: "white" }}>
                <pre style={{ 
                  margin: 0, 
                  fontFamily: "monospace", 
                  fontSize: "0.75rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all"
                }}>
                  {item.result.output}
                </pre>
              </Paper>
            </Box>
          )}
          
          {item.result.error && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1, color: "error.main" }}>
                Error:
              </Typography>
              <Paper sx={{ p: 1, backgroundColor: "error.light" }}>
                <pre style={{ 
                  margin: 0, 
                  fontFamily: "monospace", 
                  fontSize: "0.75rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all"
                }}>
                  {item.result.error}
                </pre>
              </Paper>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
});

HistoryItem.displayName = 'HistoryItem';

// Optimized main component with memoization
const CommandExecution: React.FC<CommandExecutionProps> = React.memo(({ 
  onCommandOutput, 
  className 
}) => {
  const [command, setCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Memoized callbacks to prevent re-renders
  const onCommandStart = useCallback((cmd: string) => {
    onCommandOutput?.(`🔧 Executing: ${cmd}`);
  }, [onCommandOutput]);

  const onCommandComplete = useCallback((cmd: string, result: CommandResult) => {
    const historyItem: CommandHistoryItem = {
      command: cmd,
      result,
      timestamp: new Date()
    };
    // Limit history to 100 items for performance
    setCommandHistory(prev => [historyItem, ...prev.slice(0, 99)]);
    onCommandOutput?.(`✅ Command completed: ${cmd}`);
  }, [onCommandOutput]);

  const onCommandOutputCallback = useCallback((output: string) => {
    onCommandOutput?.(output);
  }, [onCommandOutput]);

  const {
    executeCommand,
    isExecuting,
    lastResult
  } = useCommandExecution({
    onCommandStart,
    onCommandComplete,
    onCommandOutput: onCommandOutputCallback
  });

  const handleExecuteCommand = useCallback(async () => {
    if (!command.trim() || isExecuting) return;
    
    try {
      await executeCommand(command.trim());
      setCommand("");
    } catch (error) {
      console.error("Command execution failed:", error);
    }
  }, [command, isExecuting, executeCommand]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleExecuteCommand();
    }
  }, [handleExecuteCommand]);

  const handleQuickCommand = useCallback(async (quickCommand: string) => {
    setCommand(quickCommand);
    try {
      await executeCommand(quickCommand);
    } catch (error) {
      console.error("Quick command execution failed:", error);
    }
  }, [executeCommand]);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setCommandHistory([]);
    setExpandedItems(new Set());
  }, []);

  // Memoized quick commands to prevent re-creation
  const quickCommands = useMemo(() => [
    { label: "List Files", command: "ls -la" },
    { label: "Show Package.json", command: "cat package.json" },
    { label: "Node Version", command: "node --version" },
    { label: "NPM Version", command: "npm --version" },
    { label: "Install Dependencies", command: "npm install" },
    { label: "Run Dev", command: "npm run dev" },
    { label: "Run Build", command: "npm run build" },
    { label: "Current Directory", command: "pwd" }
  ], []);

  return (
    <Box className={className} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Terminal />
          Command Execution
        </Typography>
      </Box>

      {/* Command Input */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            ref={commandInputRef}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Enter command (e.g., npm install axios, ls -la, cat package.json)"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isExecuting}
            sx={{ fontFamily: "monospace" }}
          />
          <Button
            variant="contained"
            onClick={handleExecuteCommand}
            disabled={!command.trim() || isExecuting}
            startIcon={isExecuting ? <Stop /> : <PlayArrow />}
            sx={{ minWidth: 100 }}
          >
            {isExecuting ? "Stop" : "Run"}
          </Button>
        </Box>

        {/* Quick Commands */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {quickCommands.map((cmd, index) => (
            <Chip
              key={index}
              label={cmd.label}
              variant="outlined"
              size="small"
              onClick={() => handleQuickCommand(cmd.command)}
              disabled={isExecuting}
              sx={{ fontSize: "0.75rem" }}
            />
          ))}
        </Box>
      </Box>

      {/* Current Status */}
      {lastResult && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Alert 
            severity={lastResult.success ? "success" : "error"}
            icon={lastResult.success ? <CheckCircle /> : <ErrorIcon />}
          >
            <Typography variant="body2">
              Last command {lastResult.success ? "succeeded" : "failed"} 
              (exit code: {lastResult.exitCode})
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Command History */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1">Command History</Typography>
          <Button
            size="small"
            startIcon={<Clear />}
            onClick={clearHistory}
            disabled={commandHistory.length === 0}
          >
            Clear
          </Button>
        </Box>

        {commandHistory.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
            <Typography>No commands executed yet</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {commandHistory.map((item, index) => (
              <HistoryItem
                key={`${item.timestamp.getTime()}-${index}`}
                item={item}
                index={index}
                isExpanded={expandedItems.has(index)}
                onToggleExpanded={toggleExpanded}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
});

CommandExecution.displayName = 'CommandExecution';

export default CommandExecution;