import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EntriesContainer from "../components/EntriesContainer";
import Statistics from "../components/Statistics";

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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState(null);

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

  const getSelectedOwnerIds = () =>
    Object.entries(ownersState)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => Number(key));

  const getFilteredAccountIds = () =>
    pivot
      .filter((acc) => {
        const ownerSelected = Boolean(ownersState[String(acc.owner_id)]);
        const accountTypeKey = acc.type?.key || acc.type || "";
        const typeSelected = Boolean(accountTypesState[String(accountTypeKey)]);
        return ownerSelected && typeSelected;
      })
      .map((acc) => acc.id);

  const fetchEntries = async () => {
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const selectedOwners = getSelectedOwnerIds();
      const selectedAccountIds = getFilteredAccountIds();

      if (selectedOwners.length === 0 || selectedAccountIds.length === 0) {
        setEntries([]);
        return;
      }

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owners: selectedOwners,
          account_ids: selectedAccountIds,
          movement_types: ["expense"],
          date: { from: "", to: dateTo },
          page: 1,
          per_page: 100
        })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      console.log("Fetched entries:", data);
      setEntries(data.items || []);
    } catch (e) {
      setEntriesError(e.message || "Failed to load entries");
    } finally {
      setEntriesLoading(false);
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

  useEffect(() => {
    if (pivot.length === 0 || owners.length === 0) {
      return;
    }

    fetchEntries();
  }, [pivot, ownersState, accountTypesState, dateTo]);

  const [leftOpen, setLeftOpen] = useState(true);
  const [middleOpen, setMiddleOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const collapsedWidth = "fit-content"; // collapsed width should fit header text
  const thirdPercent = "33.333%";
  const rightPercent = "30%";

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
          minHeight: "100vh",
          overflowX: "hidden"
        }}
      >
        <Box mt={4} sx={{ px: 2 }}>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Box sx={{ display: "flex", gap: 2, width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
              {/* Left column - Account cards */}
              <Box sx={{
                width: leftOpen ? thirdPercent : collapsedWidth,
                transition: "width 240ms ease",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flex: leftOpen ? `0 0 ${thirdPercent}` : '0 0 auto',
                minWidth: leftOpen ? undefined : 120,
                maxWidth: leftOpen ? undefined : 360,
                boxSizing: "border-box"
              }}>
                <Box sx={{ flex: 1, overflow: "auto", px: leftOpen ? 1 : 0}}>
                  <AccountCardContainer
                    account_list={pivot}
                    owners={owners}
                    account_types={accountTypes}
                    ownersState={ownersState}
                    accountTypesState={accountTypesState}
                    setOwnersState={setOwnersState}
                    setAccountTypesState={setAccountTypesState}
                    expanded={leftOpen}
                    onToggle={(val) => setLeftOpen(Boolean(val))}
                  />
                </Box>
              </Box>

              {/* Middle column - Entries */}
              <Box sx={{
                width: middleOpen ? thirdPercent : collapsedWidth,
                transition: "width 240ms ease",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flex: middleOpen ? `0 0 ${thirdPercent}` : '0 0 auto',
                minWidth: middleOpen ? undefined : 120,
                maxWidth: middleOpen ? undefined : 360,
                boxSizing: "border-box"
              }}>
                <Box sx={{ flex: 1, overflow: "auto", px: middleOpen ? 1 : 0}}>
                  <EntriesContainer
                    entries={entries}
                    loading={entriesLoading}
                    error={entriesError}
                    expanded={middleOpen}
                    onToggle={(val) => setMiddleOpen(Boolean(val))}
                  />
                </Box>
              </Box>

              {/* Right column - Statistics */}
              <Box sx={{
                width: rightOpen ? rightPercent : collapsedWidth,
                transition: "width 240ms ease",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flex: rightOpen ? `0 0 ${rightPercent}` : '0 0 auto',
                minWidth: rightOpen ? undefined : 120,
                maxWidth: rightOpen ? undefined : 360,
                boxSizing: "border-box"
              }}>
                <Box sx={{ flex: 1, overflow: "auto", px: rightOpen ? 1 : 0}}>
                  <Statistics
                    expanded={rightOpen}
                    onToggle={(val) => setRightOpen(Boolean(val))}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Home;