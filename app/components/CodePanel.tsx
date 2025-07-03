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

  const handleEditorDidMount = (editor: any, monaco: any) => {
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
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    });

    // Add React type definitions
    const reactTypes = `
declare module 'react' {
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }
  export type JSXElementConstructor<P> = ((props: P) => ReactElement<any, any> | null) | (new (props: P) => Component<any, any>);
  export type Key = string | number;
  export class Component<P, S> {
    props: Readonly<P>;
    state: Readonly<S>;
    constructor(props: P);
    render(): ReactNode;
  }
  export type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;
  export type ReactFragment = {} | ReactNodeArray;
  export interface ReactNodeArray extends Array<ReactNode> {}
  export type ReactPortal = any;
  export function createElement<P extends {}>(
    type: string | JSXElementConstructor<P>,
    props?: P | null,
    ...children: ReactNode[]
  ): ReactElement<P>;
  export const Fragment: JSXElementConstructor<{}>;
}

declare global {
  const React: typeof import('react');
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
`;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      reactTypes,
      'file:///node_modules/@types/react/index.d.ts'
    );

    // Add a default React import for the editor
    const defaultReactImport = `import React from 'react';\n`;
    
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
  };

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
              path={ENTRY_FILE}
              onMount={handleEditorDidMount}
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