import { useState } from "react";
import { Box, IconButton, Menu, MenuItem, Typography, Tooltip } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function addDate(date, type, delta) {
  const d = new Date(date);
  if (type === 'day') {
    d.setDate(d.getDate() + delta);
  } else if (type === 'week') {
    d.setDate(d.getDate() + 7 * delta);
  } else if (type === 'month') {
    d.setMonth(d.getMonth() + delta);
  } else if (type === 'year') {
    d.setFullYear(d.getFullYear() + delta);
  }
  return d;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(d.setDate(diff));
}

function endOfWeek(date) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  return e;
}

function formatDisplay(dateType, date) {
  const d = new Date(date);
  if (dateType === 'day') {
    return d.toLocaleDateString('en-US');
  }
  if (dateType === 'week') {
    const s = startOfWeek(d);
    const e = endOfWeek(d);
    return `${s.toLocaleDateString('en-US')} — ${e.toLocaleDateString('en-US')}`;
  }
  if (dateType === 'month') {
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
  if (dateType === 'year') {
    return d.getFullYear().toString();
  }
  return '';
}

const filterButtonSize = 30;

const getButtonSx = (theme) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: filterButtonSize,
  height: filterButtonSize,
  p: 0,
  color: 'rgba(255,255,255,0.88)',
  bgcolor: 'transparent',
  borderRadius: '50%',
  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
});

function EntriesChips({ onChange } = {}) {
  const [dateType, setDateType] = useState('month');
  const [date, setDate] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = (ev) => setAnchorEl(ev.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handlePrev = () => {
    const next = addDate(date, dateType, -1);
    setDate(next);
    onChange?.({ dateType, date: next });
  };

  const handleNext = () => {
    const next = addDate(date, dateType, 1);
    setDate(next);
    onChange?.({ dateType, date: next });
  };

  const handleTypeSelect = (type) => {
    setDateType(type);
    // keep the same date value (interpreted at new granularity)
    onChange?.({ dateType: type, date });
    closeMenu();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
      <Tooltip title="Add entry">
        <IconButton size="small" onClick={() => {}} sx={getButtonSx()}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Import file">
        <IconButton size="small" onClick={() => {}} sx={getButtonSx()}>
          <InsertDriveFileIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'transparent', borderRadius: 2, px: 0.5 }}>
        <IconButton size="small" onClick={handlePrev} sx={getButtonSx()} aria-label="previous">
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        <IconButton size="small" onClick={openMenu} sx={{ px: 1, color: 'rgba(255,255,255,0.95)' }} aria-controls={Boolean(anchorEl) ? 'date-type-menu' : undefined} aria-haspopup="true">
          <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 600 }}>{formatDisplay(dateType, date)}</Typography>
        </IconButton>

        <IconButton size="small" onClick={handleNext} sx={getButtonSx()} aria-label="next">
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>

      <Menu id="date-type-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={() => handleTypeSelect('day')}>Day</MenuItem>
        <MenuItem onClick={() => handleTypeSelect('week')}>Week</MenuItem>
        <MenuItem onClick={() => handleTypeSelect('month')}>Month</MenuItem>
        <MenuItem onClick={() => handleTypeSelect('year')}>Year</MenuItem>
      </Menu>
    </Box>
  );
}

export default EntriesChips;
