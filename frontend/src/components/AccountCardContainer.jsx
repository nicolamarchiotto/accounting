import {
  Typography,
  Grid,
  Divider,
  Box
} from "@mui/material";

import AccountCard from "./AccountCard";

const ownerLayoutConfig = {
  Nicola: { order: 1, flex: 4 },
  Irene: { order: 2, flex: 4 },
  Comune: { order: 3, flex: 1 }
};
const accountTypeOrder = ["Cash", "Bank", "Investment", "Insurance"];

function AccountCardContainer({ account_list, owners }) {
  // Filter out owners with no accounts
  const ownersWithAccounts = owners.filter(owner =>
    account_list.some(acc => acc.owner_id === owner.id)
  );

  // Sort owners by configured order
  const sortedOwners = [...ownersWithAccounts].sort((a, b) => {
    const aOrder = ownerLayoutConfig[a.name]?.order ?? 999;
    const bOrder = ownerLayoutConfig[b.name]?.order ?? 999;
    return aOrder - bOrder;
  });

  return (
    <Grid
      container
      sx={{
        display: "flex",
        width: "100%"
      }}
    >
      {sortedOwners.map((owner, index) => {
        const config = ownerLayoutConfig[owner.name] || {};
        const flex = config.flex || 1;

        const accounts = account_list
          .filter(acc => acc.owner_id === owner.id)
          .sort((a, b) => {
            const aIndex = accountTypeOrder.indexOf(a.type);
            const bIndex = accountTypeOrder.indexOf(b.type);
            return aIndex - bIndex;
          });

        return (
          <Box
            key={owner.id}
            sx={{
              flex: flex,
              px: 2,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              minWidth: 0 // prevents overflow issues
            }}
          >
            {/* Accounts list */}
            {accounts.length > 0 ? (
              <Grid container spacing={2} rowSpacing={0}>
                {accounts.map(account => (
                  <Grid
                    key={account.id}
                    item
                    xs={12}
                    sm={6}
                    md={12}
                  >
                    <AccountCard account={account} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2">
                No accounts
              </Typography>
            )}

            {/* Vertical divider */}
            {index < sortedOwners.length - 1 && (
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0
                }}
              />
            )}
          </Box>
        );
      })}
    </Grid>
  );
}

export default AccountCardContainer;