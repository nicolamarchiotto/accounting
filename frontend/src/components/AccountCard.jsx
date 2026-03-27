import {
  Typography,
  Card,
  CardContent,
  Box
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ContactPageIcon from '@mui/icons-material/ContactPage';
import Currency from "./Currency";

function AccountCard({ account }) {

  const accountTypeConfig = {
    Bank: {
      bg: "#E3F2FD",
      bigIcon: AccountBalanceIcon,
      fontSize: 70,
      iconPosition: { right: 0, bottom: 0 }, // customizable position
    },
    Cash: {
      bg: "#E8F5E9",
      bigIcon: AttachMoneyIcon,
      fontSize: 76,
      iconPosition: { right: -18, bottom: 0 },
    },
    Investment: {
      bg: "#FFF8E1",
      bigIcon: TrendingUpIcon,
      fontSize: 75,
      iconPosition: { right: -2, bottom: -8 },
      rotation: -10
    },
    Insurance: {
      bg: "#F3E5F5",
      bigIcon: ContactPageIcon,
      fontSize: 66,
      iconPosition: { right: -6, bottom: 0 }
    },
  };

  const typeKey = account.type?.key || account.type;
  const config = accountTypeConfig[typeKey] || accountTypeConfig.bank;
  const BigIcon = config.bigIcon;

  return (
    <Card
      variant="outlined"
      sx={{
        width: 150,
        maxWidth: 150,
        height: "90%",
        borderRadius: 3,
        boxShadow: 1,
        position: "relative",
        overflow: "hidden",
      }}
    >
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
            fontSize: 12,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={account.name}
        >
          {account.name}
        </Typography>
        {/*Account serial number*/}
        {true &&  
          <Typography
            variant="subtitl2"
            sx={{
              fontSize: 9,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={account.name}
          >
            {account.name}
          </Typography>
        }

        {/* Amount */}
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            color: account.total_amount < 0 ? "error.main" : config.color,
          }}
        >
          {Number(account.total_amount).toFixed(2)} <Currency/>
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
            title={account.owner_name}
          >
            {account.owner_name}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default AccountCard;