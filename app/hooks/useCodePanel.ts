import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { WebContainerService } from "../services/webContainerService";
import { ProjectInitializer } from "../services/projectInitializer";
import { CodeWriterService } from "../services/codeWriterService";
import { ErrorDetectionUtils } from "../services/errorDetectionUtils"
import { useChat } from "../context/ChatMessagesContext";

export interface UseCodePanelOptions {
  code: string;
  setCode: (code: string) => void;
  isCodeGenerated: boolean;
  isSending?: boolean;
  onWriteSuccess?: () => void;
  onWriteError?: (error: string) => void;
}

export const useCodePanel = (options: UseCodePanelOptions) => {
  const {
    code,
    setCode,
    isCodeGenerated,
    isSending = false,
    onWriteSuccess,
    onWriteError,
  } = options;

  const terminalRef = useRef<HTMLDivElement>(null);
  const debounceWriteRef = useRef<NodeJS.Timeout | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  
  const [tab, setTab] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isWritingCode, setIsWritingCode] = useState(false);
  const [showPreviewShimmer, setShowPreviewShimmer] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorContext, setErrorContext] = useState("");
  
  const { sendMessage } = useChat();
  const webContainerService = WebContainerService.getInstance();
  const projectInitializer = useMemo(() => new ProjectInitializer(), []);
  const codeWriterService = useMemo(() => new CodeWriterService(), []);

  const promptUserToFixError = useCallback((context: string) => {
    setErrorContext(context);
    setErrorModalOpen(true);
  }, []);

  const handleFixError = useCallback(async () => {
    setErrorModalOpen(false);
    await sendMessage(
      `⚠️ I noticed an error while running your code:\n\n${errorContext.trim()}\n\nWould you like to try fixing it?`
    );
  }, [sendMessage, errorContext]);

  const handleCloseModal = useCallback(() => {
    setErrorModalOpen(false);
  }, []);

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: number) => {
      setTab(newValue);
    },
    []
  );

  const handleOutput = useCallback(
    (data: string) => {
      const terminal = webContainerService.getTerminalInstance();
      if (terminal) {
        terminal.write(data);
        // Auto-scroll after writing
        terminal.scrollToBottom();
      }

      const errorHandler = ErrorDetectionUtils.createErrorHandler(
        promptUserToFixError,
        debounceWriteRef
      );
      errorHandler(data);
    },
    [promptUserToFixError, webContainerService]
  );

  const initializeEnvironment = useCallback(async () => {
    if (!terminalRef.current) return;

    try {
      await webContainerService.bootWebContainer(terminalRef.current);
      
      // Ensure terminal is properly fitted after initialization
      setTimeout(() => {
        webContainerService.fitTerminal();
      }, 100);
      
      await projectInitializer.initializeProject(
        handleOutput,
        promptUserToFixError,
        setPreviewUrl,
        setCode
      );
    } catch (err) {
      promptUserToFixError(`Environment initialization failed: ${String(err)}`);
    }
  }, [webContainerService, projectInitializer, handleOutput, promptUserToFixError, setCode]);

  const handleCodeWrite = useCallback(async () => {
    if (!code?.trim()) return;

    try {
      await codeWriterService.writeCode({
        code,
        isGenerated: isCodeGenerated,
        onWriteStart: () => setIsWritingCode(true),
        onWriteSuccess: () => {
          setIsWritingCode(false);
          onWriteSuccess?.();
        },
        onWriteError: (error: string) => {
          setIsWritingCode(false);
          onWriteError?.(error);
          promptUserToFixError(error);
        },
        onTabSwitch: () => {
          setShowPreviewShimmer(true);
          setTimeout(() => {
            // setTab(1); // TODO: FIX THIS. Doesnt do anything rn, finding alternatives
            setShowPreviewShimmer(false);
          }, 100);
        },
      });
    // TODO: Fix this below comment
    // eslint-disable-next-line @typescript-eslint/no-unused-vars 
    } catch (err) {
      // Error already handled in codeWriterService
    }
  }, [code, isCodeGenerated, onWriteSuccess, onWriteError, promptUserToFixError, codeWriterService]);

  const handleIframeLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const iframe = e.target as HTMLIFrameElement;
    try {
      // Check if we can access the iframe document (same-origin)
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc && iframeDoc.location.protocol === window.location.protocol) {
        const script = iframeDoc.createElement('script');
        script.textContent = ErrorDetectionUtils.createIframeErrorScript();
        iframeDoc.head.appendChild(script);
        console.log('Successfully injected error handling into iframe');
      }
    } catch (err) {
      // Expected when iframe is cross-origin (different port/domain)
      // This is normal for WebContainer previews and doesn't need a warning
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('cross-origin') || errorMessage.includes('Permission denied')) {
        // Silently handle expected cross-origin restrictions
        console.debug('Iframe is cross-origin, error injection skipped (this is normal)');
      } else {
        // Log unexpected errors
        console.warn('Unexpected error accessing iframe:', err);
      }
    }
  }, []);

  // Initialize environment on mount
  useEffect(() => {
    initializeEnvironment();
  }, [initializeEnvironment]);

  // Handle code writing
  useEffect(() => {
    handleCodeWrite();
  }, [handleCodeWrite]);

  // Handle preview error monitoring
  useEffect(() => {
    if (!previewUrl) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(previewUrl).origin) return;
      
      if (typeof event.data === "string") {
        if (event.data.startsWith("console:")) {
          const msg = event.data.replace("console:", "");
          const terminal = webContainerService.getTerminalInstance();
          if (terminal) {
            terminal.write(`\r\n${msg}\r\n`);
            terminal.scrollToBottom();
          }
        }
        else if (event.data.startsWith("error:")) {
          const errorMsg = event.data.replace("error:", "");
          promptUserToFixError(`Preview Error: ${errorMsg}`);
        }
      }
      
      if (event.data && typeof event.data === "object" && event.data.type === "error") {
        promptUserToFixError(
          `JavaScript Error: ${event.data.message} (at ${event.data.filename}:${event.data.lineno}:${event.data.colno})`
        );
      }
    };

    const onError = (event: ErrorEvent) => {
      const errorMsg = `${event.message} (at ${event.filename}:${event.lineno}:${event.colno})`;
      promptUserToFixError(errorMsg);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      promptUserToFixError(`Unhandled Promise Rejection: ${String(event.reason)}`);
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [previewUrl, promptUserToFixError, webContainerService]);

  const shouldShowPreviewShimmer = showPreviewShimmer || (isWritingCode && isCodeGenerated) || isSending;

  return {
    // Refs
    terminalRef,
    previewIframeRef,
    
    // State
    tab,
    previewUrl,
    shouldShowPreviewShimmer,
    errorModalOpen,
    errorContext,
    
    // Handlers
    handleTabChange,
    handleIframeLoad,
    handleFixError,
    handleCloseModal,
  };
};