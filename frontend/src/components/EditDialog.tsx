import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface EditDialogProps {
  open: boolean;
  initialValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
  title?: string;
  label?: string;
}

const EditDialog: React.FC<EditDialogProps> = ({
  open,
  initialValue,
  onSave,
  onClose,
  title = 'Edit',
  label = 'Value',
}) => {
  const [value, setValue] = useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue, open]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={label}
          type="text"
          fullWidth
          variant="outlined"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
