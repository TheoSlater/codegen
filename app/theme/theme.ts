import { createTheme } from "@mui/material/styles";

const shape = {
  borderRadius: "8px", // Slightly smaller for modern feel
};

const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 14, // Slightly smaller for cleaner look
  fontWeightMedium: 500,
  button: {
    textTransform: "none" as const,
    fontWeight: 500,
    letterSpacing: "0.01em",
  },
};

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3b82f6", // bolt.new blue
      light: "#60a5fa",
      dark: "#1d4ed8",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#8b5cf6", // v0.dev purple accent
      light: "#a78bfa",
      dark: "#7c3aed",
      contrastText: "#ffffff",
    },
    background: {
      default: "#0a0a0a", // Deeper black like bolt.new
      paper: "#111111", // Very dark gray for cards/panels
    },
    text: {
      primary: "#fafafa", // Near white for primary text
      secondary: "#a1a1aa", // Muted gray for secondary text
      disabled: "#52525b", // Darker gray for disabled states
    },
    error: {
      main: "#ef4444", // Modern red
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    divider: "rgba(255, 255, 255, 0.08)", // Very subtle dividers
    action: {
      hover: "rgba(255, 255, 255, 0.04)",
      selected: "rgba(255, 255, 255, 0.08)",
      disabled: "rgba(255, 255, 255, 0.26)",
      disabledBackground: "rgba(255, 255, 255, 0.12)",
    },
  },
  shape,
  typography,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: shape.borderRadius,
          boxShadow: "none",
          textTransform: "none",
          fontWeight: 500,
          "&:hover": {
            boxShadow: "none",
          },
        },
        contained: {
          backgroundColor: "#3b82f6",
          "&:hover": {
            backgroundColor: "#2563eb",
          },
        },
        outlined: {
          borderColor: "rgba(255, 255, 255, 0.12)",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.2)",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
          },
        },
        text: {
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.04)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#111111",
          borderRadius: shape.borderRadius,
          border: "1px solid rgba(255, 255, 255, 0.06)",
          backgroundImage: "none", // Remove MUI's default gradient
        },
        elevation1: {
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)",
        },
        elevation2: {
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#111111",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#0a0a0a",
            borderRadius: shape.borderRadius,
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.12)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#3b82f6",
            },
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: "#fafafa",
        },
        h1: {
          fontWeight: 700,
          color: "#ffffff",
        },
        h2: {
          fontWeight: 600,
          color: "#ffffff",
        },
        h3: {
          fontWeight: 600,
          color: "#ffffff",
        },
        h4: {
          fontWeight: 600,
          color: "#fafafa",
        },
        h5: {
          fontWeight: 500,
          color: "#fafafa",
        },
        h6: {
          fontWeight: 500,
          color: "#fafafa",
        },
        body2: {
          color: "#a1a1aa",
        },
        caption: {
          color: "#71717a",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0a0a0a",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#0a0a0a",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.04)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(59, 130, 246, 0.15)",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          color: "#fafafa",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.12)",
          },
        },
        filled: {
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          color: "#60a5fa",
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "#3b82f6",
            "& + .MuiSwitch-track": {
              backgroundColor: "#3b82f6",
            },
          },
        },
        track: {
          backgroundColor: "rgba(255, 255, 255, 0.2)",
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: "#3b82f6",
        },
        track: {
          backgroundColor: "#3b82f6",
        },
        thumb: {
          backgroundColor: "#3b82f6",
          "&:hover": {
            boxShadow: "0 0 0 8px rgba(59, 130, 246, 0.16)",
          },
        },
      },
    },
  },
});