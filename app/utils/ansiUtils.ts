/**
 * Utility functions for handling ANSI escape codes in terminal output
 */

/**
 * Regular expression to match ANSI escape sequences
 * This includes:
 * - CSI sequences: \x1b[...m (colors, formatting)
 * - Cursor movement: \x1b[...G, \x1b[...K, etc.
 * - Other control sequences
 */
const ANSI_ESCAPE_REGEX = /\x1b\[[0-9;]*[a-zA-Z]/g;

/**
 * Alternative regex that's more comprehensive for various ANSI codes
 */
const ANSI_ESCAPE_REGEX_COMPREHENSIVE = /\x1b\[[0-9;]*[mGKHfABCDsuJ]|\x1b\[[\?]?[0-9;]*[hlc]|\x1b\[[0-9;]*[~]|\x1b\].*?\x07|\x1b\[.*?[\x40-\x7E]/g;

/**
 * Strips ANSI escape codes from a string
 * @param text - The text containing ANSI codes
 * @param comprehensive - Whether to use comprehensive regex (default: true)
 * @returns Clean text without ANSI codes
 */
export function stripAnsiCodes(text: string, comprehensive: boolean = true): string {
  if (!text) return text;
  
  const regex = comprehensive ? ANSI_ESCAPE_REGEX_COMPREHENSIVE : ANSI_ESCAPE_REGEX;
  return text.replace(regex, '');
}

/**
 * Strips ANSI codes and normalizes whitespace
 * @param text - The text to clean
 * @returns Cleaned and normalized text
 */
export function cleanTerminalOutput(text: string): string {
  if (!text) return text;
  
  // Strip ANSI codes
  let cleaned = stripAnsiCodes(text);
  
  // Normalize line endings (convert \r\n to \n, remove isolated \r)
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '');
  
  // Remove excessive whitespace but preserve meaningful formatting
  // Remove empty lines at the start and end
  cleaned = cleaned.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '');
  
  return cleaned;
}

/**
 * Checks if a string contains ANSI escape codes
 * @param text - The text to check
 * @returns True if ANSI codes are present
 */
export function containsAnsiCodes(text: string): boolean {
  return ANSI_ESCAPE_REGEX_COMPREHENSIVE.test(text);
}

/**
 * Splits terminal output into clean lines, removing ANSI codes
 * @param output - Raw terminal output
 * @returns Array of clean lines
 */
export function parseTerminalLines(output: string): string[] {
  const cleaned = cleanTerminalOutput(output);
  return cleaned.split('\n').filter(line => line.trim() !== '');
}

/**
 * Extracts error messages from terminal output
 * Common patterns: "Error:", "error:", "ERROR:", "npm ERR!"
 * @param output - Terminal output to analyze
 * @returns Array of detected error lines
 */
export function extractErrorMessages(output: string): string[] {
  const lines = parseTerminalLines(output);
  const errorPatterns = [
    /^error:/i,
    /^npm err!/i,
    /^fatal:/i,
    /^exception/i,
    /^traceback/i,
    /^uncaught/i,
    /command failed/i,
    /build failed/i
  ];
  
  return lines.filter(line => 
    errorPatterns.some(pattern => pattern.test(line.trim()))
  );
}

/**
 * Formats terminal output for display in UI components
 * @param output - Raw terminal output
 * @param options - Formatting options
 * @returns Formatted output suitable for UI display
 */
export function formatTerminalOutput(
  output: string, 
  options: {
    preserveColors?: boolean;
    maxLines?: number;
    truncateLength?: number;
  } = {}
): string {
  const { preserveColors = false, maxLines, truncateLength } = options;
  
  let formatted = preserveColors ? output : stripAnsiCodes(output);
  
  // Normalize line endings
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '');
  
  if (maxLines) {
    const lines = formatted.split('\n');
    if (lines.length > maxLines) {
      formatted = lines.slice(0, maxLines).join('\n') + '\n... (output truncated)';
    }
  }
  
  if (truncateLength && formatted.length > truncateLength) {
    formatted = formatted.substring(0, truncateLength) + '... (truncated)';
  }
  
  return formatted;
}
