import React from 'react';
import { Box, Stack, Typography, alpha, useTheme } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface DragOverlayProps {
  isDragOver: boolean;
  isVisionModel: boolean;
}

const DragOverlay: React.FC<DragOverlayProps> = ({ isDragOver, isVisionModel }) => {
  const theme = useTheme();

  if (!isDragOver || !isVisionModel) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        border: `2px dashed ${theme.palette.primary.main}`,
        borderRadius: theme.shape.borderRadius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <Stack alignItems="center" spacing={1}>
        <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
        <Typography variant="h6" color="primary">
          Drop images here
        </Typography>
      </Stack>
    </Box>
  );
};

export default DragOverlay;
