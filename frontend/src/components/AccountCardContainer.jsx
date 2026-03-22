
import {
  Typography,
  Card,
  Grid
} from "@mui/material";

import AccountCard from "./AccountCard";


function AccountCardContainer({account_list}) {

  return (
    <Grid container spacing={2}>
        {account_list && account_list.length > 0 ? (
            account_list.map((account) => (
            <Grid item xs={12} sm={6} md={4} key={account.id}>
                <AccountCard account={account}/>
            </Grid>
            ))
        ) : (
            <Typography>No data available.</Typography>
        )}
    </Grid>
  );
}

export default AccountCardContainer;



