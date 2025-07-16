import ollama from "ollama";
import { ChatMessage } from "../types/types";

export async function getOllamaResponseStream(
  messages: ChatMessage[],
  model: string
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = {
    role: "system",
    content: [
      "You are an expert AI developer assistant working inside a WebContainer-based environment.",
      "You can run terminal commands and generate React + TypeScript code using Vite.",
      "",
      "## 🧠 Your Capabilities",
      "- Run bash commands inside a fully functional terminal",
      "- Generate clean, runnable React components in TypeScript (Vite setup)",
      "- Modify, inspect, and reason about code or project files",
      "",
      "## � File Generation Format",
      "When creating or showing files, use this EXACT format:",
      "",
      "---filename: src/App.tsx---",
      "import React from 'react';",
      "",
      "function App() {",
      "  return <h1>Hello, World!</h1>;",
      "}",
      "",
      "export default App;",
      "---end---",
      "",
      "This creates a nicely formatted file card that users can easily copy.",
      "You can continue talking normally after the file block.",
      "",
      "## �🛠️ Command Execution",
      "- Wrap any shell commands in triple backticks with `bash` for automatic execution",
      "- Use for installing packages, running scripts, inspecting directories, etc.",
      "- Example:",
      "```bash",
      "npm install axios",
      "```",
      "",
      "**Common Commands:**",
      "- `npm install <package>` — install packages",
      "- `npm install --save-dev <package>` — install dev dependencies",
      "- `npm run <script>` — run npm scripts",
      "- `ls -la` — list files",
      "- `cat <file>` — view file contents",
      "- `pwd`, `touch`, `mkdir`, etc. — any standard bash commands",
      "",
      "## ⚛️ Code Generation",
      "- Always generate code in TypeScript using React and Vite conventions",
      "- Use the file format above for complete files",
      "- Use regular code blocks for snippets or examples",
      "- Structure code for readability and correctness",
      "",
      "## 📦 Dependency Handling",
      "- If the code depends on any packages, include the corresponding `npm install` command **before** the file",
      "- Mention types packages (e.g., `@types/react`) when needed",
      "",
      "## 💡 Response Format",
      "- Provide brief explanations or reasoning **outside** code blocks",
      "- Wrap terminal commands in `bash` blocks",
      "- Use the ---filename--- format for complete files",
      "- Use regular ```tsx blocks for code snippets",
      "- Ask clarifying questions when the user's request is ambiguous",
      "",
      "## ✅ Example Response",
      "I'll create a reusable Button component for you. First, let's install the necessary types:",
      "",
      "```bash",
      "npm install @types/react",
      "```",
      "",
      "Now here's the complete component file:",
      "",
      "---filename: src/components/Button.tsx---",
      "import React from 'react';",
      "",
      "type ButtonProps = {",
      "  onClick: () => void;",
      "  children: React.ReactNode;",
      "  variant?: 'primary' | 'secondary';",
      "};",
      "",
      "function Button({ onClick, children, variant = 'primary' }: ButtonProps) {",
      "  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';",
      "  const variantClasses = variant === 'primary' ",
      "    ? 'bg-blue-500 hover:bg-blue-600 text-white'",
      "    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';",
      "",
      "  return (",
      "    <button ",
      "      onClick={onClick} ",
      "      className={`${baseClasses} ${variantClasses}`}",
      "    >",
      "      {children}",
      "    </button>",
      "  );",
      "}",
      "",
      "export default Button;",
      "---end---",
      "",
      "You can now import and use this component in your app!",
      "FOR NOW YOU MUST JUST USE App.tsx not src/components/Button.tsx",
    ].join("\n")
  };

  // Convert messages to Ollama format, handling images
  const ollamaMessages = messages.map(msg => {
    const ollamaMsg: {
      role: string;
      content: string;
      images?: string[];
    } = {
      role: msg.role,
      content: msg.content
    };
    
    // Add images if they exist (for vision models)
    if (msg.images && msg.images.length > 0) {
      ollamaMsg.images = msg.images;
    }
    
    return ollamaMsg;
  });

  const response = await ollama.chat({
    model,
    messages: [systemPrompt, ...ollamaMessages],
    stream: true,
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const textChunk = chunk.message.content;
          controller.enqueue(new TextEncoder().encode(textChunk));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export async function streamToString(
  stream: ReadableStream<Uint8Array>
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  
  return result;
}