import { Button, Card, CardContent, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { esCL, labelSeverity } from '@faena/contracts';
import { SectionHeading } from '../../components/SectionHeading';
import { SelectField } from '../../components/SelectField';

/**
 * La orden nace siempre en `OPEN`: asignar equipo es una transición aparte, en
 * el tablero. Por eso este formulario no recibe equipos —los recibía y los
 * descartaba, arrastrando una consulta de red que no usaba nadie.
 */
export function WorkOrderForm({
  incidentId,
  pending,
  onSubmit,
  onCancel,
  embedded = false,
}: {
  incidentId?: string;
  pending: boolean;
  onSubmit: (body: {
    title: string;
    description?: string;
    priority: string;
    incidentId?: string;
  }) => void;
  onCancel?: () => void;
  /**
   * Sin marco propio, para vivir dentro de un `Dialog`: el `Dialog` ya aporta
   * su propio panel, y un `Card` adentro se veía como un marco dentro de otro.
   */
  embedded?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const body = (
    <Stack
      component="form"
      spacing={2}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ title, description: description || undefined, priority, incidentId });
      }}
    >
      <SectionHeading title={esCL.workOrders.createTitle} />
      <TextField
        label={esCL.workOrders.titleLabel}
        inputProps={{ 'aria-label': esCL.workOrders.titleLabel }}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <TextField
        label={esCL.workOrders.descriptionLabel}
        inputProps={{ 'aria-label': esCL.workOrders.descriptionLabel }}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        multiline
        minRows={3}
      />
      <SelectField
        label={esCL.workOrders.priority}
        value={priority}
        onChange={setPriority}
        options={[
          ['LOW', labelSeverity('LOW')],
          ['MEDIUM', labelSeverity('MEDIUM')],
          ['HIGH', labelSeverity('HIGH')],
          ['CRITICAL', labelSeverity('CRITICAL')],
        ]}
      />
      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" disabled={pending || title.trim().length < 3}>
          {pending ? esCL.workOrders.creating : esCL.workOrders.create}
        </Button>
        {onCancel && <Button onClick={onCancel}>{esCL.workOrders.cancel}</Button>}
      </Stack>
    </Stack>
  );

  if (embedded) return body;
  return (
    <Card>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
