import { Button, Stack, TextField } from '@mui/material';
import { IconAdd as AddIcon, IconSearch as SearchIcon } from '../../app/icons';
import { DatePicker as _DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import {
  MaterialReactTable,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Priority, WorkOrderListQuery, WorkOrderStatus } from '@faena/contracts';
import { esCL, labelSeverity, labelStatus } from '@faena/contracts';
import { api } from '../../api';
import { workOrderQueryKeys } from './query-keys';
import { catalogQueryKeys } from '../catalog/query-keys';
import { PageHeading } from '../../components/PageHeading';
import { FilterCard } from '../../components/FilterCard';
import { SelectField } from '../../components/SelectField';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { Empty } from '../../components/Empty';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { WorkOrderForm } from './WorkOrderForm';
import { OrderStatusSummary } from './OrderStatusSummary';
import { useWorkOrderTable } from './useWorkOrderTable';

export function WorkOrdersPage() {
  const client = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<WorkOrderStatus | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [teamId, setTeamId] = useState('');
  const [createdFrom, setCreatedFrom] = useState<Dayjs | null>(null);
  const [createdTo, setCreatedTo] = useState<Dayjs | null>(null);
  const debouncedQ = useDebouncedValue(q, 300);
  const teams = useQuery({ queryKey: catalogQueryKeys.teams, queryFn: api.teams });
  const query = useMemo<Partial<WorkOrderListQuery>>(() => {
    const tableFilter = (id: string) => columnFilters.find((filter) => filter.id === id)?.value;
    const tableSearch = tableFilter('title') ?? tableFilter('teamName');
    const tableStatus = tableFilter('status');
    const tablePriority = tableFilter('priority');
    return {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      q: debouncedQ || (typeof tableSearch === 'string' ? tableSearch : undefined),
      status: status
        ? [status]
        : tableStatus === 'OPEN' ||
            tableStatus === 'ASSIGNED' ||
            tableStatus === 'IN_PROGRESS' ||
            tableStatus === 'CLOSED'
          ? [tableStatus]
          : undefined,
      priority:
        priority ||
        (tablePriority === 'LOW' ||
        tablePriority === 'MEDIUM' ||
        tablePriority === 'HIGH' ||
        tablePriority === 'CRITICAL'
          ? tablePriority
          : undefined),
      teamId: teamId || undefined,
      createdFrom: createdFrom?.toISOString(),
      createdTo: createdTo?.toISOString(),
      sortBy: (sorting[0]?.id as WorkOrderListQuery['sortBy']) || 'createdAt',
      sortDirection: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : 'desc',
    };
  }, [
    pagination,
    debouncedQ,
    status,
    priority,
    teamId,
    createdFrom,
    createdTo,
    sorting,
    columnFilters,
  ]);
  const orders = useQuery({
    queryKey: [...workOrderQueryKeys.all, query],
    queryFn: () => api.workOrders(query),
  });
  const create = useMutation({
    mutationFn: api.createWorkOrder,
    onSuccess: () => {
      setShowForm(false);
      void client.invalidateQueries({ queryKey: workOrderQueryKeys.all });
    },
  });
  const assign = useMutation({
    mutationFn: ({ id, team }: { id: string; team: string }) => api.assignWorkOrder(id, team),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: workOrderQueryKeys.all });
    },
  });
  const advance = useMutation({
    mutationFn: ({ id, next }: { id: string; next: WorkOrderStatus }) =>
      api.workOrderStatus(id, next),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: workOrderQueryKeys.all });
    },
  });
  const confirm = useConfirmAction();
  const table = useWorkOrderTable(
    orders.data?.data ?? [],
    orders.data?.meta.total ?? 0,
    orders.data?.meta.totalPages ?? 0,
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    teams.data ?? [],
    (order, team) =>
      confirm.request({
        title: esCL.confirm.orderAssign.title,
        description: esCL.confirm.orderAssign.description(team.name),
        action: esCL.confirm.orderAssign.action,
        tone: 'warning',
        onConfirm: () => assign.mutate({ id: order.id, team: team.id }),
      }),
    (order, next) =>
      confirm.request({
        ...(next === 'CLOSED' ? esCL.confirm.orderClose : esCL.confirm.orderStart),
        tone: next === 'CLOSED' ? 'good' : 'info',
        onConfirm: () => advance.mutate({ id: order.id, next }),
      }),
  );
  return (
    <Stack spacing={3}>
      <PageHeading
        eyebrow={esCL.workOrders.eyebrow}
        title={esCL.workOrders.title}
        text={esCL.workOrders.description}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm((value) => !value)}
          >
            {esCL.workOrders.new}
          </Button>
        }
      />
      {showForm && (
        <WorkOrderForm
          teams={teams.data ?? []}
          pending={create.isPending}
          onSubmit={(body) => create.mutate(body)}
          onCancel={() => setShowForm(false)}
        />
      )}
      {orders.data && <OrderStatusSummary data={orders.data.data} />}
      {
        <FilterCard
          title="Filtros operacionales"
          onClear={() => {
            setQ('');
            setStatus('');
            setPriority('');
            setTeamId('');
            setCreatedFrom(null);
            setCreatedTo(null);
            setColumnFilters([]);
          }}
        >
          <TextField
            label="Buscar"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <SelectField
            label="Estado"
            value={status}
            onChange={(value) => setStatus(value as WorkOrderStatus | '')}
            options={[
              ['', 'Todos los estados'],
              ['OPEN', labelStatus('OPEN')],
              ['ASSIGNED', labelStatus('ASSIGNED')],
              ['IN_PROGRESS', labelStatus('IN_PROGRESS')],
              ['CLOSED', labelStatus('CLOSED')],
            ]}
          />
          <SelectField
            label="Prioridad"
            value={priority}
            onChange={(value) => setPriority(value as Priority | '')}
            options={[
              ['', 'Todas las prioridades'],
              ['LOW', labelSeverity('LOW')],
              ['MEDIUM', labelSeverity('MEDIUM')],
              ['HIGH', labelSeverity('HIGH')],
              ['CRITICAL', labelSeverity('CRITICAL')],
            ]}
          />
          <SelectField
            label="Equipo"
            value={teamId}
            onChange={setTeamId}
            options={[
              ['', 'Todos los equipos'],
              ...(teams.data ?? []).map((team) => [team.id, team.name] as [string, string]),
            ]}
          />
          <_DatePicker
            label="Desde"
            value={createdFrom}
            onChange={setCreatedFrom}
            slotProps={{ textField: { size: 'small' } }}
          />
          <_DatePicker
            label="Hasta"
            value={createdTo}
            onChange={setCreatedTo}
            slotProps={{ textField: { size: 'small' } }}
          />
        </FilterCard>
      }
      {orders.isError ? (
        <ErrorState error={orders.error} />
      ) : orders.isPending ? (
        <Loading />
      ) : orders.data.data.length === 0 ? (
        <Empty text={esCL.workOrders.empty} />
      ) : (
        <MaterialReactTable table={table} />
      )}
      {confirm.dialog}
    </Stack>
  );
}
