import { WebContainer } from "@webcontainer/api";
import { WebContainerService } from "./webContainerService";
import { PROJECT_DIR, ENTRY_FILE } from "../types/types";

export class ProjectInitializer {
  private webContainerService: WebContainerService;

  constructor() {
    this.webContainerService = WebContainerService.getInstance();
  }

  async initializeProject(
    onOutput: (data: string) => void,
    onError: (error: string) => void,
    onPreviewReady: (url: string) => void,
    onCodeLoaded: (code: string) => void
  ): Promise<void> {
    try {
      const wc = this.webContainerService.getWebContainerInstance();
      if (!wc) {
        throw new Error("WebContainer not available");
      }

      await this.createViteProject(wc, onOutput, onError);
      await this.installDependencies(wc, onOutput, onError);
      await this.startDevServer(wc, onOutput, onError, onPreviewReady);
      await this.loadInitialCode(wc, onCodeLoaded, onError);
    } catch (err) {
      onError(`Unexpected setup error: ${String(err)}`);
    }
  }

  private async createViteProject(
    wc: WebContainer,
    onOutput: (data: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    this.webContainerService.writeToTerminal("📦 Creating Vite React project...");
    
    const create = await wc.spawn("npm", [
      "create",
      "vite@latest",
      PROJECT_DIR,
      "--",
      "--template",
      "react-ts",
      "--force",
    ]);
    
    create.output.pipeTo(new WritableStream({ write: onOutput }));
    const writer = create.input.getWriter();

    // Small delay to let prompt show if any
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await writer.write("y\n");
    writer.releaseLock();

    const createExit = await create.exit;
    if (createExit !== 0) {
      throw new Error("Vite project creation failed.");
    }

    // Verify project structure
    await this.verifyProjectStructure(wc, onError);
  }

  private async verifyProjectStructure(
    wc: WebContainer,
    onError: (error: string) => void
  ): Promise<void> {
    this.webContainerService.writeToTerminal("📂 Checking project files...");
    
    const tree = await wc.fs.readdir(`/${PROJECT_DIR}/src`);
    this.webContainerService.writeToTerminal(`📁 Files in src/: ${tree.join(", ")}`);
    
    try {
      await wc.fs.readFile(ENTRY_FILE, "utf-8");
      this.webContainerService.writeSuccessToTerminal(`✅ Entry file ${ENTRY_FILE} found.`);
    } catch {
      this.webContainerService.writeErrorToTerminal(`❌ Entry file ${ENTRY_FILE} not found!`);
      throw new Error(`Entry file ${ENTRY_FILE} is missing.`);
    }
  }

  private async installDependencies(
    wc: WebContainer,
    onOutput: (data: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    this.webContainerService.writeToTerminal("📦 Installing dependencies...");
    
    const install = await wc.spawn("bash", [
      "-c",
      `cd ${PROJECT_DIR} && npm install`,
    ]);
    
    install.output.pipeTo(new WritableStream({ write: onOutput }));
    const installExit = await install.exit;
    
    if (installExit !== 0) {
      throw new Error("Dependency installation failed.");
    }
  }

  private async startDevServer(
    wc: WebContainer,
    onOutput: (data: string) => void,
    onError: (error: string) => void,
    onPreviewReady: (url: string) => void
  ): Promise<void> {
    this.webContainerService.writeToTerminal("🚀 Starting Vite dev server...");
    
    const dev = await wc.spawn("bash", [
      "-c",
      `cd ${PROJECT_DIR} && npm run dev`,
    ]);
    
    dev.output.pipeTo(new WritableStream({ write: onOutput }));

    dev.exit.then((exitCode) => {
      if (exitCode !== 0) {
        onError("Vite dev server exited unexpectedly.");
      }
    });

    wc.on("server-ready", (_port, url) => {
      onPreviewReady(url);
      this.webContainerService.writeSuccessToTerminal(`✅ Server ready at ${url}`);
    });
  }

  private async loadInitialCode(
    wc: WebContainer,
    onCodeLoaded: (code: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const fileContent = await wc.fs.readFile(ENTRY_FILE, "utf-8");
      console.log("Loaded entry file content:", fileContent);
      onCodeLoaded(fileContent);
    } catch (err) {
      onError(`Failed to load initial code: ${String(err)}`);
    }
  }
}