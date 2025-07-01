// Shimmer component for text. work in progress
import { motion } from "framer-motion";
import { Box, Typography } from "@mui/material";

export default function ShimmerText({ text }: { text: string }) {
  return (
    <Box
      component={motion.div}
      sx={{
        fontSize: 18,
        fontWeight: 500,
        background: `linear-gradient(
          90deg,
          #999 0%,
          #fff 50%,
          #999 100%
        )`,
        backgroundSize: "200% auto",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
      }}
      animate={{
        backgroundPosition: ["200% 0%", "-200% 0%"],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <Typography
        variant="body1"
        component="span"
        sx={{
          color: "inherit",
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}
