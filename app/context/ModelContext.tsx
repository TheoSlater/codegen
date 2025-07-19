"use client";
import { createContext, useContext, useState } from "react";

export type SupportedModel = "theoslater/kernl:0.1.3";

export const ModelContext = createContext<{
  model: SupportedModel;
  setModel: (model: SupportedModel) => void;
}>({
  model: "theoslater/kernl:0.1.3",
  setModel: () => {},
});

export const ModelProvider = ({ children }: { children: React.ReactNode }) => {
  const [model, setModel] = useState<SupportedModel>("theoslater/kernl:0.1.3");
  return (
    <ModelContext.Provider value={{ model, setModel}}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => useContext(ModelContext);
