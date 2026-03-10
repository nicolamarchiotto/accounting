import { AppBar, Toolbar, Typography, Box } from "@mui/material";

function Layout({ children }) {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            My App
          </Typography>
        </Toolbar>
      </AppBar>

      <Box>
        {children}
      </Box>
    </Box>
  );
}

export default Layout;