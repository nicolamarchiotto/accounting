import {
  Typography,
  Grid,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";

import AccountCard from "./AccountCard";
import AccountFilterChips from "./AccountFilterChips";

const ownerLayoutConfig = {
  Nicola: { order: 1, flex: 3 },
  Irene: { order: 2, flex: 3 },
  Comune: { order: 3, flex: 1 }
};
const accountTypeOrder = ["Cash", "Bank", "Investment", "Insurance"];

function AccountCardContainer({
  account_list,
  owners,
  account_types,
  ownersState = {},
  accountTypesState = {},
  setOwnersState = () => {},
  setAccountTypesState = () => {}
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter out owners with no accounts
  const ownersWithAccounts = owners.filter(owner =>
    account_list.some(acc => String(acc.owner_id) === String(owner.id))
  );

  // Sort owners by configured order
  const sortedOwners = [...ownersWithAccounts].sort((a, b) => {
    const aOrder = ownerLayoutConfig[a.name]?.order ?? 999;
    const bOrder = ownerLayoutConfig[b.name]?.order ?? 999;
    return aOrder - bOrder;
  });

  return (
    <Accordion
      expanded={isExpanded}
      onChange={(_event, expanded) => setIsExpanded(expanded)}
      disableGutters
      sx={{
        width: "95%",
        ml: "auto",
        mr: "auto",
        mt: 1.5,
        borderRadius: 3,
        border: "1px solid rgba(15, 23, 42, 0.10)",
        backgroundColor: "transparent",
        boxShadow: "none",
        overflow: "hidden",
        "&.MuiAccordion-root": {
          borderRadius: 3
        },
        "&.MuiAccordion-root.Mui-expanded": {
          margin: "0 auto"
        },
        "&:before": {
          display: "none"
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          minHeight: 42,
          bgcolor: "primary.main",
          color: "common.white",
          "&.Mui-expanded": {
            minHeight: 42,
            bgcolor: "primary.main"
          },
          justifyContent: "flex-start",
          "& .MuiAccordionSummary-content": {
            my: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 1.5,
            width: "100%",
            pr: 4,
            position: "relative"
          },
          "& .MuiAccordionSummary-content.Mui-expanded": {
            my: 0,
            justifyContent: "flex-start",
            gap: 1.5,
            width: "100%",
            pr: 4,
            position: "relative"
          },
          "& .MuiAccordionSummary-expandIconWrapper": {
            position: "absolute",
            right: 12,
            color: "common.white"
          }
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: "common.white"
          }}
        >
          Accounts
        </Typography>

        {isExpanded && (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onFocusCapture={(event) => event.stopPropagation()}
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center"
            }}
          >
            <AccountFilterChips
              owners={owners}
              ownersState={ownersState}
              setOwnersState={setOwnersState}
              accountTypes={account_types}
              accountTypesState={accountTypesState}
              setAccountTypesState={setAccountTypesState}
            />
          </Box>
        )}
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pt: 1, pb: 1 }}>
        <Grid
          container
          sx={{
            display: "flex",
            width: "100%"
          }}
        >
          {sortedOwners.map((owner) => {
            const config = ownerLayoutConfig[owner.name] || {};
            const flex = config.flex || 1;

            const accounts = account_list
              .filter(acc => String(acc.owner_id) === String(owner.id))
              .sort((a, b) => {
                const aTypeKey = a.type?.key || a.type;
                const bTypeKey = b.type?.key || b.type;
                const aIndex = accountTypeOrder.indexOf(aTypeKey);
                const bIndex = accountTypeOrder.indexOf(bTypeKey);
                return aIndex - bIndex;
              });
            const ownerName = accounts[0]?.owner_name || owner.name;

            return (
              <Box
                key={owner.id}
                sx={{
                  flex: flex,
                  px: 1,
                  py: 0.5,
                  minWidth: 0 // prevents overflow issues
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1.2,
                    ml: 0,
                    textAlign: "center",
                    fontWeight: 600,
                    color: "rgba(15, 23, 42, 0.78)"
                  }}
                >
                  {ownerName}
                </Typography>

                {/* Accounts list */}
                {accounts.length > 0 ? (
                  <Grid container spacing={1.5} rowSpacing={1.5} sx={{ justifyContent: "center" }}>
                    {accounts.map(account => (
                      <Grid
                        key={account.id}
                        item
                        xs={12}
                        sm={6}
                        md={12}
                        sx={{ display: "flex", justifyContent: "center" }}
                      >
                        <AccountCard
                          account={account}
                          owners={owners}
                          accountTypes={account_types}
                          isEnabled={
                            (ownersState[String(account.owner_id)] ?? true)
                            && (accountTypesState[String(account.type?.key || account.type || "")] ?? true)
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2">
                    No accounts
                  </Typography>
                )}
              </Box>
            );
          })}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

export default AccountCardContainer;