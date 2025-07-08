"use client";
import { createContext, useContext, useState, useEffect } from "react";

export type SupportedModel = "codellama" | "gemma3:4b" | "llava:7b";

// Extend window interface for dev console commands
declare global {
  interface Window {
    switchToVision: () => void;
    switchToCode: () => void;
  }
}

export const ModelContext = createContext<{
  model: SupportedModel;
  setModel: (model: SupportedModel) => void;
  isVisionModel: boolean;
}>({
  model: "codellama",
  setModel: () => {},
  isVisionModel: false,
});

export const ModelProvider = ({ children }: { children: React.ReactNode }) => {
  const [model, setModel] = useState<SupportedModel>("codellama");
  const isVisionModel = model === "gemma3:4b";

  useEffect(() => {
    // Add global function to switch models from dev console
    if (typeof window !== 'undefined') {
      window.switchToVision = () => {
        setModel("gemma3:4b");
        console.log("Switched to gemma3:4b model - Image uploads now available!");
      };
      
      window.switchToCode = () => {
        setModel("codellama");
        console.log("Switched to codellama model");
      };

      console.log("Available console commands:");
      console.log("  switchToVision() - Switch to llama3.2-vision:1b model with image support");
      console.log("  switchToCode() - Switch to codellama model");
    }
  }, []);

  return (
    <ModelContext.Provider value={{ model, setModel, isVisionModel }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => useContext(ModelContext);
