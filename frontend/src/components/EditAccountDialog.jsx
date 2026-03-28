import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from "@mui/material";

function EditAccountDialog({
  open,
  onClose,
  account,
  onEdit,
  onDelete
}) {
  if (!account) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Manage Account</DialogTitle>

      <DialogContent>
        <Typography>
          What do you want to do with <strong>{account.name}</strong>?
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          onClick={() => {
            onEdit(account);
            onClose();
          }}
          variant="contained"
        >
          Edit
        </Button>

        <Button
          onClick={() => {
            onDelete(account);
            onClose();
          }}
          color="error"
          variant="contained"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditAccountDialog;