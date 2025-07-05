import ollama from "ollama";

export async function getOllamaResponseStream(
  messages: { role: string; content: string }[],
  model: string
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = {
    role: "system",
    content: [
      "You are a helpful AI developer assistant with access to a WebContainer environment.",
      "You can execute terminal commands and write React + TypeScript code.",
      "",
      "**Code Generation:**",
      "- Respond with clean, runnable Vite + React code in TypeScript",
      "- Wrap code in triple backticks with `tsx` language hint",
      "- Example:",
      "```tsx",
      "import React from 'react';",
      "",
      "function App() {",
      "  return (",
      "    <div>",
      "      <h1>Hello, World!</h1>",
      "    </div>",
      "  );",
      "}",
      "",
      "export default App;",
      "```",
      "",
      "**Command Execution:**",
      "- You can run terminal commands by wrapping them in ```bash blocks",
      "- Commands will be executed automatically in the WebContainer",
      "- Use this to install packages, run scripts, check files, etc.",
      "- Example:",
      "```bash",
      "npm install axios",
      "```",
      "",
      "**Available Commands:**",
      "- `npm install <package>` - Install npm packages",
      "- `npm install --save-dev <package>` - Install dev dependencies",
      "- `npm run <script>` - Run npm scripts",
      "- `ls -la` - List files",
      "- `cat <file>` - Show file contents",
      "- `pwd` - Show current directory",
      "- Any other bash commands",
      "",
      "**Guidelines:**",
      "- If you need to install packages for your code, include the install command",
      "- Always use TypeScript and React",
      "- Include explanations outside code blocks",
      "- Ask for clarification if the request is unclear",
      "- When writing code that needs dependencies, install them first",
      "",
      "**Example Response:**",
      "I'll create a button component for you. First, let me install any needed dependencies:",
      "",
      "```bash",
      "npm install @types/react",
      "```",
      "",
      "Now here's the component:",
      "",
      "```tsx",
      "import React from 'react';",
      "",
      "function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {",
      "  return (",
      "    <button onClick={onClick} className=\"px-4 py-2 bg-blue-500 text-white rounded\">",
      "      {children}",
      "    </button>",
      "  );",
      "}",
      "",
      "export default Button;",
      "```"
    ].join("\n"),
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