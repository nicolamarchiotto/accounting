import {
  Typography,
  Card,
  CardContent,
  Box
} from "@mui/material";
import { useEffect, useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ContactPageIcon from '@mui/icons-material/ContactPage';
import Currency from "./Currency";
import EditAccountDialog from "./EditAccountDialog";

function AccountCard({ account, owners, accountTypes }) {

  const accountTypeConfig = {
    Bank: {
      bigIcon: AccountBalanceIcon,
      fontSize: 70,
      iconPosition: { right: 0, bottom: 0 }, // customizable position
    },
    Cash: {
      bigIcon: AttachMoneyIcon,
      fontSize: 76,
      iconPosition: { right: -18, bottom: 0 },
    },
    Investment: {
      bigIcon: TrendingUpIcon,
      fontSize: 75,
      iconPosition: { right: -2, bottom: -8 },
      rotation: -10
    },
    Insurance: {
      bigIcon: ContactPageIcon,
      fontSize: 66,
      iconPosition: { right: -6, bottom: 0 }
    },
  };

  const [currentAccount, setCurrentAccount] = useState(account);

  useEffect(() => {
    setCurrentAccount(account);
  }, [account]);

  const typeKey = currentAccount.type?.key || currentAccount.type;
  const config = accountTypeConfig[typeKey] || accountTypeConfig.bank;
  const BigIcon = config.bigIcon;

  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleEdit = (updatedAccount) => {
    setCurrentAccount(updatedAccount);
    console.log("Edit account", updatedAccount);
  };

  const handleDelete = () => {
    console.log("Delete account", currentAccount);
    handleClose();
    
  };

  return (
    
    <Card
      onClick={(e) => {
        e.stopPropagation();
        handleOpen();
      }}      variant="outlined"
      sx={{
        width: 145,
        maxWidth: 150,
        height: "85%",
        borderRadius: 3,
        boxShadow: 1,
        position: "relative",
        overflow: "hidden",
        background: currentAccount.color,
        cursor: "pointer",
        transition: "0.2s",
        "&:hover": {
          transform: "scale(1.03)",
          boxShadow: 4,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 85% 80%, rgba(0,0,0,0.06) 0%, transparent 50%),
            radial-gradient(circle at 10% 10%, rgba(255,255,255,0.35) 0%, transparent 45%),
            linear-gradient(120deg, rgba(255,255,255,0.15) 0%, transparent 60%)
          `,
          zIndex: 0,
          pointerEvents: "none",
        },
      }}
    >
      <EditAccountDialog
        open={open}
        onClose={handleClose}
        account={currentAccount}
        owners={owners}
        accountTypes={accountTypes}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {/* Background Icon with configurable position */}
      <BigIcon
        sx={{
          position: "absolute",
          opacity: 0.08,
          color: "#191a18",
          pointerEvents: "none",
          fontSize: config.fontSize, // use fontSize from map
          transform: `rotate(${config.rotation || 0}deg)`,
          ...config.iconPosition, // apply position from map
        }}
      />

      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          padding: "10px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Account Name */}
        <Typography
          variant="subtitl2"
          sx={{
            fontSize: 11,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={account.name}
        >
          {currentAccount.name}
        </Typography>
        

        {/* Amount */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: currentAccount.total_amount < 0 ? "error.main" : config.color,
          }}
        >
          {Number(currentAccount.total_amount).toFixed(2)} <Currency/>
        </Typography>

        {/* Owner */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            overflow: "hidden",
          }}
        >
          <AccountCircleIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={currentAccount.owner_name}
          >
            {currentAccount.owner_name}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default AccountCard;