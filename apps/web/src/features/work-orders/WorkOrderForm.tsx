import { Button, Card, CardContent, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { esCL, labelSeverity } from '@faena/contracts';
import type { Team } from '../../api';
import { SectionHeading } from '../../components/SectionHeading';
import { SelectField } from '../../components/SelectField';

export function WorkOrderForm({
  incidentId,
  teams: _teams,
  pending,
  onSubmit,
  onCancel,
}: {
  incidentId?: string;
  teams: Team[];
  pending: boolean;
  onSubmit: (body: {
    title: string;
    description?: string;
    priority: string;
    incidentId?: string;
  }) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  return (
    <Card>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
