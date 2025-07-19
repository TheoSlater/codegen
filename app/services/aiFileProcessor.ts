import { CodeWriterService } from "./codeWriterService";
import { AICommandService } from "./aiCommandService";

export interface FileProcessingResult {
  filename: string;
  success: boolean;
  error?: string;
}

export class AIFileProcessor {
  private codeWriterService: CodeWriterService;
  private aiCommandService: AICommandService;
  private processedFiles: Set<string> = new Set();

  constructor() {
    this.codeWriterService = new CodeWriterService();
    this.aiCommandService = new AICommandService();
  }

  /**
   * Process all files from an AI response containing file blocks
   */
  async processAIResponse(aiResponse: string): Promise<FileProcessingResult[]> {
    const results: FileProcessingResult[] = [];
    
    // Extract all file blocks from the response
    const fileMatches = aiResponse.match(/---filename:\s*(.+?)---([\s\S]*?)---end---/g);
    
    if (!fileMatches) {
      return results;
    }

    for (const match of fileMatches) {
      const fileMatch = match.match(/---filename:\s*(.+?)---([\s\S]*?)---end---/);
      if (fileMatch) {
        const filename = fileMatch[1].trim();
        const content = fileMatch[2].trim();
        
        // Create a unique key to prevent duplicate processing
        const fileKey = `${filename}:${this.hashContent(content)}`;
        
        if (this.processedFiles.has(fileKey)) {
          continue; // Skip if already processed
        }
        
        this.processedFiles.add(fileKey);
        
        try {
          await this.processFile(filename, content);
          results.push({
            filename,
            success: true
          });
          console.log(`✅ Successfully processed file: ${filename}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            filename,
            success: false,
            error: errorMessage
          });
          console.error(`❌ Failed to process file ${filename}:`, errorMessage);
        }
      }
    }

    return results;
  }

  /**
   * Process a single file, handling both main app files and other project files
   */
  private async processFile(filename: string, content: string): Promise<void> {
    // Normalize the filename to handle different path formats
    const normalizedFilename = this.normalizeFilename(filename);
    
    // Check if this is the main app file that should update the code panel
    if (this.isMainAppFile(normalizedFilename)) {
      // Use CodeWriterService for main app files to ensure code panel updates
      await this.codeWriterService.writeCode({
        code: content,
        filename: normalizedFilename,
        isGenerated: true
      });
    } else {
      // Use AICommandService for other files (CSS, components, etc.)
      const result = await this.aiCommandService.createFile(normalizedFilename, content);
      if (!result.success) {
        throw new Error(result.error || 'Unknown error creating file');
      }
    }
  }

  /**
   * Normalize filename to ensure consistent path format
   */
  private normalizeFilename(filename: string): string {
    // Remove leading slashes and normalize paths
    let normalized = filename.replace(/^\/+/, '');
    
    // Handle relative paths starting with './'
    if (normalized.startsWith('./')) {
      normalized = normalized.substring(2);
    }
    
    // Special handling for common CSS files that should stay in root
    if (normalized === 'App.css' || normalized === 'index.css' || normalized === 'globals.css') {
      return normalized;
    }
    
    // If it doesn't start with specific directories, add appropriate prefix
    if (!normalized.startsWith('src/') && 
        !normalized.startsWith('public/') && 
        !normalized.startsWith('styles/') &&
        !normalized.startsWith('package.json')) {
      
      // CSS files go to src/ unless they're root-level files
      if (normalized.endsWith('.css')) {
        // Check if it's likely a component-specific CSS file
        if (normalized.includes('/') || normalized.split('/')[0].match(/^[A-Z]/)) {
          normalized = `src/${normalized}`;
        }
      }
      // Other source files go to src/
      else if (normalized.endsWith('.tsx') || normalized.endsWith('.ts') || 
               normalized.endsWith('.jsx') || normalized.endsWith('.js')) {
        // Check if it's likely a source file
        if (!normalized.includes('/') || normalized.split('/')[0].match(/^[A-Z]/)) {
          normalized = `src/${normalized}`;
        }
      }
    }
    
    return normalized;
  }

  /**
   * Check if a filename is the main app file that should update the code panel
   */
  private isMainAppFile(filename: string): boolean {
    const mainFiles = [
      'src/App.tsx',
      'src/App.js',
      'App.tsx',
      'App.js',
      'src/index.tsx',
      'src/index.js'
    ];
    
    return mainFiles.some(mainFile => 
      filename === mainFile || filename.endsWith(`/${mainFile}`)
    );
  }

  /**
   * Simple content hash for duplicate detection
   */
  private hashContent(content: string): string {
    return `${content.length}:${content.substring(0, 50)}`;
  }

  /**
   * Clear processed files cache
   */
  clearProcessedFiles(): void {
    this.processedFiles.clear();
  }

  /**
   * Process files during streaming (for immediate file creation)
   */
  async processStreamingFiles(partialResponse: string): Promise<FileProcessingResult[]> {
    const results: FileProcessingResult[] = [];
    
    // Look for complete file blocks in the streaming response
    const completeFileMatches = partialResponse.match(/---filename:\s*(.+?)---([\s\S]*?)---end---/g);
    
    if (completeFileMatches) {
      for (const match of completeFileMatches) {
        const fileMatch = match.match(/---filename:\s*(.+?)---([\s\S]*?)---end---/);
        if (fileMatch) {
          const filename = fileMatch[1].trim();
          const content = fileMatch[2].trim();
          
          const fileKey = `${filename}:${this.hashContent(content)}`;
          
          if (!this.processedFiles.has(fileKey)) {
            this.processedFiles.add(fileKey);
            
            try {
              await this.processFile(filename, content);
              results.push({
                filename,
                success: true
              });
              console.log(`✅ Real-time file creation: ${filename}`);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              results.push({
                filename,
                success: false,
                error: errorMessage
              });
              console.error(`❌ Real-time file creation failed for ${filename}:`, errorMessage);
            }
          }
        }
      }
    }

    return results;
  }
}
