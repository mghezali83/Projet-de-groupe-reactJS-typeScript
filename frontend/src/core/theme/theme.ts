import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7b2d26',
      dark: '#542019',
      light: '#a94f40',
      contrastText: '#fffaf2',
    },
    secondary: {
      main: '#315b3c',
      dark: '#203e29',
      light: '#598365',
      contrastText: '#ffffff',
    },
    background: {
      default: '#faf7f0',
      paper: '#ffffff',
    },
    text: {
      primary: '#29251f',
      secondary: '#716b60',
    },
    success: { main: '#39744a' },
    warning: { main: '#bd761f' },
    error: { main: '#b3261e' },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 750, letterSpacing: '-0.04em' },
    h2: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' },
    h3: { fontSize: '1.5rem', fontWeight: 700 },
    h4: { fontSize: '1.25rem', fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 999,
          paddingInline: 20,
          boxShadow: 'none',
        },
        contained: {
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 18 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #eee7dc',
          boxShadow: '0 12px 36px rgba(65, 44, 26, 0.06)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#716b60',
          fontWeight: 700,
          backgroundColor: '#faf7f0',
        },
      },
    },
  },
})
