import React, { useEffect, useRef, useCallback, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import "xterm/css/xterm.css";
import { Box, Tabs, Tab, useTheme } from "@mui/material";
import Editor from "@monaco-editor/react";
import { useChat } from "../../context/ChatMessagesContext";
import ShimmerText from "../ShimmerText";

const PROJECT_DIR = "my-app";
const ENTRY_FILE = `/${PROJECT_DIR}/src/App.tsx`;

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
  const terminalInstance = useRef<import("xterm").Terminal | null>(null);
  const debounceWriteRef = useRef<NodeJS.Timeout | null>(null);
  const [tab, setTab] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { sendMessage } = useChat();
  const theme = useTheme();

  const bootWebContainer = useCallback(async () => {
    if (webcontainerInstance) return webcontainerInstance;
    if (!terminalRef.current) throw new Error("Terminal DOM element not found");

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
    terminal.write("\u001b[1;34m🔧 Booting WebContainer...\r\n\u001b[0m");
    terminalInstance.current = terminal;

    const wc = await WebContainer.boot();
    webcontainerInstance = wc;

    return wc;
  }, []);

  const promptUserToFixError = useCallback(
    async (context: string) => {
      await sendMessage(
        `⚠️ I noticed an error while running your code:\n\n${context.trim()}\n\nWould you like me to try fixing it?`
      );
    },
    [sendMessage]
  );

  const isLikelyError = (text: string) =>
    /error|not found|failed|unexpected/i.test(text);

  const handleOutput = useCallback(
    (data: string) => {
      terminalInstance.current?.write(data);

      try {
        const parsed = JSON.parse(data);
        if (parsed?.error) {
          promptUserToFixError(JSON.stringify(parsed.error));
          return;
        }
      } catch {
        // Ignore parse error
      }

      if (isLikelyError(data)) {
        if (debounceWriteRef.current) clearTimeout(debounceWriteRef.current);
        debounceWriteRef.current = setTimeout(() => {
          promptUserToFixError(data);
        }, 1000);
      }
    },
    [promptUserToFixError]
  );

  const initializeEnvironment = useCallback(async () => {
    const wc = await bootWebContainer();
    const terminal = terminalInstance.current;
    if (!terminal) return;

    const write = (msg: string) =>
      terminal.write(`\u001b[1;36m${msg}\r\n\u001b[0m`);

    try {
      write("📦 Creating Vite React project...");
      const create = await wc.spawn("npm", [
        "create",
        "vite@latest",
        PROJECT_DIR,
        "--",
        "--template",
        "react-ts",
        "--force",
      ]);
      create.output.pipeTo(new WritableStream({ write: handleOutput }));
      const writer = create.input.getWriter();
      await new Promise((res) => setTimeout(res, 2500));
      await writer.write("y\n");
      writer.releaseLock();

      const createExit = await create.exit;
      if (createExit !== 0) {
        await promptUserToFixError("Vite project creation failed.");
        return;
      }

      write("📦 Installing dependencies...");
      const install = await wc.spawn("bash", ["-c", `cd ${PROJECT_DIR} && npm install`]);
      install.output.pipeTo(new WritableStream({ write: handleOutput }));
      const installExit = await install.exit;
      if (installExit !== 0) {
        await promptUserToFixError("Dependency installation failed.");
        return;
      }

      write("🚀 Starting Vite dev server...");
      const dev = await wc.spawn("bash", ["-c", `cd ${PROJECT_DIR} && npm run dev`]);
      dev.output.pipeTo(new WritableStream({ write: handleOutput }));

      dev.exit.then((exitCode) => {
        if (exitCode !== 0) {
          promptUserToFixError("Vite dev server exited unexpectedly.");
        }
      });

      wc.on("server-ready", (_port, url) => {
        setPreviewUrl(url);
        terminal.write(`\u001b[1;32m✅ Server ready at ${url}\r\n\u001b[0m`);
      });

      const fileContent = await wc.fs.readFile(ENTRY_FILE, "utf-8");
      setCode(fileContent);
    } catch (err) {
      await promptUserToFixError(`Unexpected setup error: ${String(err)}`);
    }
  }, [bootWebContainer, handleOutput, promptUserToFixError, setCode]);

  useEffect(() => {
    initializeEnvironment();
  }, [initializeEnvironment]);

  useEffect(() => {
    if (!webcontainerInstance) return;

    const timeoutId = setTimeout(async () => {
      try {
        await webcontainerInstance?.fs.writeFile(ENTRY_FILE, code);
      } catch (err) {
        console.warn("Failed to write file:", err);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [code]);

  useEffect(() => {
    if (!previewUrl || !terminalInstance.current) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(previewUrl).origin) return;
      if (typeof event.data === "string" && event.data.startsWith("console:")) {
        const msg = event.data.replace("console:", "");
        terminalInstance.current?.write(`\r\n${msg}\r\n`);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [previewUrl]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
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
      )}

{tab === 1 && (
  previewUrl ? (
    <iframe
      src={previewUrl}
      style={{ flex: 1, border: "none", width: "100%" }}
      sandbox="allow-scripts allow-same-origin"
      title="Preview"
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
  )
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
