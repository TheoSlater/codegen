import React, { useCallback, useMemo } from "react";
import "xterm/css/xterm.css";
import { Box, Tabs, Tab, useTheme } from "@mui/material";
import Editor from "@monaco-editor/react";
import ShimmerText from "./ShimmerText";
import ErrorFixModal from "./ErrorFixModal";
import { CodePanelProps, ENTRY_FILE } from "../types/types";
import { useCodePanel } from "../hooks/useCodePanel";

// Memoized ShimmerText components to prevent re-renders
const LoadingShimmer = React.memo(() => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    height="100%"
  >
    <ShimmerText text="Loading your code..." />
  </Box>
));

const PreviewShimmer = React.memo(() => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    height="100%"
  >
    <ShimmerText text="Updating preview..." />
  </Box>
));

const PreviewPlaceholder = React.memo(() => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    height="100%"
  >
    <ShimmerText text="Your preview will appear here." />
  </Box>
));

LoadingShimmer.displayName = 'LoadingShimmer';
PreviewShimmer.displayName = 'PreviewShimmer';
PreviewPlaceholder.displayName = 'PreviewPlaceholder';

// Optimized main component with memoization
const CodePanel: React.FC<CodePanelProps> = React.memo(({
  code,
  setCode,
  showTerminal = true,
  isCodeGenerated = false,
  onWriteSuccess,
  onWriteError,
}) => {
  const theme = useTheme();
  
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

  // Memoized editor options to prevent re-creation
  const editorOptions = useMemo(() => ({
    fontSize: 14,
    minimap: { enabled: false },
    wordWrap: "on" as const,
    scrollBeyondLastLine: false,
  }), []);

  // Memoized default React import
  const defaultReactImport = useMemo(() => 'import React from "react";\n\n', []);

  const handleEditorDidMount = useCallback((
    editor: import("monaco-editor").editor.IStandaloneCodeEditor, 
    monaco: typeof import("monaco-editor")
  ) => {
    // Configure TypeScript compiler options for JSX
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
    
    // Check if React is already imported
    const model = editor.getModel();
    if (model && !model.getValue().includes('import React')) {
      model.setValue(defaultReactImport + model.getValue());
    }

    // Disable some strict checks that might cause issues
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  }, [defaultReactImport]);

  // Memoized box styles to prevent re-creation
  const containerStyles = useMemo(() => ({
    borderRadius: 1,
    border: `1px solid ${theme.palette.divider}`,
  }), [theme.palette.divider]);

  const terminalStyles = useMemo(() => ({
    height: "100%",
    width: "100%",
    backgroundColor: "#000",
    color: "#fff",
    fontFamily: "monospace",
    overflow: "hidden",
    position: "relative" as const,
    display: tab === 2 ? "block" : "none",
  }), [tab]);

  // Memoized iframe styles to prevent object re-creation
  const iframeStyles = useMemo(() => ({ 
    flex: 1, 
    border: "none", 
    width: "100%" 
  }), []);

  // Memoized editor change handler
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  }, [setCode]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      overflow="hidden"
      sx={containerStyles}
    >
      <ErrorFixModal
        open={errorModalOpen}
        errorText={errorContext}
        onClose={handleCloseModal}
        onFix={handleFixError}
      />
      
      <Tabs
        value={tab}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Code" />
        <Tab label="Preview" />
        {showTerminal && <Tab label="Terminal" />}
      </Tabs>

      {/* Code Tab */}
      {tab === 0 && (
        <>
          {code ? (
            <Editor
              height="calc(100% - 48px)"
              language="typescript"
              value={code}
              onChange={handleEditorChange}
              options={editorOptions}
              theme="vscode-dark"
              path={ENTRY_FILE}
              onMount={handleEditorDidMount}
            />
          ) : (
            <LoadingShimmer />
          )}
        </>
      )}

      {/* Preview Tab */}
      {tab === 1 && (
        <>
          {shouldShowPreviewShimmer ? (
            <PreviewShimmer />
          ) : previewUrl ? (
            <iframe
              ref={previewIframeRef}
              src={previewUrl}
              style={iframeStyles}
              sandbox="allow-scripts allow-same-origin"
              title="Preview"
              onLoad={handleIframeLoad}
            />
          ) : (
            <PreviewPlaceholder />
          )}
        </>
      )}

      {/* Terminal Tab - Enhanced with command execution capabilities */}
      {showTerminal && (
        <Box
          ref={terminalRef}
          sx={terminalStyles}
        />
      )}
    </Box>
  );
});

CodePanel.displayName = 'CodePanel';

export default CodePanel;