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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import Currency from "./Currency";
import EditAccountDialog from "./EditAccountDialog";

function AccountCard({ account, owners, accountTypes, isEnabled = true, onToggle }) {

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
  const config = accountTypeConfig[typeKey] || accountTypeConfig.Bank;
  const BigIcon = config.bigIcon;
  const serialValue = String(currentAccount.serial ?? "").trim();
  const checked = isEnabled;

  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      variant="outlined"
      sx={{
        width: 170,
        maxWidth: 170,
        height: 96,
        borderRadius: 3,
        boxShadow: checked ? 1 : 0,
        position: "relative",
        overflow: "hidden",
        background: checked ? currentAccount.color : "#9ea1a5",
        borderColor: checked ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.28)",
        opacity: checked ? 1 : 0.82,
        filter: checked ? "none" : "saturate(0.2) brightness(0.92)",
        transition: "background 180ms ease, opacity 180ms ease, filter 180ms ease, box-shadow 180ms ease",
        cursor: "default",
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
      {/* Icons in top right corner, animated on card hover */}
      <>
        <InfoIcon
          onClick={(e) => { e.stopPropagation(); handleOpen(); }}
          sx={{
            position: "absolute",
            top: 6,
            right: 28,
            fontSize: 18,
            color: checked ? "#F5F5F5" : "rgba(245, 245, 245, 0.65)",
            zIndex: 2,
            cursor: hovered ? "pointer" : "default",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "scale(1)" : "scale(0.85)",
            pointerEvents: hovered ? "auto" : "none",
            transition: "opacity 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms ease",
            "&:hover": {
              transform: "scale(1.12)",
              color: checked ? "#FFFFFF" : "rgba(255, 255, 255, 0.82)",
            },
          }}
        />
        {checked ? (
          <CheckCircleIcon
            onClick={(e) => { e.stopPropagation(); if (onToggle) onToggle(account.id, false); }}
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              fontSize: 18,
              color: isEnabled
                ? (checked ? "#F5F5F5" : "rgba(245, 245, 245, 0.65)")
                : "rgba(245, 245, 245, 0.45)",
              zIndex: 2,
              cursor: "pointer",
              opacity: hovered ? 1 : 0,
              transform: hovered ? "scale(1)" : "scale(0.85)",
              pointerEvents: "auto",
              transition: "opacity 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms ease",
              "&:hover": {
                transform: "scale(1.12)",
                color: isEnabled
                  ? (checked ? "#FFFFFF" : "rgba(255, 255, 255, 0.82)")
                  : "rgba(245, 245, 245, 0.45)",
              },
            }}
          />
        ) : (
          <CheckCircleOutlineIcon
            onClick={(e) => { e.stopPropagation(); if (onToggle) onToggle(account.id, true); }}
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              fontSize: 18,
              color: isEnabled
                ? (checked ? "#F5F5F5" : "rgba(245, 245, 245, 0.65)")
                : "rgba(245, 245, 245, 0.45)",
              zIndex: 2,
              cursor: "pointer",
              opacity: hovered ? 1 : 0,
              transform: hovered ? "scale(1)" : "scale(0.85)",
              pointerEvents: "auto",
              transition: "opacity 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms ease",
              "&:hover": {
                transform: "scale(1.12)",
                color: isEnabled
                  ? (checked ? "#FFFFFF" : "rgba(255, 255, 255, 0.82)")
                  : "rgba(245, 245, 245, 0.45)",
              },
            }}
          />
        )}
      </>

      {/* Background Icon with configurable position */}
      <BigIcon
        sx={{
          position: "absolute",
          opacity: checked ? 0.25 : 0.14,
          color: "#F5F5F5",
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
          pt: "8px",
          pl: "8px",
          "&:last-child": {
              pb: "8px",
            },
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Account Name */}
        <Typography
          variant="subtitle2"
          sx={{
            fontSize: 14,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: checked ? "#F5F5F5" : "rgba(245, 245, 245, 0.72)"
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
            color: checked ? "#F5F5F5" : "rgba(245, 245, 245, 0.72)"
          }}
        >
          {Number(currentAccount.total_amount).toFixed(2)} <Currency/>
        </Typography>

        <Typography
          variant="caption"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            visibility: serialValue ? "visible" : "hidden",
            color: checked ? "rgba(245, 245, 245, 0.9)" : "rgba(245, 245, 245, 0.62)",
          }}
          title={serialValue}
        >
          {serialValue || "-"}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default AccountCard;