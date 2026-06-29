import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EntriesContainer from "../components/entries/EntriesContainer";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  CssBaseline,
  CircularProgress,
  Alert
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccountCardContainer from "../components/account/AccountCardContainer";

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
  const [entriesDateType, setEntriesDateType] = useState('month');
  const [entriesDate, setEntriesDate] = useState(new Date());
  const [accountEnabled, setAccountEnabled] = useState({});

  // Wrap owners/account types setters so chips also enable/disable matching accounts
  const handleSetOwnersState = (updater) => {
    setOwnersState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // find owner ids that changed
      const changed = Object.keys(next).filter(k => prev[k] !== next[k]);
      if (changed.length > 0 && pivot && pivot.length > 0) {
        setAccountEnabled((aePrev) => {
          const nextAe = { ...aePrev };
          for (const ownerId of changed) {
            const on = Boolean(next[ownerId]);
            pivot.forEach((acc) => {
              if (String(acc.owner_id) === String(ownerId)) {
                nextAe[String(acc.id)] = on;
              }
            });
          }
          return nextAe;
        });
      }
      return next;
    });
  };

  const handleSetAccountTypesState = (updater) => {
    setAccountTypesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const changed = Object.keys(next).filter(k => prev[k] !== next[k]);
      if (changed.length > 0 && pivot && pivot.length > 0) {
        setAccountEnabled((aePrev) => {
          const nextAe = { ...aePrev };
          for (const typeKey of changed) {
            const on = Boolean(next[typeKey]);
            pivot.forEach((acc) => {
              const accTypeKey = acc.type?.key || acc.type || '';
              if (String(accTypeKey) === String(typeKey)) {
                nextAe[String(acc.id)] = on;
              }
            });
          }
          return nextAe;
        });
      }
      return next;
    });
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
      // initialize accountEnabled map to true for each account
      try {
        const map = {};
        (data || []).forEach((acc) => { map[String(acc.id)] = true; });
        setAccountEnabled(map);
      } catch (e) {
        // ignore
      }
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
        const accountOn = accountEnabled[String(acc.id)] ?? true;
        return ownerSelected && typeSelected && accountOn;
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

      // compute date range from entriesDateType/entriesDate
      const dateRangeForSelection = (type, d) => {
        const date = new Date(d);
        const toIso = (dt) => dt.toISOString().split('T')[0];
        if (type === 'day') {
          return { from: toIso(date), to: toIso(date) };
        }
        if (type === 'week') {
          // start on Monday
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
          const start = new Date(date.setDate(diff));
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          return { from: toIso(start), to: toIso(end) };
        }
        if (type === 'month') {
          const start = new Date(date.getFullYear(), date.getMonth(), 1);
          const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          return { from: toIso(start), to: toIso(end) };
        }
        if (type === 'year') {
          const start = new Date(date.getFullYear(), 0, 1);
          const end = new Date(date.getFullYear(), 11, 31);
          return { from: toIso(start), to: toIso(end) };
        }
        return { from: '', to: '' };
      };

      const { from, to } = dateRangeForSelection(entriesDateType, entriesDate);

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owners: selectedOwners,
          account_ids: selectedAccountIds,
          movement_types: ["expense"],
          date: { from: from || "", to: to || "" },
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
  }, [pivot, ownersState, accountTypesState, entriesDateType, entriesDate, accountEnabled]);

  const [leftOpen, setLeftOpen] = useState(true);
  const [middleOpen, setMiddleOpen] = useState(true);

  const collapsedWidth = "fit-content"; // collapsed width should fit header text
  const leftPercent = "40%";
  const middlePercent = "60%";

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

          {/* Accounts balance selector removed — account cards show balance at current date */}

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
                width: leftOpen ? leftPercent : collapsedWidth,
                transition: "width 240ms ease",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flex: leftOpen ? `0 0 ${leftPercent}` : '0 0 auto',
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
                    setOwnersState={handleSetOwnersState}
                    setAccountTypesState={handleSetAccountTypesState}
                    accountEnabled={accountEnabled}
                    setAccountEnabled={setAccountEnabled}
                    expanded={leftOpen}
                    onToggle={(val) => setLeftOpen(Boolean(val))}
                  />
                </Box>
              </Box>

              {/* Middle column - Entries */}
              <Box sx={{
                width: middleOpen ? (leftOpen ? middlePercent : 'auto') : collapsedWidth,
                transition: "width 240ms ease",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flex: middleOpen ? (leftOpen ? `0 0 ${middlePercent}` : '1 1 auto') : '0 0 auto',
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
                    onDateChange={(payload) => {
                      if (payload?.dateType) setEntriesDateType(payload.dateType);
                      if (payload?.date) setEntriesDate(payload.date);
                    }}
                    onAddSuccess={fetchEntries}
                  />
                </Box>
              </Box>

              {/* Right column removed: statistics component deleted per request */}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Home;