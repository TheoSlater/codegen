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
      main: "#5c6ac4",  // deep indigo, muted but vibrant
      light: "#8a96d1",
      dark: "#32409d",
      contrastText: "#f0f0f0", // light text for good readability
    },
    secondary: {
      main: "#ff4081", // keep your vibrant pink, it's solid
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
          '&:hover': {
            backgroundColor: "#32409d", // darkened primary for hover
            boxShadow: "0 0 8px rgba(92, 106, 196, 0.5)", // subtle glow on hover
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
          borderRadius: shape.borderRadius,
          border: "1px solid rgba(255, 255, 255, 0.1)",
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
