import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Box,
  CssBaseline,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";

const drawerWidth = 200;

function Home() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    });

    navigate("/");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Top Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap>
            My Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: open ? drawerWidth : 0,
            transition: "width 0.3s",
            overflowX: "hidden"
          }
        }}
      >
        <Toolbar />

        <Divider />

        <List>
          <ListItemButton>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>

            {open && <ListItemText primary="Dashboard" />}
          </ListItemButton>

          <ListItemButton>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>

            {open && <ListItemText primary="Home" />}
          </ListItemButton>
        </List>

        <Divider />

        <List sx={{ mt: "auto" }}>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>

            {open && <ListItemText primary="Logout" />}
          </ListItemButton>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f4f6f8",
          p: 3,
          minHeight: "100vh"
        }}
      >
        <Toolbar />

        <Typography variant="h4" gutterBottom>
          Welcome
        </Typography>

        <Typography>
          This is your dashboard content area.
        </Typography>

        <Box mt={4}>
          <Button variant="contained">
            Example Action
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default Home;