import React from "react";
import "xterm/css/xterm.css";
import { Box, Tabs, Tab, useTheme } from "@mui/material";
import Editor from "@monaco-editor/react";
import ShimmerText from "./ShimmerText";
import ErrorFixModal from "./ErrorFixModal";
import { CodePanelProps, ENTRY_FILE } from "../types/types";
import { useCodePanel } from "../hooks/useCodePanel";

const CodePanel: React.FC<CodePanelProps> = ({
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

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      overflow="hidden"
      sx={{
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
      }}
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
              onChange={(value) => value !== undefined && setCode(value)}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
                scrollBeyondLastLine: false,
              }}
              defaultPath={ENTRY_FILE}
            />
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="100%"
            >
              <ShimmerText text="Loading your code..." />
            </Box>
          )}
        </>
      )}

      {/* Preview Tab */}
      {tab === 1 && (
        <>
          {shouldShowPreviewShimmer ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="100%"
            >
              <ShimmerText text="Updating preview..." />
            </Box>
          ) : previewUrl ? (
            <iframe
              ref={previewIframeRef}
              src={previewUrl}
              style={{ flex: 1, border: "none", width: "100%" }}
              sandbox="allow-scripts allow-same-origin"
              title="Preview"
              onLoad={handleIframeLoad}
            />
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="100%"
            >
              <ShimmerText text="Your preview will appear here." />
            </Box>
          )}
        </>
      )}

      {/* Terminal Tab */}
      {showTerminal && (
        <Box
          ref={terminalRef}
          sx={{
            height: "100%",
            width: "100%",
            backgroundColor: "#000",
            color: "#fff",
            fontFamily: "monospace",
            overflow: "hidden",
            position: "relative",
            display: tab === 2 ? "block" : "none",
          }}
        />
      )}
    </Box>
  );
};

export default CodePanel;