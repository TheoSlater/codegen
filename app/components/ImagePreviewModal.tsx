import React from 'react';
import { Modal, Backdrop, Box, Typography, Stack, IconButton, alpha, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ImageData } from '../hooks/useImageUpload';

interface ImagePreviewModalProps {
  previewImage: { src: string; index: number; data: ImageData } | null;
  onClose: () => void;
  onRemove: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  previewImage,
  onClose,
  onRemove,
}) => {
  const theme = useTheme();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Modal
      open={!!previewImage}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 300,
        sx: { bgcolor: "rgba(0, 0, 0, 0.8)" },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: "90vw",
          maxHeight: "90vh",
          outline: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {previewImage && (
          <>
            <Box
              component="img"
              src={previewImage.src}
              alt={previewImage.data.originalName}
              sx={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: theme.shape.borderRadius,
                boxShadow: `0 8px 32px ${alpha("#000", 0.4)}`,
              }}
            />
            <Typography variant="caption" sx={{ mt: 1, color: "white", textAlign: "center" }}>
              {previewImage.data.originalName} • {formatFileSize(previewImage.data.size)}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <IconButton
                onClick={onRemove}
                sx={{
                  bgcolor: theme.palette.error.main,
                  color: "white",
                  "&:hover": {
                    bgcolor: theme.palette.error.dark,
                  },
                }}
                aria-label="Remove image"
              >
                <CloseIcon />
              </IconButton>
              <IconButton
                onClick={onClose}
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  color: theme.palette.text.primary,
                  "&:hover": {
                    bgcolor: theme.palette.background.paper,
                  },
                }}
                aria-label="Close preview"
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default ImagePreviewModal;
