// Test page for chunked messaging
"use client";

import { Box } from "@mui/material";
import TestChunkedMessages from "../components/TestChunkedMessages";
import { ThemeProvider } from "../theme/ThemeContext";

export default function TestPage() {
  return (
    <ThemeProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <TestChunkedMessages />
      </Box>
    </ThemeProvider>
  );
}
