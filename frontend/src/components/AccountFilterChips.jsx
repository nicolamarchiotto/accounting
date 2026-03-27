import { Chip, Container, Avatar, IconButton } from "@mui/material";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ContactPageIcon from '@mui/icons-material/ContactPage';

function AccountFilterChips({ owners, ownersState, setOwnersState, accountTypes, accountTypesState, setAccountTypesState }) {

const accountTypeConfig = {
    Bank: {
      bg: "#E3F2FD",
      bigIcon: AccountBalanceIcon,
      fontSize: 20,
    },
    Cash: {
      bg: "#E8F5E9",
      bigIcon: AttachMoneyIcon,
      fontSize: 20,
    },
    Investment: {
      bg: "#FFF8E1",
      bigIcon: TrendingUpIcon,
      fontSize: 20,
      rotation: -10
    },
    Insurance: {
      bg: "#F3E5F5",
      bigIcon: ContactPageIcon,
      fontSize: 20,
    },
  };

  return (
    <Container
      maxWidth={false}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 1.5,
          pb: 2
        }}>

                
      <Container
        maxWidth={false}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 1.5
            }}>
        {accountTypes && accountTypes.map((g) => {
          const config = accountTypeConfig[g] || accountTypeConfig["Bank"];
          const BigIcon = config.bigIcon;

          return (
            <IconButton
              key={g}
              onClick={() => {
                setAccountTypesState((prev) => ({
                  ...prev,
                  [g]: !prev[g]
                }));
                console.log(accountTypesState)
              }}
              sx={{
                backgroundColor: accountTypesState[g] ? "success.main" : "grey.300",
                color: accountTypesState[g] ? "rgba(255,255,255,0.7)" : "text.primary",
                width: 35,
                height: 35
              }}
            >
              <BigIcon
                sx={{
                  fontSize: config.fontSize || 20,
                  transform: `rotate(${config.rotation || 0}deg)`
                }}
              />
            </IconButton>
          );
        })}
      </Container>

      <Container
        maxWidth={false}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 1.5
            }}>
        {owners && owners.map((g) => (
          <Chip 
            key={g.id}
            label={g.name}
            avatar={<Avatar>{g?.name.charAt(0)}</Avatar>}
            onClick={() => {
              setOwnersState((prev) => ({
                ...prev,
                [g.id]: !prev[g.id]
              }));
            }}
            color={ownersState[g.id] ? "success" : "default"} />
          ))
        }
      </Container>

    </Container>
  );
}

export default AccountFilterChips;