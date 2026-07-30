import { useCallback, useState, type ReactNode } from 'react';
import { ConfirmDialog, type ConfirmRequest } from '../components/ConfirmDialog';

/**
 * Puerta de confirmación para las acciones que cambian estado.
 *
 * `request` abre el diálogo y `dialog` es el nodo que hay que renderizar una
 * sola vez en la página. La mutación se dispara únicamente desde `onConfirm`,
 * así que ninguna acción puede ejecutarse por un clic accidental en una fila.
 */
export function useConfirmAction(): {
  request: (next: ConfirmRequest) => void;
  dialog: ReactNode;
} {
  const [pending, setPending] = useState<ConfirmRequest | null>(null);
  const close = useCallback(() => setPending(null), []);
  return {
    request: setPending,
    dialog: <ConfirmDialog request={pending} onClose={close} />,
  };
}
