// components/CodePanel.tsx
import React, { useEffect, useRef, useCallback, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import "xterm/css/xterm.css";
import { Box, Tabs, Tab, useTheme } from "@mui/material";
import Editor from "@monaco-editor/react";
import { useChat } from "../../context/ChatMessagesContext";

let webcontainerInstance: WebContainer | null = null;

interface CodePanelProps {
  code: string;
  setCode: (code: string) => void;
  pendingFile?: string | null;
  showTerminal?: boolean;
}

export default function CodePanel({
  code,
  setCode,
  showTerminal = true,
}: CodePanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<import("xterm").Terminal | null>(null);
  const debounceWriteRef = useRef<NodeJS.Timeout | null>(null);
  const [tab, setTab] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { sendMessage } = useChat();
  const theme = useTheme();

  // Initialize terminal & boot webcontainer once (memoized)
  const bootWebContainer = useCallback(async () => {
    if (webcontainerInstance) return webcontainerInstance;

    if (!terminalRef.current) {
      throw new Error("Terminal DOM element not found");
    }

    const { Terminal } = await import("xterm");

    const terminal = new Terminal({
      convertEol: true,
      fontSize: 14,
      cursorBlink: true,
      theme: {
        background: "#000000",
        foreground: "#ffffff",
      },
    });

    terminal.open(terminalRef.current);
    termInstance.current = terminal;

    terminal.write("\u001b[1;34m🔧 Booting WebContainer...\r\n\u001b[0m");

    const wc = await WebContainer.boot();
    webcontainerInstance = wc;

    return wc;
  }, []);

  // Send error fix request to chat context
  const promptUserToFixError = useCallback(
    async (context: string) => {
      await sendMessage(
        `⚠️ I noticed an error while running your code:\n\n${context.trim()}\n\nWould you like me to try fixing it?`
      );
    },
    [sendMessage]
  );

  // Output handler with enhanced error detection and minimal parsing
  const handleOutput = useCallback(
    (data: string) => {
      if (!termInstance.current) return;
      termInstance.current.write(data);

      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          promptUserToFixError(JSON.stringify(parsed.error));
          return;
        }
      } catch {}

      if (/error|not found|failed|unexpected/i.test(data)) {
        if (debounceWriteRef.current !== null) {
          clearTimeout(debounceWriteRef.current);
        }

        debounceWriteRef.current = setTimeout(() => {
          promptUserToFixError(data);
        }, 1000);
      }
    },
    [promptUserToFixError]
  );

  // Boot and setup environment on mount
  useEffect(() => {
    let terminal: import("xterm").Terminal | undefined;
    let isMounted = true;

    const boot = async () => {
      const wc = await bootWebContainer();
      if (!isMounted) return;

      terminal = termInstance.current!;
      terminal.write(
        "\u001b[1;36m📦 Creating Vite React project...\r\n\u001b[0m"
      );

      const create = await wc.spawn("npm", [
        "create",
        "vite@latest",
        "my-app",
        "--",
        "--template",
        "react-ts",
        "--force",
      ]);

      create.output.pipeTo(
        new WritableStream({
          write: (chunk) => {
            handleOutput(chunk);
          },
        })
      );

      const writer = create.input.getWriter();
      await new Promise((r) => setTimeout(r, 2500));
      await writer.write("y\n");
      writer.releaseLock();

      const createExit = await create.exit;
      if (createExit !== 0) {
        await promptUserToFixError("Vite project creation failed.");
        return;
      }

      terminal.write("\u001b[1;36m📦 Installing dependencies...\r\n\u001b[0m");
      const install = await wc.spawn("bash", [
        "-c",
        "cd my-app && npm install",
      ]);
      install.output.pipeTo(
        new WritableStream({
          write: (chunk) => handleOutput(chunk),
        })
      );

      const installExit = await install.exit;
      if (installExit !== 0) {
        await promptUserToFixError("Dependency installation failed.");
        return;
      }

      terminal.write("\u001b[1;36m🚀 Starting Vite dev server...\r\n\u001b[0m");
      const dev = await wc.spawn("bash", ["-c", "cd my-app && npm run dev"]);

      dev.output.pipeTo(
        new WritableStream({
          write: (chunk) => handleOutput(chunk),
        })
      );

      dev.exit.then((exitCode) => {
        if (exitCode !== 0) {
          promptUserToFixError("Vite dev server exited unexpectedly.");
        }
      });

      wc.on("server-ready", (_port, url) => {
        setPreviewUrl(url);
        terminal?.write(`\u001b[1;32m✅ Server ready at ${url}\r\n\u001b[0m`);
      });

      // Load initial file content into editor
      const file = await wc.fs.readFile("/my-app/src/App.tsx", "utf-8");
      setCode(file);
    };

    boot();

    return () => {
      isMounted = false;
      // Note: Do NOT dispose terminal here to keep it persistent
      // terminal?.dispose();
    };
  }, [bootWebContainer, handleOutput, promptUserToFixError, setCode]);

  // Debounced write to WebContainer filesystem on code changes
  useEffect(() => {
    if (!webcontainerInstance) return;
    if (debounceWriteRef.current) clearTimeout(debounceWriteRef.current);

    debounceWriteRef.current = setTimeout(async () => {
      try {
        if (webcontainerInstance) {
          await webcontainerInstance.fs.writeFile("/my-app/src/App.tsx", code);
        }
      } catch (error) {
        console.warn("Failed to write file:", error);
      }
    }, 500);

    return () => clearTimeout(debounceWriteRef.current!);
  }, [code]);

  // Tab change handler
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  // Console log forwarding from iframe preview to terminal
  useEffect(() => {
    if (!previewUrl || !termInstance.current) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(previewUrl).origin) return;
      if (typeof event.data === "string" && event.data.startsWith("console:")) {
        const msg = event.data.replace("console:", "");
        termInstance.current?.write(`\r\n${msg}\r\n`);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [previewUrl]);

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
      <Tabs
        value={tab}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Code" />
        <Tab label="Preview" />
        {showTerminal && <Tab label="Terminal" />}
      </Tabs>

      {tab === 0 && (
        <Editor
          height="calc(100% - 48px)"
          defaultLanguage="typescript"
          value={code}
          onChange={(value) => value !== undefined && setCode(value)}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
          }}
          defaultPath="/my-app/src/App.tsx"
        />
      )}

      {tab === 1 && previewUrl && (
        <iframe
          src={previewUrl}
          style={{ flex: 1, border: "none", width: "100%" }}
          sandbox="allow-scripts allow-same-origin"
          title="Preview"
        />
      )}

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
}
