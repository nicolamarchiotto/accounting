import { Box, Divider, IconButton, Tooltip } from "@mui/material";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ContactPageIcon from '@mui/icons-material/ContactPage';
import RestartAltIcon from "@mui/icons-material/RestartAlt";

function AccountFilterChips({ owners, ownersState, setOwnersState, accountTypes, accountTypesState, setAccountTypesState }) {
  const filterButtonSize = 30;

  const getFilterButtonSx = (isSelected) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: filterButtonSize,
    height: filterButtonSize,
    p: 0,
    color: isSelected ? "#0d47a1" : "rgba(255,255,255,0.72)",
    bgcolor: isSelected ? "rgba(255,255,255,0.95)" : "transparent",
    border: isSelected ? "1px solid rgba(255,255,255,0.95)" : "1px solid transparent",
    borderRadius: "50%",
    "&:hover": {
      bgcolor: isSelected ? "#ffffff" : "rgba(255,255,255,0.2)"
    }
  });

  const accountTypeConfig = {
    Bank: {
      bigIcon: AccountBalanceIcon,
      fontSize: 20,
    },
    Cash: {
      bigIcon: AttachMoneyIcon,
      fontSize: 20,
    },
    Investment: {
      bigIcon: TrendingUpIcon,
      fontSize: 20,
      rotation: -10
    },
    Insurance: {
      bigIcon: ContactPageIcon,
      fontSize: 20,
    },
  };

  const resetFilters = () => {
    const resetOwnersState = {};
    (owners || []).forEach((owner) => {
      resetOwnersState[owner.id] = true;
    });

    const resetAccountTypesState = {};
    (accountTypes || []).forEach((accountType) => {
      resetAccountTypesState[accountType] = true;
    });

    setOwnersState(resetOwnersState);
    setAccountTypesState(resetAccountTypesState);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.8,
        pl: 1
      }}
    >
      {accountTypes && accountTypes.map((g) => {
        const config = accountTypeConfig[g] || accountTypeConfig.Bank;
        const BigIcon = config.bigIcon;
        const isSelected = Boolean(accountTypesState[g]);

        return (
          <Tooltip key={g} title={g}>
            <IconButton
              size="small"
              onClick={() => {
                setAccountTypesState((prev) => ({
                  ...prev,
                  [g]: !prev[g]
                }));
              }}
              sx={getFilterButtonSx(isSelected)}
            >
              <BigIcon
                sx={{
                  fontSize: config.fontSize || 20,
                  transform: `rotate(${config.rotation || 0}deg)`
                }}
              />
            </IconButton>
          </Tooltip>
        );
      })}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: "rgba(255,255,255,0.35)" }} />

      {owners && owners.map((g) => {
        const isSelected = Boolean(ownersState[g.id]);
        return (
          <Tooltip key={g.id} title={g.name}>
            <IconButton
              size="small"
              onClick={() => {
                setOwnersState((prev) => ({
                  ...prev,
                  [g.id]: !prev[g.id]
                }));
              }}
              sx={getFilterButtonSx(isSelected)}
            >
              <Box
                component="span"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {g?.name.charAt(0)}
              </Box>
            </IconButton>
          </Tooltip>
        );
      })}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: "rgba(255,255,255,0.35)" }} />

      <Tooltip title="Reset filters">
        <IconButton
          size="small"
          onClick={resetFilters}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: filterButtonSize,
            height: filterButtonSize,
            p: 0,
            borderRadius: "50%",
            color: "rgba(255,255,255,0.9)",
            bgcolor: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.28)",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.22)"
            }
          }}
        >
          <RestartAltIcon fontSize="small" />
        </IconButton>
      </Tooltip>

    </Box>
  );
}

export default AccountFilterChips;