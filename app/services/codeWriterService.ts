import { WebContainerService } from "./webContainerService";

export interface CodeWriteOptions {
  code: string;
  isGenerated: boolean;
  onWriteStart?: () => void;
  onWriteSuccess?: () => void;
  onWriteError?: (error: string) => void;
  onTabSwitch?: () => void;
}

export class CodeWriterService {
  private webContainerService: WebContainerService;

  constructor() {
    this.webContainerService = WebContainerService.getInstance();
  }

  async writeCode(options: CodeWriteOptions): Promise<void> {
    const {
      code,
      onWriteStart,
      onWriteSuccess,
      onWriteError,
    } = options;

    if (!code?.trim()) {
      return;
    }

    console.log("Attempting to write code to FS");
    onWriteStart?.();

    try {
      await this.webContainerService.writeCodeToFile(code);
      console.log("Write successful");
      
      onWriteSuccess?.();
      
    } catch (err) {
      console.warn("Failed to write file:", err);
      const errorMessage = `Failed to write file: ${String(err)}`;
      onWriteError?.(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async readCode(): Promise<string> {
    try {
      return await this.webContainerService.readCodeFromFile();
    } catch (err) {
      throw new Error(`Failed to read code: ${String(err)}`);
    }
  }
}