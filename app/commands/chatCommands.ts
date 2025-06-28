// This is the chat commands script where all of the commands you can use in chat are created
// feel free to add your own but make sure they work :/

import type { CommandMap } from "../hooks/useChatCommands";
import type { SendMessageFn } from "../types/types";

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
