import React, { useCallback, useMemo, useEffect } from "react";
import "xterm/css/xterm.css";
import {
  Box,
  Tabs,
  Tab,
  useTheme,
  Typography,
} from "@mui/material";
import {
  Terminal as TerminalIcon,
  Code as CodeIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import ShimmerText from "./ShimmerText";
import ErrorFixModal from "./ErrorFixModal";
import { CodePanelProps, ENTRY_FILE } from "../types/types";
import { useCodePanel } from "../hooks/useCodePanel";
import { WebContainerService } from "../services/webContainerService";

// Shimmer text components
const LoadingShimmer = React.memo(() => (
  <Box display="flex" alignItems="center" justifyContent="center" height="100%" sx={{ color: 'text.secondary' }}>
    <ShimmerText text="Loading your code..." />
  </Box>
));
const PreviewShimmer = React.memo(() => (
  <Box display="flex" alignItems="center" justifyContent="center" height="100%" sx={{ color: 'text.secondary' }}>
    <ShimmerText text="Updating preview..." />
  </Box>
));
const PreviewPlaceholder = React.memo(() => (
  <Box display="flex" alignItems="center" justifyContent="center" height="100%" sx={{ color: 'text.secondary' }}>
    <ShimmerText text="Your preview will appear here." />
  </Box>
));

LoadingShimmer.displayName = 'LoadingShimmer';
PreviewShimmer.displayName = 'PreviewShimmer';
PreviewPlaceholder.displayName = 'PreviewPlaceholder';

const CodePanel: React.FC<CodePanelProps> = React.memo(({
  code,
  setCode,
  showTerminal = true,
  isCodeGenerated = false,
  onWriteSuccess,
  onWriteError,
}) => {
  const theme = useTheme();
  const terminalHeight = 200;

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('ResizeObserver loop completed with undelivered notifications')
      ) {
        return;
      }
      originalError.apply(console, args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

  const {
    terminalRef,
    previewIframeRef,
    tab,
    previewUrl,
    shouldShowPreviewShimmer,
    errorModalOpen,
    errorContext,
    handleTabChange,
    handleIframeLoad,
    handleFixError,
    handleCloseModal,
  } = useCodePanel({
    code,
    setCode,
    isCodeGenerated,
    onWriteSuccess,
    onWriteError,
  });

  // Handle terminal resizing
  useEffect(() => {
    const handleResize = () => {
      // Get the WebContainer service instance and fit the terminal
      const webContainerService = WebContainerService.getInstance();
      webContainerService.fitTerminal();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fit terminal when switching to terminal or when terminal becomes visible
  useEffect(() => {
    const webContainerService = WebContainerService.getInstance();
    const timer = setTimeout(() => {
      webContainerService.fitTerminal();
    }, 100); // Small delay to ensure DOM is updated

    return () => clearTimeout(timer);
  }, [tab, showTerminal]);

  const editorOptions = useMemo(() => ({
    fontSize: 14,
    minimap: { enabled: false },
    wordWrap: "on" as const,
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    lineNumbers: "on" as const,
    renderLineHighlight: "line" as const,
    selectionHighlight: false,
    occurrencesHighlight: "off" as const,
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    automaticLayout: true,
    scrollbar: {
      vertical: "auto" as const,
      horizontal: "auto" as const,
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
  }), []);

  const defaultReactImport = useMemo(() => 'import React from "react";\n\n', []);

  const handleEditorDidMount = useCallback((
    editor: import("monaco-editor").editor.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor")
  ) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      allowJs: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
    });

    const model = editor.getModel();
    if (model && !model.getValue().includes('import React')) {
      model.setValue(defaultReactImport + model.getValue());
    }

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        editor.layout();
      });
    });

    const editorElement = editor.getDomNode();
    if (editorElement) {
      resizeObserver.observe(editorElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [defaultReactImport]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) setCode(value);
  }, [setCode]);

  const tabIconMap = {
    0: <CodeIcon sx={{ fontSize: 16, mr: 1 }} />,
    1: <PreviewIcon sx={{ fontSize: 16, mr: 1 }} />,
  };
  

  return (
    <Box display="flex" flexDirection="column" height="100%" sx={{
      backgroundColor: theme.palette.background.default,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 1,
      overflow: 'hidden',
    }}>
      <ErrorFixModal
        open={errorModalOpen}
        errorText={errorContext}
        onClose={handleCloseModal}
        onFix={handleFixError}
      />

      {/* Tabs */}
      <Box sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.text.primary,
              },
            },
            '& .MuiTabs-indicator': {
              height: 2,
              backgroundColor: theme.palette.primary.main,
            },
          }}
        >
          <Tab icon={tabIconMap[0]} label="Code" iconPosition="start" />
          <Tab icon={tabIconMap[1]} label="Preview" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Main content with animated tab transitions */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {tab === 0 && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%' }}
            >
              {code ? (
                <Editor
                  height="100%"
                  language="typescript"
                  value={code}
                  onChange={handleEditorChange}
                  options={editorOptions}
                  theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
                  path={ENTRY_FILE}
                  onMount={handleEditorDidMount}
                />
              ) : <LoadingShimmer />}
            </motion.div>
          )}
          {tab === 1 && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%' }}
            >
              {shouldShowPreviewShimmer ? (
                <PreviewShimmer />
              ) : previewUrl ? (
                <iframe
                  ref={previewIframeRef}
                  src={previewUrl}
                  style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
                  sandbox="allow-scripts allow-same-origin"
                  title="Preview"
                  onLoad={handleIframeLoad}
                />
              ) : <PreviewPlaceholder />}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Terminal */}
      {showTerminal && (
        <>
          <Box
            sx={{
              height: 40,
              display: 'flex',
              alignItems: 'center',
              px: 2,
              backgroundColor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <TerminalIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, color: 'text.secondary' }}>
              Terminal
            </Typography>
          </Box>

          <Box
            sx={{
              height: terminalHeight,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              ref={terminalRef}
              sx={{
                height: '100%',
                width: '100%',
                backgroundColor: '#0a0a0a',
                color: '#fff',
                fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
                fontSize: '13px',
                '& .xterm': {
                  height: '100% !important',
                },
                '& .xterm-viewport': {
                  height: '100% !important',
                },
                '& .xterm-screen': {
                  height: '100% !important',
                },
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
});

CodePanel.displayName = 'CodePanel';
export default CodePanel;
