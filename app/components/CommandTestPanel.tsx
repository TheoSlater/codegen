import React, { useState, useCallback, useMemo } from 'react';
import { Box, Button, Typography, TextField, Alert, CircularProgress } from '@mui/material';
import { Terminal, PlayArrow, CheckCircle, Error } from '@mui/icons-material';
import { useCommandExecution } from '../hooks/useCommandExecution';

interface CommandTestPanelProps {
  className?: string;
}

// Optimized component with memoization
const CommandTestPanel: React.FC<CommandTestPanelProps> = React.memo(({ className }) => {
  const [command, setCommand] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Memoized callbacks to prevent re-renders
  const onCommandStart = useCallback((cmd: string) => {
    setStatus('running');
    const knownSlowCommands = {
      'npm install': 'Installing packages... This may take several minutes.',
      'npm i ': 'Installing packages... This may take several minutes.',
      'npm run build': 'Building project... This may take a few minutes.',
      'npm run dev': 'Starting development server... This will run in the background.',
      'npm start': 'Starting development server... This will run in the background.',
      'git clone': 'Cloning repository... This may take a while.',
    };

    const slowCommand = Object.keys(knownSlowCommands).find(key => cmd.includes(key));
    if (slowCommand) {
      setMessage(knownSlowCommands[slowCommand as keyof typeof knownSlowCommands]);
    } else if (cmd.includes('ls') || cmd.includes('pwd') || cmd.includes('cat')) {
      setMessage(`Running quick command: ${cmd}`);
    } else {
      setMessage(`Running: ${cmd}`);
    }
  }, []);

  const onCommandComplete = useCallback((cmd: string, result: { success: boolean; output?: string; error?: string; exitCode?: number }) => {
    if (result.success) {
      setStatus('success');
      if (result.output && result.output.trim()) {
        setMessage(`✅ Success: ${result.output.slice(0, 200)}${result.output.length > 200 ? '...' : ''}`);
      } else {
        setMessage('✅ Command completed successfully');
      }
    } else {
      setStatus('error');
      const errorMsg = result.error || result.output || 'Unknown error';
      setMessage(`❌ Command failed (exit code: ${result.exitCode})\n${errorMsg.slice(0, 300)}${errorMsg.length > 300 ? '...' : ''}`);
    }
    
    setCommand('');
    
    // Auto-clear status after delay
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, result.success ? 10000 : 15000);
  }, []);

  const { executeCommand, isExecuting, commandService } = useCommandExecution({
    onCommandStart,
    onCommandComplete
  });

  const handleExecute = useCallback(async () => {
    if (!command.trim() || isExecuting || !commandService) return;
    
    try {
      await executeCommand(command);
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Execution failed: ${error}`);
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 10000);
    }
  }, [command, isExecuting, commandService, executeCommand]);

  const handleCancel = useCallback(() => {
    setStatus('idle');
    setMessage('Command execution cancelled');
    setCommand('');
    setTimeout(() => setMessage(''), 3000);
  }, []);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleExecute();
    }
  }, [handleExecute]);

  // Memoized status indicator
  const statusIndicator = useMemo(() => {
    switch (status) {
      case 'running':
        return <CircularProgress size={20} />;
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return null;
    }
  }, [status]);

  // Memoized quick commands
  const quickCommands = useMemo(() => [
    { label: "List Files", command: "ls -la" },
    { label: "Package.json", command: "cat package.json" },
    { label: "Node Version", command: "node --version" },
    { label: "NPM Version", command: "npm --version" },
    { label: "Install Deps", command: "npm install" },
    { label: "Run Dev", command: "npm run dev" },
  ], []);

  return (
    <Box className={className} sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Terminal />
        AI Command Executor
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        label="Enter command"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isExecuting}
        sx={{ mb: 2 }}
        InputProps={{
          endAdornment: statusIndicator,
        }}
      />

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={handleExecute}
          disabled={!command.trim() || isExecuting}
        >
          Execute
        </Button>
        
        {isExecuting && (
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </Box>

      {status !== 'idle' && message && (
        <Alert 
          severity={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message}
          </Typography>
        </Alert>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick Commands:</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {quickCommands.map(({ label, command: cmd }) => (
          <Button
            key={cmd}
            size="small"
            variant="outlined"
            onClick={() => setCommand(cmd)}
            disabled={isExecuting}
          >
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  );
});

CommandTestPanel.displayName = 'CommandTestPanel';

export default CommandTestPanel;
