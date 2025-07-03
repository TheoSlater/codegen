import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface ErrorFixModalProps {
  open: boolean;
  errorText: string;
  onClose: () => void;
  onFix: () => void;
}

const ErrorFixModal: React.FC<ErrorFixModalProps> = ({
  open,
  errorText,
  onClose,
  onFix,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Error Detected
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          size="large"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography
          variant="body2"
          sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
        >
          {errorText}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="error" onClick={onFix}>
          Fix Error
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorFixModal;