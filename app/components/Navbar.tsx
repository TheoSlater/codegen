"use client";

import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useModel } from "../context/ModelContext"; // Adjust import path as needed

const models = ["codellama"];

export default function BoltNavbar() {
  const theme = useTheme();
  const { model, setModel } = useModel();

  const handleModelChange = (event: SelectChangeEvent) => {
    setModel(event.target.value);
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      color="default"
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        px: 2,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: 56,
          height: 56,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Logo */}
        <Box display="flex" alignItems="center" gap={1.25}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: "1rem",
              letterSpacing: "-0.01em",
              fontFamily: theme.typography.fontFamily,
            }}
          >
            CodeGen
          </Typography>
        </Box>

        {/* Right: Model Selector + Settings */}
        <Box display="flex" alignItems="center" gap={1.5}>
          <Select
            size="small"
            value={model}
            onChange={handleModelChange}
            variant="outlined"
            sx={{
              fontSize: 14,
              height: 36,
              minWidth: 120,
              fontFamily: theme.typography.fontFamily,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.divider,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            {models.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>

          <Tooltip title="Settings">
            <IconButton size="small" sx={{ color: theme.palette.text.primary }}>
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
