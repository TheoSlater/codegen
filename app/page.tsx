// This is the home page of the main app.
// Change this to however you want if you have experience !!! CAUTION !!!
// credit - theoslater.xyz
"use client";

import { Box } from "@mui/material";
import ChatArea from "./components/ChatArea";
import { useChat } from "./context/ChatMessagesContext";
import BoltNavbar from "./components/Navbar";

export default function Home() {
  const { clearMessages } = useChat();

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <BoltNavbar />
      <Box
        sx={{
          flex: 1,
          minHeight: 0,

          p: 2,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <ChatArea />
      </Box>
    </Box>
  );
}
