import type { CommandMap } from "../../hooks/useChatCommands";
import type { SendMessageFn } from "../../types/types";

// This factory returns commands with access to external handlers like sendMessage
export function createChatCommands(
  sendMessage: SendMessageFn,
  handleWebSearchAndSummarize: (args: string) => Promise<void>
): CommandMap {
  return {
    search: {
      name: "search",
      description: "Search the web and summarize the results",
      run: handleWebSearchAndSummarize,
    },
  };
}
