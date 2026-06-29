import { Box, CircularProgress, Alert, Typography, Collapse, IconButton } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from "react";
import EntriesChips from "./EntriesChips";
import EntryDialog from "./EntryDialog";

// Helper to safely extract a display name from possibly nested objects
const getName = (val) => {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.name || String(val);
  return String(val);
};

function EntriesContainer({ entries = [], loading = false, error = null, expanded, onToggle, onDateChange, onAddSuccess }) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const [dateType, setDateType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;

  const handleChange = (_event, expandedVal) => {
    if (onToggle) onToggle(expandedVal);
    else setInternalExpanded(expandedVal);
  };
  const handleAdd = () => {
    if (typeof onToggle === 'function' && false) {
      // placeholder if parent wants to handle add
    }
    if (typeof window !== 'undefined') console.log('Add entry clicked');
  };

  const handleImport = () => {
    if (typeof window !== 'undefined') console.log('Import file clicked');
  };

  const openEntryForEdit = (entry) => {
    setSelectedEntry(entry);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedEntry(null);
  };

  const handleDateChange = ({ dateType: dt, date }) => {
    if (dt) setDateType(dt);
    if (date) setSelectedDate(date);
    if (onDateChange) onDateChange({ dateType: dt || dateType, date: date || selectedDate });
  };
  return (
    <Box sx={{ width: isExpanded ? "100%" : "auto", borderRadius: 3, border: "1px solid rgba(15, 23, 42, 0.10)", backgroundColor: "transparent", boxShadow: "none", overflow: "hidden" }}>
      <Box sx={{ px: 2, pr: 6, minHeight: 42, bgcolor: "primary.main", color: "common.white", display: "flex", alignItems: "center", justifyContent: "flex-start", position: "relative", borderTopRightRadius: isExpanded ? 3 : 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: "0.02em", color: "common.white" }}>Entries</Typography>
        {isExpanded && (
          <Box onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} onFocusCapture={(event) => event.stopPropagation()} sx={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center" }}>
            <EntriesChips onChange={handleDateChange} onAddSuccess={onAddSuccess} />
          </Box>
        )}
        <Box sx={{ position: "absolute", right: 12 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleChange(null, !isExpanded); }} sx={{ color: "common.white" }} aria-label={isExpanded ? "Collapse Entries" : "Expand Entries"}>
            <ExpandMoreIcon sx={{ transform: isExpanded ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 200ms" }} />
          </IconButton>
        </Box>
      </Box>
      <Collapse in={isExpanded} timeout={300} unmountOnExit>
        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Box sx={{ display: "flex", gap: 2 }}>
              {/* Left column: entries list (one third of available width) */}
              <Box sx={{ width: "33.333%", minHeight: 140, maxHeight: "46vh", overflowY: "auto", display: "grid", gap: 1.5, pr: 0.5 }}>
                {entries.length === 0 ? (
                  <Typography variant="body2" sx={{ color: "rgba(15, 23, 42, 0.7)" }}>
                    No expense entries match the selected owners or accounts.
                  </Typography>
                ) : (
                  entries.map((entry) => (
                    <Box key={entry.id} onClick={() => openEntryForEdit(entry)} sx={{ padding: 2, borderRadius: 2, border: "1px solid rgba(15, 23, 42, 0.08)", backgroundColor: "#f8fafc", transition: "transform 0.15s ease, box-shadow 0.15s ease", cursor: "pointer", '&:hover': { transform: "translateY(-1px)", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "rgba(15, 23, 42, 0.95)", mb: 0.5 }}>{getName(entry.category) || "Expense"}</Typography>
                          <Typography variant="body2" sx={{ color: "rgba(15, 23, 42, 0.75)", mb: 0.5, whiteSpace: "pre-wrap" }}>{entry.description || "No description"}</Typography>
                          <Typography variant="caption" sx={{ color: "rgba(15, 23, 42, 0.55)" }}>
                            {getName(entry.account)}{entry.destination_account ? ` → ${getName(entry.destination_account)}` : ""}{entry.subcategory ? ` · ${getName(entry.subcategory)}` : ""}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" sx={{ color: "rgba(211, 47, 47, 0.95)", fontWeight: 700, whiteSpace: "nowrap" }}>-{Number(entry.amount).toFixed(2)}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ display: "block", mt: 1, color: "rgba(15, 23, 42, 0.55)" }}>{new Date(entry.date).toLocaleDateString()}</Typography>
                    </Box>
                  ))
                )}
              </Box>

              {/* Right area: intentionally empty for now (two thirds of available width) */}
              <Box sx={{ width: "66.667%", minHeight: 140, maxHeight: "46vh" }} />
            </Box>
          )}
        </Box>
      </Collapse>
      <EntryDialog
        open={editDialogOpen}
        onClose={closeEditDialog}
        entry={selectedEntry}
        onSaved={onAddSuccess}
        onDeleted={onAddSuccess}
      />
  </Box>
  );
}

export default EntriesContainer;
