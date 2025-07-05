"use client";
import React, { createContext, useContext } from "react";
import { useChatMessages } from "../hooks/useChatMessages";

const ChatMessagesContext = createContext<ReturnType<
  typeof useChatMessages
> | null>(null);

// Memoized provider to prevent unnecessary re-renders
export const ChatMessagesProvider = React.memo(({
  children,
}: {
  children: React.ReactNode;
}) => {
  const chat = useChatMessages();
  return (
    <ChatMessagesContext.Provider value={chat}>
      {children}
    </ChatMessagesContext.Provider>
  );
});

ChatMessagesProvider.displayName = 'ChatMessagesProvider';

export const useChat = () => {
  const ctx = useContext(ChatMessagesContext);
  if (!ctx) throw new Error("useChat must be used inside ChatMessagesProvider");
  return ctx;
};
