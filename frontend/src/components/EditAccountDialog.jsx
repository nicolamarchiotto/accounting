import {
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  TextField,
  Box,
  Alert,
  Typography,
  IconButton,
  Tooltip
} from "@mui/material";
import { useEffect, useState } from "react";
import ColorLensIcon from "@mui/icons-material/ColorLens";

const PRESET_ACCOUNT_COLORS = [
  "#D32F2F", // deep red
  "#E64A19", // deep orange
  "#F57C00", // dark orange
  "#F9A825", // amber (darkened)
  "#FBC02D", // strong yellow (darkened)
  "#9E9D24", // olive yellow-green

  "#558B2F", // dark green
  "#2E7D32", // green
  "#00796B", // teal
  "#00838F", // cyan teal
  "#0277BD", // blue
  "#1565C0", // deeper blue

  "#283593", // indigo
  "#4527A0", // deep purple
  "#6A1B9A", // purple
  "#AD1457", // pink/magenta deep
  "#C62828", // red deep
  "#D84315", // deep orange-red

  "#EF6C00", // strong orange
  "#F9A825", // amber
  "#827717", // olive
  "#558B2F", // green
  "#2E7D32", // dark green
  "#00695C", // deep teal

  "#00838F", // cyan
  "#0277BD", // blue
  "#1565C0", // blue deep
  "#303F9F", // indigo
  "#6A1B9A", // purple
  "#C2185B"  // deep pink
];
const CUSTOM_COLOR_OPTION = "__CUSTOM__";

function isValidHexColor(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function EditAccountDialog({
  open,
  onClose,
  account,
  owners,
  accountTypes,
  onEdit,
  onDelete
}) {
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    color: "#E3F2FD",
    type: "",
    start_amount: 0,
    owner_id: "",
    iban: "",
    serial: ""
  });

  useEffect(() => {
    if (!account) {
      return;
    }

    setSaveError("");

    setFormValues({
      name: account.name || "",
      color: account.color || "#E3F2FD",
      type: account.type || "",
      start_amount: account.start_amount ?? 0,
      owner_id: account.owner_id ?? "",
      iban: account.iban || "",
      serial: account.serial || ""
    });
  }, [account, open]);

  if (!account) return null;

  const handleFieldChange = (field) => (event) => {
    const value = field === "start_amount"
      ? event.target.value === "" ? "" : Number(event.target.value)
      : event.target.value;

    setFormValues((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePresetDropdownChange = (event) => {
    const value = event.target.value;
    if (value === CUSTOM_COLOR_OPTION) {
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      color: value
    }));
  };

  const handleCustomHexChange = (event) => {
    const value = event.target.value;

    setFormValues((prev) => ({
      ...prev,
      color: value
    }));
  };

  const handleSave = async () => {
    setSaveError("");

    if (!isValidHexColor(formValues.color)) {
      setSaveError("Color must be a valid hex value like #E3F2FD.");
      return;
    }

    const selectedOwner = (owners || []).find((owner) => owner.id === formValues.owner_id);

    const payload = {
      name: formValues.name.trim(),
      account_type: formValues.type,
      owner_id: String(formValues.owner_id ?? ""),
      start_amount: formValues.start_amount === "" ? "" : String(formValues.start_amount),
      color: formValues.color,
      iban: formValues.iban,
      serial: formValues.serial
    };

    if (!payload.name || !payload.account_type || !payload.owner_id) {
      setSaveError("Name, account type, and owner are required.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/accounts/edit/${account.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || `HTTP ${response.status}`);
      }

      onEdit({
        ...account,
        ...formValues,
        type: formValues.type,
        start_amount: formValues.start_amount === "" ? 0 : Number(formValues.start_amount),
        owner_id: Number(formValues.owner_id),
        owner_name: selectedOwner?.name || account.owner_name
      });
      onClose();
    } catch (error) {
      setSaveError(error.message || "Failed to update account.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (event) => {
    // Discard any unsaved local edits and restore current account values.
    event?.stopPropagation?.();
    event?.preventDefault?.();
    setSaveError("");
    setFormValues({
      name: account.name || "",
      color: account.color || "#E3F2FD",
      type: account.type || "",
      start_amount: account.start_amount ?? 0,
      owner_id: account.owner_id ?? "",
      iban: account.iban || "",
      serial: account.serial || ""
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(event) => {
        event?.stopPropagation?.();
        if (!isSaving) {
          handleCancel(event);
        }
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Edit Account</DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {saveError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          ) : null}

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Name"
                value={formValues.name}
                onChange={handleFieldChange("name")}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                select
                label="Account Type"
                value={formValues.type}
                onChange={handleFieldChange("type")}
              >
                {(accountTypes || []).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                select
                label="Owner"
                value={formValues.owner_id}
                onChange={handleFieldChange("owner_id")}
              >
                {(owners || []).map((owner) => (
                  <MenuItem key={owner.id} value={owner.id}>
                    {owner.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Start Amount"
                value={formValues.start_amount}
                onChange={handleFieldChange("start_amount")}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="IBAN"
                value={formValues.iban}
                onChange={handleFieldChange("iban")}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Serial"
                value={formValues.serial}
                onChange={handleFieldChange("serial")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Color
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexDirection: { xs: "column", sm: "row" }
                  }}
                >
                  <TextField
                    select
                    fullWidth
                    label="Preset Palette"
                    value={
                      PRESET_ACCOUNT_COLORS.some(
                        (color) => color.toLowerCase() === String(formValues.color).toLowerCase()
                      )
                        ? formValues.color
                        : CUSTOM_COLOR_OPTION
                    }
                    onChange={handlePresetDropdownChange}
                  >
                    {PRESET_ACCOUNT_COLORS.map((color) => (
                      <MenuItem key={color} value={color}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: 0.8,
                              border: "1px solid rgba(0,0,0,0.2)",
                              backgroundColor: color
                            }}
                          />
                          <Typography variant="body2">{color.toUpperCase()}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuItem value={CUSTOM_COLOR_OPTION}>Custom color</MenuItem>
                  </TextField>

                  <Tooltip title="Pick custom color">
                    <IconButton
                      component="label"
                      aria-label="pick custom color"
                      sx={{
                        width: 56,
                        height: 56,
                        alignSelf: { xs: "flex-start", sm: "center" },
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.23)",
                        backgroundColor: isValidHexColor(formValues.color) ? formValues.color : "#E3F2FD",
                        color: "rgba(0,0,0,0.7)",
                        "&:hover": {
                          backgroundColor: isValidHexColor(formValues.color) ? formValues.color : "#E3F2FD",
                          boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.2)"
                        }
                      }}
                    >
                      <ColorLensIcon />
                      <Box
                        component="input"
                        type="color"
                        value={isValidHexColor(formValues.color) ? formValues.color : "#E3F2FD"}
                        onChange={handleCustomHexChange}
                        sx={{ display: "none" }}
                      />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={(event) => {
            handleCancel(event);
          }}
          disabled={isSaving}
        >
          Cancel
        </Button>

        <Button
          onClick={(event) => {
            event.stopPropagation();
            handleSave();
          }}
          variant="contained"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>

        <Button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(account);
            onClose();
          }}
          color="error"
          variant="contained"
          disabled={isSaving}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditAccountDialog;
