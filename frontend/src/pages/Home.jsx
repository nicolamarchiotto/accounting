import { useState, useEffect } from "react";
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
  CircularProgress,
  Alert
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountFilterChips from "../components/AccountFilterChips";
import AccountCardContainer from "../components/AccountCardContainer";

const drawerWidth = 200;

function Home() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [pivot, setPivot] = useState([]);
  const [owners, setOwners] = useState([]);
  const [ownersState, setOwnersState] = useState({});
  const [accountTypes, setAccountTypes] = useState([]);
  const [accountTypesState,setAccountTypesState] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const fetchPivot = async () => {
    try {
      const res = await fetch("/api/entries/pivot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_by: "account",
          include_transfers: true,
          include_accounts_start_amount: true,
          date: { from: "2025-07-10", to: "2026-03-15" }
        })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setPivot(data);
    } catch (e) {
      setError(e.message || "Failed to load data");
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await fetch("/api/owners", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setOwners(data);
      const owners_state = {};
      for (const owner in data) {
        owners_state[data[owner].id] = true;
      }
      setOwnersState(owners_state);
    } catch (e) {
      setError(e.message || "Failed to load data");
    }
  };

  const fetchAccountTypes = async () => {
    try {
      const res = await fetch("/api/account/types", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setAccountTypes(data);
      const account_types_state = {};
      for (const account_typr in data) {
        account_types_state[data[account_typr]] = true;
      }
      setAccountTypesState(account_types_state);
    } catch (e) {
      setError(e.message || "Failed to load data");
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchOwners();
    fetchPivot();
    fetchAccountTypes()
    
    setLoading(false);
  }, []);

  // Filter pivot based on ownersState and accountTypesState
  const filteredPivot = pivot.filter(
    acc => ownersState[acc.owner_id] && accountTypesState[acc.type]
  );

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
            Accouting
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
          pl: 3,
          pr: 3,
          pb: 3,
          minHeight: "100vh"
        }}
      >
        <Box mt={4}>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              <AccountFilterChips 
                owners={owners}
                ownersState={ownersState}
                setOwnersState={setOwnersState}
                accountTypes={accountTypes}
                accountTypesState={accountTypesState}
                setAccountTypesState={setAccountTypesState}/>
              <AccountCardContainer
                account_list={filteredPivot}
                owners={owners}
                account_types={accountTypes}/>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Home;