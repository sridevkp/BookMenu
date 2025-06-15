
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const PromptDialog = ({ open, value, onClose, onChange, title, onConfirm, onCancel }) => {
  return (
    <Dialog open={open} onClose={onClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
            <TextField
            autoFocus
            margin="dense"
            label="Folder name"
            type="text"
            fullWidth
            variant="standard"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => {
                if (e.key === 'Enter') onConfirm();
                if (e.key === 'Escape') onCancel();
            }}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => onCancel()} variant="outlined" size="small">Cancel</Button>
            <Button onClick={onConfirm} variant="contained" size="small" disabled={!value.trim()}>Create</Button>
        </DialogActions>
    </Dialog>
  )
}

export default PromptDialog;