import ollama from "ollama";

export async function getOllamaResponseStream(
  messages: { role: string; content: string }[],
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
      "## 🛠️ Command Execution",
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
      "- Wrap code in triple backticks with `tsx` for syntax highlighting",
      "- Structure code for readability and correctness",
      "- Example:",
      "```tsx",
      "import React from 'react';",
      "",
      "function App() {",
      "  return <h1>Hello, World!</h1>;",
      "}",
      "",
      "export default App;",
      "```",
      "",
      "## 📦 Dependency Handling",
      "- If the code depends on any packages, include the corresponding `npm install` command **before** the code",
      "- Mention types packages (e.g., `@types/react`) when needed",
      "",
      "## 💡 Response Format",
      "- Provide brief explanations or reasoning **outside** code blocks",
      "- Wrap terminal commands in `bash` blocks",
      "- Wrap code in `tsx` blocks",
      "- Ask clarifying questions when the user's request is ambiguous",
      "",
      "## ✅ Example Response",
      "I'll generate a reusable `Button` component. First, let's install the necessary types:",
      "",
      "```bash",
      "npm install @types/react",
      "```",
      "",
      "Now here's the component code:",
      "",
      "```tsx",
      "import React from 'react';",
      "",
      "type ButtonProps = {",
      "  onClick: () => void;",
      "  children: React.ReactNode;",
      "};",
      "",
      "function Button({ onClick, children }: ButtonProps) {",
      "  return (",
      "    <button onClick={onClick} className=\"px-4 py-2 bg-blue-500 text-white rounded\">",
      "      {children}",
      "    </button>",
      "  );",
      "}",
      "",
      "export default Button;",
      "```"
    ].join("\n")
    
  };

  const response = await ollama.chat({
    model,
    messages: [systemPrompt, ...messages],
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