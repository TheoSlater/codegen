"use client";
import { createContext, useContext, useState } from "react";

export const ModelContext = createContext<{
  model: string;
  setModel: (model: string) => void;
}>({
  model: "llama3",
  setModel: () => {},
});

export const ModelProvider = ({ children }: { children: React.ReactNode }) => {
  const [model, setModel] = useState("llama3");
  return (
    <ModelContext.Provider value={{ model, setModel }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => useContext(ModelContext);
