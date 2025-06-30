import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

const shape = {
  borderRadius: "10px",
};

const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 15,
  fontWeightMedium: 600,
  button: {
    textTransform: "none" as const,
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
};

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1de9b6", // bright but soft aqua, less electric
      light: "#5ef1c6",
      dark: "#139e82",
      contrastText: "#121212", // dark text for readability on bright button
    },
    secondary: {
      main: "#ff4081", // vibrant pink but without neon glow
      contrastText: "#121212",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#e0e0e0",
      secondary: "#aaaaaa",
    },
    error: {
      main: red.A200,
    },
    divider: "rgba(255, 255, 255, 0.15)",
  },
  shape,
  typography,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: shape.borderRadius,
          transition: "background-color 0.25s ease, box-shadow 0.25s ease",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "#16b295", // slightly darker aqua
            boxShadow: "0 4px 8px rgba(29, 233, 182, 0.3)", // subtle soft shadow, no glow
          },
        },
        containedPrimary: {
          color: "#121212",
          backgroundColor: "#1de9b6",
          "&:hover": {
            backgroundColor: "#16b295",
          },
        },
        containedSecondary: {
          color: "#121212",
          backgroundColor: "#ff4081",
          "&:hover": {
            backgroundColor: "#e0366d",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
          borderRadius: shape.borderRadius,
          border: "1px solid rgba(255, 255, 255, 0.1)", // very subtle border for separation
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: "#e0e0e0",
          textShadow: "none",
        },
      },
    },
  },
});
