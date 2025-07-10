import React, { useMemo } from 'react';
import { Box, Stack, Chip, IconButton, CircularProgress, alpha, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ImageData } from '../hooks/useImageUpload';

interface ImageThumbnailsProps {
  selectedImages: ImageData[];
  onImageClick: (img: ImageData, index: number) => void;
  onRemoveImage: (id: string) => void;
  maxImages: number;
}

const ImageThumbnails: React.FC<ImageThumbnailsProps> = ({
  selectedImages,
  onImageClick,
  onRemoveImage,
  maxImages,
}) => {
  const theme = useTheme();

  const base64ToDataUrl = (base64: string) => `data:image/*;base64,${base64}`;

  const totalImageSize = useMemo(() => {
    return selectedImages.reduce((total, img) => total + img.size, 0);
  }, [selectedImages]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (selectedImages.length === 0) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 1 }}>
        {selectedImages.map((img, index) => (
          <Box
            key={img.id}
            sx={{
              position: "relative",
              width: 64,
              height: 64,
              borderRadius: 1,
              overflow: "visible",
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              transition: "all 0.2s ease-in-out",
              cursor: img.isLoading ? "default" : "pointer",
              "&:hover": img.isLoading ? {} : {
                borderColor: theme.palette.primary.main,
                transform: "translateY(-2px)",
              },
            }}
            onClick={() => !img.isLoading && onImageClick(img, index)}
          >
            {img.isLoading ? (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: theme.palette.grey[100],
                  borderRadius: 1,
                }}
              >
                <CircularProgress size={20} thickness={4} />
              </Box>
            ) : (
              <Box
                component="img"
                src={base64ToDataUrl(img.base64)}
                alt={img.originalName}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  borderRadius: 1,
                }}
              />
            )}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(img.id);
              }}
              sx={{
                position: "absolute",
                top: -6,
                right: -6,
                bgcolor: theme.palette.grey[800],
                color: "white",
                width: 20,
                height: 20,
                minWidth: 20,
                "&:hover": {
                  bgcolor: theme.palette.grey[900],
                },
                transition: "all 0.2s ease-in-out",
                zIndex: 2,
                "& .MuiSvgIcon-root": {
                  fontSize: 12,
                },
              }}
              aria-label="Remove image"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        ))}
      </Stack>
      
      {/* Image info */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip 
          label={`${selectedImages.length}/${maxImages}`}
          size="small"
          sx={{
            height: 24,
            fontSize: '0.75rem',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
            border: 'none',
            '& .MuiChip-label': {
              px: 1,
            },
          }}
        />
        <Chip 
          label={formatFileSize(totalImageSize)}
          size="small"
          sx={{
            height: 24,
            fontSize: '0.75rem',
            bgcolor: alpha(theme.palette.grey[500], 0.08),
            color: theme.palette.text.secondary,
            border: 'none',
            '& .MuiChip-label': {
              px: 1,
            },
          }}
        />
      </Stack>
    </Box>
  );
};

export default ImageThumbnails;
