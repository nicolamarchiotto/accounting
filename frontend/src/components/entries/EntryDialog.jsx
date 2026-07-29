import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Alert,
  CircularProgress,
  Typography
} from "@mui/material";

function EntryDialog({ open, onClose, onAdded, entry, onSaved, onDeleted } = {}) {
  const [accounts, setAccounts] = useState([]);
  const [movementTypes, setMovementTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState({
    account_id: "",
    amount: "",
    movement_type_index: 0,
    category_id: "",
    sub_category_id: "",
    description: "",
    destination_account_id: "",
    date: new Date().toISOString().split("T")[0]
  });

  const isEditing = Boolean(entry?.id);

  const normalizeDate = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    const match = String(value).match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
  };

  const buildFormValues = (entryData, movementTypesList = movementTypes, accountsList = accounts) => {
    const movementIndex = movementTypesList.indexOf(entryData?.movement_type || "");
    return {
      account_id: entryData?.account?.id || entryData?.account || accountsList[0]?.id || "",
      amount: entryData?.amount ?? "",
      movement_type_index: movementIndex >= 0 ? movementIndex : 0,
      category_id: entryData?.category?.id || "",
      sub_category_id: entryData?.subcategory?.id || "",
      description: entryData?.description || "",
      destination_account_id: entryData?.destination_account?.id || "",
      date: entryData?.date ? normalizeDate(entryData.date) : new Date().toISOString().split("T")[0]
    };
  };

  const resetForm = () => {
    setFormValues((prev) => ({
      ...prev,
      ...buildFormValues(null)
    }));
    setError("");
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadData = async () => {
      setLoadingData(true);
      setError("");

      try {
        const [accountsRes, movementRes, categoriesRes] = await Promise.all([
          fetch("/api/entries/pivot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              group_by: "account",
              include_transfers: true,
              include_accounts_start_amount: false,
              date: { from: "", to: "" }
            })
          }),
          fetch("/api/movement_types", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          }),
          fetch("/api/categories", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          })
        ]);

        if (!accountsRes.ok) {
          throw new Error(`Failed to load accounts: ${accountsRes.status}`);
        }
        if (!movementRes.ok) {
          throw new Error(`Failed to load movement types: ${movementRes.status}`);
        }
        if (!categoriesRes.ok) {
          throw new Error(`Failed to load categories: ${categoriesRes.status}`);
        }

        const accountsData = await accountsRes.json();
        const movementData = await movementRes.json();
        const categoriesData = await categoriesRes.json();

        setAccounts(accountsData || []);
        setMovementTypes(movementData || []);
        setCategories(categoriesData || []);

        setFormValues(buildFormValues(entry || null, movementData || [], accountsData || []));
      } catch (err) {
        setError(err.message || "Failed to load entry form data.");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [open, entry]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (open && entry && movementTypes.length && accounts.length) {
      setFormValues(buildFormValues(entry, movementTypes, accounts));
    }
  }, [open, entry, movementTypes, accounts]);

  const selectedCategory = categories.find((cat) => String(cat.id) === String(formValues.category_id));
  const subcategories = selectedCategory?.subcategories || [];
  const selectedMovementType = String(movementTypes[formValues.movement_type_index] || "").toLowerCase();
  const isTransfer = selectedMovementType === "transfer";

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormValues((prev) => {
      const next = {
        ...prev,
        [field]: value,
        ...(field === "category_id" ? { sub_category_id: "" } : {})
      };

      if (field === "account_id") {
        if (String(prev.destination_account_id) === String(value)) {
          next.destination_account_id = "";
        }
      }

      if (field === "movement_type_index") {
        const nextMovementType = String(movementTypes[value] || "").toLowerCase();
        if (nextMovementType !== "transfer") {
          next.destination_account_id = "";
        }
        if (nextMovementType === "transfer") {
          next.category_id = "";
          next.sub_category_id = "";
        }
      }

      return next;
    });
  };

  const handleSave = async () => {
    setError("");

    if (!formValues.account_id) {
      setError("A source account is required.");
      return;
    }
    if (!formValues.amount || Number(formValues.amount) <= 0) {
      setError("Amount must be a positive number.");
      return;
    }
    if (formValues.movement_type_index === null || formValues.movement_type_index === undefined) {
      setError("Movement type is required.");
      return;
    }
    if (!formValues.date) {
      setError("Date is required.");
      return;
    }

    const isTransfer = movementTypes[formValues.movement_type_index] === "Transfer";
    if (isTransfer && !formValues.destination_account_id) {
      setError("Destination account is required for transfers.");
      return;
    }

    const payload = {
      account_id: Number(formValues.account_id),
      destination_account_id: isTransfer ? Number(formValues.destination_account_id) : null,
      amount: String(formValues.amount),
      movement_type_index: Number(formValues.movement_type_index),
      category_id: formValues.category_id ? Number(formValues.category_id) : null,
      sub_category_id: formValues.sub_category_id ? Number(formValues.sub_category_id) : null,
      description: formValues.description,
      date: normalizeDate(formValues.date)
    };

    const url = isEditing ? `/api/entries/edit/${entry.id}` : "/api/entries/add";
    const method = isEditing ? "PUT" : "POST";

    setSaving(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (isEditing) {
        if (onSaved) onSaved();
      } else {
        if (onAdded) onAdded();
      }
      onClose();
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry?.id) {
      return;
    }

    setError("");
    setSaving(true);
    try {
      const response = await fetch(`/api/entries/remove/${entry.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (onDeleted) onDeleted();
      onClose();
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to delete entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setError("");
    onClose();
  };

  const destinationAccounts = accounts.filter((account) => String(account.id) !== String(formValues.account_id));

  return (
    <Dialog open={Boolean(open)} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Edit Entry" : "Add Entry"}</DialogTitle>

      <DialogContent dividers>
        {loadingData ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ pt: 1 }}>
            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : null}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: isTransfer ? 4 : 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Source account"
                  value={formValues.account_id}
                  onChange={handleFieldChange("account_id")}
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: isTransfer ? 4 : 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Movement type"
                  value={formValues.movement_type_index}
                  onChange={handleFieldChange("movement_type_index")}
                >
                  {movementTypes.map((type, index) => (
                    <MenuItem key={type} value={index}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {isTransfer ? (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Target account"
                    value={formValues.destination_account_id}
                    onChange={handleFieldChange("destination_account_id")}
                  >
                    <MenuItem value="">Select target account</MenuItem>
                    {destinationAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                ) : 
                null
              }
              
              {!isTransfer &&
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    value={formValues.category_id}
                    onChange={handleFieldChange("category_id")}
                    >
                    <MenuItem value="">None</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Subcategory"
                    value={formValues.sub_category_id}
                    onChange={handleFieldChange("sub_category_id")}
                    disabled={!subcategories.length}
                    >
                    <MenuItem value="">None</MenuItem>
                    {subcategories.map((subcategory) => (
                      <MenuItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            }

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formValues.amount}
                  onChange={handleFieldChange("amount")}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={formValues.date}
                  onChange={handleFieldChange("date")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formValues.description}
                  onChange={handleFieldChange("description")}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} disabled={saving || loadingData}>
          Cancel
        </Button>
        {isEditing ? (
          <Button color="error" onClick={handleDelete} disabled={saving || loadingData}>
            Delete
          </Button>
        ) : null}
        <Button onClick={handleSave} variant="contained" disabled={saving || loadingData}>
          {saving ? "Saving..." : isEditing ? "Save" : "Add Entry"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EntryDialog;
