export class ErrorDetectionUtils {
    static isLikelyError(text: string): boolean {
      return /error|not found|failed|unexpected|syntaxerror|referenceerror|typeerror|does not provide an export|cannot resolve|module not found|compilation failed|build failed/i.test(text);
    }
  
    static parseErrorFromOutput(data: string): string | null {
      try {
        const parsed = JSON.parse(data);
        if (parsed?.error) {
          return JSON.stringify(parsed.error);
        }
      } catch {
        // Ignore parse error
      }
  
      if (this.isLikelyError(data)) {
        return data;
      }
  
      return null;
    }
  
    static createErrorHandler(
      promptUserToFixError: (context: string) => void,
      debounceRef: React.MutableRefObject<NodeJS.Timeout | null>
    ) {
      return (data: string) => {
        const error = this.parseErrorFromOutput(data);
        if (error) {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          debounceRef.current = setTimeout(() => {
            promptUserToFixError(error);
          }, 1000);
        }
      };
    }
  
    static createIframeErrorScript(): string {
      return `
        window.addEventListener('error', function(event) {
          try {
            // Only send error if it's not a cross-origin related error
            if (event.message && !event.message.includes('Script error') && !event.message.includes('cross-origin')) {
              window.parent.postMessage({
                type: 'error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : ''
              }, '*');
            }
          } catch(e) {
            // Silently ignore postMessage errors (expected for cross-origin iframes)
          }
        });
        
        window.addEventListener('unhandledrejection', function(event) {
          try {
            window.parent.postMessage({
              type: 'error',
              message: 'Unhandled Promise Rejection: ' + String(event.reason),
              filename: 'unknown',
              lineno: 0,
              colno: 0,
              stack: event.reason && event.reason.stack ? event.reason.stack : ''
            }, '*');
          } catch(e) {
            // Silently ignore postMessage errors (expected for cross-origin iframes)
          }
        });
        
        // Override console methods to send errors to parent
        const originalError = console.error;
        console.error = function(...args) {
          originalError.apply(console, args);
          try {
            const message = args.join(' ');
            // Filter out noise from cross-origin errors
            if (!message.includes('cross-origin') && !message.includes('Script error')) {
              window.parent.postMessage('error:' + message, '*');
            }
          } catch(e) {
            // Silently ignore postMessage errors
          }
        };
      `;
    }
  }