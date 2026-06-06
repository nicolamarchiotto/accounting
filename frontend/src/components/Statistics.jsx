import { Box, Typography, Collapse, IconButton } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from "react";

function Statistics({ expanded, onToggle }) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;

  const handleChange = (_event, expandedVal) => {
    if (onToggle) onToggle(expandedVal);
    else setInternalExpanded(expandedVal);
  };

  return (
    <Box sx={{ width: isExpanded ? "100%" : "auto", borderRadius: 3, border: "1px solid rgba(15, 23, 42, 0.10)", backgroundColor: "transparent", boxShadow: "none", overflow: "hidden" }}>
      <Box sx={{ px: 2, pr: 6, minHeight: 42, bgcolor: "primary.main", color: "common.white", display: "flex", alignItems: "center", justifyContent: "flex-start", position: "relative" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: "0.02em", color: "common.white" }}>Statistics</Typography>
        <Box sx={{ position: "absolute", right: 12 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleChange(null, !isExpanded); }} sx={{ color: "common.white" }} aria-label={isExpanded ? "Collapse Statistics" : "Expand Statistics"}>
            <ExpandMoreIcon sx={{ transform: isExpanded ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 200ms" }} />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={isExpanded} timeout={300} unmountOnExit>
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ color: "rgba(15, 23, 42, 0.78)" }}>
            Placeholder for statistics. Add charts or summary cards here.
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

export default Statistics;
