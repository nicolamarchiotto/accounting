import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  Box,
  CssBaseline,
  CircularProgress,
  Alert
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import FilterListIcon from "@mui/icons-material/FilterList";
import AccountFilterChips from "../components/AccountFilterChips";
import AccountCardContainer from "../components/AccountCardContainer";

function getTodayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function Home() {
  const navigate = useNavigate();
  const [pivot, setPivot] = useState([]);
  const [dateTo, setDateTo] = useState(getTodayIsoDate());
  const [owners, setOwners] = useState([]);
  const [ownersState, setOwnersState] = useState({});
  const [accountTypes, setAccountTypes] = useState([]);
  const [accountTypesState,setAccountTypesState] = useState({});
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleFilterBar = () => {
    setIsFilterBarOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    });

    navigate("/");
  };

  const fetchPivot = async (toDate) => {
    try {
      const res = await fetch("/api/entries/pivot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_by: "account",
          include_transfers: true,
          include_accounts_start_amount: true,
          date: { from: "", to: toDate || "" }
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
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchOwners(),
        fetchAccountTypes()
      ]);

      setLoading(false);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadPivot = async () => {
      setLoading(true);
      setError(null);
      await fetchPivot(dateTo);
      setLoading(false);
    };

    loadPivot();
  }, [dateTo]);

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
        <Toolbar sx={{ position: "relative" }}>
          <Typography variant="h6" noWrap>
            Accouting
          </Typography>

          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <TextField
              type="date"
              size="small"
              label="Accounts balance at"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                minWidth: 170,
                "& .MuiInputBase-root": {
                  color: "common.white",
                  fontSize: "0.85rem",
                  height: 36
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.82rem"
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.5)"
                },
                "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.9)"
                },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "common.white"
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "common.white"
                },
                "& .MuiSvgIcon-root": {
                  color: "common.white"
                },
                "& input::-webkit-calendar-picker-indicator": {
                  filter: "invert(1)"
                },
                "& input::-webkit-clear-button": {
                  display: "none"
                },
                "& input::-ms-clear": {
                  display: "none"
                },
                "& input::-ms-reveal": {
                  display: "none"
                }
              }}
            />
          </Box>

          <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                overflow: "hidden",
                whiteSpace: "nowrap",
                maxWidth: isFilterBarOpen ? 560 : 0,
                opacity: isFilterBarOpen ? 1 : 0,
                transform: isFilterBarOpen ? "translateX(0)" : "translateX(8px)",
                transition: "max-width 0.35s ease, opacity 0.2s ease, transform 0.3s ease"
              }}
            >
              <AccountFilterChips
                owners={owners}
                ownersState={ownersState}
                setOwnersState={setOwnersState}
                accountTypes={accountTypes}
                accountTypesState={accountTypesState}
                setAccountTypesState={setAccountTypesState}
              />
            </Box>

            <IconButton
              color="inherit"
              onClick={toggleFilterBar}
              aria-label="open filters"
            >
              <FilterListIcon />
            </IconButton>

            <Box
              sx={{
                mx: 0.75,
                height: 22,
                borderLeft: "1px solid rgba(255,255,255,0.45)"
              }}
            />

            <IconButton
              color="inherit"
              onClick={handleLogout}
              aria-label="logout"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f4f6f8",
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