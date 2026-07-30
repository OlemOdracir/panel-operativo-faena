import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { esCL } from '@faena/contracts';
import type { StateTone } from '../app/tokens';
import { chipColorForTone } from '../app/theme';

export type ConfirmRequest = {
  title: string;
  description: string;
  /** Etiqueta del botón que ejecuta la acción. Nunca un «Aceptar» genérico. */
  action: string;
  /** Tono del botón de confirmación; `critical` para lo irreversible. */
  tone?: StateTone;
  onConfirm: () => void;
};

export function ConfirmDialog({
  request,
  onClose,
}: {
  request: ConfirmRequest | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={request !== null}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirm-dialog-title">{request?.title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {request?.description}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        {/* Cancelar recibe el foco inicial: el camino seguro es el que está
            bajo el dedo cuando el diálogo aparece. */}
        <Button onClick={onClose} autoFocus>
          {esCL.confirm.cancel}
        </Button>
        <Button
          variant="contained"
          color={request ? chipColorForTone[request.tone ?? 'info'] : 'info'}
          onClick={() => {
            request?.onConfirm();
            onClose();
          }}
        >
          {request?.action}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
