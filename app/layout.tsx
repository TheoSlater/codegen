// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme/ThemeContext"; // adjust path accordingly
import { ModelProvider } from "./context/ModelContext";
import { ChatMessagesProvider } from "./context/ChatMessagesContext";
import ErrorBoundary from "./components/ErrorBoundary";
import MemoryManager from "./components/MemoryManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STAK.DEV - AI-Powered Development Platform",
  description: "An all-in-one developer platform that simplifies building modern, responsive web applications with integrated AI capabilities",
  keywords: ["AI development", "web development", "React", "Next.js", "coding assistant"],
  authors: [{ name: "Theo Slater" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ModelProvider>
          <ChatMessagesProvider>
            <ThemeProvider>
              <ErrorBoundary>
                <MemoryManager />
                {children}
              </ErrorBoundary>
            </ThemeProvider>
          </ChatMessagesProvider>
        </ModelProvider>
      </body>
    </html>
  );
}
