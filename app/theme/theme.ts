// theme.ts
import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

const shape = {
  borderRadius: "12px",
};

const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 14,
  button: {
    textTransform: "none" as const,
    fontWeight: 500,
  },
};

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#79ffe1", // bright aqua
      light: "#a3fff3",
      dark: "#4ac1bb",
      contrastText: "#000",
    },
    secondary: {
      main: "#ff0080", // neon pink
    },
    background: {
      default: "#0d0d0d",
      paper: "#121212",
    },
    text: {
      primary: "#e0e0e0",
      secondary: "#aaaaaa",
    },
    error: {
      main: red.A200,
    },
    divider: "rgba(255, 255, 255, 0.12)",
  },
  shape,
  typography,
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#00bfae", // a slightly muted aqua (less neon than dark)
      light: "#33d6c9",
      dark: "#008e7e",
      contrastText: "#fff",
    },
    secondary: {
      main: "#e91e63", // a bright pink but a bit less neon for light background
    },
    background: {
      default: "#f1f1f1", // light neutral grayish-white
      paper: "#ffffff",
    },
    text: {
      primary: "#121212", // near black for readability on light bg
      secondary: "#555555",
    },
    error: {
      main: red.A400,
    },
    divider: "rgba(0, 0, 0, 0.12)",
  },
  shape,
  typography,
});
