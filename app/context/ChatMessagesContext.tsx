"use client";
import React, { createContext, useContext } from "react";
import { useChatMessages } from "../hooks/useChatMessages";

const ChatMessagesContext = createContext<ReturnType<
  typeof useChatMessages
> | null>(null);

export const ChatMessagesProvider = ({
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
};

export const useChat = () => {
  const ctx = useContext(ChatMessagesContext);
  if (!ctx) throw new Error("useChat must be used inside ChatMessagesProvider");
  return ctx;
};
